from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.core.config import settings
from shared.core.logging import setup_logging
from shared.core.middleware import RequestContextMiddleware
from web.api.v1.router import api_router


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(
        title=f"{settings.app_name} Web API",
        version=settings.app_version,
        description="Public web API for marketplace agents.",
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
    app.include_router(api_router, prefix=f"/web{settings.api_prefix}")
    return app


app = create_app()
