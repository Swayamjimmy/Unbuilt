
import os
import httpx

REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
REDDIT_API_BASE = "https://oauth.reddit.com"

async def _get_reddit_token() -> str:
    """Obtain a Reddit OAuth2 token with defensive validation."""
    client_id = os.getenv("REDDIT_CLIENT_ID", "")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET", "")
    
    if not client_id or not client_secret:
        raise ValueError("Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET environment variables.")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            REDDIT_TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
            headers={"User-Agent": "IdeaForge:v1.0.0 (by /u/IdeaForgeBot)"},
        )
        response.raise_for_status()
        return response.json()["access_token"]

async def reddit_search(query: str, subreddits: list[str]) -> list[dict]:
    """Search Reddit for posts matching a query. Falls back to mock data if no keys exist."""
    client_id = os.getenv("REDDIT_CLIENT_ID", "")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET", "")

    # Clean fallback when the user does not have API keys
    if not client_id or not client_secret:
        target_sub = subreddits[0] if subreddits else "startup"
        return [
            {
                "source": "reddit",
                "subreddit": target_sub,
                "title": f"Frustrated with existing solutions for {query}",
                "selftext": f"I have been trying to find a solid tool for {query} but everything is either too expensive or missing basic features. Is anyone else building a workaround for this?",
                "score": 45,
                "num_comments": 12,
                "url": f"https://reddit.com/r/{target_sub}/comments/mock_post_1"
            },
            {
                "source": "reddit",
                "subreddit": target_sub,
                "title": f"Is there an open-source alternative for {query}?",
                "selftext": "Our team needs to handle this workflow locally. I'm searching for modern stacks or self-hosted platforms that address this challenge directly.",
                "score": 31,
                "num_comments": 8,
                "url": f"https://reddit.com/r/{target_sub}/comments/mock_post_2"
            }
        ]

    # Real authenticated query (executed if keys are successfully loaded)
    try:
        token = await _get_reddit_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "IdeaForge:v1.0.0 (by /u/IdeaForgeBot)",
        }

        results = []
        async with httpx.AsyncClient() as client:
            for subreddit in subreddits:
                response = await client.get(
                    f"{REDDIT_API_BASE}/r/{subreddit}/search",
                    headers=headers,
                    params={
                        "q": query,
                        "sort": "relevance",
                        "limit": 5,
                        "restrict_sr": "true",
                    },
                )
                if response.status_code == 200:
                    posts = response.json().get("data", {}).get("children", [])
                    for post in posts:
                        post_data = post.get("data", {})
                        results.append({
                            "source": "reddit",
                            "subreddit": subreddit,
                            "title": post_data.get("title", ""),
                            "selftext": post_data.get("selftext", "")[:500],
                            "score": post_data.get("score", 0),
                            "num_comments": post_data.get("num_comments", 0),
                            "url": post_data.get("url", ""),
                        })
        return results
    except Exception as e:
        # Gracefully handle network issues or API blockages
        return []

# HackerNews Algolia Search API (free, no auth required)
HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search"

async def hackernews_search(query: str) -> list[dict]:
    """Search HackerNews for stories matching a query via the Algolia API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            HN_SEARCH_URL,
            params={
                "query": query,
                "tags": "story",
                "hitsPerPage": 10,
            },
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for hit in data.get("hits", []):
        results.append({
            "source": "hackernews",
            "title": hit.get("title", ""),
            "url": hit.get("url", ""),
            "points": hit.get("points", 0),
            "num_comments": hit.get("num_comments", 0),
            "object_id": hit.get("objectID", ""),
        })

    return results