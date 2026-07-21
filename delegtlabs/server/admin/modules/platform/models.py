import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


AGENT_CATEGORY = (
    "linkedin",
    "legal",
    "facebook_ads",
    "instagram",
    "twitter",
    "email",
    "whatsapp",
    "youtube",
    "pr",
    "review",
    "seo",
    "support",
)
AGENT_BILLING_UNIT = ("per_post", "per_run", "flat_monthly")
AGENT_STATUS = ("draft", "active", "deprecated")
PLAN_BILLING_CYCLE = ("monthly", "annual")
CLIENT_STATUS = ("active", "suspended", "trial")
SUBSCRIPTION_STATUS = ("active", "past_due", "cancelled")
CLIENT_AGENT_STATUS = ("active", "paused")
PRICE_ENTITY_TYPE = ("agent", "plan")


class Agent(TimestampMixin, Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(Enum(*AGENT_CATEGORY, name="agent_category"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_price_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    base_price_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    billing_unit: Mapped[str] = mapped_column(Enum(*AGENT_BILLING_UNIT, name="agent_billing_unit"), nullable=False)
    status: Mapped[str] = mapped_column(Enum(*AGENT_STATUS, name="agent_status"), nullable=False, default="draft")
    version: Mapped[int] = mapped_column(nullable=False, default=1)
    default_prompt_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardrail_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    plan_agents: Mapped[list["PlanAgent"]] = relationship(back_populates="agent")
    client_agents: Mapped[list["ClientAgent"]] = relationship(back_populates="agent")


class Plan(TimestampMixin, Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    price_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    price_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    billing_cycle: Mapped[str] = mapped_column(Enum(*PLAN_BILLING_CYCLE, name="plan_billing_cycle"), nullable=False)
    max_agents: Mapped[int] = mapped_column(nullable=False, default=0)
    max_posts_per_month: Mapped[int] = mapped_column(nullable=False, default=0)
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    is_custom: Mapped[bool] = mapped_column(nullable=False, default=False)

    plan_agents: Mapped[list["PlanAgent"]] = relationship(back_populates="plan")
    subscriptions: Mapped[list["ClientSubscription"]] = relationship(back_populates="plan")


class PlanAgent(TimestampMixin, Base):
    __tablename__ = "plan_agents"
    __table_args__ = (UniqueConstraint("plan_id", "agent_id", name="uq_plan_agents_plan_id_agent_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agents.id", ondelete="RESTRICT"), nullable=False)
    included_quota: Mapped[int | None] = mapped_column(nullable=True)
    override_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    plan: Mapped["Plan"] = relationship(back_populates="plan_agents")
    agent: Mapped["Agent"] = relationship(back_populates="plan_agents")


class Client(TimestampMixin, Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Enum(*CLIENT_STATUS, name="client_status"), nullable=False, default="trial")
    region: Mapped[str | None] = mapped_column(String(80), nullable=True)

    subscriptions: Mapped[list["ClientSubscription"]] = relationship(back_populates="client")
    client_agents: Mapped[list["ClientAgent"]] = relationship(back_populates="client")


class ClientSubscription(Base):
    __tablename__ = "client_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    renews_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(Enum(*SUBSCRIPTION_STATUS, name="subscription_status"), nullable=False)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped["Client"] = relationship(back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship(back_populates="subscriptions")


class ClientAgent(TimestampMixin, Base):
    __tablename__ = "client_agents"
    __table_args__ = (UniqueConstraint("client_id", "agent_id", name="uq_client_agents_client_id_agent_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agents.id", ondelete="RESTRICT"), nullable=False)
    custom_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(Enum(*CLIENT_AGENT_STATUS, name="client_agent_status"), nullable=False, default="active")

    client: Mapped["Client"] = relationship(back_populates="client_agents")
    agent: Mapped["Agent"] = relationship(back_populates="client_agents")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(Enum(*PRICE_ENTITY_TYPE, name="price_entity_type"), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    old_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    new_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    changed_by: Mapped[str] = mapped_column(String(255), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
