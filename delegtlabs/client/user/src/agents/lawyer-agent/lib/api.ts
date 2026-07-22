export interface DraftGenerationPayload {
  draftId: string;
  draftTitle: string;
  draftLanguage: string;
  jurisdiction: string;
  systemInstruction: string;
  userInstruction: string;
  structuredFacts: Record<string, unknown>;
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

/** Calls platform lawyer-agent generate-draft endpoint. */
export async function generateDraft(
  slug: string,
  payload: DraftGenerationPayload
): Promise<DraftGenerationResponse> {
  const response = await fetch(`/api/user/agents/${slug}/generate-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate draft: ${response.statusText}. ${errText}`);
  }

  const data = await response.json();
  return {
    draftId: data.draftId || data.draft_id || payload.draftId,
    provider: data.provider || "mock",
    model: data.model || "delegatlabs-mock-v1",
    status: data.status || "generated",
    draftText: data.draftText || data.draft_text || "",
    warnings: data.warnings || [],
    generationId: data.generationId || data.generation_id || "",
  };
}
