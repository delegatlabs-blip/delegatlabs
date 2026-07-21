from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from shared.core.config import settings
from shared.core.exceptions import AppError, app_error_handler, http_exception_handler
from shared.core.logging import setup_logging
from shared.core.middleware import RequestContextMiddleware
from shared.enums import AppSurface
from web.api.v1.router import api_router


def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(
        title=f"{settings.app_name} Web API",
        version=settings.app_version,
        description="Public web surface — modular monolith slice, ready to extract.",
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

    @app.get("/health", tags=["system"])
    async def health():
        return {
            "status": "ok",
            "app": settings.app_name,
            "app_version": settings.app_version,
            "api_version": settings.api_version,
            "surface": AppSurface.WEB.value,
        }

    app.include_router(api_router, prefix=f"/web{settings.api_prefix}")
    return app


app = create_app()
