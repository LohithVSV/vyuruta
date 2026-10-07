from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Tribute(Base):
    """A temporary XP tribute owed by one player to another."""

    __tablename__ = "tributes"
    __table_args__ = (UniqueConstraint("debtor_id", "creditor_id", name="uq_tribute_pair"),)

    id = Column(Integer, primary_key=True, index=True)

    debtor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creditor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    tax_rate_percent = Column(Integer, nullable=False, default=1)
    active = Column(Boolean, nullable=False, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    debtor = relationship("User", foreign_keys=[debtor_id])
    creditor = relationship("User", foreign_keys=[creditor_id])