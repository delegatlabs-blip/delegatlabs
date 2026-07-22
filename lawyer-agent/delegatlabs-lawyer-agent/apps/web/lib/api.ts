export interface DraftGenerationPayload {
  draftId: string;
  draftTitle: string;
  draftLanguage: string;
  jurisdiction: string;
  systemInstruction: string;
  userInstruction: string;
  structuredFacts: Record<string, any>;
  selectedClauses: { id: string; title: string; titleHi?: string }[];
  guardrails: string[];
  outputRequirements: string[];
  validationSummary: string;
  customInstructions?: string;
}

export interface DraftGenerationResponse {
  draftId: string;
  provider: string;
  model: string;
  status: string;
  draftText: string;
  warnings: string[];
  generationId: string;
}

export const generateDraftMock = async (
  payload: DraftGenerationPayload
): Promise<DraftGenerationResponse> => {
  const response = await fetch("http://127.0.0.1:8000/api/v1/ai/generate-draft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to compile draft: ${response.statusText}. Details: ${errText}`);
  }

  return response.json();
};
