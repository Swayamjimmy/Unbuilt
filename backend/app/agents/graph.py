from typing import Literal

from langgraph.graph import StateGraph, START, END

from app.agents.state import AgentState
from app.agents.nodes import scout_node, analyst_node, architect_node

# Minimum number of analyzed signals before proceeding to Architect
MIN_SIGNALS_THRESHOLD = 3


def should_reflect(state: AgentState) -> Literal["scout", "architect"]:
    """Route back to Scout if Analyst found too few demand signals."""
    signals = state.get("analyzed_signals", [])
    if len(signals) < MIN_SIGNALS_THRESHOLD:
        return "scout"
    return "architect"


def build_graph() -> StateGraph:
    """Assemble the multi-agent graph with conditional reflection."""
    # Initialize the graph with our shared state schema
    graph = StateGraph(AgentState)

    # Register each agent as a named node
    graph.add_node("scout", scout_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("architect", architect_node)

    # Define the flow: START -> Scout -> Analyst
    graph.add_edge(START, "scout")
    graph.add_edge("scout", "analyst")

    # Conditional edge: Analyst decides next step based on signal quality
    graph.add_conditional_edges(
        "analyst",
        should_reflect,
        {"scout": "scout", "architect": "architect"},
    )

    # Architect is the final node
    graph.add_edge("architect", END)

    return graph


# Compile the graph into a runnable
idea_graph = build_graph().compile()

# Maximum graph transitions allowed per run
RECURSION_LIMIT = 10


async def run_idea_graph(user_interests: list[str]) -> dict:
    """Execute the idea generation graph with safety limits."""
    initial_state: AgentState = {
        "user_interests": user_interests,
        "search_queries": [],
        "raw_findings": [],
        "analyzed_signals": [],
        "final_ideas": [],
    }

    # Pass recursion_limit in the config to prevent runaway loops
    result = await idea_graph.ainvoke(
        initial_state,
        {"recursion_limit": RECURSION_LIMIT},
    )
    return result