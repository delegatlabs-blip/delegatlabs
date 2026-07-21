"""DelegtLabs monolith entrypoint.

Runs all surfaces (admin / user / web) in one process today.
Tomorrow, each surface's `main.py` can be deployed independently without
moving business logic — only this gateway goes away.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from admin.api.v1.router import api_router as admin_router
from admin.modules.platform.security import verify_admin_token
from shared.core.config import settings
from shared.core.exceptions import AppError, app_error_handler, http_exception_handler
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
            "Modular monolith gateway. Surfaces are namespaced and versioned:\n"
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
    app.add_exception_handler(HTTPException, http_exception_handler)

    @app.middleware("http")
    async def admin_auth(request: Request, call_next):
        if request.url.path.startswith("/api/admin") and not settings.disable_admin_auth:
            if request.method == "OPTIONS":
                return await call_next(request)
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Missing bearer token"})
            request.state.admin_principal = await verify_admin_token(auth_header.removeprefix("Bearer ").strip())
        return await call_next(request)

    @app.get("/", tags=["system"])
    async def root():
        return {
            "app": settings.app_name,
            "app_version": settings.app_version,
            "api_version": settings.api_version,
            "surfaces": {
                "admin": "/api/admin",
                "user": f"/user{settings.api_prefix}",
                "web": f"/web{settings.api_prefix}",
            },
            "docs": "/docs",
        }

    @app.get("/health", tags=["system"])
    async def health():
        return {
            "status": "ok",
            "app": settings.app_name,
            "app_version": settings.app_version,
            "api_version": settings.api_version,
            "mode": "monolith",
        }

    @app.get("/version", tags=["system"])
    async def version():
        """App + API versioning — used by clients for compatibility checks."""
        return {
            "app_name": settings.app_name,
            "app_version": settings.app_version,
            "api_version": settings.api_version,
            "api_prefix": settings.api_prefix,
            "environment": settings.app_env,
        }

    # Versioned surface mounts — each can become its own service later
    app.include_router(admin_router, prefix="/api/admin")
    app.include_router(user_router, prefix=f"/user{settings.api_prefix}")
    app.include_router(web_router, prefix=f"/web{settings.api_prefix}")

    return app


app = create_app()
