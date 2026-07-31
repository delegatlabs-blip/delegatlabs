"""admin catalog agents/users/customers for console CRUD

Revision ID: 20260727_03
Revises: 20260721_02
Create Date: 2026-07-27 23:50:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260727_03"
down_revision: Union[str, None] = "20260721_02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), server_default="", nullable=False),
        sa.Column("status", sa.Text(), server_default="draft", nullable=False),
        sa.Column("version", sa.Text(), server_default="1.0.0", nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("short_description", sa.Text(), server_default="", nullable=False),
        sa.Column("detailed_description", sa.Text(), server_default="", nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("redirect_url", sa.Text(), server_default="", nullable=False),
        sa.Column("demo_url", sa.Text(), server_default="", nullable=False),
        sa.Column("documentation_url", sa.Text(), server_default="", nullable=False),
        sa.Column("payment_type", sa.Text(), server_default="subscription", nullable=False),
        sa.Column(
            "subscription_plans",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "credit_packs",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("currency", sa.Text(), server_default="USD", nullable=False),
        sa.Column("billing_interval", sa.Text(), server_default="monthly", nullable=False),
        sa.Column("plan_name", sa.Text(), server_default="", nullable=False),
        sa.Column("listed_on_website", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_agents_slug", "admin_agents", ["slug"], unique=False)
    op.create_index("ix_admin_agents_listed", "admin_agents", ["listed_on_website", "status"], unique=False)

    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), server_default="", nullable=False),
        sa.Column("company", sa.Text(), server_default="", nullable=False),
        sa.Column("role", sa.Text(), server_default="Viewer", nullable=False),
        sa.Column("status", sa.Text(), server_default="active", nullable=False),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "admin_customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), server_default="", nullable=False),
        sa.Column("company", sa.Text(), server_default="", nullable=False),
        sa.Column("plan", sa.Text(), server_default="Starter", nullable=False),
        sa.Column("status", sa.Text(), server_default="active", nullable=False),
        sa.Column("agents_purchased", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_spend", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )


def downgrade() -> None:
    op.drop_table("admin_customers")
    op.drop_table("admin_users")
    op.drop_index("ix_admin_agents_listed", table_name="admin_agents")
    op.drop_index("ix_admin_agents_slug", table_name="admin_agents")
    op.drop_table("admin_agents")
