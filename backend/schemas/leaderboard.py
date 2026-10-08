from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    treasure: int

    class Config:
        from_attributes = True