import uuid
import asyncio
from fastapi import APIRouter

from app.schemas.ideas import GenerateIdeasRequest, IdeaResponse
from app.agents.graph import graph

router = APIRouter()

# In-memory job store for tracking generation progress
jobs: dict[str, dict] = {}

async def run_graph(job_id: str, request: GenerateIdeasRequest):
    """Run the LangGraph agent in the background and update job status."""
    try:
        jobs[job_id]["stage"] = "scouting"
        result = await graph.ainvoke({
            "user_interests": request.interests,
            "search_queries": [],
            "raw_findings": [],
            "analyzed_signals": [],
            "final_ideas": []
        })
        jobs[job_id]["status"] = "complete"
        jobs[job_id]["stage"] = "complete"
        jobs[job_id]["ideas"] = result["final_ideas"]
    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["stage"] = str(e)


@router.post("/api/generate-ideas", response_model=IdeaResponse)
async def generate_ideas(request: GenerateIdeasRequest):
    """Start idea generation and return a job ID for polling."""
    # Create a unique job ID for tracking
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "running", "stage": "scouting", "ideas": None}

    # Launch the graph in the background
    asyncio.create_task(run_graph(job_id, request))

    return IdeaResponse(job_id=job_id, status="running", stage="scouting")

@router.get("/api/status/{job_id}", response_model=IdeaResponse)
async def get_status(job_id: str):
    """Return current job progress for frontend polling."""
    job = jobs.get(job_id)
    if not job:
        return IdeaResponse(job_id=job_id, status="not_found")
    return IdeaResponse(
        job_id=job_id,
        status=job["status"],
        stage=job.get("stage"),
        ideas=job.get("ideas")
    )