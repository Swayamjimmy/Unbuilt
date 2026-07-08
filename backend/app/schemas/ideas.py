from pydantic import BaseModel, HttpUrl


class GenerateIdeasRequest(BaseModel):
    interests: list[str]
    tech_stack: list[str]
    github_url: HttpUrl | None = None


class IdeaResponse(BaseModel):
    job_id: str
    status: str
    stage: str | None = None
    ideas: list[dict] | None = None