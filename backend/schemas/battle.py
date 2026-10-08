from pydantic import BaseModel, computed_field, field_validator
from datetime import datetime

from core.game_constants import BATTLE_DURATION_MINUTES


class BattleCreate(BaseModel):
    city_id: int
    proposed_time: datetime
    difficulty: int  # 1=easy 2=medium 3=difficult, chosen by the challenger

    @field_validator("difficulty")
    @classmethod
    def difficulty_must_be_valid(cls, v):
        if v not in (1, 2, 3):
            raise ValueError("difficulty must be 1 (easy), 2 (medium), or 3 (difficult)")
        return v


class BattleResponse(BaseModel):
    id: int
    challenger_id: int
    opponent_id: int
    city_id: int
    difficulty: int
    proposed_time: datetime
    status: str
    challenger_joined_at: datetime | None = None
    opponent_joined_at: datetime | None = None
    match_started_at: datetime | None = None
    tribute_choice: str | None = None
    tribute_amount: int | None = None
    created_at: datetime

    @computed_field
    @property
    def duration_minutes(self) -> int:
        return BATTLE_DURATION_MINUTES[self.difficulty]

    class Config:
        from_attributes = True