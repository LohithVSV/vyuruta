from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sprints
from routers import auth, cities, battles
from routers import problems
from routers import leaderboard
from routers import submissions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}