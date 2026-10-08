from datetime import datetime

from pydantic import BaseModel


class DailyTreasureStatus(BaseModel):
    amount: int
    claimed_today: bool
    next_claim_at: datetime
    currency: int


class TreasureHistoryEntry(BaseModel):
    id: int
    amount: int
    related_username: str | None = None
    created_at: datetime
