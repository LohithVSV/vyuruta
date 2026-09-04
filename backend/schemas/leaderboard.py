from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    xp: int

    class Config:
        from_attributes = True