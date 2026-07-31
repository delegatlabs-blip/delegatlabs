import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AdminAgent(Base):
    """Admin console agent catalog (listing + runtime config)."""

    __tablename__ = "admin_agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    category: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")
    version: Mapped[str] = mapped_column(Text, nullable=False, default="1.0.0")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    short_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    detailed_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    features: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    redirect_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    demo_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    documentation_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    payment_type: Mapped[str] = mapped_column(Text, nullable=False, default="subscription")
    subscription_plans: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    credit_packs: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(Text, nullable=False, default="USD")
    billing_interval: Mapped[str] = mapped_column(Text, nullable=False, default="monthly")
    plan_name: Mapped[str] = mapped_column(Text, nullable=False, default="")
    listed_on_website: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
