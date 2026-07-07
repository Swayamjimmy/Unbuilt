import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.agents.state import AgentState
from app.agents.tools import reddit_search, hackernews_search

# Initialize Gemini 2.5 Flash for all node functions
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY")
)

async def scout_node(state: AgentState) -> AgentState:
    """Generate dynamic search queries and select subreddits based on user input."""
    # Build a prompt that asks Gemini to create targeted search queries
    prompt = (
        f"Based on these user interests: {state['user_interests']}\n\n"
        "Generate 5 specific search queries to find project ideas and demand signals "
        "on Reddit and HackerNews. Also suggest 3-5 relevant subreddits to search.\n\n"
        "Return valid JSON with this format:\n"
        '{"queries": ["query1", "query2"], "subreddits": ["subreddit1", "subreddit2"]}'
    )

    # Ask Gemini to generate search queries from user interests
    response = await llm.ainvoke(prompt)

    # Parse the generated queries from Gemini's response
    try:
        content = response.content
        start = content.find("{")
        end = content.rfind("}") + 1
        data = json.loads(content[start:end])
        queries = data.get("queries", [])
        subreddits = data.get("subreddits", ["python", "webdev", "learnprogramming"])
    except (json.JSONDecodeError, ValueError):
        # Fallback: create basic queries from interests directly
        queries = [f"{interest} project ideas" for interest in state["user_interests"]]
        subreddits = ["python", "webdev", "learnprogramming"]

    # Execute searches across Reddit and HackerNews with generated queries
    raw_findings = []
    for query in queries:
        reddit_results = await reddit_search(query, subreddits)
        hn_results = await hackernews_search(query)
        raw_findings.extend(reddit_results)
        raw_findings.extend(hn_results)

    return {
        **state,
        "search_queries": queries,
        "raw_findings": raw_findings,
    }

async def analyst_node(state: AgentState) -> AgentState:
    """Score and filter raw findings for demand signals, pain points, and feasibility."""
    # Limit findings to avoid exceeding token limits
    findings_text = json.dumps(state["raw_findings"][:50], indent=2)

    # Build a prompt asking Gemini to analyze and score each finding
    prompt = (
        "Analyze these community discussions and score them for:\n"
        "1. Demand signal strength (are people asking for this?)\n"
        "2. Pain points mentioned\n"
        "3. Feasibility for a solo developer\n\n"
        f"Discussions:\n{findings_text}\n\n"
        "Return a valid JSON array of analyzed signals:\n"
        '[{"title": "...", "source": "...", "demand_score": 1-10, '
        '"pain_points": ["..."], "feasibility": "high/medium/low", "summary": "..."}]'
    )

    # Ask Gemini to score and categorize the raw findings
    response = await llm.ainvoke(prompt)

    # Parse the analyzed signals from Gemini's response
    try:
        content = response.content
        start = content.find("[")
        end = content.rfind("]") + 1
        analyzed_signals = json.loads(content[start:end])
    except (json.JSONDecodeError, ValueError):
        analyzed_signals = []

    # Filter to keep only high-demand signals (score 6 or above)
    filtered_signals = [
        signal for signal in analyzed_signals
        if signal.get("demand_score", 0) >= 6
    ]

    return {
        **state,
        "analyzed_signals": filtered_signals if filtered_signals else analyzed_signals[:10],
    }

async def architect_node(state: AgentState) -> AgentState:
    """Synthesize filtered signals and user skills into actionable project ideas."""
    # Prepare the analyzed signals for the prompt
    signals_text = json.dumps(state["analyzed_signals"], indent=2)

    # Build a prompt asking Gemini to create concrete project ideas
    prompt = (
        f"Based on these validated demand signals:\n{signals_text}\n\n"
        f"And the user's skills/interests: {state['user_interests']}\n\n"
        "Generate 3-5 concrete, actionable project ideas. Each idea must:\n"
        "- Solve a real pain point from the signals\n"
        "- Match the user's skill level\n"
        "- Include evidence from the community discussions\n"
        "- Be buildable by a solo developer in 2-8 weeks\n\n"
        "Return a valid JSON array:\n"
        '[{"title": "...", "description": "...", "pain_point": "...", '
        '"evidence": [{"source": "...", "quote": "..."}], '
        '"tech_stack": ["..."], "difficulty": "beginner/intermediate/advanced", '
        '"estimated_weeks": 4, "why_this_matches": "..."}]'
    )

    # Ask Gemini to synthesize ideas from signals and user profile
    response = await llm.ainvoke(prompt)

    # Parse the final project ideas from Gemini's response
    try:
        content = response.content
        start = content.find("[")
        end = content.rfind("]") + 1
        final_ideas = json.loads(content[start:end])
    except (json.JSONDecodeError, ValueError):
        final_ideas = []

    return {
        **state,
        "final_ideas": final_ideas,
    }