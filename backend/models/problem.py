from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.topic import problem_topics


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Integer, nullable=False)  # 1 = easy, 2 = medium, 3 = hard
    function_signature = Column(String, nullable=True)
    time_limit_ms = Column(Integer, default=2000)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    test_cases = relationship(
        "TestCase", back_populates="problem", cascade="all, delete-orphan"
    )
    topics = relationship("Topic", secondary=problem_topics, back_populates="problems")