from fastapi import FastAPI
from routers import auth

app = FastAPI()

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Vyuruta backend is alive"}