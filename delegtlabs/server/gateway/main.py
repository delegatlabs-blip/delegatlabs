"""DelegtLabs monolith entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from admin.api.v1.router import api_router as admin_router
from shared.core.config import settings
from shared.core.exceptions import AppError, app_error_handler
from shared.core.logging import setup_logging
from shared.core.middleware import RequestContextMiddleware
from user.api.v1.router import api_router as user_router
from web.api.v1.router import api_router as web_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.app_name} API",
        version=settings.app_version,
        description=(
            "Modular monolith gateway.\n"
            "- Admin: `/api/admin`\n"
            f"- User: `/user{settings.api_prefix}`\n"
            f"- Web: `/web{settings.api_prefix}`"
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_exception_handler(AppError, app_error_handler)

    @app.get("/", tags=["system"])
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

    @app.get("/health", tags=["system"])
    async def health():
        return {"status": "ok", "mode": "monolith"}

    app.include_router(admin_router, prefix="/api/admin")
    app.include_router(user_router, prefix=f"/user{settings.api_prefix}")
    app.include_router(web_router, prefix=f"/web{settings.api_prefix}")
    return app


app = create_app()
