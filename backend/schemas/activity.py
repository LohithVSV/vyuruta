from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RecentBattleActivity(BaseModel):
    id: int
    text: str
    created_at: Optional[datetime]
