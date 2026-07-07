from fastapi import FastAPI
from mangum import Mangum

from app.routers import ideas

# Create the FastAPI application
app = FastAPI(title="Unbuilt API", version="1.0.0")

# Include endpoint routers
app.include_router(ideas.router)

# Mangum handler wraps the app for AWS Lambda compatibility
handler = Mangum(app, lifespan="off")