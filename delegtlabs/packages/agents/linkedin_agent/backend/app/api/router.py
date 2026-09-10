from fastapi import APIRouter
from app.api.endpoints import (
    admin,
    auth,
    billing,
    onboarding,
    onboarding_adaptive,
    performance,
    posts,
    session,
    settings,
    tenant,
    topics,
)

api_router = APIRouter()

# session first: it owns /auth/me, /auth/email/*, /auth/profile, /auth/signout
api_router.include_router(session.router)
api_router.include_router(auth.router)
api_router.include_router(onboarding.router)
api_router.include_router(onboarding_adaptive.router)
api_router.include_router(performance.router)
api_router.include_router(posts.router)
api_router.include_router(settings.router)
api_router.include_router(topics.router)
api_router.include_router(admin.router)
api_router.include_router(tenant.router)
api_router.include_router(billing.router)
