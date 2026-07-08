import json
import os
import uuid

import boto3
from fastapi import APIRouter

from app.schemas.ideas import GenerateIdeasRequest, IdeaResponse


router = APIRouter()

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
JOBS_TABLE_NAME = os.getenv("JOBS_TABLE_NAME", "ideaforge-jobs")
JOBS_QUEUE_URL = os.getenv("JOBS_QUEUE_URL")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION,
)

sqs = boto3.client(
    "sqs",
    region_name=AWS_REGION,
)

jobs_table = dynamodb.Table(JOBS_TABLE_NAME)


@router.post(
    "/api/generate-ideas",
    response_model=IdeaResponse,
)
async def generate_ideas(
    request: GenerateIdeasRequest,
):
    job_id = str(uuid.uuid4())

    print(
        f"CREATING JOB job={job_id}",
        flush=True,
    )

    jobs_table.put_item(
        Item={
            "job_id": job_id,
            "status": "queued",
            "stage": "queued",
        }
    )

    message = {
        "job_id": job_id,
        "interests": request.interests,
        "tech_stack": request.tech_stack,
        "github_url": (
            str(request.github_url)
            if request.github_url
            else None
        ),
    }

    try:
        sqs.send_message(
            QueueUrl=JOBS_QUEUE_URL,
            MessageBody=json.dumps(message),
        )

    except Exception:
        jobs_table.update_item(
            Key={
                "job_id": job_id,
            },
            UpdateExpression=(
                "SET #status = :status, "
                "stage = :stage"
            ),
            ExpressionAttributeNames={
                "#status": "status",
            },
            ExpressionAttributeValues={
                ":status": "error",
                ":stage": "Failed to queue job",
            },
        )

        raise

    print(
        f"JOB QUEUED job={job_id}",
        flush=True,
    )

    return IdeaResponse(
        job_id=job_id,
        status="queued",
        stage="queued",
        ideas=None,
    )


@router.get(
    "/api/status/{job_id}",
    response_model=IdeaResponse,
)
async def get_status(
    job_id: str,
):
    response = jobs_table.get_item(
        Key={
            "job_id": job_id,
        }
    )

    job = response.get("Item")

    if not job:
        return IdeaResponse(
            job_id=job_id,
            status="not_found",
            stage=None,
            ideas=None,
        )

    print(
        f"JOB STATUS job={job_id} "
        f"status={job.get('status')} "
        f"stage={job.get('stage')}",
        flush=True,
    )

    return IdeaResponse(
        job_id=job_id,
        status=job["status"],
        stage=job.get("stage"),
        ideas=job.get("ideas"),
    )