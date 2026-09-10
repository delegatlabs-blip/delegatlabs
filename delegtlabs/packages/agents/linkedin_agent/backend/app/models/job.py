import enum
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy import Text, DateTime, Enum as SQLEnum, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class JobType(str, enum.Enum):
    GENERATE = "generate"
    PUBLISH = "publish"
    FEEDBACK = "feedback"
    MANUAL_TRIGGER = "manual_trigger"

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[JobType] = mapped_column(SQLEnum(JobType, name="job_type", create_type=False), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status", create_type=False),
        default=JobStatus.PENDING
    )
    payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
