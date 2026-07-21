import { DraftBlueprint } from "./draft-blueprints";

export interface CompletenessResult {
  draftId: string;
  totalRequiredFields: number;
  completedRequiredFields: number;
  missingRequiredFields: string[];
  isReadyForGeneration: boolean;
  completionPercentage: number;
  warnings: string[];
}

export function runCompletenessCheck(
  blueprint: DraftBlueprint,
  answers: Record<string, string | number>
): CompletenessResult {
  const missingRequiredFields: string[] = [];
  let completedRequiredFields = 0;

  blueprint.requiredFields.forEach((field) => {
    const val = answers[field.id];
    if (val === undefined || val === null || String(val).trim() === "") {
      missingRequiredFields.push(field.id);
    } else {
      completedRequiredFields++;
    }
  });

  const totalRequiredFields = blueprint.requiredFields.length;
  const completionPercentage =
    totalRequiredFields > 0 ? Math.round((completedRequiredFields / totalRequiredFields) * 100) : 100;

  const warnings: string[] = [];
  const owner = String(answers.owner_full_name || "").trim().toLowerCase();
  const tenant = String(answers.tenant_full_name || "").trim().toLowerCase();
  if (owner && tenant && owner === tenant) {
    warnings.push("Owner and Tenant names must not be identical.");
  }
  const rentVal = parseFloat(String(answers.monthly_rent_amount ?? ""));
  if (answers.monthly_rent_amount !== undefined && (isNaN(rentVal) || rentVal <= 0)) {
    warnings.push("Monthly rent must be greater than zero.");
  }

  return {
    draftId: blueprint.draftId,
    totalRequiredFields,
    completedRequiredFields,
    missingRequiredFields,
    isReadyForGeneration: missingRequiredFields.length === 0 && warnings.length === 0,
    completionPercentage,
    warnings,
  };
}
