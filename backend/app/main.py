from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import ideas


app = FastAPI(
    title="IdeaForge API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://unbuilt-ten.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    ideas.router,
)


@app.get("/")
async def root():
    return {
        "message": "IdeaForge API",
    }


handler = Mangum(app)