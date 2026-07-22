from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse
from app.core.config import settings


class GeminiProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return "gemini-1.5-pro"

    def is_available(self) -> bool:
        # Check config key
        return bool(settings.gemini_api_key)

    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        raise NotImplementedError("Gemini provider draft generation is not implemented yet.")
