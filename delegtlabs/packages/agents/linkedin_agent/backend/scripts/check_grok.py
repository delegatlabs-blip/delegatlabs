import asyncio
import logging
from app.services.grok import generate_and_store_image

logging.basicConfig(level=logging.INFO)

async def check_grok():
    print("🧪 Testing Grok Image Generation...")
    try:
        res = await generate_and_store_image("Modern developer workstation vector illustration with React code")
        print("✅ Grok Image Generation Succeeded:")
        print("Image URL:", res["imageUrl"])
        print("Stored URL:", res["supabaseUrl"])
    except Exception as e:
        print("❌ Grok test failed:", e)

if __name__ == "__main__":
    asyncio.run(check_grok())
