import asyncio
from dotenv import load_dotenv
from app.agents.graph import run_idea_graph

# Load environment variables from .env
load_dotenv()


async def main():
    """Run the graph with sample interests and print results."""
    print("Starting idea generation graph...")
    print("="* 50)

    result = await run_idea_graph(
        user_interests=["machine learning", "web development", "Python"]
    )

    print(f"\nSearch queries generated: {len(result['search_queries'])}")
    print(f"Raw findings collected: {len(result['raw_findings'])}")
    print(f"Analyzed signals: {len(result['analyzed_signals'])}")
    print(f"Final ideas generated: {len(result['final_ideas'])}")
    print("\n" + "=" * 50)

    for i, idea in enumerate(result["final_ideas"], 1):
        print(f"\nIdea {i}: {idea.get('title', 'Untitled')}")
        print(f"  Summary: {idea.get('summary', 'No summary')}")


if __name__ == "__main__":
    asyncio.run(main())