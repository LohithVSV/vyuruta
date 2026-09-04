from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    college_name = Column(String, nullable=False)

    currency = Column(Integer, nullable=False, default=0)
    xp = Column(Integer, nullable=False, default=0)
    win_streak = Column(Integer, nullable=False, default=0)
    has_hosting_rights = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    city = relationship("City", back_populates="owner", uselist=False)