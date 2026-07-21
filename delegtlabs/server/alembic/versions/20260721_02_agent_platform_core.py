"""agent platform core generic tables

Revision ID: 20260721_02
Revises: 20260708_01
Create Date: 2026-07-21 20:00:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260721_02"
down_revision: Union[str, None] = "20260708_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["client_agent_id"], ["client_agents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_configs_client_agent_id"), "agent_configs", ["client_agent_id"], unique=False)

    op.create_table(
        "agent_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_type", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("output_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["client_agent_id"], ["client_agents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_runs_client_agent_id"), "agent_runs", ["client_agent_id"], unique=False)

    op.create_table(
        "agent_metrics_daily",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_date", sa.Date(), nullable=False),
        sa.Column("metric_name", sa.String(length=100), nullable=False),
        sa.Column("metric_value", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["client_agent_id"], ["client_agents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_metrics_daily_client_agent_id"), "agent_metrics_daily", ["client_agent_id"], unique=False)
    op.create_index(op.f("ix_agent_metrics_daily_metric_date"), "agent_metrics_daily", ["metric_date"], unique=False)

    op.create_table(
        "agent_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("encrypted_token", sa.LargeBinary(), nullable=False),
        sa.Column("refresh_token", sa.LargeBinary(), nullable=True),
        sa.Column("scopes", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["client_agent_id"], ["client_agents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_credentials_client_agent_id"), "agent_credentials", ["client_agent_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_agent_credentials_client_agent_id"), table_name="agent_credentials")
    op.drop_table("agent_credentials")
    op.drop_index(op.f("ix_agent_metrics_daily_metric_date"), table_name="agent_metrics_daily")
    op.drop_index(op.f("ix_agent_metrics_daily_client_agent_id"), table_name="agent_metrics_daily")
    op.drop_table("agent_metrics_daily")
    op.drop_index(op.f("ix_agent_runs_client_agent_id"), table_name="agent_runs")
    op.drop_table("agent_runs")
    op.drop_index(op.f("ix_agent_configs_client_agent_id"), table_name="agent_configs")
    op.drop_table("agent_configs")
