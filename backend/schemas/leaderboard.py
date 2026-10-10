from pydantic import BaseModel
from datetime import datetime


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    treasure: int

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    period: str
    world: str
    season_start: datetime
    season_end: datetime
    entries: list[LeaderboardEntry]