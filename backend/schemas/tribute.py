from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class TributeChoice(BaseModel):
    choice: Literal["pay", "tax"]


class TributeResponse(BaseModel):
    id: int
    debtor_id: int
    creditor_id: int
    tax_rate_percent: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True