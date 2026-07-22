import { normalizeCaseRecord } from "./case-storage";
import { buildCaseDraftPrefill } from "./case-draft-prefill";
import { DraftBlueprint } from "./draft-blueprints";

export function runAuditTests() {
  const results: Record<string, boolean | string> = {};

  // 1. Legacy Level 15 case conversion check
  const legacyLevel15Case = {
    id: "case_legacy_15",
    caseTitle: "Legacy Disputed Land",
    caseType: "Civil",
    clientName: "Raman Lal",
    clientRole: "Plaintiff",
    clientParty: "partyA",
    parties: [
      { sideLabel: "A", partyName: "Raman Lal", legalRole: "Plaintiff", isClient: true },
      { sideLabel: "B", partyName: "Shyam Lal", legalRole: "Defendant", isClient: false }
    ],
    courtType: "District Court",
    courtName: "Civil Judge",
    stage: "Admission",
    status: "active",
    createdAt: "2026-01-01T12:00:00Z"
  };

  const normalized15 = normalizeCaseRecord(legacyLevel15Case);
  results["Legacy Level 15: Not Null"] = normalized15 !== null;
  results["Legacy Level 15: partyA name mapped"] = normalized15?.partyA?.name === "Raman Lal";
  results["Legacy Level 15: partyA role mapped"] = normalized15?.partyA?.legalRole === "Plaintiff";
  results["Legacy Level 15: partyB name mapped"] = normalized15?.partyB?.name === "Shyam Lal";
  results["Legacy Level 15: partyB role mapped"] = normalized15?.partyB?.legalRole === "Defendant";

  // 2. Case missing partyA/partyB (incomplete data fallback)
  const incompleteCase = {
    id: "case_incomplete",
    caseTitle: "Incomplete Case Record",
    caseType: "Rent",
    clientName: "Owner Landlord",
    clientRole: "Landlord",
    clientParty: "partyA",
    courtType: "Rent Controller",
    courtName: "Rent Controller"
  };

  const normalizedIncomplete = normalizeCaseRecord(incompleteCase);
  results["Incomplete Case: Not Null"] = normalizedIncomplete !== null;
  results["Incomplete Case: partyA name fallback"] = normalizedIncomplete?.partyA?.name === "Owner Landlord";
  results["Incomplete Case: partyA role fallback"] = normalizedIncomplete?.partyA?.legalRole === "Landlord";
  results["Incomplete Case: partyB name default"] = normalizedIncomplete?.partyB?.name === "";
  results["Incomplete Case: partyB role default"] = normalizedIncomplete?.partyB?.legalRole === "Second Party";

  // 3. Corrupted case parsing (missing required keys)
  const corruptedCase = {
    caseType: "Civil"
    // missing id and caseTitle
  };
  const normalizedCorrupted = normalizeCaseRecord(corruptedCase);
  results["Corrupted Case: Correctly Rejected"] = normalizedCorrupted === null;

  // 4. Prefill validation: Rent Agreement created from Landlord case
  const landlordCase = {
    id: "case_rent_landlord",
    caseTitle: "Tenant Eviction",
    caseType: "Rent",
    clientName: "Mr. Landlord Name",
    clientRole: "Landlord",
    clientParty: "partyA",
    partyA: { name: "Mr. Landlord Name", legalRole: "Landlord" },
    partyB: { name: "Mr. Tenant Name", legalRole: "Tenant" },
    courtType: "District Court",
    courtName: "Rent Controller Tribunal",
    stage: "Admission",
    createdAt: new Date().toISOString()
  };
  
  const rentBlueprint: DraftBlueprint = {
    draftId: "rent_agreement",
    sections: [],
    requiredFields: [],
    recommendedFields: [],
    optionalFields: [],
    mandatoryClauses: [],
    recommendedClauses: [],
    optionalClauses: [],
    validationRules: [],
    reviewChecklist: []
  };

  const landlordPrefill = buildCaseDraftPrefill(normalizeCaseRecord(landlordCase), rentBlueprint);
  results["Landlord Prefill: Owner name matched"] = landlordPrefill["owner_full_name"] === "Mr. Landlord Name";
  results["Landlord Prefill: Tenant name matched"] = landlordPrefill["tenant_full_name"] === "Mr. Tenant Name";

  // 5. Prefill validation: Rent Agreement created from Tenant case
  const tenantCase = {
    id: "case_rent_tenant",
    caseTitle: "Rent Dispute",
    caseType: "Rent",
    clientName: "Mr. Tenant Name",
    clientRole: "Tenant",
    clientParty: "partyB",
    partyA: { name: "Mr. Landlord Name", legalRole: "Landlord" },
    partyB: { name: "Mr. Tenant Name", legalRole: "Tenant" },
    courtType: "District Court",
    courtName: "Rent Controller Tribunal",
    stage: "Admission",
    createdAt: new Date().toISOString()
  };

  const tenantPrefill = buildCaseDraftPrefill(normalizeCaseRecord(tenantCase), rentBlueprint);
  results["Tenant Prefill: Tenant name matched"] = tenantPrefill["tenant_full_name"] === "Mr. Tenant Name";
  results["Tenant Prefill: Owner name matched"] = tenantPrefill["owner_full_name"] === "Mr. Landlord Name";

  // 6. Prefill validation: Standalone Rent Agreement (null case context)
  const standalonePrefill = buildCaseDraftPrefill(null, rentBlueprint);
  results["Standalone Prefill: Empty object returned"] = Object.keys(standalonePrefill).length === 0;

  return results;
}
