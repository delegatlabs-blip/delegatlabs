import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.db.base import Base


class LawyerDraftSession(Base):
    __tablename__ = "lawyer_draft_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("client_agents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    draft_id: Mapped[str] = mapped_column(String(100), nullable=False)
    draft_title: Mapped[str] = mapped_column(String(255), nullable=False)
    draft_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    jurisdiction: Mapped[str] = mapped_column(String(100), nullable=False, default="Uttar Pradesh")
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="in_progress")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class LawyerGeneratedDraft(Base):
    __tablename__ = "lawyer_generated_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("client_agents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("lawyer_draft_sessions.id", ondelete="SET NULL"), nullable=True
    )
    draft_id: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="mock")
    model: Mapped[str] = mapped_column(String(100), nullable=False, default="delegatlabs-mock-v1")
    draft_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="generated")
    warnings: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
