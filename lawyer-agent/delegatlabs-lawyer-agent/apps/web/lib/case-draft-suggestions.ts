import { DRAFT_CATALOG } from "./draft-catalog";
import { CaseRecord } from "./case-storage";

export interface CaseDraftSuggestion {
  draftId: string;
  title: string;
  titleHi: string;
  reason: string;
  reasonHi: string;
  priority: "recommended" | "relevant" | "optional";
  isAvailable: boolean;
}

/**
 * Deterministically suggests relevant draft types based on case attributes.
 */
export function getCaseDraftSuggestions(caseRecord: CaseRecord): CaseDraftSuggestion[] {
  const suggestions: CaseDraftSuggestion[] = [];

  const caseType = (caseRecord.caseType || "").trim();
  const stage = (caseRecord.stage || "").trim();

  // Helper to add suggestion
  const addSuggestion = (
    draftId: string,
    title: string,
    titleHi: string,
    reason: string,
    reasonHi: string,
    priority: "recommended" | "relevant" | "optional"
  ) => {
    // Check if it exists in DRAFT_CATALOG and is available
    const catalogItem = DRAFT_CATALOG.find((item) => item.id === draftId);
    const isAvailable = !!(catalogItem && catalogItem.status === "available");

    // Push suggestion
    suggestions.push({
      draftId,
      title: catalogItem ? (catalogItem.title) : title,
      titleHi: catalogItem ? (catalogItem.titleHi) : titleHi,
      reason,
      reasonHi,
      priority,
      isAvailable
    });
  };

  // --- 1. RENT CASE RULES ---
  if (caseType === "Rent") {
    addSuggestion(
      "eviction_notice",
      "Eviction Notice",
      "बेदखली का नोटिस",
      "Evict tenant or terminate tenancy due to non-payment of rent or expiry of term.",
      "किराया भुगतान न करने या अवधि समाप्त होने के कारण किरायेदार को बेदखल करें या किरायेदारी समाप्त करें।",
      "recommended"
    );
    addSuggestion(
      "recovery_notice",
      "Recovery Notice",
      "धन वसूली नोटिस",
      "Demand outstanding rent dues or security deposits from the opposite party.",
      "विपक्षी दल से बकाया किराये की राशि या सुरक्षा जमा की मांग करें।",
      "relevant"
    );
    addSuggestion(
      "rent_agreement",
      "Rent Agreement",
      "किराया समझौता पत्र",
      "Create or renew a residential tenancy contract with verified clauses.",
      "सत्यापित शर्तों के साथ आवासीय किरायेदारी अनुबंध बनाएं या उसका नवीनीकरण करें।",
      "optional"
    );
    addSuggestion(
      "early_disposal_application",
      "Early Disposal Application",
      "त्वरित निस्तारण हेतु प्रार्थना पत्र",
      "Request fast-track proceedings to resolve eviction disputes early.",
      "बेदखली विवादों को जल्दी हल करने के लिए फास्ट-ट्रैक कार्यवाही का अनुरोध करें।",
      "optional"
    );
  }

  // --- 2. CRIMINAL CASE RULES ---
  if (caseType === "Criminal") {
    addSuggestion(
      "bail_application",
      "Bail Application",
      "जमानत के लिए प्रार्थना पत्र",
      "Apply for regular bail before the Magistrate or Sessions Court.",
      "मजिस्ट्रेट या सत्र न्यायालय के समक्ष नियमित जमानत के लिए आवेदन करें।",
      "recommended"
    );
    addSuggestion(
      "discharge_application",
      "Discharge Application",
      "डिस्चार्ज (उन्मोचन) प्रार्थना पत्र",
      "Seek discharge of accused if charges are groundless or lacking evidence.",
      "यदि आरोप निराधार हैं या सबूतों की कमी है तो आरोपी को बरी करने की मांग करें।",
      "relevant"
    );
    addSuggestion(
      "exemption_application",
      "Exemption Application",
      "व्यक्तिगत पेशी से छूट का प्रार्थना पत्र",
      "Request personal appearance exemption for client on next hearing dates.",
      "अगली सुनवाई की तारीखों पर मुवक्किल के लिए व्यक्तिगत उपस्थिति से छूट का अनुरोध करें।",
      "relevant"
    );
    addSuggestion(
      "surety_application",
      "Surety Application",
      "जमानतदार का आवेदन (Surety)",
      "Submit details of surety/bail-bond values to release the accused.",
      "आरोपी को रिहा करने के लिए जमानतदार/जमानत-बॉन्ड के मूल्यों का विवरण जमा करें।",
      "optional"
    );
    addSuggestion(
      "undertaking",
      "Undertaking",
      "वचन पत्र (Undertaking)",
      "Submit an official written promise to comply with release terms.",
      "रिहाई की शर्तों का पालन करने के लिए एक आधिकारिक लिखित वादा जमा करें।",
      "optional"
    );
  }

  // --- 3. BAIL CASE RULES ---
  if (caseType === "Bail") {
    addSuggestion(
      "bail_application",
      "Bail Application",
      "जमानत के लिए प्रार्थना पत्र",
      "Apply for regular or anticipatory release from custody.",
      "हिरासत से नियमित या अग्रिम रिहाई के लिए आवेदन करें।",
      "recommended"
    );
    addSuggestion(
      "surety_affidavit",
      "Surety Affidavit",
      "जमानतदार का हलफनामा",
      "Verify assets and identity of the surety standing bond for the accused.",
      "आरोपी के लिए जमानत लेने वाले व्यक्ति की संपत्ति और पहचान सत्यापित करें।",
      "relevant"
    );
    addSuggestion(
      "exemption_application",
      "Exemption Application",
      "व्यक्तिगत पेशी से छूट का प्रार्थना पत्र",
      "Request exemption from personal appearance during bail execution hearings.",
      "जमानत निष्पादन सुनवाई के दौरान व्यक्तिगत उपस्थिति से छूट का अनुरोध करें।",
      "optional"
    );
  }

  // --- 4. APPEAL RULES ---
  if (caseType === "Appeal") {
    addSuggestion(
      "appeal_sessions_order",
      "Appeal Against Sessions Court Order",
      "सत्र न्यायालय के आदेश के खिलाफ अपील",
      "Draft the main memorandum of appeal challenging the lower court order.",
      "निचली अदालत के आदेश को चुनौती देने वाली अपील का मुख्य ज्ञापन तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "delay_condonation_application",
      "Delay Condonation Application",
      "देरी की माफी के लिए प्रार्थना पत्र",
      "Request the court to condone delay under Limitation Act Section 5 if appeal is late.",
      "यदि अपील में देरी हुई है तो सीमा अधिनियम की धारा 5 के तहत देरी की माफी का अनुरोध करें।",
      "relevant"
    );
    addSuggestion(
      "stay_application",
      "Stay Application",
      "स्थगन आदेश का प्रार्थना पत्र (Stay)",
      "Seek stay on execution of the impugned decree or judgment during appeal.",
      "अपील के दौरान विवादित डिक्री या निर्णय के निष्पादन पर रोक लगाने की मांग करें।",
      "relevant"
    );
  }

  // --- 5. WRIT RULES ---
  if (caseType === "Writ") {
    addSuggestion(
      "writ_petition_226",
      "Writ Petition under Article 226",
      "अनुच्छेद 226 के तहत रिट याचिका",
      "Prepare a writ petition under Article 226 of the Constitution.",
      "संविधान के अनुच्छेद 226 के तहत रिट याचिका तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "supplementary_affidavit",
      "Supplementary Affidavit",
      "पूरक शपथ पत्र",
      "Place additional facts or documents on record for the Writ Court.",
      "रिट कोर्ट के रिकॉर्ड में अतिरिक्त तथ्य या दस्तावेज प्रस्तुत करें।",
      "relevant"
    );
    addSuggestion(
      "listing_application",
      "Listing Application",
      "सूचीबद्ध करने का प्रार्थना पत्र",
      "Request registry to list the Writ Petition for early admission hearing.",
      "शीघ्र प्रवेश सुनवाई के लिए रिट याचिका को सूचीबद्ध करने का अनुरोध करें।",
      "optional"
    );
    addSuggestion(
      "mention_slip",
      "Mention Slip",
      "मेंशन स्लिप (Urgent Listing)",
      "Request urgent listing of the petition before the Bench.",
      "पीठ के समक्ष याचिका को तत्काल सूचीबद्ध करने का अनुरोध करें।",
      "optional"
    );
  }

  // --- 6. CONSUMER RULES ---
  if (caseType === "Consumer") {
    addSuggestion(
      "consumer_notice",
      "Consumer Notice",
      "उपभोक्ता शिकायत नोटिस",
      "Send a formal notice demanding grievance remedy prior to consumer filing.",
      "उपभोक्ता शिकायत दर्ज करने से पहले शिकायत निवारण की मांग करने वाला औपचारिक नोटिस भेजें।",
      "recommended"
    );
    addSuggestion(
      "consumer_complaint",
      "Complaint",
      "उपभोक्ता शिकायत (Complaint)",
      "Draft the main consumer dispute complaint to file before the Forum.",
      "फोरम के समक्ष दायर करने के लिए मुख्य उपभोक्ता विवाद शिकायत का मसौदा तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "affidavit",
      "Affidavit",
      "शपथ पत्र",
      "File supporting affidavit verifying facts stated in the complaint.",
      "शिकायत में बताए गए तथ्यों को सत्यापित करने वाला समर्थक शपथ पत्र दायर करें।",
      "relevant"
    );
    addSuggestion(
      "consumer_reply",
      "Reply",
      "जवाब (Written Statement)",
      "Draft the written version/reply representing the opposite service vendor.",
      "सेवा प्रदाता/विपक्षी दल का प्रतिनिधित्व करने वाले जवाब का मसौदा तैयार करें।",
      "optional"
    );
  }

  // --- 7. FAMILY RULES ---
  if (caseType === "Family") {
    addSuggestion(
      "maintenance_petition",
      "Maintenance Petition",
      "भरण-पोषण की याचिका",
      "Seek monthly maintenance support for client under Section 125 of CrPC.",
      "सीआरपीसी की धारा 125 के तहत मुवक्किल के लिए मासिक भरण-पोषण सहायता की मांग करें।",
      "recommended"
    );
    addSuggestion(
      "mutual_divorce",
      "Mutual Divorce Petition",
      "आपसी सहमति से तलाक की याचिका",
      "Draft joint petition for mutual dissolution under personal marriage laws.",
      "व्यक्तिगत विवाह कानूनों के तहत आपसी सहमति से तलाक के लिए संयुक्त याचिका तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "family_reply",
      "Reply",
      "जवाब दावा (Reply)",
      "Draft response to divorce or restitution of conjugal rights petitions.",
      "तलाक या वैवाहिक अधिकारों की पुनर्स्थापना याचिकाओं के जवाब का मसौदा तैयार करें।",
      "relevant"
    );
    addSuggestion(
      "settlement_terms",
      "Settlement Terms",
      "समझौता पत्र (Settlement Deed)",
      "Draft mutual agreement terms resolving alimony, custody, and properties.",
      "गुजारा भत्ता, कस्टडी और संपत्तियों को सुलझाने वाले आपसी समझौते की शर्तों का मसौदा तैयार करें।",
      "optional"
    );
  }

  // --- 8. STAGE-BASED RULES (Appended if matched) ---
  if (stage === "Final Arguments") {
    addSuggestion(
      "written_submission",
      "Written Submission",
      "लिखित बहस (Written Arguments)",
      "Draft structured written arguments summarizing pleading facts and citations.",
      "तथ्यों और उद्धरणों को सारांशित करते हुए लिखित दलीलें तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "short_argument_note",
      "Short Argument Note",
      "बहस नोट (Synopsis)",
      "Create brief bullet points of case highlights for the Bench's reference.",
      "पीठ के संदर्भ के लिए मामले के मुख्य बिंदुओं का संक्षिप्त विवरण तैयार करें।",
      "relevant"
    );
    addSuggestion(
      "early_disposal_application",
      "Early Disposal Application",
      "त्वरित निस्तारण हेतु प्रार्थना पत्र",
      "Apply for expedited scheduling to conclude the case during final stage.",
      "अंतिम चरण के दौरान मामले को समाप्त करने के लिए त्वरित समय निर्धारण के लिए आवेदन करें।",
      "optional"
    );
  }

  if (stage === "Evidence") {
    addSuggestion(
      "evidence_affidavit",
      "Evidence Affidavit",
      "मुख्य परीक्षा का शपथ पत्र (Evidence)",
      "Draft the examination-in-chief affidavit representing the witness statements.",
      "गवाहों के बयानों का प्रतिनिधित्व करने वाले मुख्य परीक्षा के शपथ पत्र का मसौदा तैयार करें।",
      "recommended"
    );
    addSuggestion(
      "list_of_documents",
      "List of Documents",
      "दस्तावेजों की सूची (Exhibit List)",
      "Compile and record all supporting exhibition evidence/papers.",
      "सभी सहायक प्रदर्शनी साक्ष्यों/कागजातों को संकलित और दर्ज करें।",
      "relevant"
    );
    addSuggestion(
      "witness_list",
      "Witness List",
      "गवाहों की सूची",
      "List of individuals to examine before the court during trial stage.",
      "सुनवाई चरण के दौरान अदालत के समक्ष जांच करने वाले व्यक्तियों की सूची।",
      "optional"
    );
    addSuggestion(
      "summon_witness_application",
      "Application for Summoning Witness",
      "गवाहों को समन भेजने का प्रार्थना पत्र",
      "Request court to issue official summons/warrants to material witnesses.",
      "अदालत से गवाहों को आधिकारिक समन जारी करने का अनुरोध करें।",
      "optional"
    );
  }

  return suggestions;
}

/**
 * simpleInternalChecks is a self-testing verification suite for suggestions mapping
 */
export function runSuggestionsTests(): Record<string, boolean> {
  const testResults: Record<string, boolean> = {};

  // 1. Rent + Final Arguments
  const rentCase: CaseRecord = {
    id: "test-rent",
    caseTitle: "Test Lease",
    caseType: "Rent",
    clientName: "Landlord",
    clientRole: "Petitioner",
    clientParty: "partyA",
    partyA: { name: "Landlord", legalRole: "Petitioner" },
    partyB: { name: "Tenant", legalRole: "Respondent" },
    courtType: "District Court",
    courtName: "Rent Controller",
    stage: "Final Arguments",
    status: "active",
    createdAt: new Date().toISOString()
  };
  const suggestionsRent = getCaseDraftSuggestions(rentCase);
  testResults["Rent + Final Arguments has Eviction Notice"] = suggestionsRent.some((s) => s.draftId === "eviction_notice");
  testResults["Rent + Final Arguments has Written Submission"] = suggestionsRent.some((s) => s.draftId === "written_submission");

  // 2. Criminal + Discharge
  const criminalCase: CaseRecord = {
    id: "test-crim",
    caseTitle: "State vs John",
    caseType: "Criminal",
    clientName: "Accused",
    clientRole: "Respondent",
    clientParty: "partyB",
    partyA: { name: "State", legalRole: "Petitioner" },
    partyB: { name: "Accused", legalRole: "Respondent" },
    courtType: "District Court",
    courtName: "Magistrate Court",
    stage: "Charge",
    status: "active",
    createdAt: new Date().toISOString()
  };
  const suggestionsCriminal = getCaseDraftSuggestions(criminalCase);
  testResults["Criminal has Discharge Application"] = suggestionsCriminal.some((s) => s.draftId === "discharge_application");

  // 3. Bail case
  const bailCase: CaseRecord = {
    id: "test-bail",
    caseTitle: "Bail for Roy",
    caseType: "Bail",
    clientName: "Applicant",
    clientRole: "Applicant",
    clientParty: "partyA",
    partyA: { name: "Applicant", legalRole: "Applicant" },
    partyB: { name: "State", legalRole: "Respondent" },
    courtType: "District Court",
    courtName: "Sessions Court",
    stage: "Arguments",
    status: "active",
    createdAt: new Date().toISOString()
  };
  const suggestionsBail = getCaseDraftSuggestions(bailCase);
  testResults["Bail has Bail Application"] = suggestionsBail.some((s) => s.draftId === "bail_application");

  // 4. Writ case
  const writCase: CaseRecord = {
    id: "test-writ",
    caseTitle: "Writ of Mandamus",
    caseType: "Writ",
    clientName: "Petitioner",
    clientRole: "Petitioner",
    clientParty: "partyA",
    partyA: { name: "Petitioner", legalRole: "Petitioner" },
    partyB: { name: "State", legalRole: "Respondent" },
    courtType: "High Court",
    courtName: "High Court",
    stage: "Admission",
    status: "active",
    createdAt: new Date().toISOString()
  };
  const suggestionsWrit = getCaseDraftSuggestions(writCase);
  testResults["Writ has Writ Petition"] = suggestionsWrit.some((s) => s.draftId === "writ_petition_226");

  // 5. Consumer case
  const consumerCase: CaseRecord = {
    id: "test-con",
    caseTitle: "User vs Vendor",
    caseType: "Consumer",
    clientName: "Complainant",
    clientRole: "Complainant",
    clientParty: "partyA",
    partyA: { name: "Complainant", legalRole: "Complainant" },
    partyB: { name: "Vendor", legalRole: "Opposite Party" },
    courtType: "District Forum",
    courtName: "District Forum",
    stage: "Evidence",
    status: "active",
    createdAt: new Date().toISOString()
  };
  const suggestionsConsumer = getCaseDraftSuggestions(consumerCase);
  testResults["Consumer has Consumer Notice"] = suggestionsConsumer.some((s) => s.draftId === "consumer_notice");

  return testResults;
}
