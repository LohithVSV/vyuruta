import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sprints
from routers import auth, cities, battles
from routers import problems
from routers import leaderboard
from routers import submissions
from routers import treasure
from schema_migrations import initialize_database

app = FastAPI()


@app.on_event("startup")
def initialize_schema():
    initialize_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv(
            "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cities.router)
app.include_router(battles.router)
app.include_router(sprints.router)
app.include_router(problems.router)
app.include_router(leaderboard.router)
app.include_router(submissions.router)
app.include_router(treasure.router)

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}