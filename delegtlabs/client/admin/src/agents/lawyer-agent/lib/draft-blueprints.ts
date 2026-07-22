export interface DraftSection {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  order: number;
}

export interface DraftFieldOption {
  value: string;
  label: string;
  labelHi?: string;
}

export interface DraftField {
  id: string;
  label: string;
  labelHi: string;
  sectionId: string;
  required: boolean;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  placeholder?: string;
  placeholderHi?: string;
  options?: DraftFieldOption[];
  helperText?: string;
  helperTextHi?: string;
}

export interface DraftClause {
  id: string;
  title: string;
  titleHi: string;
  type: "mandatory" | "recommended" | "optional";
  description?: string;
  descriptionHi?: string;
}

export interface ValidationRule {
  id: string;
  ruleText: string;
  ruleTextHi: string;
}

export interface ReviewChecklistItem {
  id: string;
  checkText: string;
  checkTextHi: string;
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
  validationRules: ValidationRule[];
  reviewChecklist: ReviewChecklistItem[];
}

export const DRAFT_BLUEPRINTS: Record<string, DraftBlueprint> = {
  rent_agreement: {
    draftId: "rent_agreement",
    sections: [
      {
        id: "party_details",
        title: "Party Details",
        titleHi: "पक्षकार विवरण",
        description: "Specify owner (landlord) and tenant details.",
        descriptionHi: "मकान मालिक और किरायेदार का विवरण दर्ज करें।",
        order: 1
      },
      {
        id: "property_details",
        title: "Property Details",
        titleHi: "संपत्ति का विवरण",
        description: "Provide details of the rented property.",
        descriptionHi: "किराये पर दी जाने वाली संपत्ति का विवरण दर्ज करें।",
        order: 2
      },
      {
        id: "rent_deposit",
        title: "Rent & Deposit",
        titleHi: "किराया एवं जमानत राशि",
        description: "State monthly rent, security deposit, and payment terms.",
        descriptionHi: "मासिक किराया, सुरक्षा जमा और भुगतान की शर्तें दर्ज करें।",
        order: 3
      },
      {
        id: "agreement_terms",
        title: "Agreement Terms",
        titleHi: "समझौता शर्तें",
        description: "Define duration, start date, notice period, and jurisdiction.",
        descriptionHi: "अवधि, प्रारंभ तिथि, नोटिस अवधि और क्षेत्राधिकार निर्धारित करें।",
        order: 4
      },
      {
        id: "clauses",
        title: "Clauses",
        titleHi: "खंड (Clauses)",
        description: "Choose mandatory and recommended clauses for your agreement.",
        descriptionHi: "अपने समझौते के लिए अनिवार्य और अनुशंसित खंड चुनें।",
        order: 5
      },
      {
        id: "review",
        title: "Review & Signing",
        titleHi: "समीक्षा और हस्ताक्षर",
        description: "Enter witness details and perform a final check.",
        descriptionHi: "गवाहों का विवरण दर्ज करें और अंतिम जांच करें।",
        order: 6
      }
    ],
    requiredFields: [
      // Party Details
      {
        id: "owner_full_name",
        label: "Owner Full Name",
        labelHi: "मकान मालिक का पूरा नाम",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., Rajesh Kumar Sharma",
        placeholderHi: "उदा. राजेश कुमार शर्मा",
        helperText: "Enter the full legal name of the property owner.",
        helperTextHi: "संपत्ति के मालिक का पूरा कानूनी नाम दर्ज करें।"
      },
      {
        id: "owner_father_or_spouse_name",
        label: "Owner's Father/Spouse Name",
        labelHi: "मकान मालिक के पिता/पति का नाम",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., Late Shri Om Prakash Sharma",
        placeholderHi: "उदा. स्वर्गीय श्री ओम प्रकाश शर्मा"
      },
      {
        id: "owner_address",
        label: "Owner Residential Address",
        labelHi: "मकान मालिक का पता",
        sectionId: "party_details",
        required: true,
        inputType: "textarea",
        placeholder: "e.g., Flat 101, Meerut, UP",
        placeholderHi: "उदा. फ्लैट 101, मेरठ, उत्तर प्रदेश"
      },
      {
        id: "owner_pan",
        label: "Owner PAN Number",
        labelHi: "मकान मालिक का पैन नंबर",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., ABCDE1234F",
        placeholderHi: "उदा. ABCDE1234F"
      },
      {
        id: "tenant_full_name",
        label: "Tenant Full Name",
        labelHi: "किरायेदार का पूरा नाम",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., Anil Kumar",
        placeholderHi: "उदा. अनिल कुमार"
      },
      {
        id: "tenant_father_or_spouse_name",
        label: "Tenant's Father/Spouse Name",
        labelHi: "किरायेदार के पिता/पति का नाम",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., Shri Ram Kumar",
        placeholderHi: "उदा. श्री राम कुमार"
      },
      {
        id: "tenant_address",
        label: "Tenant Residential Address",
        labelHi: "किरायेदार का स्थाई पता",
        sectionId: "party_details",
        required: true,
        inputType: "textarea",
        placeholder: "e.g., House 50, Lucknow, UP",
        placeholderHi: "उदा. हाउस 50, लखनऊ, उत्तर प्रदेश"
      },
      {
        id: "tenant_pan",
        label: "Tenant PAN Number",
        labelHi: "किरायेदार का पैन नंबर",
        sectionId: "party_details",
        required: true,
        inputType: "text",
        placeholder: "e.g., XYZWP5678Q",
        placeholderHi: "उदा. XYZWP5678Q"
      },
      
      // Property Details
      {
        id: "property_full_address",
        label: "Property Full Address",
        labelHi: "संपत्ति का पूरा पता",
        sectionId: "property_details",
        required: true,
        inputType: "textarea",
        placeholder: "e.g., House No. 124, Mohalla Civil Lines, Meerut, UP",
        placeholderHi: "उदा. मकान नंबर 124, मोहल्ला सिविल लाइंस, मेरठ, उत्तर प्रदेश",
        helperText: "Provide the exact address of the rented premises.",
        helperTextHi: "किराए पर दी जाने वाली संपत्ति का सटीक पता दर्ज करें।"
      },
      {
        id: "property_type",
        label: "Property Type",
        labelHi: "संपत्ति का प्रकार",
        sectionId: "property_details",
        required: true,
        inputType: "select",
        options: [
          { value: "apartment", label: "Apartment / फ्लैट", labelHi: "फ्लैट (Apartment)" },
          { value: "house", label: "Independent House / स्वतंत्र मकान", labelHi: "स्वतंत्र मकान" },
          { value: "commercial", label: "Commercial Office / दुकान", labelHi: "व्यावसायिक कार्यालय/दुकान" }
        ]
      },
      {
        id: "property_use",
        label: "Property Usage",
        labelHi: "संपत्ति का उपयोग",
        sectionId: "property_details",
        required: true,
        inputType: "select",
        options: [
          { value: "residential", label: "Residential / आवासीय", labelHi: "आवासीय" },
          { value: "commercial", label: "Commercial / व्यावसायिक", labelHi: "व्यावसायिक" }
        ]
      },
      
      // Rent & Deposit
      {
        id: "monthly_rent_amount",
        label: "Monthly Rent Amount (INR)",
        labelHi: "मासिक किराया राशि (INR)",
        sectionId: "rent_deposit",
        required: true,
        inputType: "number",
        placeholder: "e.g., 15000",
        placeholderHi: "उदा. 15000"
      },
      {
        id: "security_deposit_amount",
        label: "Security Deposit Amount (INR)",
        labelHi: "सुरक्षा जमा राशि (INR)",
        sectionId: "rent_deposit",
        required: true,
        inputType: "number",
        placeholder: "e.g., 30000",
        placeholderHi: "उदा. 30000"
      },
      {
        id: "rent_payment_due_day",
        label: "Rent Payment Due Day",
        labelHi: "किराया भुगतान देय तारीख",
        sectionId: "rent_deposit",
        required: true,
        inputType: "number",
        placeholder: "e.g., 5",
        placeholderHi: "उदा. 5 (महीने की 5 तारीख तक)"
      },
      
      // Agreement Terms
      {
        id: "agreement_start_date",
        label: "Agreement Start Date",
        labelHi: "समझौता प्रारंभ तिथि",
        sectionId: "agreement_terms",
        required: true,
        inputType: "date"
      },
      {
        id: "agreement_duration_months",
        label: "Agreement Duration (Months)",
        labelHi: "समझौता अवधि (महीने)",
        sectionId: "agreement_terms",
        required: true,
        inputType: "number",
        placeholder: "e.g., 11",
        placeholderHi: "उदा. 11"
      },
      {
        id: "notice_period_days",
        label: "Notice Period (Days)",
        labelHi: "नोटिस अवधि (दिन)",
        sectionId: "agreement_terms",
        required: true,
        inputType: "number",
        placeholder: "e.g., 30",
        placeholderHi: "उदा. 30"
      },
      {
        id: "jurisdiction_city",
        label: "Jurisdiction City",
        labelHi: "क्षेत्राधिकार शहर",
        sectionId: "agreement_terms",
        required: true,
        inputType: "text",
        placeholder: "e.g., Meerut",
        placeholderHi: "उदा. मेरठ"
      },
      
      // Review
      {
        id: "witness_1_name",
        label: "Witness 1 Name",
        labelHi: "गवाह 1 का नाम",
        sectionId: "review",
        required: true,
        inputType: "text",
        placeholder: "e.g., Suresh Prasad",
        placeholderHi: "उदा. सुरेश प्रसाद"
      },
      {
        id: "witness_1_address",
        label: "Witness 1 Address",
        labelHi: "गवाह 1 का पता",
        sectionId: "review",
        required: true,
        inputType: "textarea",
        placeholder: "e.g., Sector 4, Noida, UP",
        placeholderHi: "उदा. सेक्टर 4, नोएडा, उत्तर प्रदेश"
      },
      {
        id: "witness_2_name",
        label: "Witness 2 Name",
        labelHi: "गवाह 2 का नाम",
        sectionId: "review",
        required: true,
        inputType: "text",
        placeholder: "e.g., Ramesh Pal",
        placeholderHi: "उदा. रमेश पाल"
      },
      {
        id: "witness_2_address",
        label: "Witness 2 Address",
        labelHi: "गवाह 2 का पता",
        sectionId: "review",
        required: true,
        inputType: "textarea",
        placeholder: "e.g., Sector 12, Noida, UP",
        placeholderHi: "उदा. सेक्टर 12, नोएडा, उत्तर प्रदेश"
      }
    ],
    recommendedFields: [
      { id: "owner_mobile", label: "Owner Mobile Number", labelHi: "मकान मालिक का मोबाइल नंबर", sectionId: "party_details", required: false, inputType: "text", placeholder: "e.g., 9876543210" },
      { id: "tenant_mobile", label: "Tenant Mobile Number", labelHi: "किरायेदार का मोबाइल नंबर", sectionId: "party_details", required: false, inputType: "text", placeholder: "e.g., 9123456789" },
      { id: "owner_aadhaar", label: "Owner Aadhaar Number", labelHi: "मकान मालिक का आधार नंबर", sectionId: "party_details", required: false, inputType: "text", placeholder: "e.g., 1234-5678-9012" },
      { id: "tenant_aadhaar", label: "Tenant Aadhaar Number", labelHi: "किरायेदार का आधार नंबर", sectionId: "party_details", required: false, inputType: "text", placeholder: "e.g., 9876-5432-1098" },
      { id: "maintenance_responsibility", label: "Maintenance Responsibility", labelHi: "रखरखाव की जिम्मेदारी", sectionId: "rent_deposit", required: false, inputType: "text", placeholder: "e.g., Tenant / Landlord" },
      { id: "electricity_responsibility", label: "Electricity Responsibility", labelHi: "बिजली भुगतान जिम्मेदारी", sectionId: "rent_deposit", required: false, inputType: "text", placeholder: "e.g., Tenant / किरायेदार" },
      { id: "water_responsibility", label: "Water Responsibility", labelHi: "पानी भुगतान जिम्मेदारी", sectionId: "rent_deposit", required: false, inputType: "text", placeholder: "e.g., Tenant / किरायेदार" },
      { id: "lock_in_period", label: "Lock-in Period (Months)", labelHi: "लॉक-इन अवधि (महीने)", sectionId: "agreement_terms", required: false, inputType: "number", placeholder: "e.g., 6" },
      { id: "rent_increment_terms", label: "Rent Increment Terms", labelHi: "किराया वृद्धि की शर्तें", sectionId: "rent_deposit", required: false, inputType: "text", placeholder: "e.g., 10% after 11 months" }
    ],
    optionalFields: [
      // Select fields for clauses (Section 5)
      {
        id: "parking_details",
        label: "Parking Space Allocated?",
        labelHi: "क्या पार्किंग स्थान आवंटित है?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "yes", label: "Yes - 1 Car / हाँ", labelHi: "हाँ" },
          { value: "no", label: "No Parking / नहीं", labelHi: "नहीं" }
        ]
      },
      {
        id: "pet_policy",
        label: "Are Pets Allowed?",
        labelHi: "क्या पालतू जानवरों की अनुमति है?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "allowed", label: "Allowed / अनुमति है", labelHi: "अनुमति है" },
          { value: "restricted", label: "Not Allowed / अनुमति नहीं है", labelHi: "अनुमति नहीं है" }
        ]
      },
      {
        id: "visitor_policy",
        label: "Visitor Restrictions?",
        labelHi: "अतिथियों के लिए कोई प्रतिबंध?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "none", label: "No Restrictions / कोई प्रतिबंध नहीं", labelHi: "कोई प्रतिबंध नहीं" },
          { value: "restricted", label: "No Overnight Stay without Consent / पूर्व सहमति आवश्यक", labelHi: "पूर्व सहमति आवश्यक" }
        ]
      },
      {
        id: "society_rules",
        label: "Society Rules Compliance Mandatory?",
        labelHi: "सोसाइटी नियमों का अनुपालन अनिवार्य?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "yes", label: "Yes / हाँ", labelHi: "हाँ" },
          { value: "no", label: "No / नहीं", labelHi: "नहीं" }
        ]
      },
      {
        id: "painting_responsibility",
        label: "Painting Cost Borne by?",
        labelHi: "पेंटिंग का खर्च कौन वहन करेगा?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "owner", label: "Owner / मकान मालिक", labelHi: "मकान मालिक" },
          { value: "tenant", label: "Tenant / किरायेदार", labelHi: "किरायेदार" }
        ]
      },
      {
        id: "inventory_details",
        label: "Inventory List Attached?",
        labelHi: "क्या सामान की सूची (Inventory) संलग्न है?",
        sectionId: "clauses",
        required: false,
        inputType: "select",
        options: [
          { value: "yes", label: "Yes / हाँ", labelHi: "हाँ" },
          { value: "no", label: "No / नहीं", labelHi: "नहीं" }
        ]
      }
    ],
    mandatoryClauses: [
      { id: "parties_clause", title: "Parties Identification Clause", titleHi: "पक्षकारों की पहचान खंड", type: "mandatory" },
      { id: "property_description_clause", title: "Property Description Clause", titleHi: "किराये की संपत्ति का विवरण खंड", type: "mandatory" },
      { id: "rent_clause", title: "Rent Covenant Clause", titleHi: "किराया भुगतान समझौता खंड", type: "mandatory" },
      { id: "security_deposit_clause", title: "Security Deposit Clause", titleHi: "सुरक्षा जमा राशि खंड", type: "mandatory" },
      { id: "duration_clause", title: "Duration of Lease Clause", titleHi: "पट्टे की अवधि (कार्यकाल) खंड", type: "mandatory" },
      { id: "termination_clause", title: "Notice Period & Termination Clause", titleHi: "नोटिस और समझौता समाप्ति खंड", type: "mandatory" },
      { id: "maintenance_clause", title: "Maintenance & Wear-and-Tear Clause", titleHi: "रखरखाव और मरम्मत खंड", type: "mandatory" },
      { id: "possession_clause", title: "Delivery of Possession Clause", titleHi: "कब्जा सौंपने का खंड", type: "mandatory" },
      { id: "default_clause", title: "Default & Non-payment Consequence Clause", titleHi: "किराया न देने पर कार्रवाई खंड", type: "mandatory" },
      { id: "jurisdiction_clause", title: "Jurisdiction & Dispute Clause", titleHi: "क्षेत्राधिकार एवं विवाद निवारण खंड", type: "mandatory" },
      { id: "signature_clause", title: "Signature of Parties Clause", titleHi: "हस्ताक्षर खंड", type: "mandatory" },
      { id: "witness_clause", title: "Witness Verification Clause", titleHi: "गवाहों के सत्यापन का खंड", type: "mandatory" }
    ],
    recommendedClauses: [
      { id: "police_verification_clause", title: "Police Verification Clause", titleHi: "पुलिस सत्यापन खंड", type: "recommended" },
      { id: "subletting_restriction_clause", title: "Subletting Restriction Clause", titleHi: "सबलेटिंग (किराये पर देना) निषेध खंड", type: "recommended" },
      { id: "damage_responsibility_clause", title: "Damage and Restoration Clause", titleHi: "क्षति और पुनर्स्थापन जिम्मेदारी खंड", type: "recommended" },
      { id: "electricity_water_clause", title: "Electricity & Water Bills Clause", titleHi: "बिजली और पानी के बिल का भुगतान खंड", type: "recommended" },
      { id: "parking_clause", title: "Parking Space Allocation Clause", titleHi: "पार्किंग स्थान आवंटन खंड", type: "recommended" },
      { id: "lock_in_clause", title: "Lock-in Period Penalty Clause", titleHi: "लॉक-इन अवधि और जुर्माना खंड", type: "recommended" },
      { id: "rent_increment_clause", title: "Rent Escalation & Increment Clause", titleHi: "किराया वृद्धि प्रतिशत खंड", type: "recommended" }
    ],
    optionalClauses: [
      { id: "pet_clause", title: "Pets Allowed Clause", titleHi: "पालतू जानवरों की अनुमति खंड", type: "optional" },
      { id: "visitor_clause", title: "Guests & Visitors Policy Clause", titleHi: "मेहमानों की नीति का खंड", type: "optional" },
      { id: "society_rules_clause", title: "Society Rules Compliance Clause", titleHi: "सोसाइटी नियमों के पालन का खंड", type: "optional" },
      { id: "inventory_clause", title: "Inventory & Fixtures Details Clause", titleHi: "फिटिंग और सामान सूची खंड", type: "optional" },
      { id: "painting_clause", title: "Painting Cost Allocation Clause", titleHi: "पेंटिंग लागत आवंटन खंड", type: "optional" }
    ],
    validationRules: [
      { id: "val_party_complete", ruleText: "Required party details (names, addresses, PANs) must be complete.", ruleTextHi: "आवश्यक पक्षकार विवरण (नाम, पते, पैन) पूर्ण होने चाहिए।" },
      { id: "val_names_distinct", ruleText: "Owner and Tenant names must not be identical.", ruleTextHi: "मकान मालिक और किरायेदार का नाम एक समान नहीं होना चाहिए।" },
      { id: "val_rent_positive", ruleText: "Monthly rent must be a positive numeric value greater than zero.", ruleTextHi: "मासिक किराया शून्य से अधिक होना चाहिए।" },
      { id: "val_deposit_positive", ruleText: "Security deposit must be zero or a positive numeric value.", ruleTextHi: "सुरक्षा जमा शून्य या अधिक होना चाहिए।" },
      { id: "val_start_date", ruleText: "Agreement start date must be a valid calendar date in the present or future.", ruleTextHi: "प्रारंभ तिथि वैध होनी चाहिए।" },
      { id: "val_duration_months", ruleText: "Agreement duration must be specified in months (standard is 11).", ruleTextHi: "अवधि महीनों में होनी चाहिए (आमतौर पर 11 महीने)।" },
      { id: "val_jurisdiction", ruleText: "Jurisdiction city must be declared for resolving legal disputes.", ruleTextHi: "कानूनी क्षेत्राधिकार शहर घोषित होना चाहिए।" },
      { id: "val_witnesses", ruleText: "Witness details must be complete before final document export.", ruleTextHi: "दस्तावेज़ निर्यात करने से पहले गवाहों का विवरण आवश्यक है।" },
      { id: "val_numbers_to_words", ruleText: "Amount fields must support both numeric values and writing in words.", ruleTextHi: "राशि के आंकड़े और शब्द दोनों प्रारूपों का समर्थन आवश्यक है।" },
      { id: "val_lang_selected", ruleText: "Draft output language must be explicitly selected before intake form.", ruleTextHi: "मसौदा भाषा का चयन इनटेक विज़ार्ड शुरू करने से पहले आवश्यक है।" }
    ],
    reviewChecklist: [
      { id: "chk_owner_id", checkText: "Verify owner identity details against PAN or Aadhaar card.", checkTextHi: "पैन या आधार के साथ मकान मालिक के विवरण का मिलान करें।" },
      { id: "chk_tenant_id", checkText: "Verify tenant identity details against official ID cards.", checkTextHi: "किरायेदार के आधिकारिक आईडी कार्ड के साथ मिलान करें।" },
      { id: "chk_property_address", checkText: "Verify property address matches electricity bill or registry title deed.", checkTextHi: "बिजली के बिल या रजिस्ट्री विलेख के साथ संपत्ति के पते का मिलान करें।" },
      { id: "chk_rent_value", checkText: "Verify monthly rent amount and payment day are accurate.", checkTextHi: "मासिक किराया और भुगतान देय तिथि का मिलान करें।" },
      { id: "chk_deposit_value", checkText: "Verify security deposit amount matches actual deposit received.", checkTextHi: "जमा कराई गई वास्तविक सुरक्षा जमा राशि के साथ मिलान करें।" },
      { id: "chk_duration", checkText: "Verify agreement duration period (e.g. 11 months).", checkTextHi: "समझौते की अवधि (जैसे 11 महीने) का मिलान करें।" },
      { id: "chk_notice", checkText: "Verify notice period duration matches agreement terms.", checkTextHi: "नोटिस अवधि का मिलान करें।" },
      { id: "chk_witness_details", checkText: "Verify both witnesses have full names and addresses recorded.", checkTextHi: "सुनिश्चित करें कि दोनों गवाहों के नाम और पते दर्ज हैं।" },
      { id: "chk_custom_clauses", checkText: "Review any custom clauses appended before final drafting.", checkTextHi: "अंतिम रूप देने से पहले अतिरिक्त शर्तों की समीक्षा करें।" },
      { id: "chk_stamp_duty", checkText: "Manually confirm stamp paper values and registration rules for Uttar Pradesh.", checkTextHi: "उत्तर प्रदेश के लिए आवश्यक स्टांप शुल्क और पंजीकरण नियमों की स्वयं जांच करें।" }
    ]
  }
};

export const getDraftBlueprint = (draftId: string): DraftBlueprint | undefined => {
  return DRAFT_BLUEPRINTS[draftId];
};
