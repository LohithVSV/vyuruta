from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SprintResponse(BaseModel):
    id: int
    battle_id: int
    problem_title: str
    status: str
    claimed_winner_id: Optional[int] = None
    winner_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True