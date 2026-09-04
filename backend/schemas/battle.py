from pydantic import BaseModel, field_validator
from datetime import datetime


class BattleCreate(BaseModel):
    city_id: int
    proposed_time: datetime
    difficulty: int  # 1=easy 2=medium 3=hard, chosen by the challenger

    @field_validator("difficulty")
    @classmethod
    def difficulty_must_be_valid(cls, v):
        if v not in (1, 2, 3):
            raise ValueError("difficulty must be 1 (easy), 2 (medium), or 3 (hard)")
        return v


class BattleResponse(BaseModel):
    id: int
    challenger_id: int
    opponent_id: int
    city_id: int
    difficulty: int
    proposed_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True