import os
import uuid
import time
import logging
import httpx
from typing import Dict, Optional
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_xai_client() -> Optional[AsyncOpenAI]:
    if not settings.GROK_API_KEY:
        return None
    return AsyncOpenAI(
        api_key=settings.GROK_API_KEY,
        base_url="https://api.x.ai/v1"
    )

async def generate_grok_image(prompt: str) -> str:
    client = get_xai_client()
    if not client:
        raise ValueError("GROK_API_KEY is not configured in environment variables")

    response = await client.images.generate(
        model=settings.GROK_IMAGE_MODEL,
        prompt=prompt,
        n=1,
    )

    if not response.data or not response.data[0].url:
        raise RuntimeError("Grok image API returned no image URL")

    return response.data[0].url

async def download_and_store_image(image_url: str, filename: Optional[str] = None) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(image_url)
        res.raise_for_status()
        content = res.content
        content_type = res.headers.get("content-type", "image/png")

    ext = "jpg" if "jpeg" in content_type else "webp" if "webp" in content_type else "png"
    name = filename or f"{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}.{ext}"

    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    file_path = os.path.join(uploads_dir, name)
    with open(file_path, "wb") as f:
        f.write(content)

    server_url = settings.BACKEND_URL or f"http://localhost:{settings.PORT}"
    return f"{server_url}/uploads/{name}"

async def generate_and_store_image(prompt: str) -> Dict[str, str]:
    image_url = await generate_grok_image(prompt)
    stored_url = await download_and_store_image(image_url)
    return {"imageUrl": image_url, "supabaseUrl": stored_url}
