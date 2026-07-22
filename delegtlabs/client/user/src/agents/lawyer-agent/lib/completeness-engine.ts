import { DraftBlueprint } from "./draft-blueprints";

export interface CompletenessResult {
  draftId: string;
  totalRequiredFields: number;
  completedRequiredFields: number;
  missingRequiredFields: string[];
  totalValidationRules: number;
  passedValidationRules: string[];
  failedValidationRules: { id: string; error: string; errorHi: string }[];
  warnings: { id: string; text: string; textHi: string }[];
  isReadyForGeneration: boolean;
  completionPercentage: number;
}

export const runCompletenessCheck = (
  blueprint: DraftBlueprint,
  answers: Record<string, any>,
  draftLanguage?: string
): CompletenessResult => {
  const missingRequiredFields: string[] = [];
  let completedRequiredFields = 0;

  // 1. Validate Required Fields
  blueprint.requiredFields.forEach((field) => {
    const val = answers[field.id];
    if (val === undefined || val === null || String(val).trim() === "") {
      missingRequiredFields.push(field.id);
    } else {
      completedRequiredFields++;
    }
  });

  const totalRequiredFields = blueprint.requiredFields.length;
  const completionPercentage = totalRequiredFields > 0
    ? Math.round((completedRequiredFields / totalRequiredFields) * 100)
    : 100;

  // 2. Validate Deterministic Rules
  const passedValidationRules: string[] = [];
  const failedValidationRules: { id: string; error: string; errorHi: string }[] = [];

  const addRuleResult = (id: string, passed: boolean, errorText: string, errorTextHi: string) => {
    if (passed) {
      passedValidationRules.push(id);
    } else {
      failedValidationRules.push({ id, error: errorText, errorHi: errorTextHi });
    }
  };

  // Rule 1: Required party details must be complete
  const partyFields = blueprint.requiredFields.filter(f => f.sectionId === "party_details");
  const partyComplete = partyFields.every(f => answers[f.id] && String(answers[f.id]).trim() !== "");
  addRuleResult(
    "val_party_complete",
    partyComplete,
    "Required party details (names, addresses, PANs) must be complete.",
    "आवश्यक पक्षकार विवरण (नाम, पते, पैन) पूर्ण होने चाहिए।"
  );

  // Rule 2: Owner and tenant names must not be same
  const ownerName = String(answers["owner_full_name"] || "").trim().toLowerCase();
  const tenantName = String(answers["tenant_full_name"] || "").trim().toLowerCase();
  const nameDistinct = ownerName === "" || tenantName === "" || ownerName !== tenantName;
  addRuleResult(
    "val_names_distinct",
    nameDistinct,
    "Owner and Tenant names must not be identical.",
    "मकान मालिक और किरायेदार का नाम एक समान नहीं होना चाहिए।"
  );

  // Rule 3: Monthly rent must be greater than zero
  const rentVal = parseFloat(answers["monthly_rent_amount"]);
  const rentPositive = !isNaN(rentVal) && rentVal > 0;
  addRuleResult(
    "val_rent_positive",
    rentPositive,
    "Monthly rent must be a positive numeric value greater than zero.",
    "मासिक किराया शून्य से अधिक होना चाहिए।"
  );

  // Rule 4: Security deposit must be zero or greater
  const depositVal = parseFloat(answers["security_deposit_amount"]);
  const depositOk = !isNaN(depositVal) && depositVal >= 0;
  addRuleResult(
    "val_deposit_positive",
    depositOk,
    "Security deposit must be zero or a positive numeric value.",
    "सुरक्षा जमा शून्य या अधिक होना चाहिए।"
  );

  // Rule 5: Agreement start date must be present
  const startDatePresent = answers["agreement_start_date"] && String(answers["agreement_start_date"]).trim() !== "";
  addRuleResult(
    "val_start_date",
    !!startDatePresent,
    "Agreement start date must be a valid calendar date.",
    "प्रारंभ तिथि वैध होनी चाहिए।"
  );

  // Rule 6: Agreement duration must be greater than zero
  const durationVal = parseInt(answers["agreement_duration_months"], 10);
  const durationOk = !isNaN(durationVal) && durationVal > 0;
  addRuleResult(
    "val_duration_months",
    durationOk,
    "Agreement duration must be specified in months greater than zero.",
    "अवधि महीनों में होनी चाहिए (आमतौर पर 11 महीने)।"
  );

  // Rule 7: Notice period must be greater than zero
  const noticeVal = parseInt(answers["notice_period_days"], 10);
  const noticeOk = !isNaN(noticeVal) && noticeVal > 0;
  addRuleResult(
    "notice_period_positive", // Matches blueprint id or validation mapping
    noticeOk,
    "Notice period must be specified in days greater than zero.",
    "नोटिस की अवधि शून्य से अधिक होनी चाहिए।"
  );

  // Rule 8: Jurisdiction city must be present
  const jurisdictionPresent = answers["jurisdiction_city"] && String(answers["jurisdiction_city"]).trim() !== "";
  addRuleResult(
    "val_jurisdiction",
    !!jurisdictionPresent,
    "Jurisdiction city must be declared for resolving legal disputes.",
    "कानूनी क्षेत्राधिकार शहर घोषित होना चाहिए।"
  );

  // Rule 9: Witness details must be present before final export
  const witnessFields = blueprint.requiredFields.filter(f => f.sectionId === "review");
  const witnessComplete = witnessFields.every(f => answers[f.id] && String(answers[f.id]).trim() !== "");
  addRuleResult(
    "val_witnesses",
    witnessComplete,
    "Witness details must be complete before final document generation.",
    "दस्तावेज़ बनाने से पहले गवाहों का विवरण आवश्यक है।"
  );

  // Rule 10: Draft language must be selected before generation
  const langOk = draftLanguage === "en" || draftLanguage === "hi";
  addRuleResult(
    "val_lang_selected",
    langOk,
    "Draft output language must be explicitly selected before generating.",
    "मसौदा भाषा का चयन इनटेक विज़ार्ड शुरू करने से पहले आवश्यक है।"
  );

  // Total Validation Rules count
  const totalValidationRules = 10;

  // 3. Compile Warnings / Recommended improvements
  const warnings: { id: string; text: string; textHi: string }[] = [];

  const checkRecommendedMissing = (id: string, fieldName: string, fieldNameHi: string) => {
    const val = answers[id];
    if (val === undefined || val === null || String(val).trim() === "") {
      warnings.push({
        id: `warn_${id}`,
        text: `Recommended field '${fieldName}' is missing. Providing this ensures a more complete agreement.`,
        textHi: `अनुशंसित फ़ील्ड '${fieldNameHi}' अनुपस्थित है। इसे प्रदान करने से अनुबंध अधिक मजबूत होता है।`
      });
    }
  };

  checkRecommendedMissing("owner_mobile", "Owner Mobile Number", "मकान मालिक का मोबाइल नंबर");
  checkRecommendedMissing("tenant_mobile", "Tenant Mobile Number", "किरायेदार का मोबाइल नंबर");
  checkRecommendedMissing("maintenance_responsibility", "Maintenance Responsibility", "रखरखाव की जिम्मेदारी");
  checkRecommendedMissing("electricity_responsibility", "Electricity Responsibility", "बिजली भुगतान जिम्मेदारी");
  checkRecommendedMissing("water_responsibility", "Water Responsibility", "पानी भुगतान जिम्मेदारी");
  checkRecommendedMissing("parking_details", "Parking Details", "पार्किंग विवरण");
  checkRecommendedMissing("lock_in_period", "Lock-in Period", "लॉक-इन अवधि");
  checkRecommendedMissing("rent_increment_terms", "Rent Increment Terms", "किराया वृद्धि की शर्तें");

  // Police verification warning
  if (!answers["police_verification_clause"] || answers["police_verification_clause"] === "no") {
    warnings.push({
      id: "warn_police_verification",
      text: "Police verification details are not added. Police verification is commonly recommended for tenant onboarding. Please verify local police verification requirements manually.",
      textHi: "पुलिस सत्यापन विवरण नहीं जोड़े गए हैं। किरायेदार ऑनबोर्डिंग के लिए पुलिस सत्यापन की आमतौर पर सिफारिश की जाती है। कृपया स्थानीय पुलिस सत्यापन आवश्यकताओं को स्वयं सत्यापित करें।"
    });
  }

  // Stamp paper manual check warning
  warnings.push({
    id: "warn_stamp_paper_manual",
    text: "Manually verify required stamp duty rates and registration policies for Uttar Pradesh.",
    textHi: "उत्तर प्रदेश के लिए आवश्यक स्टांप शुल्क और पंजीकरण नीतियों की स्वयं पुष्टि करें।"
  });

  // Ready state: zero missing required fields AND zero failed validation rules
  const isReadyForGeneration = missingRequiredFields.length === 0 && failedValidationRules.length === 0;

  return {
    draftId: blueprint.draftId,
    totalRequiredFields,
    completedRequiredFields,
    missingRequiredFields,
    totalValidationRules,
    passedValidationRules,
    failedValidationRules,
    warnings,
    isReadyForGeneration,
    completionPercentage
  };
};
