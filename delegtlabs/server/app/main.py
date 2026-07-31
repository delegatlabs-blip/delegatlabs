"""DelegtLabs FastAPI entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.admin.router import router as admin_router
from app.api.v1.user.router import router as user_router
from app.api.v1.web.router import router as web_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.middleware import RequestContextMiddleware
from app.utils.exceptions import AppError, app_error_handler


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title=f"{settings.app_name} API",
        version=settings.app_version,
        description=(
            "Modular monolith.\n"
            "- Admin: `/api/admin`\n"
            f"- User: `/user{settings.api_prefix}`\n"
            f"- Web: `/web{settings.api_prefix}`"
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestContextMiddleware)
    application.add_exception_handler(AppError, app_error_handler)

    @application.get("/", tags=["system"])
    async def root():
        return {
            "app": settings.app_name,
            "surfaces": {
                "admin": "/api/admin",
                "user": f"/user{settings.api_prefix}",
                "web": f"/web{settings.api_prefix}",
            },
            "docs": "/docs",
            "auth": "disabled" if settings.disable_admin_auth else "enabled",
        }

    @application.get("/health", tags=["system"])
    async def health():
        return {"status": "ok", "mode": "monolith", "storage": "postgresql"}

    application.include_router(admin_router, prefix="/api/admin")
    application.include_router(user_router, prefix=f"/user{settings.api_prefix}")
    application.include_router(web_router, prefix=f"/web{settings.api_prefix}")
    return application


app = create_app()
