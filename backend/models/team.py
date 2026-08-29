from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())