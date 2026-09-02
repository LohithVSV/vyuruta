from pydantic import BaseModel


class TopicOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True