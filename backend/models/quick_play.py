from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from database import Base


class QuickPlayLock(Base):
    __tablename__ = "quick_play_locks"

    id = Column(Integer, primary_key=True)


class QuickPlayQueue(Base):
    __tablename__ = "quick_play_queue"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    difficulty = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="waiting")
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=True)
    queued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
