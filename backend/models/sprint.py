from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)

    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False, unique=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=True)
    problem_title = Column(String, nullable=False, default="Untitled DSA Problem")

    # pending -> claimed -> finished  (or back to pending if disputed)
    status = Column(String, nullable=False, default="pending")

    claimed_winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    battle = relationship("Battle")
    problem = relationship("Problem")
    claimed_winner = relationship("User", foreign_keys=[claimed_winner_id])
    winner = relationship("User", foreign_keys=[winner_id])