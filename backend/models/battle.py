from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Battle(Base):
    __tablename__ = "battles"

    id = Column(Integer, primary_key=True, index=True)

    challenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opponent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)

    difficulty = Column(Integer, nullable=False, default=1)  # 1=easy 2=medium 3=hard, set by challenger

    proposed_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending | accepted | rejected | awaiting_tribute | resolved

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    challenger = relationship("User", foreign_keys=[challenger_id])
    opponent = relationship("User", foreign_keys=[opponent_id])
    city = relationship("City")