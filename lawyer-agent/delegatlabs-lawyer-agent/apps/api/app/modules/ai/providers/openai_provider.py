from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse
from app.core.config import settings


class OpenAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return "gpt-4o"

    def is_available(self) -> bool:
        # Check config key
        return bool(settings.openai_api_key)

    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        raise NotImplementedError("OpenAI provider draft generation is not implemented yet.")
