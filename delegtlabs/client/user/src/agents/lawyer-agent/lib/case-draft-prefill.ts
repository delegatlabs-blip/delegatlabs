import { CaseRecord } from "./case-storage";
import { DraftBlueprint } from "./draft-blueprints";

/**
 * Normalizes input role string to lowercase, handling undefined or null safely.
 */
function normalizeRole(role: string | null | undefined): string {
  if (!role) return "";
  return String(role).trim().toLowerCase();
}

/**
 * Prefills draft intake form fields using context parameters from active litigation.
 * Matches are conservative to prevent bad assumptions.
 */
export function buildCaseDraftPrefill(
  caseRecord: CaseRecord | null | undefined,
  blueprint: DraftBlueprint | null | undefined
): Record<string, string> {
  const prefill: Record<string, string> = {};

  if (!caseRecord || !blueprint) {
    return prefill;
  }

  // Ensure partyA and partyB exist
  const partyA = caseRecord.partyA;
  const partyB = caseRecord.partyB;

  if (blueprint.draftId === "rent_agreement") {
    // Match Landlord role
    if (partyA && normalizeRole(partyA.legalRole) === "landlord" && partyA.name) {
      prefill["owner_full_name"] = partyA.name;
    } else if (partyB && normalizeRole(partyB.legalRole) === "landlord" && partyB.name) {
      prefill["owner_full_name"] = partyB.name;
    }

    // Match Tenant role
    if (partyA && normalizeRole(partyA.legalRole) === "tenant" && partyA.name) {
      prefill["tenant_full_name"] = partyA.name;
    } else if (partyB && normalizeRole(partyB.legalRole) === "tenant" && partyB.name) {
      prefill["tenant_full_name"] = partyB.name;
    }
  }

  return prefill;
}
