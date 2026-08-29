from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CityResponse(BaseModel):
    id: int
    name: str
    subject_cluster: str
    owner_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True