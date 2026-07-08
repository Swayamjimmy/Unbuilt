import asyncio
import json
import os
import traceback

import boto3


AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
JOBS_TABLE_NAME = os.getenv("JOBS_TABLE_NAME", "ideaforge-jobs")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION,
)

jobs_table = dynamodb.Table(JOBS_TABLE_NAME)


def update_job(
    job_id: str,
    status: str,
    stage: str,
    ideas=None,
):
    expression = (
        "SET #status = :status, "
        "stage = :stage"
    )

    names = {
        "#status": "status",
    }

    values = {
        ":status": status,
        ":stage": stage,
    }

    if ideas is not None:
        expression += ", ideas = :ideas"
        values[":ideas"] = ideas

    jobs_table.update_item(
        Key={
            "job_id": job_id,
        },
        UpdateExpression=expression,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )


async def process_job(
    message: dict,
):
    job_id = message["job_id"]
    interests = message.get("interests", [])

    print("=" * 60, flush=True)
    print("WORKER START", flush=True)
    print(f"JOB ID: {job_id}", flush=True)
    print(f"INTERESTS: {interests}", flush=True)
    print("=" * 60, flush=True)

    try:
        update_job(
            job_id=job_id,
            status="scouting",
            stage="scouting",
        )

        from app.agents.graph import run_idea_graph

        print(
            f"GRAPH IMPORT COMPLETE job={job_id}",
            flush=True,
        )

        result = await run_idea_graph(
            user_interests=interests,
        )

        ideas = result.get(
            "final_ideas",
            [],
        )

        update_job(
            job_id=job_id,
            status="complete",
            stage="complete",
            ideas=ideas,
        )

        print(
            f"WORKER COMPLETE "
            f"job={job_id} "
            f"ideas={len(ideas)}",
            flush=True,
        )

    except Exception as error:
        error_type = type(error).__name__
        error_message = str(error)

        full_error = (
            f"{error_type}: "
            f"{error_message or repr(error)}"
        )

        print("=" * 60, flush=True)
        print("WORKER FAILED", flush=True)
        print(f"JOB ID: {job_id}", flush=True)
        print(f"ERROR: {full_error}", flush=True)

        traceback.print_exc()

        print("=" * 60, flush=True)

        update_job(
            job_id=job_id,
            status="error",
            stage=full_error,
        )

        raise


async def process_records(
    event: dict,
):
    for record in event.get("Records", []):
        message = json.loads(
            record["body"]
        )

        await process_job(message)


def handler(
    event,
    context,
):
    print(
        f"SQS EVENT records="
        f"{len(event.get('Records', []))}",
        flush=True,
    )

    asyncio.run(
        process_records(event)
    )

    return {
        "statusCode": 200,
    }