from typing import List
from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.providers.mock_provider import MockAIProvider
from app.modules.ai.providers.openai_provider import OpenAIProvider
from app.modules.ai.providers.gemini_provider import GeminiProvider
from app.modules.ai.providers.claude_provider import ClaudeProvider
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse, ModelProviderStatus
from app.core.config import settings


class AIModelRouterService:
    def __init__(self):
        self.providers: List[BaseAIProvider] = [
            MockAIProvider(),
            OpenAIProvider(),
            GeminiProvider(),
            ClaudeProvider()
        ]

    def get_providers_status(self) -> List[ModelProviderStatus]:
        return [
            ModelProviderStatus(
                provider=p.provider_name,
                model=p.model_name,
                isAvailable=p.is_available()
            )
            for p in self.providers
        ]

    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        # Try default provider first
        default_name = settings.ai_default_provider
        default_provider = next((p for p in self.providers if p.provider_name == default_name), None)
        
        if default_provider and default_provider.is_available():
            return default_provider.generate_draft(request)

        # Fallback to first available provider
        for p in self.providers:
            if p.is_available():
                return p.generate_draft(request)

        raise RuntimeError("No AI model provider is currently configured and available.")


ai_router_service = AIModelRouterService()
