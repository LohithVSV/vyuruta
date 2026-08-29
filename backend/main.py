from fastapi import FastAPI
from routers import auth, cities

app = FastAPI()

app.include_router(auth.router)
app.include_router(cities.router)

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}