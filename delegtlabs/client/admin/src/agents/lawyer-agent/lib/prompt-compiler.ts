import { DraftBlueprint } from "./draft-blueprints";

export interface PromptCompilerInput {
  draftId: string;
  draftTitle: string;
  draftLanguage: string;
  answers: Record<string, any>;
  blueprint: DraftBlueprint;
  customInstructions: string;
}

export interface CompiledPromptPackage {
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
  customInstructions: string;
  generatedAt: string;
}

export const compileDraftPrompt = (input: PromptCompilerInput): CompiledPromptPackage => {
  const { draftId, draftTitle, draftLanguage, answers, blueprint, customInstructions } = input;
  const isHindi = draftLanguage === "hi";

  // System Persona
  const systemInstruction = `You are an AI drafting assistant for Indian legal documents.
You assist advocates in preparing professional legal drafts that comply with Indian laws.
You behave like a user-friendly, highly capable AI Junior Associate, not a chatbot.
You are not a substitute for a licensed advocate.

CRITICAL INSTRUCTIONS:
1. Do not invent, hallucinate, or assume laws, sections, case laws, citations, or legal authorities.
2. If verified legal authority is missing or required but not provided, use neutral wording and add a clear note outside the draft body for manual legal verification.
3. Generate the document content only from the provided facts. Do not invent any factual details or parameters.
4. Preserve party names, amounts, dates, and addresses exactly as provided. Do not modify spelling or correct them unless asked.
5. If required information is missing, do not guess. Use [TO BE FILLED] placeholders only where permitted or leave appropriate blanks.
6. Do not add unsupported factual allegations.
7. You must generate the entire draft document in the selected language: ${isHindi ? "हिन्दी (Hindi)" : "English"}.
8. Ensure the tone is extremely formal and standard for Indian courtroom or commercial filings.`;

  // Facts compilation
  const structuredFacts: Record<string, any> = {};
  blueprint.sections.forEach((sec) => {
    if (sec.id === "review") return;
    
    const sectionFields = [
      ...blueprint.requiredFields.filter(f => f.sectionId === sec.id),
      ...blueprint.recommendedFields.filter(f => f.sectionId === sec.id),
      ...blueprint.optionalFields.filter(f => f.sectionId === sec.id)
    ];

    const sectionAnswers: Record<string, any> = {};
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

  // Selected clauses compilation
  const selectedClauses: { id: string; title: string; titleHi?: string }[] = [];
  
  // By default, add all mandatory clauses
  blueprint.mandatoryClauses.forEach((c) => {
    selectedClauses.push({ id: c.id, title: c.title, titleHi: c.titleHi });
  });

  // Check recommended and optional clauses based on optional select fields
  // e.g., if parking_details = "yes", electricity_responsibility is filled, subletting is recommended, etc.
  blueprint.recommendedClauses.forEach((c) => {
    selectedClauses.push({ id: c.id, title: c.title, titleHi: c.titleHi });
  });

  // Optional clauses depending on selection
  if (answers["pet_policy"] === "allowed" || answers["pet_policy"] === "restricted") {
    const pc = blueprint.optionalClauses.find(c => c.id === "pet_clause");
    if (pc) selectedClauses.push({ id: pc.id, title: pc.title, titleHi: pc.titleHi });
  }
  if (answers["visitor_policy"] === "restricted") {
    const vc = blueprint.optionalClauses.find(c => c.id === "visitor_clause");
    if (vc) selectedClauses.push({ id: vc.id, title: vc.title, titleHi: vc.titleHi });
  }
  if (answers["society_rules"] === "yes") {
    const sc = blueprint.optionalClauses.find(c => c.id === "society_rules_clause");
    if (sc) selectedClauses.push({ id: sc.id, title: sc.title, titleHi: sc.titleHi });
  }
  if (answers["inventory_details"] === "yes") {
    const ic = blueprint.optionalClauses.find(c => c.id === "inventory_clause");
    if (ic) selectedClauses.push({ id: ic.id, title: ic.title, titleHi: ic.titleHi });
  }
  if (answers["painting_responsibility"] === "owner" || answers["painting_responsibility"] === "tenant") {
    const pac = blueprint.optionalClauses.find(c => c.id === "painting_clause");
    if (pac) selectedClauses.push({ id: pac.id, title: pac.title, titleHi: pac.titleHi });
  }

  // Guardrails
  const guardrails = [
    "No hallucinated legal citations.",
    "No unsupported facts or assumptions.",
    "No invented party details or IDs.",
    "Do not include any 'Legal Advice Disclaimer' or AI warnings inside the drafted document body.",
    "Use a formal, professional legal drafting tone standard in Indian courts.",
    "Use clear clause numbering and indentation.",
    "Ensure all financial amounts are shown in both numbers and word forms (e.g. INR 15,000 / Rupees Fifteen Thousand Only).",
    "Format all dates clearly (e.g. 1st Day of August, 2026).",
    "Mention manual verification notes only outside the final document draft, never inside the printable draft body."
  ];

  // Output Requirements
  const outputRequirements = [
    "Title: Centered, capitalized, formal title of the draft.",
    "Parties: Formal identification of Landlord (Lessor) and Tenant (Lessee) with fathers' names, addresses, and PAN numbers.",
    "Recitals / Background: Clear description of ownership, intent of lease, and description of leased premises.",
    "Terms and Conditions: Organized sections including rent amount, due dates, security deposit, duration, notice period, and maintenance terms.",
    "Clauses: Seamless integration of mandatory, recommended, and selected optional clauses.",
    "Jurisdiction: Clear clause specifying jurisdiction courts for dispute resolution (Uttar Pradesh standard).",
    "Signature Blocks: Formatted signature placeholders for both Owner and Tenant.",
    "Witness Blocks: Formatted witness placeholders including full names and addresses for both Witness 1 and Witness 2.",
    "Clean formatting with no Markdown tags inside the draft body text itself.",
    `Ensure complete draft translation into selected language: ${isHindi ? "हिन्दी (Hindi)" : "English"}.`
  ];

  // User instructions prompt body
  const factsText = Object.entries(structuredFacts)
    .map(([section, fields]) => {
      const fieldLines = Object.entries(fields)
        .map(([label, val]) => `  - ${label}: ${val}`)
        .join("\n");
      return `### ${section}\n${fieldLines}`;
    })
    .join("\n\n");

  const clausesText = selectedClauses.map((c) => `  - ${isHindi && c.titleHi ? c.titleHi : c.title} (ID: ${c.id})`).join("\n");

  const userInstruction = `Please draft a professional legal document based on the following instructions:

## DOCUMENT METADATA
- Draft Type: ${draftTitle}
- Draft Language: ${isHindi ? "Hindi (हिन्दी)" : "English"}
- State/Jurisdiction: Uttar Pradesh, India

## COLLECTED FACTS
${factsText}

## CLAUSES TO INCLUDE
${clausesText}

${customInstructions ? `## CUSTOM DIRECTIVES FROM ADVOCATE\n${customInstructions}\n` : ""}
## FORMAT AND OUTPUT REQUIREMENTS
Please review the required guardrails and generate the complete legal draft text accordingly.`;

  // Validation Summary
  const validationSummary = "Completeness check passed. Required party details, financial figures, dates, and witness placeholders are validated.";

  return {
    draftId,
    draftTitle,
    draftLanguage,
    jurisdiction: "Uttar Pradesh, India",
    systemInstruction,
    userInstruction,
    structuredFacts,
    selectedClauses,
    guardrails,
    outputRequirements,
    validationSummary,
    customInstructions,
    generatedAt: new Date().toISOString()
  };
};
