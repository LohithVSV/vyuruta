from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

problem_topics = Table(
    "problem_topics",
    Base.metadata,
    Column("problem_id", Integer, ForeignKey("problems.id"), primary_key=True),
    Column("topic_id", Integer, ForeignKey("topics.id"), primary_key=True),
)


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g. "arrays", "dp", "graphs", "strings"

    problems = relationship("Problem", secondary=problem_topics, back_populates="topics")