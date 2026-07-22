from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse
from app.core.config import settings


class ClaudeProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "claude"

    @property
    def model_name(self) -> str:
        return "claude-3-5-sonnet"

    def is_available(self) -> bool:
        # Check config key
        return bool(settings.claude_api_key)

    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        raise NotImplementedError("Claude provider draft generation is not implemented yet.")
