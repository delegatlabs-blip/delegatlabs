from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from admin.api.v1.router import api_router
from admin.modules.platform.security import verify_admin_token
from admin.modules.platform import models as _platform_models
from shared.core.config import settings
from shared.core.exceptions import AppError, app_error_handler, http_exception_handler
from shared.core.logging import setup_logging
from shared.core.middleware import RequestContextMiddleware
from shared.enums import AppSurface


def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(
        title=f"{settings.app_name} Admin API",
        version=settings.app_version,
        description="Admin surface — modular monolith slice, ready to extract.",
        docs_url="/docs",
        redoc_url="/redoc",
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
    async def enforce_admin_auth(request: Request, call_next):
        if settings.disable_admin_auth:
            return await call_next(request)
        if request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"}:
            return await call_next(request)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Missing bearer token"})
        token = auth_header.removeprefix("Bearer ").strip()
        request.state.admin_principal = await verify_admin_token(token)
        return await call_next(request)

    @app.get("/health", tags=["system"])
    async def health():
        return {
            "status": "ok",
            "app": settings.app_name,
            "app_version": settings.app_version,
            "api_version": settings.api_version,
            "surface": AppSurface.ADMIN.value,
        }

    app.include_router(api_router, prefix="/api/admin")
    return app


app = create_app()
