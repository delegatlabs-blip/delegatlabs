import { DraftBlueprint } from "./draft-blueprints";

export interface CompiledPromptPackage {
  draftId: string;
  draftTitle: string;
  draftLanguage: string;
  jurisdiction: string;
  systemInstruction: string;
  userInstruction: string;
  structuredFacts: Record<string, Record<string, string | number>>;
  selectedClauses: { id: string; title: string; titleHi?: string }[];
  guardrails: string[];
  outputRequirements: string[];
  validationSummary: string;
  customInstructions: string;
}

export function compileDraftPrompt(input: {
  draftId: string;
  draftTitle: string;
  draftLanguage: string;
  jurisdiction: string;
  answers: Record<string, string | number>;
  blueprint: DraftBlueprint;
  customInstructions?: string;
}): CompiledPromptPackage {
  const { draftId, draftTitle, draftLanguage, jurisdiction, answers, blueprint, customInstructions = "" } =
    input;
  const isHindi = draftLanguage === "hi";

  const systemInstruction = `You are an AI drafting assistant for Indian legal documents.
You assist advocates in preparing professional legal drafts.
Do not invent laws, citations, or facts. Generate in ${isHindi ? "Hindi" : "English"}.`;

  const structuredFacts: Record<string, Record<string, string | number>> = {};
  blueprint.sections.forEach((sec) => {
    const sectionFields = [
      ...blueprint.requiredFields.filter((f) => f.sectionId === sec.id),
      ...blueprint.recommendedFields.filter((f) => f.sectionId === sec.id),
      ...blueprint.optionalFields.filter((f) => f.sectionId === sec.id),
    ];
    const sectionAnswers: Record<string, string | number> = {};
    sectionFields.forEach((field) => {
      const val = answers[field.id];
      if (val !== undefined && String(val).trim() !== "") {
        sectionAnswers[field.label] = val;
      }
    });
    if (Object.keys(sectionAnswers).length > 0) {
      structuredFacts[sec.title] = sectionAnswers;
    }
  });

  const selectedClauses = blueprint.mandatoryClauses.map((c) => ({
    id: c.id,
    title: c.title,
    titleHi: c.titleHi,
  }));

  return {
    draftId,
    draftTitle,
    draftLanguage,
    jurisdiction,
    systemInstruction,
    userInstruction: `Draft a complete ${draftTitle} using only the structured facts provided.`,
    structuredFacts,
    selectedClauses,
    guardrails: [
      "Do not hallucinate legal authorities.",
      "Preserve party names and amounts exactly.",
      "Use [TO BE FILLED] only when a fact is missing.",
    ],
    outputRequirements: [
      "Formal Indian legal document tone",
      `Entire draft in ${isHindi ? "Hindi" : "English"}`,
    ],
    validationSummary: "Client-side completeness check passed or warnings noted.",
    customInstructions,
  };
}
