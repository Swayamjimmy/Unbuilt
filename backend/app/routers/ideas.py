import asyncio
import traceback
import uuid

from fastapi import APIRouter

from app.agents.graph import run_idea_graph
from app.schemas.ideas import GenerateIdeasRequest, IdeaResponse


router = APIRouter()

# In-memory job store.
# NOTE: This is okay for local development, but is not reliable
# across separate AWS Lambda execution environments.
jobs: dict[str, dict] = {}


async def run_graph(
    job_id: str,
    request: GenerateIdeasRequest,
):
    """Run the idea generation graph and update job status."""

    try:
        print("=" * 60)
        print("STARTING IDEA GRAPH")
        print(f"JOB ID: {job_id}")
        print(f"INTERESTS: {request.interests}")
        print("=" * 60)

        jobs[job_id]["stage"] = "scouting"

        result = await run_idea_graph(
            user_interests=request.interests,
        )

        print("=" * 60)
        print("IDEA GRAPH COMPLETED")
        print(f"JOB ID: {job_id}")
        print("=" * 60)

        jobs[job_id]["status"] = "complete"
        jobs[job_id]["stage"] = "complete"
        jobs[job_id]["ideas"] = result.get(
            "final_ideas",
            [],
        )

    except Exception as e:
        error_type = type(e).__name__
        error_repr = repr(e)

        print("=" * 60)
        print("IDEA GRAPH FAILED")
        print(f"JOB ID: {job_id}")
        print(f"ERROR TYPE: {error_type}")
        print(f"ERROR REPR: {error_repr}")

        traceback.print_exc()

        print("=" * 60)

        jobs[job_id]["status"] = "error"
        jobs[job_id]["stage"] = (
            f"{error_type}: {error_repr}"
        )
        jobs[job_id]["ideas"] = None


@router.post(
    "/api/generate-ideas",
    response_model=IdeaResponse,
)
async def generate_ideas(
    request: GenerateIdeasRequest,
):
    """Start idea generation and return a job ID."""

    job_id = str(uuid.uuid4())

    print("=" * 60)
    print("NEW IDEA GENERATION REQUEST")
    print(f"JOB ID: {job_id}")
    print(f"TECH STACK: {request.tech_stack}")
    print(f"INTERESTS: {request.interests}")
    print(f"GITHUB URL: {request.github_url}")
    print("=" * 60)

    jobs[job_id] = {
        "status": "running",
        "stage": "scouting",
        "ideas": None,
    }

    asyncio.create_task(
        run_graph(
            job_id=job_id,
            request=request,
        )
    )

    return IdeaResponse(
        job_id=job_id,
        status="running",
        stage="scouting",
        ideas=None,
    )


@router.get(
    "/api/status/{job_id}",
    response_model=IdeaResponse,
)
async def get_status(
    job_id: str,
):
    """Return the current status of an idea generation job."""

    job = jobs.get(job_id)

    if not job:
        print(
            f"JOB NOT FOUND: {job_id}"
        )

        return IdeaResponse(
            job_id=job_id,
            status="not_found",
            stage=None,
            ideas=None,
        )

    print(
        f"JOB STATUS: {job_id} "
        f"status={job['status']} "
        f"stage={job.get('stage')}"
    )

    return IdeaResponse(
        job_id=job_id,
        status=job["status"],
        stage=job.get("stage"),
        ideas=job.get("ideas"),
    )