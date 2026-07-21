from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AgentCreate(BaseModel):
    name: str
    slug: str
    category: str
    description: str | None = None
    base_price_inr: Decimal = Field(default=Decimal("0"))
    base_price_usd: Decimal = Field(default=Decimal("0"))
    billing_unit: str
    status: str = "draft"
    version: int = 1
    default_prompt_ref: str | None = None
    guardrail_config: dict = Field(default_factory=dict)


class AgentUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    category: str | None = None
    description: str | None = None
    base_price_inr: Decimal | None = None
    base_price_usd: Decimal | None = None
    billing_unit: str | None = None
    status: str | None = None
    version: int | None = None
    default_prompt_ref: str | None = None
    guardrail_config: dict | None = None


class AgentRead(APIModel):
    id: UUID
    name: str
    slug: str
    category: str
    description: str | None
    base_price_inr: Decimal
    base_price_usd: Decimal
    billing_unit: str
    status: str
    version: int
    default_prompt_ref: str | None
    guardrail_config: dict
    created_at: datetime
    updated_at: datetime


class PlanAgentInput(BaseModel):
    agent_id: UUID
    included_quota: int | None = None
    override_price: Decimal | None = None


class PlanCreate(BaseModel):
    name: str
    price_inr: Decimal = Field(default=Decimal("0"))
    price_usd: Decimal = Field(default=Decimal("0"))
    billing_cycle: str
    max_agents: int = 0
    max_posts_per_month: int = 0
    features: dict = Field(default_factory=dict)
    is_custom: bool = False
    agents: list[PlanAgentInput] = Field(default_factory=list)


class PlanUpdate(BaseModel):
    name: str | None = None
    price_inr: Decimal | None = None
    price_usd: Decimal | None = None
    billing_cycle: str | None = None
    max_agents: int | None = None
    max_posts_per_month: int | None = None
    features: dict | None = None
    is_custom: bool | None = None
    agents: list[PlanAgentInput] | None = None


class PlanAgentRead(APIModel):
    id: UUID
    agent_id: UUID
    included_quota: int | None
    override_price: Decimal | None


class PlanRead(APIModel):
    id: UUID
    name: str
    price_inr: Decimal
    price_usd: Decimal
    billing_cycle: str
    max_agents: int
    max_posts_per_month: int
    features: dict
    is_custom: bool
    created_at: datetime
    updated_at: datetime
    included_agents: list[PlanAgentRead] = Field(default_factory=list)


class ClientRead(APIModel):
    id: UUID
    org_name: str
    owner_email: str
    status: str
    region: str | None
    created_at: datetime
    updated_at: datetime


class ClientStatusUpdate(BaseModel):
    status: str


class ClientDetail(APIModel):
    client: ClientRead
    active_subscription: dict | None
    active_agents: list[dict]
    usage_summary: dict


class SubscriptionCreate(BaseModel):
    plan_id: UUID
    renews_at: datetime
    status: str = "active"
    stripe_subscription_id: str | None = None


class SubscriptionUpdate(BaseModel):
    plan_id: UUID | None = None
    renews_at: datetime | None = None
    status: str | None = None
    stripe_subscription_id: str | None = None


class SubscriptionRead(APIModel):
    id: UUID
    client_id: UUID
    plan_id: UUID
    started_at: datetime
    renews_at: datetime
    status: str
    stripe_subscription_id: str | None


class ClientAgentCreate(BaseModel):
    agent_id: UUID
    custom_price: Decimal | None = None
    status: str = "active"


class ClientAgentUpdate(BaseModel):
    custom_price: Decimal | None = None
    status: str | None = None


class ClientAgentRead(APIModel):
    id: UUID
    client_id: UUID
    agent_id: UUID
    custom_price: Decimal | None
    status: str
    created_at: datetime
    updated_at: datetime


class PriceHistoryRead(APIModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    old_price: Decimal
    new_price: Decimal
    changed_by: str
    changed_at: datetime


class AuditLogRead(APIModel):
    id: UUID
    admin_user_id: str
    action: str
    target_type: str
    target_id: str | None
    metadata: dict
    created_at: datetime


class ImpersonationTokenRead(BaseModel):
    token: str
    expires_in_seconds: int = 600
