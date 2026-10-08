import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_attempt_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="SET NULL"), nullable=True)
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("exposure_sessions.id", ondelete="SET NULL"), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="fallback-v1", nullable=False)
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "assessment_written", "exposure_session"
    analysis_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, completed, failed
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assessment_attempt = relationship("AssessmentAttempt", back_populates="ai_analysis")
    session = relationship("ExposureSession", back_populates="ai_analysis")
    report = relationship("Report", back_populates="ai_analysis", uselist=False)

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_attempt_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="SET NULL"), nullable=True)
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("exposure_sessions.id", ondelete="SET NULL"), nullable=True)
    ai_analysis_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_analyses.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    practice_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft, ai_completed, awaiting_review, revision_required, approved, released
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assessment_attempt = relationship("AssessmentAttempt", back_populates="report")
    session = relationship("ExposureSession", back_populates="report")
    ai_analysis = relationship("AIAnalysis", back_populates="report")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
