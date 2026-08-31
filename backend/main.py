from fastapi import FastAPI
from backend.routers import sprints
from routers import auth, cities, battles

app = FastAPI()

app.include_router(auth.router)
app.include_router(cities.router)
app.include_router(battles.router)
app.include_router(sprints.router)

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}