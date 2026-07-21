"""admin panel initial schema

Revision ID: 20260708_01
Revises:
Create Date: 2026-07-08 21:45:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260708_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("category", sa.Enum("linkedin", "facebook_ads", "instagram", "twitter", "email", "whatsapp", "youtube", "pr", "review", "seo", "support", name="agent_category"), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("base_price_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("base_price_usd", sa.Numeric(12, 2), nullable=False),
        sa.Column("billing_unit", sa.Enum("per_post", "per_run", "flat_monthly", name="agent_billing_unit"), nullable=False),
        sa.Column("status", sa.Enum("draft", "active", "deprecated", name="agent_status"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("default_prompt_ref", sa.String(length=255), nullable=True),
        sa.Column("guardrail_config", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("price_inr", sa.Numeric(12, 2), nullable=False),
        sa.Column("price_usd", sa.Numeric(12, 2), nullable=False),
        sa.Column("billing_cycle", sa.Enum("monthly", "annual", name="plan_billing_cycle"), nullable=False),
        sa.Column("max_agents", sa.Integer(), nullable=False),
        sa.Column("max_posts_per_month", sa.Integer(), nullable=False),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_custom", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("org_name", sa.String(length=255), nullable=False),
        sa.Column("owner_email", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Enum("active", "suspended", "trial", name="client_status"), nullable=False),
        sa.Column("region", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_clients_owner_email"), "clients", ["owner_email"], unique=False)

    op.create_table(
        "plan_agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("included_quota", sa.Integer(), nullable=True),
        sa.Column("override_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("plan_id", "agent_id", name="uq_plan_agents_plan_id_agent_id"),
    )

    op.create_table(
        "client_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("renews_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.Enum("active", "past_due", "cancelled", name="subscription_status"), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "client_agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("custom_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Enum("active", "paused", name="client_agent_status"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", "agent_id", name="uq_client_agents_client_id_agent_id"),
    )

    op.create_table(
        "price_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.Enum("agent", "plan", name="price_entity_type"), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("old_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("new_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("changed_by", sa.String(length=255), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_price_history_entity_id"), "price_history", ["entity_id"], unique=False)

    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("admin_user_id", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_type", sa.String(length=100), nullable=False),
        sa.Column("target_id", sa.String(length=255), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_log_admin_user_id"), "audit_log", ["admin_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_log_admin_user_id"), table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_index(op.f("ix_price_history_entity_id"), table_name="price_history")
    op.drop_table("price_history")
    op.drop_table("client_agents")
    op.drop_table("client_subscriptions")
    op.drop_table("plan_agents")
    op.drop_index(op.f("ix_clients_owner_email"), table_name="clients")
    op.drop_table("clients")
    op.drop_table("plans")
    op.drop_table("agents")

    op.execute("DROP TYPE IF EXISTS price_entity_type")
    op.execute("DROP TYPE IF EXISTS client_agent_status")
    op.execute("DROP TYPE IF EXISTS subscription_status")
    op.execute("DROP TYPE IF EXISTS client_status")
    op.execute("DROP TYPE IF EXISTS plan_billing_cycle")
    op.execute("DROP TYPE IF EXISTS agent_status")
    op.execute("DROP TYPE IF EXISTS agent_billing_unit")
    op.execute("DROP TYPE IF EXISTS agent_category")
