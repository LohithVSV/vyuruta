from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class RewardLog(Base):
    """
    A timestamped record of treasure changes for the weekly leaderboard.
    """
    __tablename__ = "reward_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    currency_amount = Column(Integer, nullable=False, default=0)
    xp_amount = Column(Integer, nullable=False, default=0)
    source = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())