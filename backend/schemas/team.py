from pydantic import BaseModel
from datetime import datetime

class TeamCreate(BaseModel):
    name: str
    guild_id: int

class TeamResponse(BaseModel):
    id: int
    name: str
    guild_id: int
    created_at: datetime

    class Config:
        from_attributes = True