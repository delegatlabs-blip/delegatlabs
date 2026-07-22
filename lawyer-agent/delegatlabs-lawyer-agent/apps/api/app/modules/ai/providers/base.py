from abc import ABC, abstractmethod
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse


class BaseAIProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the AI provider (e.g. mock, openai, gemini, claude)"""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Specific model identifier used (e.g. gpt-4o, gemini-1.5-pro)"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if the provider is fully configured and ready to receive requests"""
        pass

    @abstractmethod
    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        """Submits the request to the model provider to compile the document draft"""
        pass
