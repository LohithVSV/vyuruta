from fastapi import FastAPI
from routers import sprints
from routers import auth, cities, battles
from routers import problems
from routers import leaderboard


app = FastAPI()

app.include_router(auth.router)
app.include_router(cities.router)
app.include_router(battles.router)
app.include_router(sprints.router)
app.include_router(problems.router)
app.include_router(leaderboard.router)

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}