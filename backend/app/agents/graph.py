from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.agents.state import AgentState

from app.agents.nodes import (
    scout_node,
    analyst_node,
    architect_node,
)


def build_graph() -> StateGraph:
    """
    Build the idea generation pipeline.

    Flow:

    START
      |
      v
    scout
      |
      v
    analyst
      |
      v
    architect
      |
      v
    END

    Scout and Analyst are deterministic.

    Re-running them with the same state would produce the
    same results and create an infinite LangGraph cycle.

    Architect is allowed to handle a small number of signals.
    """

    graph = StateGraph(
        AgentState
    )


    graph.add_node(
        "scout",
        scout_node,
    )

    graph.add_node(
        "analyst",
        analyst_node,
    )

    graph.add_node(
        "architect",
        architect_node,
    )


    graph.add_edge(
        START,
        "scout",
    )

    graph.add_edge(
        "scout",
        "analyst",
    )

    graph.add_edge(
        "analyst",
        "architect",
    )

    graph.add_edge(
        "architect",
        END,
    )


    return graph


idea_graph = (
    build_graph()
    .compile()
)


async def run_idea_graph(
    user_interests: list[str],
) -> dict:
    """
    Execute the idea generation graph.
    """

    initial_state: AgentState = {
        "user_interests":
            user_interests,

        "search_queries":
            [],

        "raw_findings":
            [],

        "analyzed_signals":
            [],

        "final_ideas":
            [],
    }


    print(
        "STARTING IDEA GRAPH",
        flush=True,
    )

    print(
        f"INTERESTS: "
        f"{user_interests}",
        flush=True,
    )


    result = await idea_graph.ainvoke(
        initial_state,
        {
            "recursion_limit": 10,
        },
    )


    print(
        "IDEA GRAPH COMPLETE",
        flush=True,
    )

    print(
        f"SEARCH QUERIES: "
        f"{len(result.get('search_queries', []))}",
        flush=True,
    )

    print(
        f"RAW FINDINGS: "
        f"{len(result.get('raw_findings', []))}",
        flush=True,
    )

    print(
        f"ANALYZED SIGNALS: "
        f"{len(result.get('analyzed_signals', []))}",
        flush=True,
    )

    print(
        f"FINAL IDEAS: "
        f"{len(result.get('final_ideas', []))}",
        flush=True,
    )


    return result