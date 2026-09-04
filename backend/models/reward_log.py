from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class RewardLog(Base):
    """
    A timestamped record of every currency/xp payout. This exists so the
    weekly leaderboard can be computed by filtering on created_at, instead
    of needing a scheduled job to reset a weekly counter. Season leaderboard
    still reads straight off User.xp (cumulative) since seasons already
    reset manually for now.
    """
    __tablename__ = "reward_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    currency_amount = Column(Integer, nullable=False, default=0)
    xp_amount = Column(Integer, nullable=False, default=0)  # amount actually kept, after any tax siphon
    source = Column(String, nullable=False)  # e.g. "sprint_win"

    created_at = Column(DateTime(timezone=True), server_default=func.now())