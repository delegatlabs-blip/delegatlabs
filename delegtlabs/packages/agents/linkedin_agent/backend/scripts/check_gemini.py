import asyncio
import logging
from app.services.gemini import generate_post, derive_image_prompt

logging.basicConfig(level=logging.INFO)

async def check_gemini():
    print("🧪 Testing Gemini Post Generation...")
    try:
        res = await generate_post(
            topic_slug="react-new-feature",
            topic_name="React New Feature",
            tone="casual",
            post_length="medium",
            hashtag_count=4
        )
        print("✅ Post Generation Succeeded:")
        print(res["text"])
        print("-" * 50)
        
        prompt = await derive_image_prompt(res["text"])
        print("✅ Derived Image Prompt:")
        print(prompt)
    except Exception as e:
        print("❌ Gemini test failed:", e)

if __name__ == "__main__":
    asyncio.run(check_gemini())
