from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    input_data = Column(Text, nullable=False)      # stdin fed to the submission
    expected_output = Column(Text, nullable=False)  # exact stdout expected
    is_sample = Column(Boolean, default=False)  # True = shown to user before submitting, False = hidden judge case

    problem = relationship("Problem", back_populates="test_cases")