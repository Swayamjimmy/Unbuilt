from pydantic import BaseModel

# Request model for the idea generation endpoint
class GenerateIdeasRequest(BaseModel):
    interests: list[str]
    tech_stack: list[str]

# Response model returned by both endpoints
class IdeaResponse(BaseModel):
    job_id: str
    status: str
    stage: str | None = None
    ideas: list[dict] | None = None