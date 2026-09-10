import os
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import execute_one_raw
from app.api.router import api_router
from app.jobs.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("🚀 Starting AntGrav FastAPI Backend...")
    try:
        await execute_one_raw("SELECT 1")
        logger.info("✅ Database connected")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")

    try:
        await start_scheduler()
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")

    yield

    # Shutdown logic
    logger.info("SIGTERM/SIGINT received, shutting down...")
    stop_scheduler()

app = FastAPI(
    title="AntGrav LinkedIn Content Agent Backend",
    description="FastAPI conversion of the AntGrav LinkedIn Content Agent Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# =============================================
# CORS Middleware
# =============================================
origins = [
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# =============================================
# Static Files (/uploads)
# =============================================
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# =============================================
# Health Check Endpoint
# =============================================
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "ok": True,
        "service": "AntGrav LinkedIn Content Agent",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# =============================================
# Include API Routers
# =============================================
app.include_router(api_router)
