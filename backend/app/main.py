from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import ideas


app = FastAPI(
    title="Unbuilt API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",

        # REPLACE WITH YOUR ACTUAL DEPLOYED FRONTEND URL
        "https://unbuilt-ten.vercel.app",
    ],

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "OPTIONS",
    ],

    allow_headers=[
        "*",
    ],
)


app.include_router(ideas.router)


handler = Mangum(
    app,
    lifespan="off",
)