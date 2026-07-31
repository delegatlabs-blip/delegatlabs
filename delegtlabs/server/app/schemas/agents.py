from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


PaymentType = Literal["subscription", "credit"]
AgentStatus = Literal["draft", "active", "paused"]
BillingInterval = Literal["monthly", "yearly", "one-time"]


class SubscriptionPlan(BaseModel):
    id: str = Field(default_factory=lambda: f"plan_{uuid4().hex[:8]}")
    name: str
    price: float = 0
    currency: str = "USD"
    billingInterval: BillingInterval = "monthly"
    features: list[str] = Field(default_factory=list)
    active: bool = True


class CreditPack(BaseModel):
    id: str = Field(default_factory=lambda: f"pack_{uuid4().hex[:8]}")
    name: str
    price: float = 0
    currency: str = "USD"
    credits: int = 0
    features: list[str] = Field(default_factory=list)
    active: bool = True


class AgentListing(BaseModel):
    paymentType: PaymentType = "subscription"
    subscriptionPlans: list[SubscriptionPlan] = Field(default_factory=list)
    creditPacks: list[CreditPack] = Field(default_factory=list)
    price: float = 0
    currency: str = "USD"
    billingInterval: BillingInterval = "monthly"
    planName: str = ""
    redirectUrl: str = ""
    demoUrl: str = ""
    documentationUrl: str = ""
    shortDescription: str = ""
    detailedDescription: str = ""
    tags: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    featured: bool = False
    listedOnWebsite: bool = True


class AgentRecord(BaseModel):
    id: str
    name: str
    slug: str
    description: str = ""
    category: str = ""
    version: str = "1.0.0"
    status: AgentStatus = "draft"
    createdAt: str
    updatedAt: str
    listing: AgentListing
    config: dict[str, Any] = Field(default_factory=dict)


class AgentCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    category: str | None = None
    version: str | None = None
    status: AgentStatus = "draft"
    listing: AgentListing | None = None
    config: dict[str, Any] | None = None


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    version: str | None = None
    status: AgentStatus | None = None
    listing: AgentListing | None = None
    config: dict[str, Any] | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def derive_price_fields(listing: AgentListing) -> AgentListing:
    data = listing.model_dump()
    if listing.paymentType == "subscription":
        plan = next((p for p in listing.subscriptionPlans if p.active), None) or (
            listing.subscriptionPlans[0] if listing.subscriptionPlans else None
        )
        if plan:
            data.update(
                price=plan.price,
                currency=plan.currency,
                billingInterval=plan.billingInterval,
                planName=plan.name,
            )
    else:
        pack = next((p for p in listing.creditPacks if p.active), None) or (
            listing.creditPacks[0] if listing.creditPacks else None
        )
        if pack:
            data.update(
                price=pack.price,
                currency=pack.currency,
                billingInterval="one-time",
                planName=pack.name,
            )
    return AgentListing(**data)


def default_listing_for_slug(slug: str) -> AgentListing:
    if "lawyer" in slug:
        return derive_price_fields(
            AgentListing(
                paymentType="subscription",
                subscriptionPlans=[
                    SubscriptionPlan(
                        name="Legal Desk",
                        price=79,
                        features=["Guided intake", "Jurisdiction defaults"],
                    )
                ],
                creditPacks=[
                    CreditPack(name="50 drafts", price=39, credits=50, features=["Draft credits"])
                ],
                shortDescription="Guided legal drafting with jurisdiction-aware templates.",
                detailedDescription="Draft notices, agreements, and contracts with completeness checks.",
                tags=["Legal", "Drafting", "Contracts"],
                features=["Guided intake wizard", "Completeness checks"],
                redirectUrl="https://app.delegatelabs.com/agents/lawyer",
                featured=True,
                listedOnWebsite=True,
            )
        )
    return derive_price_fields(
        AgentListing(
            paymentType="subscription",
            subscriptionPlans=[
                SubscriptionPlan(
                    name="Starter",
                    price=49,
                    features=["AI post generation", "Lead scoring"],
                ),
                SubscriptionPlan(
                    name="Growth",
                    price=99,
                    features=["Everything in Starter", "Auto-publish"],
                ),
            ],
            creditPacks=[
                CreditPack(name="100 credits", price=29, credits=100, features=["Usable credits"])
            ],
            shortDescription="PR posting, lead generation, and content automation for LinkedIn.",
            detailedDescription="Automate LinkedIn growth with AI-written posts and lead scoring.",
            tags=["LinkedIn", "Lead Gen", "Content"],
            features=["AI post generation", "Lead scoring & outreach"],
            redirectUrl="https://app.delegatelabs.com/agents/linkedin",
            featured=True,
            listedOnWebsite=True,
        )
    )


def row_to_agent(row: dict[str, Any]) -> AgentRecord:
    listing = derive_price_fields(
        AgentListing(
            paymentType=row.get("payment_type") or "subscription",
            subscriptionPlans=row.get("subscription_plans") or [],
            creditPacks=row.get("credit_packs") or [],
            price=float(row.get("price") or 0),
            currency=row.get("currency") or "USD",
            billingInterval=row.get("billing_interval") or "monthly",
            planName=row.get("plan_name") or "",
            redirectUrl=row.get("redirect_url") or "",
            demoUrl=row.get("demo_url") or "",
            documentationUrl=row.get("documentation_url") or "",
            shortDescription=row.get("short_description") or "",
            detailedDescription=row.get("detailed_description") or "",
            tags=row.get("tags") or [],
            features=row.get("features") or [],
            featured=bool(row.get("featured")),
            listedOnWebsite=bool(row.get("listed_on_website", True)),
        )
    )
    return AgentRecord(
        id=str(row["id"]),
        name=row["name"],
        slug=row["slug"],
        description=row.get("description") or listing.shortDescription,
        category=row.get("category") or "",
        version=row.get("version") or "1.0.0",
        status=row.get("status") or "draft",
        createdAt=str(row.get("created_at") or _now()),
        updatedAt=str(row.get("updated_at") or _now()),
        listing=listing,
        config=row.get("config") or {},
    )


def agent_to_row(agent: AgentRecord) -> dict[str, Any]:
    listing = derive_price_fields(agent.listing)
    return {
        "id": agent.id,
        "name": agent.name,
        "slug": agent.slug,
        "category": agent.category,
        "status": agent.status,
        "version": agent.version,
        "description": agent.description,
        "short_description": listing.shortDescription,
        "detailed_description": listing.detailedDescription,
        "tags": listing.tags,
        "features": listing.features,
        "redirect_url": listing.redirectUrl,
        "demo_url": listing.demoUrl,
        "documentation_url": listing.documentationUrl,
        "payment_type": listing.paymentType,
        "subscription_plans": [p.model_dump() for p in listing.subscriptionPlans],
        "credit_packs": [p.model_dump() for p in listing.creditPacks],
        "price": listing.price,
        "currency": listing.currency,
        "billing_interval": listing.billingInterval,
        "plan_name": listing.planName,
        "listed_on_website": listing.listedOnWebsite,
        "featured": listing.featured,
        "config": agent.config,
        "created_at": agent.createdAt,
        "updated_at": agent.updatedAt,
    }
