from sqlalchemy import Column, DateTime, Integer
from database import Base


class Season(Base):
    __tablename__ = "game_seasons"

    id = Column(Integer, primary_key=True)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
