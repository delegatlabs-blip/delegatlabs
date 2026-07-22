from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional


class PromptMessage(BaseModel):
    role: str
    content: str


class PromptGuardrail(BaseModel):
    rule: str


class PromptOutputRequirement(BaseModel):
    requirement: str


class DraftGenerationRequest(BaseModel):
    draftId: str = Field(..., alias="draftId")
    draftTitle: str = Field(..., alias="draftTitle")
    draftLanguage: str = Field(..., alias="draftLanguage")
    jurisdiction: str
    systemInstruction: str = Field(..., alias="systemInstruction")
    userInstruction: str = Field(..., alias="userInstruction")
    structuredFacts: Dict[str, Any] = Field(..., alias="structuredFacts")
    selectedClauses: List[Dict[str, Any]] = Field(..., alias="selectedClauses")
    guardrails: List[str]
    outputRequirements: List[str] = Field(..., alias="outputRequirements")
    validationSummary: str = Field(..., alias="validationSummary")
    customInstructions: Optional[str] = Field(None, alias="customInstructions")

    class Config:
        populate_by_name = True


class DraftGenerationResponse(BaseModel):
    draftId: str = Field(..., alias="draftId")
    provider: str
    model: str
    status: str
    draftText: str = Field(..., alias="draftText")
    warnings: List[str]
    generationId: str = Field(..., alias="generationId")

    class Config:
        populate_by_name = True


class ModelProviderStatus(BaseModel):
    provider: str
    model: str
    isAvailable: bool = Field(..., alias="isAvailable")

    class Config:
        populate_by_name = True
