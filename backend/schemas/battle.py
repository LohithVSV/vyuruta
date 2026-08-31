from pydantic import BaseModel
from datetime import datetime


class BattleCreate(BaseModel):
    city_id: int
    proposed_time: datetime


class BattleResponse(BaseModel):
    id: int
    challenger_id: int
    opponent_id: int
    city_id: int
    proposed_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True