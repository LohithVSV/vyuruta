from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_date = Column(Date, nullable=False, unique=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    problem = relationship("Problem")


class DailyAttempt(Base):
    __tablename__ = "daily_challenge_attempts"
    __table_args__ = (
        UniqueConstraint(
            "daily_challenge_id",
            "user_id",
            name="uq_daily_challenge_attempt_user",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    daily_challenge_id = Column(
        Integer,
        ForeignKey("daily_challenges.id"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="in_progress")
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    solve_time_seconds = Column(Integer, nullable=True)

    daily_challenge = relationship("DailyChallenge")
    user = relationship("User")
