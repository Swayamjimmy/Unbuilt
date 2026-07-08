from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import ideas
# Create the FastAPI application
app = FastAPI(title="Unbuilt API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# Include endpoint routers
app.include_router(ideas.router)

# Mangum handler wraps the app for AWS Lambda compatibility
handler = Mangum(app, lifespan="off")