from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Guild(Base):
    __tablename__ = "guilds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    college_name = Column(String, nullable=False)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())