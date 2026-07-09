import json
import os
from typing import Any

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agents.state import AgentState
from app.agents.tools import reddit_search, hackernews_search


load_dotenv()


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.4,
)


def build_search_queries(
    interests: list[str],
) -> list[str]:
    """
    Generate targeted search queries without using Gemini.
    """

    queries: list[str] = []

    for interest in interests[:5]:
        interest = interest.strip()

        if not interest:
            continue

        queries.extend(
            [
                f"{interest} frustrating problem",
                f"{interest} tool wish existed",
                f"{interest} repetitive workflow",
            ]
        )

    # Remove duplicates while preserving order.
    return list(dict.fromkeys(queries))[:8]


def select_subreddits(
    interests: list[str],
) -> list[str]:
    """
    Select relevant subreddits using a lightweight keyword map.
    """

    subreddit_map = {
        "ai": [
            "artificial",
            "MachineLearning",
            "LocalLLaMA",
        ],
        "machine learning": [
            "MachineLearning",
            "learnmachinelearning",
        ],
        "python": [
            "Python",
            "learnpython",
        ],
        "web": [
            "webdev",
            "Frontend",
        ],
        "frontend": [
            "Frontend",
            "webdev",
        ],
        "backend": [
            "Backend",
            "webdev",
        ],
        "devops": [
            "devops",
            "kubernetes",
        ],
        "cloud": [
            "aws",
            "cloudcomputing",
        ],
        "aws": [
            "aws",
            "devops",
        ],
        "product": [
            "SaaS",
            "Entrepreneur",
            "startups",
        ],
        "startup": [
            "startups",
            "Entrepreneur",
        ],
        "developer tools": [
            "programming",
            "webdev",
            "ExperiencedDevs",
        ],
    }

    selected: list[str] = []

    for interest in interests:
        normalized = interest.lower().strip()

        for keyword, subreddits in subreddit_map.items():
            if keyword in normalized or normalized in keyword:
                selected.extend(subreddits)

    if not selected:
        selected = [
            "programming",
            "webdev",
            "SideProject",
        ]

    return list(dict.fromkeys(selected))[:5]


async def scout_node(
    state: AgentState,
) -> AgentState:
    """
    Generate search queries and collect community discussions.

    No Gemini request is made in this node.
    """

    interests = state["user_interests"]

    queries = build_search_queries(
        interests
    )

    subreddits = select_subreddits(
        interests
    )

    print(
        f"SCOUT queries={len(queries)} "
        f"subreddits={subreddits}",
        flush=True,
    )

    raw_findings: list[dict[str, Any]] = []

    for query in queries:
        try:
            reddit_results = await reddit_search(
                query,
                subreddits,
            )

            raw_findings.extend(
                reddit_results
            )

        except Exception as error:
            print(
                f"REDDIT SEARCH FAILED "
                f"query={query} "
                f"error={error}",
                flush=True,
            )

        try:
            hn_results = await hackernews_search(
                query
            )

            raw_findings.extend(
                hn_results
            )

        except Exception as error:
            print(
                f"HN SEARCH FAILED "
                f"query={query} "
                f"error={error}",
                flush=True,
            )

    print(
        f"SCOUT COMPLETE "
        f"findings={len(raw_findings)}",
        flush=True,
    )

    return {
        **state,
        "search_queries": queries,
        "raw_findings": raw_findings,
    }


def calculate_demand_score(
    finding: dict,
) -> int:
    """
    Estimate demand strength using textual community signals.
    """

    text = " ".join(
        str(value)
        for value in finding.values()
        if value is not None
    ).lower()

    score = 3

    strong_signals = [
        "wish there was",
        "wish there were",
        "looking for",
        "need a tool",
        "need something",
        "does anyone know",
        "is there a",
        "alternative to",
        "frustrating",
        "annoying",
        "painful",
        "hate",
        "problem",
        "struggle",
        "difficult",
        "manual",
        "repetitive",
        "takes forever",
    ]

    medium_signals = [
        "how do you",
        "how can i",
        "workflow",
        "automate",
        "better way",
        "solution",
        "tool",
        "manage",
        "track",
    ]

    for signal in strong_signals:
        if signal in text:
            score += 2

    for signal in medium_signals:
        if signal in text:
            score += 1

    return min(score, 10)


def extract_summary(
    finding: dict,
) -> str:
    """
    Extract a short textual summary from a finding.
    """

    for key in [
        "snippet",
        "text",
        "body",
        "description",
        "title",
    ]:
        value = finding.get(key)

        if value:
            return str(value)[:500]

    return ""


async def analyst_node(
    state: AgentState,
) -> AgentState:
    """
    Score community findings using deterministic heuristics.

    No Gemini request is made in this node.
    """

    analyzed_signals = []

    for finding in state["raw_findings"][:50]:
        demand_score = calculate_demand_score(
            finding
        )

        if demand_score < 5:
            continue

        analyzed_signals.append(
            {
                "title": finding.get(
                    "title",
                    "Community discussion",
                ),
                "source": finding.get(
                    "source",
                    "unknown",
                ),
                "url": finding.get(
                    "url",
                    "",
                ),
                "demand_score": demand_score,
                "summary": extract_summary(
                    finding
                ),
            }
        )

    analyzed_signals.sort(
        key=lambda signal: signal[
            "demand_score"
        ],
        reverse=True,
    )

    top_signals = analyzed_signals[:15]

    print(
        f"ANALYST COMPLETE "
        f"signals={len(top_signals)}",
        flush=True,
    )

    return {
        **state,
        "analyzed_signals": top_signals,
    }


async def architect_node(
    state: AgentState,
) -> AgentState:
    """
    Use Gemini once to synthesize validated community signals
    into concrete project ideas.
    """

    signals = state[
        "analyzed_signals"
    ][:15]

    signals_text = json.dumps(
        signals,
        ensure_ascii=False,
    )

    interests_text = json.dumps(
        state["user_interests"],
        ensure_ascii=False,
    )

    prompt = f"""
You are a senior product engineer identifying strong software
portfolio project opportunities.

USER INTERESTS:
{interests_text}

VALIDATED COMMUNITY SIGNALS:
{signals_text}

Generate exactly 4 concrete software project ideas.

Requirements:

1. Each project must solve a pain point visible in the community
   signals.

2. The project must be realistic for one developer to build in
   2-8 weeks.

3. Avoid generic ideas such as:
   - todo apps
   - chat apps
   - weather apps
   - generic AI wrappers

4. Prefer technically interesting systems involving:
   - AI
   - backend engineering
   - infrastructure
   - developer tools
   - distributed systems
   when relevant to the user's interests.

5. Evidence must reference the supplied community signals only.
   Never invent a Reddit or Hacker News URL.

6. Return ONLY valid JSON.

Return this exact JSON structure:

[
  {{
    "title": "Project title",
    "description": "Clear explanation of the product",
    "pain_point": "Specific problem being solved",
    "evidence": [
      {{
        "source": "reddit or hackernews",
        "title": "Discussion title",
        "url": "Original discussion URL",
        "snippet": "Short evidence summary"
      }}
    ],
    "tech_stack": [
      "technology"
    ],
    "difficulty": "beginner or intermediate or advanced",
    "estimated_weeks": 4,
    "why_this_matches": "Why this matches the user"
  }}
]
"""

    print(
        "ARCHITECT CALLING GEMINI",
        flush=True,
    )

    response = await llm.ainvoke(
        prompt
    )

    try:
        content = str(response.content)

        start = content.find("[")
        end = content.rfind("]") + 1

        if start == -1 or end == 0:
            raise ValueError(
                "Gemini response contained no JSON array"
            )

        final_ideas = json.loads(
            content[start:end]
        )

    except (
        json.JSONDecodeError,
        ValueError,
    ) as error:
        print(
            f"ARCHITECT PARSE FAILED "
            f"error={error}",
            flush=True,
        )

        final_ideas = []

    print(
        f"ARCHITECT COMPLETE "
        f"ideas={len(final_ideas)}",
        flush=True,
    )

    return {
        **state,
        "final_ideas": final_ideas,
    }