from typing import TypedDict

class AgentState(TypedDict):
    """Shared state container for the multi-agent graph.

    Each field represents a stage of the idea discovery pipeline:
    - user_interests: what the user cares about
    - search_queries: dynamically generated queries for external APIs
    - raw_findings: unprocessed results from Reddit and HackerNews
    - analyzed_signals: scored and filtered demand signals
    - final_ideas: synthesized, actionable project ideas
    """
    user_interests: list[str]
    search_queries: list[str]
    raw_findings: list[dict]
    analyzed_signals: list[dict]
    final_ideas: list[dict]