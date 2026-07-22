import { DraftBlueprint } from "./draft-blueprints";

export interface ValidationCheckItem {
  id: string;
  name: string;
  nameHi: string;
  passed: boolean;
  message: string;
  messageHi: string;
}

export interface OutputValidationResult {
  status: "passed" | "warning" | "failed";
  checks: ValidationCheckItem[];
  missingPlaceholders: string[];
  warnings: string[];
  isReadyForExport: boolean;
}

interface OutputValidatorInput {
  draftId: string;
  draftText: string;
  blueprint: DraftBlueprint;
  answers: Record<string, any>;
  draftLanguage: "en" | "hi";
}

export const validateGeneratedDraft = (input: OutputValidatorInput): OutputValidationResult => {
  const { draftText, blueprint, answers, draftLanguage } = input;
  const checks: ValidationCheckItem[] = [];
  const missingPlaceholders: string[] = [];
  const warnings: string[] = [];

  // Helper to add check result
  const addCheck = (
    id: string,
    name: string,
    nameHi: string,
    passed: boolean,
    message: string,
    messageHi: string
  ) => {
    checks.push({ id, name, nameHi, passed, message, messageHi });
  };

  // 1. Text is not empty
  const hasText = !!(draftText && draftText.trim().length > 0);
  addCheck(
    "chk_has_text",
    "Document text generated",
    "दस्तावेज़ पाठ उत्पन्न हुआ",
    hasText,
    "Generated document body is present.",
    "उत्पन्न दस्तावेज़ की मुख्य सामग्री उपलब्ध है।"
  );

  // Helper to extract clean answer
  const getCleanVal = (key: string): string => {
    return String(answers[key] || "").trim();
  };

  // 2. Owner name match
  const ownerName = getCleanVal("owner_full_name");
  const hasOwner = ownerName !== "" && draftText.toLowerCase().includes(ownerName.toLowerCase());
  addCheck(
    "chk_owner_name",
    "Owner name check",
    "मकान मालिक के नाम की जांच",
    hasOwner,
    `Owner name '${ownerName}' found in text.`,
    `मकान मालिक का नाम '${ownerName}' पाठ में मिला।`
  );

  // 3. Tenant name match
  const tenantName = getCleanVal("tenant_full_name");
  const hasTenant = tenantName !== "" && draftText.toLowerCase().includes(tenantName.toLowerCase());
  addCheck(
    "chk_tenant_name",
    "Tenant name check",
    "किरायेदार के नाम की जांच",
    hasTenant,
    `Tenant name '${tenantName}' found in text.`,
    `किरायेदार का नाम '${tenantName}' पाठ में मिला।`
  );

  // 4. Property address match
  const propertyAddress = getCleanVal("property_full_address");
  // Check first line or parts of address if long
  const addressParts = propertyAddress.split(",").map(p => p.trim()).filter(p => p.length > 3);
  const hasAddress = propertyAddress !== "" && (
    draftText.toLowerCase().includes(propertyAddress.toLowerCase()) ||
    (addressParts.length > 0 && addressParts.every(part => draftText.toLowerCase().includes(part.toLowerCase())))
  );
  addCheck(
    "chk_property_address",
    "Property address check",
    "संपत्ति के पते की जांच",
    hasAddress,
    "Property address details found in text.",
    "संपत्ति का पता पाठ में मिला।"
  );

  // 5. Rent amount match
  const rentVal = getCleanVal("monthly_rent_amount");
  const hasRent = rentVal !== "" && draftText.includes(rentVal);
  addCheck(
    "chk_rent_amount",
    "Monthly rent amount check",
    "मासिक किराया राशि की जांच",
    hasRent,
    `Rent value of INR ${rentVal} found in text.`,
    `किराया राशि INR ${rentVal} पाठ में मिली।`
  );

  // 6. Security deposit match
  const depositVal = getCleanVal("security_deposit_amount");
  const hasDeposit = depositVal !== "" && draftText.includes(depositVal);
  addCheck(
    "chk_deposit_amount",
    "Security deposit check",
    "सुरक्षा जमा राशि की जांच",
    hasDeposit,
    `Security deposit of INR ${depositVal} found in text.`,
    `सुरक्षा जमा राशि INR ${depositVal} पाठ में मिली।`
  );

  // 7. Jurisdiction check
  const jurisdiction = getCleanVal("jurisdiction_city");
  const hasJurisdiction = jurisdiction !== "" && draftText.toLowerCase().includes(jurisdiction.toLowerCase());
  addCheck(
    "chk_jurisdiction",
    "Dispute jurisdiction check",
    "विवाद क्षेत्राधिकार की जांच",
    hasJurisdiction,
    `Jurisdiction courts at '${jurisdiction}' found.`,
    `क्षेत्राधिकार न्यायालय '${jurisdiction}' पाए गए।`
  );

  // 8. Signature block
  const hasSignature = 
    draftText.toLowerCase().includes("signature") || 
    draftText.includes("हस्ताक्षर") || 
    draftText.includes("सही");
  addCheck(
    "chk_signature_block",
    "Signature placeholders check",
    "हस्ताक्षर ब्लॉक की जांच",
    hasSignature,
    "Signature placeholders found for landlord and tenant.",
    "मकान मालिक और किरायेदार के लिए हस्ताक्षर ब्लॉक पाए गए।"
  );

  // 9. Witness block
  const hasWitness = 
    draftText.toLowerCase().includes("witness") || 
    draftText.includes("गवाह") || 
    draftText.includes("साक्षी");
  addCheck(
    "chk_witness_block",
    "Witness block check",
    "गवाह ब्लॉक की जांच",
    hasWitness,
    "Witness signature blocks found.",
    "गवाह हस्ताक्षर ब्लॉक पाए गए।"
  );

  // 10. Placeholder search: check for bracketed text like [TO BE FILLED]
  const placeholderRegex = /\[([^\]]+)\]/g;
  let match;
  const foundPlaceholders: string[] = [];
  while ((match = placeholderRegex.exec(draftText)) !== null) {
    foundPlaceholders.push(match[0]);
  }
  
  const hasNoPlaceholders = foundPlaceholders.length === 0;
  addCheck(
    "chk_placeholders",
    "Unresolved placeholders check",
    "अपूर्ण प्लेसहोल्डर की जांच",
    hasNoPlaceholders,
    hasNoPlaceholders ? "No unresolved bracket placeholders found." : `Found unresolved placeholders: ${foundPlaceholders.join(", ")}`,
    hasNoPlaceholders ? "कोई अपूर्ण कोष्ठक प्लेसहोल्डर नहीं मिला।" : `अपूर्ण प्लेसहोल्डर मिले: ${foundPlaceholders.join(", ")}`
  );

  if (!hasNoPlaceholders) {
    foundPlaceholders.forEach(p => {
      if (!missingPlaceholders.includes(p)) {
        missingPlaceholders.push(p);
      }
    });
  }

  // 11. Language check
  const containsHindiDevanagari = /[\u0900-\u097F]/.test(draftText);
  const langMatch = !!(draftLanguage === "hi" ? containsHindiDevanagari : !containsHindiDevanagari || (draftText.length > 0 && draftText.split(" ").filter(w => !/[\u0900-\u097F]/.test(w)).length > draftText.split(" ").length / 2));
  
  addCheck(
    "chk_language",
    "Output language check",
    "आउटपुट भाषा की जांच",
    langMatch,
    `Text matches selected draft language: ${draftLanguage === "hi" ? "Hindi" : "English"}.`,
    `दस्तावेज़ का पाठ चयनित भाषा (${draftLanguage === "hi" ? "हिन्दी" : "अंग्रेजी"}) के अनुरूप है।`
  );

  // 12. Mandatory clause keywords mapping
  const clauseKeywords: Record<string, { keywords: string[]; keywordsHi: string[]; name: string; nameHi: string }> = {
    rent: { 
      keywords: ["rent", "pay", "monthly"], 
      keywordsHi: ["किराया", "भुगतान", "मासिक"],
      name: "Rent clause", nameHi: "किराया खंड"
    },
    security: { 
      keywords: ["security", "deposit", "refundable"], 
      keywordsHi: ["सुरक्षा जमा", "जमानत", "ब्याज मुक्त"],
      name: "Deposit clause", nameHi: "सुरक्षा जमा खंड"
    },
    duration: { 
      keywords: ["duration", "period", "months", "term"], 
      keywordsHi: ["अवधि", "महीने", "कार्यकाल"],
      name: "Lease duration clause", nameHi: "अवधि खंड"
    },
    termination: { 
      keywords: ["termination", "terminate", "notice"], 
      keywordsHi: ["समाप्ति", "समाप्त", "नोटिस"],
      name: "Termination clause", nameHi: "समाप्ति खंड"
    },
    jurisdiction: { 
      keywords: ["jurisdiction", "court", "dispute"], 
      keywordsHi: ["क्षेत्राधिकार", "विवाद", "न्यायालय"],
      name: "Jurisdiction clause", nameHi: "क्षेत्राधिकार खंड"
    },
    possession: { 
      keywords: ["possession", "vacant", "handover"], 
      keywordsHi: ["कब्जा", "खाली", "आधिपत्य"],
      name: "Possession clause", nameHi: "कब्जा खंड"
    },
    maintenance: { 
      keywords: ["maintenance", "repair", "fittings", "wear"], 
      keywordsHi: ["रखरखाव", "मरम्मत", "पेंटिंग"],
      name: "Maintenance clause", nameHi: "रखरखाव खंड"
    },
    default: { 
      keywords: ["default", "non-payment", "breach"], 
      keywordsHi: ["उल्लंघन", "डिफ़ॉल्ट", "विफल"],
      name: "Default clause", nameHi: "डिफ़ॉल्ट खंड"
    }
  };

  let clauseScore = 0;
  let totalClauses = Object.keys(clauseKeywords).length;
  
  Object.entries(clauseKeywords).forEach(([clauseKey, details]) => {
    const textLower = draftText.toLowerCase();
    const matchesEn = details.keywords.some(k => textLower.includes(k.toLowerCase()));
    const matchesHi = details.keywordsHi.some(k => textLower.includes(k));
    const passed = matchesEn || matchesHi;
    
    if (passed) {
      clauseScore++;
    }
  });

  const clausesComplete = clauseScore === totalClauses;
  addCheck(
    "chk_mandatory_clauses",
    "Mandatory clause coverage",
    "अनिवार्य अनुबंध खंडों की कवरेज",
    clausesComplete,
    `Found coverage for ${clauseScore} out of ${totalClauses} mandatory contract terms.`,
    `सभी ${totalClauses} में से ${clauseScore} अनिवार्य अनुबंध खंड पाए गए।`
  );

  // Warnings compilation
  if (foundPlaceholders.length > 0) {
    warnings.push("Unresolved bracket placeholders exist in the text. Please replace them before printing.");
  }
  if (!clausesComplete) {
    warnings.push(`Some standard contract terms (matched keywords) might be missing. Found ${clauseScore}/${totalClauses}.`);
  }
  if (!langMatch) {
    warnings.push(`The generated document language does not match the draft language setting of '${draftLanguage}'.`);
  }

  // Ready states
  // We treat failed if any essential check (hasText, owner, tenant, address, rent, deposit) is false
  const essentialPassed = hasText && hasOwner && hasTenant && hasAddress && hasRent && hasDeposit;
  const isReadyForExport = essentialPassed && hasNoPlaceholders;

  let status: "passed" | "warning" | "failed" = "passed";
  const failedCount = checks.filter(c => !c.passed).length;
  
  if (failedCount > 0) {
    status = isReadyForExport ? "warning" : "failed";
  }

  return {
    status,
    checks,
    missingPlaceholders,
    warnings,
    isReadyForExport
  };
};
