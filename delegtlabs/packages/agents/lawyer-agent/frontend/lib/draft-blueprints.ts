export interface DraftSection {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  order: number;
}

export interface DraftField {
  id: string;
  label: string;
  labelHi: string;
  sectionId: string;
  required: boolean;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  placeholder?: string;
}

export interface DraftClause {
  id: string;
  title: string;
  titleHi: string;
  type: "mandatory" | "recommended" | "optional";
}

export interface DraftBlueprint {
  draftId: string;
  sections: DraftSection[];
  requiredFields: DraftField[];
  recommendedFields: DraftField[];
  optionalFields: DraftField[];
  mandatoryClauses: DraftClause[];
  recommendedClauses: DraftClause[];
  optionalClauses: DraftClause[];
}

const rentAgreement: DraftBlueprint = {
  draftId: "rent_agreement",
  sections: [
    {
      id: "party_details",
      title: "Party Details",
      titleHi: "पक्षकार विवरण",
      description: "Owner and tenant details",
      order: 1,
    },
    {
      id: "property_details",
      title: "Property Details",
      titleHi: "संपत्ति का विवरण",
      description: "Rented property details",
      order: 2,
    },
    {
      id: "rent_deposit",
      title: "Rent & Deposit",
      titleHi: "किराया एवं जमानत",
      description: "Rent and deposit terms",
      order: 3,
    },
    {
      id: "agreement_terms",
      title: "Agreement Terms",
      titleHi: "समझौता शर्तें",
      description: "Duration and jurisdiction",
      order: 4,
    },
  ],
  requiredFields: [
    {
      id: "owner_full_name",
      label: "Owner Full Name",
      labelHi: "मकान मालिक का नाम",
      sectionId: "party_details",
      required: true,
      inputType: "text",
      placeholder: "Full legal name",
    },
    {
      id: "tenant_full_name",
      label: "Tenant Full Name",
      labelHi: "किरायेदार का नाम",
      sectionId: "party_details",
      required: true,
      inputType: "text",
    },
    {
      id: "owner_address",
      label: "Owner Residential Address",
      labelHi: "मकान मालिक का पता",
      sectionId: "party_details",
      required: true,
      inputType: "textarea",
    },
    {
      id: "tenant_address",
      label: "Tenant Residential Address",
      labelHi: "किरायेदार का पता",
      sectionId: "party_details",
      required: true,
      inputType: "textarea",
    },
    {
      id: "property_address",
      label: "Property Full Address",
      labelHi: "संपत्ति का पूरा पता",
      sectionId: "property_details",
      required: true,
      inputType: "textarea",
    },
    {
      id: "monthly_rent_amount",
      label: "Monthly Rent Amount (INR)",
      labelHi: "मासिक किराया",
      sectionId: "rent_deposit",
      required: true,
      inputType: "number",
    },
    {
      id: "security_deposit",
      label: "Security Deposit Amount (INR)",
      labelHi: "जमानत राशि",
      sectionId: "rent_deposit",
      required: true,
      inputType: "number",
    },
    {
      id: "duration_months",
      label: "Agreement Duration (Months)",
      labelHi: "अवधि (माह)",
      sectionId: "agreement_terms",
      required: true,
      inputType: "number",
    },
    {
      id: "start_date",
      label: "Agreement Start Date",
      labelHi: "प्रारंभ तिथि",
      sectionId: "agreement_terms",
      required: true,
      inputType: "date",
    },
  ],
  recommendedFields: [],
  optionalFields: [],
  mandatoryClauses: [
    { id: "quiet_enjoyment", title: "Quiet Enjoyment", titleHi: "शांतिपूर्ण उपयोग", type: "mandatory" },
    { id: "maintenance", title: "Maintenance Obligations", titleHi: "रखरखाव", type: "mandatory" },
  ],
  recommendedClauses: [
    { id: "lock_in", title: "Lock-in Period", titleHi: "लॉक-इन अवधि", type: "recommended" },
  ],
  optionalClauses: [],
};

/** Generic blueprint for other available drafts — same field shape, lighter copy. */
function genericBlueprint(draftId: string, title: string): DraftBlueprint {
  return {
    draftId,
    sections: [
      {
        id: "party_details",
        title: "Party Details",
        titleHi: "पक्षकार विवरण",
        description: "Parties to the document",
        order: 1,
      },
      {
        id: "agreement_terms",
        title: "Document Terms",
        titleHi: "दस्तावेज़ शर्तें",
        description: "Key terms",
        order: 2,
      },
    ],
    requiredFields: [
      {
        id: "owner_full_name",
        label: "First Party Name",
        labelHi: "प्रथम पक्ष",
        sectionId: "party_details",
        required: true,
        inputType: "text",
      },
      {
        id: "tenant_full_name",
        label: "Second Party Name",
        labelHi: "द्वितीय पक्ष",
        sectionId: "party_details",
        required: true,
        inputType: "text",
      },
      {
        id: "start_date",
        label: "Document Date",
        labelHi: "तिथि",
        sectionId: "agreement_terms",
        required: true,
        inputType: "date",
      },
    ],
    recommendedFields: [],
    optionalFields: [],
    mandatoryClauses: [{ id: "standard", title: `Standard ${title} Clauses`, titleHi: "मानक खंड", type: "mandatory" }],
    recommendedClauses: [],
    optionalClauses: [],
  };
}

export const DRAFT_BLUEPRINTS: Record<string, DraftBlueprint> = {
  rent_agreement: rentAgreement,
  leave_license: genericBlueprint("leave_license", "Leave and License"),
  legal_notice: genericBlueprint("legal_notice", "Legal Notice"),
};

export function getBlueprint(draftId: string): DraftBlueprint | null {
  return DRAFT_BLUEPRINTS[draftId] || null;
}
