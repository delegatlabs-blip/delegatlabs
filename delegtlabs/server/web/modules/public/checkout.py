import json
import uuid
from typing import Any
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/checkout", tags=["checkout"])


class CheckoutSessionRequest(BaseModel):
    plan_id: str | None = None
    agent_slugs: list[str]
    email: str
    currency: str = "USD"


@router.get("/catalog")
async def get_agent_catalog():
    return {
        "plans": [
            {
                "id": "plan_starter",
                "name": "Starter Plan",
                "price_usd": 49.0,
                "price_inr": 3999.0,
                "max_agents": 2,
                "features": ["Standard AI Workers", "Email Notifications", "Basic Analytics"],
            },
            {
                "id": "plan_growth",
                "name": "Growth Pro Plan",
                "price_usd": 199.0,
                "price_inr": 15999.0,
                "max_agents": 5,
                "features": ["Priority AI Workers", "Unlimited Runs", "Advanced Sub-dashboards", "Dedicated Support"],
            },
        ],
        "agents": [
            {
                "slug": "linkedin-agent",
                "name": "LinkedIn Growth Agent",
                "category": "linkedin",
                "status": "active",
                "price_usd": 250.0,
                "price_inr": 19999.0,
                "description": "Automated B2B lead generation, connection outreach, and post generation.",
            },
            {
                "slug": "facebook-ads-agent",
                "name": "Facebook Ads Optimizer",
                "category": "facebook_ads",
                "status": "active",
                "price_usd": 299.0,
                "price_inr": 24999.0,
                "description": "Automated ad creative generation, ROAS tracking, and campaign optimization.",
            },
            {
                "slug": "instagram-agent",
                "name": "Instagram Content Creator",
                "category": "instagram",
                "status": "active",
                "price_usd": 199.0,
                "price_inr": 15999.0,
                "description": "Reels scriptwriting, content pillars, auto-scheduling, and engagement boost.",
            },
            {
                "slug": "email-agent",
                "name": "Outbound Email Agent",
                "category": "email",
                "status": "active",
                "price_usd": 199.0,
                "price_inr": 15999.0,
                "description": "Cold email sequence writer, deliverability warmer, and lead responder.",
            },
            {
                "slug": "seo-agent",
                "name": "SEO & Content Ranker",
                "category": "seo",
                "status": "active",
                "price_usd": 249.0,
                "price_inr": 19999.0,
                "description": "Keyword research, blog post generator, on-page optimization, and audit.",
            },
        ],
    }


@router.post("/session")
async def create_checkout_session(payload: CheckoutSessionRequest):
    session_id = f"cs_test_{uuid.uuid4().hex[:16]}"
    return {
        "session_id": session_id,
        "checkout_url": f"http://localhost:3002/checkout?session_id={session_id}&email={payload.email}&agents={','.join(payload.agent_slugs)}",
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(None, alias="Stripe-Signature")):
    payload = await request.body()
    try:
        data = json.loads(payload.decode("utf-8")) if payload else {}
    except Exception:
        data = {}

    event_type = data.get("type", "checkout.session.completed")

    client_id = str(uuid.uuid4())
    purchased_agent_slugs = data.get("data", {}).get("object", {}).get("metadata", {}).get("agents", "linkedin-agent").split(",")

    return {
        "received": True,
        "event": event_type,
        "client_id": client_id,
        "purchased_agents": purchased_agent_slugs,
        "redirect_url": "/dashboard?checkout_success=true",
    }
