export type Category = 
  | "agreements" 
  | "legal_notices" 
  | "family" 
  | "criminal" 
  | "civil"
  | "affidavits"
  | "lower_court"
  | "high_court"
  | "bail_criminal";

export type Difficulty = "easy" | "medium" | "hard";
export type DraftStatus = "available" | "coming_soon";

export interface DraftCatalogItem {
  id: string;
  title: string;
  titleHi: string;
  category: Category;
  description: string;
  descriptionHi: string;
  supportedStates: string[];
  supportedLanguages: string[];
  estimatedTimeMinutes: number;
  difficulty: Difficulty;
  status: DraftStatus;
}

export const DRAFT_CATALOG: DraftCatalogItem[] = [
  // Agreements (Available)
  {
    id: "rent_agreement",
    title: "Rent Agreement",
    titleHi: "किराया समझौता पत्र",
    category: "agreements",
    description: "Standard residential lease agreement outlining terms between landlord and tenant.",
    descriptionHi: "मकान मालिक और किरायेदार के बीच शर्तों को रेखांकित करने वाला आवासीय पट्टा समझौता।",
    supportedStates: ["Uttar Pradesh", "Delhi"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "easy",
    status: "available"
  },
  {
    id: "leave_license",
    title: "Leave and License Agreement",
    titleHi: "छुट्टी और लाइसेंस समझौता",
    category: "agreements",
    description: "Licensing agreement for temporary occupation of commercial or residential premises.",
    descriptionHi: "व्यावसायिक या आवासीय परिसर पर अस्थायी कब्जे के लिए लाइसेंस समझौता।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "sale_agreement",
    title: "Sale Agreement",
    titleHi: "बिक्री का इकरारनामा",
    category: "agreements",
    description: "Agreement to sell immovable property detailing token money and final registration terms.",
    descriptionHi: "बयाना राशि और पंजीकरण की शर्तों का विवरण देने वाला अचल संपत्ति बिक्री समझौता।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 25,
    difficulty: "hard",
    status: "available"
  },
  {
    id: "partnership_agreement",
    title: "Partnership Agreement",
    titleHi: "साझेदारी विलेख (Partnership Deed)",
    category: "agreements",
    description: "Deed creating a business partnership detailing profit sharing and operations.",
    descriptionHi: "लाभ साझाकरण और संचालन का विवरण देने वाला व्यावसायिक साझेदारी विलेख।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 30,
    difficulty: "hard",
    status: "available"
  },
  {
    id: "loan_agreement",
    title: "Loan Agreement",
    titleHi: "ऋण समझौता पत्र",
    category: "agreements",
    description: "Personal or commercial lender contract detailing interest rates and repayment schedule.",
    descriptionHi: "बयाज दरों और पुनर्भुगतान अनुसूची का विवरण देने वाला व्यक्तिगत या व्यावसायिक ऋण समझौता।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "nda_agreement",
    title: "Non-Disclosure Agreement (NDA)",
    titleHi: "गैर-प्रकटीकरण समझौता (NDA)",
    category: "agreements",
    description: "Confidentiality agreement protecting proprietary information and business secrets.",
    descriptionHi: "मालिकाना जानकारी और व्यावसायिक रहस्यों की रक्षा करने वाला गोपनीयता समझौता।",
    supportedStates: ["Uttar Pradesh", "Delhi"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "available"
  },

  // Legal Notices (Available)
  {
    id: "general_notice",
    title: "General Legal Notice",
    titleHi: "सामान्य कानूनी नोटिस",
    category: "legal_notices",
    description: "Formal legal notice to initiate disputes or demand specific actions prior to lawsuit.",
    descriptionHi: "मुकदमे से पहले विवादों को शुरू करने या विशिष्ट कार्रवाई की मांग करने वाला औपचारिक कानूनी नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "cheque_bounce_notice",
    title: "Cheque Bounce Notice",
    titleHi: "चेक बाउंस नोटिस",
    category: "legal_notices",
    description: "Statutory notice under Section 138 of Negotiable Instruments Act demanding payment.",
    descriptionHi: "एनआई अधिनियम की धारा 138 के तहत भुगतान की मांग करने वाला वैधानिक नोटिस।",
    supportedStates: ["Uttar Pradesh", "Delhi"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "available"
  },
  {
    id: "recovery_notice",
    title: "Recovery Notice",
    titleHi: "धन वसूली नोटिस",
    category: "legal_notices",
    description: "Demand notice for outstanding dues, unpaid salary, or business debts.",
    descriptionHi: "बकाया राशि, भुगतान न किए गए वेतन, या व्यावसायिक ऋण के लिए मांग नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "eviction_notice",
    title: "Eviction Notice",
    titleHi: "बेदखली का नोटिस",
    category: "legal_notices",
    description: "Notice sent to tenant to vacate premises due to lease expiry or rent default.",
    descriptionHi: "पट्टा समाप्ति या किराया चूक के कारण किरायेदार को परिसर खाली करने के लिए भेजा गया नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 18,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "breach_contract_notice",
    title: "Breach of Contract Notice",
    titleHi: "अनुबंध उल्लंघन का नोटिस",
    category: "legal_notices",
    description: "Notice to defaulting party outlining specific contract breaches and remedy timeline.",
    descriptionHi: "डिफ़ॉल्ट करने वाले पक्ष को विशिष्ट अनुबंध उल्लंघन और उपाय समयरेखा की रूपरेखा का नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 20,
    difficulty: "hard",
    status: "available"
  },
  {
    id: "consumer_notice",
    title: "Consumer Notice",
    titleHi: "उपभोक्ता शिकायत नोटिस",
    category: "legal_notices",
    description: "Notice served to service provider or seller prior to filing in Consumer Forum.",
    descriptionHi: "उपभोक्ता फोरम में फाइल करने से पहले सेवा प्रदाता या विक्रेता को दिया जाने वाला नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "available"
  },

  // Family Law (Available)
  {
    id: "mutual_divorce",
    title: "Mutual Divorce Petition",
    titleHi: "आपसी सहमति से तलाक की याचिका",
    category: "family",
    description: "Joint petition for dissolution of marriage under Hindu Marriage Act Section 13B.",
    descriptionHi: "हिंदू विवाह अधिनियम की धारा 13B के तहत विवाह विच्छेद के लिए संयुक्त याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 30,
    difficulty: "hard",
    status: "available"
  },
  {
    id: "maintenance_petition",
    title: "Maintenance Petition",
    titleHi: "भरण-पोषण की याचिका",
    category: "family",
    description: "Petition for maintenance under Section 125 of CrPC / Section 144 of BNSS.",
    descriptionHi: "सीआरपीसी की धारा 125 / बीएनएसएस की धारा 144 के तहत गुजारा भत्ता की याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 25,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "child_custody",
    title: "Child Custody Petition",
    titleHi: "बच्चे की कस्टडी के लिए याचिका",
    category: "family",
    description: "Petition seeking visitation rights and legal guardianship under Guardian & Wards Act.",
    descriptionHi: "गार्जियन एंड वार्ड्स एक्ट के तहत मुलाकात के अधिकार और कानूनी अभिभावक अधिकार की मांग करने वाली याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 28,
    difficulty: "hard",
    status: "available"
  },

  // Criminal Law (Available)
  {
    id: "bail_application",
    title: "Bail Application",
    titleHi: "जमानत के लिए प्रार्थना पत्र",
    category: "criminal",
    description: "Regular bail application before Magistrate or Sessions court under CrPC Sec 437/439.",
    descriptionHi: "मजिस्ट्रेट या सत्र न्यायालय के समक्ष नियमित जमानत आवेदन पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "available"
  },
  {
    id: "anticipatory_bail",
    title: "Anticipatory Bail Application",
    titleHi: "अग्रिम जमानत का प्रार्थना पत्र",
    category: "criminal",
    description: "Application for pre-arrest bail under Section 438 of CrPC / Section 482 of BNSS.",
    descriptionHi: "गिरफ्तारी पूर्व जमानत के लिए सत्र न्यायालय या उच्च न्यायालय के समक्ष आवेदन पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 25,
    difficulty: "hard",
    status: "available"
  },
  {
    id: "criminal_complaint",
    title: "Criminal Complaint",
    titleHi: "आपराधिक शिकायत (Complaint)",
    category: "criminal",
    description: "Private complaint before Magistrate under Section 200 of CrPC.",
    descriptionHi: "मजिस्ट्रेट के समक्ष सीआरपीसी की धारा 200 के तहत निजी आपराधिक शिकायत।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "available"
  },

  // Civil Law (Available)
  {
    id: "affidavit",
    title: "Affidavit",
    titleHi: "शपथ पत्र",
    category: "civil",
    description: "Standard solemn declaration of facts sworn before oath commissioner or notary public.",
    descriptionHi: "ओथ कमिश्नर या नोटरी के समक्ष ली जाने वाली तथ्यों की घोषणा।",
    supportedStates: ["Uttar Pradesh", "Delhi"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "available"
  },
  {
    id: "power_of_attorney",
    title: "General Power of Attorney",
    titleHi: "सामान्य मुख्तारनामा (GPA)",
    category: "civil",
    description: "Legal document authorizing an agent to manage business, property, and legal affairs.",
    descriptionHi: "एजेंट को व्यवसाय, संपत्ति और कानूनी मामलों का प्रबंधन करने के लिए अधिकृत करने वाला कानूनी दस्तावेज।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 25,
    difficulty: "medium",
    status: "available"
  },

  // 1. Affidavits (Coming Soon Expansion)
  {
    id: "noc_affidavit",
    title: "NOC Affidavit",
    titleHi: "अनापत्ति शपथ पत्र (NOC)",
    category: "affidavits",
    description: "Declaration expressing no objection for specific property, business, or administrative transfers.",
    descriptionHi: "विशिष्ट संपत्ति, व्यवसाय या प्रशासनिक हस्तांतरण के लिए अनापत्ति व्यक्त करने वाला घोषणा पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "gap_certificate_affidavit",
    title: "Gap Certificate Affidavit",
    titleHi: "अंतराल प्रमाण पत्र शपथ पत्र (Gap Certificate)",
    category: "affidavits",
    description: "Affidavit detailing reason for educational or professional gap period.",
    descriptionHi: "शैक्षणिक या व्यावसायिक अंतराल अवधि का कारण बताने वाला शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "two_name_affidavit",
    title: "Two Name Affidavit",
    titleHi: "दो नाम होने का शपथ पत्र",
    category: "affidavits",
    description: "Solemn affirmation verifying that two different names belong to the same individual.",
    descriptionHi: "यह सत्यापित करने वाला शपथ पत्र कि दो अलग-अलग नाम एक ही व्यक्ति के हैं।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "name_correction_affidavit",
    title: "Name Correction Affidavit",
    titleHi: "नाम सुधार शपथ पत्र",
    category: "affidavits",
    description: "Formal declaration for correcting spelling or surname in official documents.",
    descriptionHi: "आधिकारिक दस्तावेजों में वर्तनी या उपनाम को सही करने की औपचारिक घोषणा।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "declaration_affidavit",
    title: "Declaration Affidavit",
    titleHi: "घोषणा शपथ पत्र",
    category: "affidavits",
    description: "General declaration under oath stating specific facts or statements.",
    descriptionHi: "शपथ के तहत विशिष्ट तथ्यों या बयानों को बताने वाली सामान्य घोषणा।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "pension_affidavit",
    title: "Pension Affidavit",
    titleHi: "पेंशन शपथ पत्र",
    category: "affidavits",
    description: "Affidavit submitted for retirement pension release or claims.",
    descriptionHi: "सेवानिवृत्ति पेंशन जारी करने या दावों के लिए प्रस्तुत किया जाने वाला शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "supplementary_affidavit",
    title: "Supplementary Affidavit",
    titleHi: "पूरक शपथ पत्र",
    category: "affidavits",
    description: "Additional affidavit placing new or secondary facts on court record.",
    descriptionHi: "अदालती रिकॉर्ड पर नए या द्वितीयक तथ्यों को रखने वाला अतिरिक्त शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "short_counter_affidavit",
    title: "Short Counter Affidavit",
    titleHi: "लघु प्रति-शपथ पत्र",
    category: "affidavits",
    description: "Brief reply affidavit contesting facts alleged by opposite party.",
    descriptionHi: "विपक्षी दल द्वारा लगाए गए तथ्यों का विरोध करने वाला संक्षिप्त उत्तर शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "evidence_affidavit",
    title: "Evidence Affidavit",
    titleHi: "साक्ष्य का शपथ पत्र (Evidence)",
    category: "affidavits",
    description: "Affidavit of witness containing examination-in-chief deposition details.",
    descriptionHi: "मुख्य गवाह के बयानों को शामिल करने वाला साक्ष्य शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "surety_affidavit",
    title: "Surety Affidavit",
    titleHi: "जमानतदार का हलफनामा",
    category: "affidavits",
    description: "Affidavit affirming financial standing and identification of a bail surety.",
    descriptionHi: "जमानतदार की वित्तीय स्थिति और पहचान की पुष्टि करने वाला शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },

  // 2. Lower Court Applications (Coming Soon Expansion)
  {
    id: "haziri_mafi_application",
    title: "Appearance Exemption Application (Haziri Mafi)",
    titleHi: "हाजिरी माफी आवेदन (Haziri Mafi)",
    category: "lower_court",
    description: "Application seeking exemption from personal appearance of accused or litigant for a single date.",
    descriptionHi: "आरोपी या मुकदमेबाज की एक तारीख के लिए व्यक्तिगत उपस्थिति से छूट की मांग करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "adjournment_application",
    title: "Adjournment Application",
    titleHi: "स्थगन हेतु प्रार्थना पत्र",
    category: "lower_court",
    description: "Application requesting next hearing date due to unavoidable circumstances.",
    descriptionHi: "अपरिहार्य परिस्थितियों के कारण अगली सुनवाई तिथि का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "exemption_application",
    title: "Exemption Application",
    titleHi: "व्यक्तिगत पेशी से छूट का आवेदन",
    category: "lower_court",
    description: "Application requesting permanent or long-term exemption from personal court appearance.",
    descriptionHi: "अदालत में व्यक्तिगत उपस्थिति से स्थायी या दीर्घकालिक छूट का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "discharge_application",
    title: "Discharge Application",
    titleHi: "डिस्चार्ज (उन्मोचन) प्रार्थना पत्र",
    category: "lower_court",
    description: "Application seeking discharge of the accused when accusations lack material evidence.",
    descriptionHi: "आरोपों में पर्याप्त सबूत न होने पर आरोपी को बरी (डिस्चार्ज) करने की मांग करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "early_disposal_application",
    title: "Early Disposal Application",
    titleHi: "त्वरित निस्तारण हेतु प्रार्थना पत्र",
    category: "lower_court",
    description: "Application requesting expedited trial or case resolution due to urgency.",
    descriptionHi: "शीघ्र सुनवाई या त्वरित मामला निस्तारण का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "order_compliance_application",
    title: "Order Compliance Application",
    titleHi: "आदेश अनुपालन प्रार्थना पत्र",
    category: "lower_court",
    description: "Application stating compliance or requesting execution of a specific court order.",
    descriptionHi: "विशिष्ट अदालती आदेश के अनुपालन या निष्पादन का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "undertaking",
    title: "Undertaking",
    titleHi: "वचन पत्र (Undertaking)",
    category: "lower_court",
    description: "Solemn written commitment submitted to court agreeing to specific performance or terms.",
    descriptionHi: "विशिष्ट शर्तों या कार्य के पालन के लिए अदालत में प्रस्तुत किया जाने वाला वचन पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "list_of_documents",
    title: "List of Documents",
    titleHi: "दस्तावेजों की सूची (List of Documents)",
    category: "lower_court",
    description: "Form containing details of documents and evidence being placed on record.",
    descriptionHi: "अदालती रिकॉर्ड पर रखे जा रहे दस्तावेजों और साक्ष्यों का विवरण देने वाली सूची।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "witness_list",
    title: "Witness List",
    titleHi: "गवाहों की सूची",
    category: "lower_court",
    description: "List of names of witnesses proposed to be examined during trial.",
    descriptionHi: "मुकदमे के दौरान गवाही देने के लिए प्रस्तावित गवाहों के नामों की सूची।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "summon_witness_application",
    title: "Application for Summoning Witness",
    titleHi: "गवाहों को समन भेजने का आवेदन",
    category: "lower_court",
    description: "Application requesting court to summon material witnesses or public records.",
    descriptionHi: "महत्वपूर्ण गवाहों या सार्वजनिक रिकॉर्ड को अदालत में समन करने का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },

  // 3. High Court Drafts (Coming Soon Expansion)
  {
    id: "mention_slip",
    title: "Mention Slip",
    titleHi: "मेंशन स्लिप (Urgent Listing)",
    category: "high_court",
    description: "Urgent slip submitted to court for quick listing of case before Bench.",
    descriptionHi: "पीठ के समक्ष मामले की त्वरित सुनवाई के लिए प्रस्तुत की जाने वाली मेंशन स्लिप।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "vakalatnama_record_application",
    title: "Vakalatnama Taken on Record Application",
    titleHi: "वकालतनामा रिकॉर्ड पर लेने हेतु आवेदन",
    category: "high_court",
    description: "Application to accept and file advocate authorization memorandum on record.",
    descriptionHi: "वकालतनामा पत्र को रिकॉर्ड में स्वीकार और दाखिल करने का आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "coming_soon"
  },
  {
    id: "listing_application",
    title: "Listing Application",
    titleHi: "सूचीबद्ध करने का प्रार्थना पत्र",
    category: "high_court",
    description: "Application requesting registry to list case for admission or final hearing.",
    descriptionHi: "मामले को सुनवाई या प्रवेश के लिए सूचीबद्ध करने का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "written_submission",
    title: "Written Submission",
    titleHi: "लिखित बहस (Written Arguments)",
    category: "high_court",
    description: "Detailed synopsis of arguments, facts, and legal citations submitted prior to judgment.",
    descriptionHi: "फैसले से पहले प्रस्तुत की जाने वाली लिखित दलीलों और कानूनी उद्धरणों का विस्तृत विवरण।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 30,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "short_argument_note",
    title: "Short Argument Note",
    titleHi: "बहस नोट (Synopsis)",
    category: "high_court",
    description: "Concise summary of pleading points and key propositions for the court's reference.",
    descriptionHi: "अदालत के संदर्भ के लिए मुख्य दलीलों और कानूनी तर्कों का संक्षिप्त सारांश।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "writ_petition_226",
    title: "Writ Petition under Article 226",
    titleHi: "अनुच्छेद 226 के तहत रिट याचिका",
    category: "high_court",
    description: "Constitutional petition before High Court for enforcement of fundamental or other legal rights.",
    descriptionHi: "मौलिक या कानूनी अधिकारों के प्रवर्तन के लिए उच्च न्यायालय के समक्ष दायर संवैधानिक याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 40,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "writ_petition_227",
    title: "Writ Petition under Article 227",
    titleHi: "अनुच्छेद 227 के तहत रिट याचिका",
    category: "high_court",
    description: "Petition before High Court seeking supervisory jurisdiction over subordinate courts or tribunals.",
    descriptionHi: "अधीनस्थ अदालतों या न्यायाधिकरणों पर पर्यवेक्षी अधिकार क्षेत्र की मांग करने वाली याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 35,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "criminal_misc_writ",
    title: "Criminal Miscellaneous Writ Petition",
    titleHi: "आपराधिक विविध रिट याचिका",
    category: "high_court",
    description: "Constitutional writ petition for quashing FIR or seeking protection from arrest.",
    descriptionHi: "एफआईआर रद्द करने या गिरफ्तारी से सुरक्षा की मांग करने वाली उच्च न्यायालय के समक्ष रिट याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 35,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "stay_application",
    title: "Stay Application",
    titleHi: "स्थगन आदेश का प्रार्थना पत्र (Stay)",
    category: "high_court",
    description: "Application requesting temporary stay on execution of impugned decree or action.",
    descriptionHi: "विवादित आदेश या कार्रवाई के निष्पादन पर अस्थायी रोक (स्थगन) लगाने की मांग करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "delay_condonation_application",
    title: "Delay Condonation Application",
    titleHi: "देरी की माफी के लिए प्रार्थना पत्र",
    category: "high_court",
    description: "Application under Section 5 of Limitation Act to condone delayed filing of petition or appeal.",
    descriptionHi: "अपील या याचिका दायर करने में हुई देरी की माफी के लिए सीमा अधिनियम की धारा 5 के तहत आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },

  // 4. Bail & Criminal Applications (Coming Soon Expansion)
  {
    id: "regular_bail_application",
    title: "Regular Bail Application",
    titleHi: "नियमित जमानत के लिए प्रार्थना पत्र",
    category: "bail_criminal",
    description: "Bail application seeking release of accused currently in judicial or police custody.",
    descriptionHi: "न्यायिक या पुलिस हिरासत में बंद आरोपी की रिहाई की मांग करने वाला नियमित जमानत आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "sessions_bail_application",
    title: "Sessions Bail Application",
    titleHi: "सत्र न्यायालय के समक्ष जमानत आवेदन",
    category: "bail_criminal",
    description: "Bail application filed before the Court of Sessions under applicable criminal codes.",
    descriptionHi: "सत्र न्यायालय (Court of Sessions) के समक्ष दायर की जाने वाली जमानत याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "anticipatory_bail_application",
    title: "Anticipatory Bail Application",
    titleHi: "अग्रिम जमानत का प्रार्थना पत्र",
    category: "bail_criminal",
    description: "Bail application seeking pre-arrest protection under Section 438 CrPC / Section 482 BNSS.",
    descriptionHi: "गिरफ्तारी पूर्व सुरक्षा की मांग करने वाली अग्रिम जमानत याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 25,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "surety_application",
    title: "Surety Application",
    titleHi: "जमानतदार का आवेदन (Surety)",
    category: "bail_criminal",
    description: "Application requesting court to accept bail bonds and release the accused.",
    descriptionHi: "अदालत से जमानत बांड स्वीकार करने और आरोपी को रिहा करने का अनुरोध करने वाला आवेदन।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "criminal_revision",
    title: "Criminal Revision",
    titleHi: "आपराधिक पुनरीक्षण याचिका (Revision)",
    category: "bail_criminal",
    description: "Revision petition challenging correctness, legality, or propriety of a lower court order.",
    descriptionHi: "निचली अदालत के आदेश की सत्यता, वैधता या शुद्धता को चुनौती देने वाली पुनरीक्षण याचिका।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 30,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "appeal_sessions_order",
    title: "Appeal Against Sessions Court Order",
    titleHi: "सत्र न्यायालय के आदेश के खिलाफ अपील",
    category: "bail_criminal",
    description: "Criminal appeal challenging conviction or order passed by Court of Sessions.",
    descriptionHi: "सत्र न्यायालय द्वारा पारित दोषसिद्धि या आदेश को चुनौती देने वाली आपराधिक अपील।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 30,
    difficulty: "hard",
    status: "coming_soon"
  },
  {
    id: "consumer_complaint",
    title: "Consumer Complaint",
    titleHi: "उपभोक्ता शिकायत (Complaint)",
    category: "lower_court",
    description: "Main consumer dispute complaint to file before the District Forum.",
    descriptionHi: "जिला फोरम के समक्ष दायर की जाने वाली मुख्य उपभोक्ता शिकायत।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "consumer_reply",
    title: "Reply to Consumer Complaint",
    titleHi: "उपभोक्ता शिकायत का जवाब",
    category: "lower_court",
    description: "Written version reply representing service vendor in consumer dispute.",
    descriptionHi: "उपभोक्ता विवाद में सेवा प्रदाता का प्रतिनिधित्व करने वाला जवाब।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "family_reply",
    title: "Reply to Family Petition",
    titleHi: "पारिवारिक याचिका का जवाब",
    category: "family",
    description: "Written response to divorce or restitution of conjugal rights petitions.",
    descriptionHi: "तलाक या वैवाहिक अधिकारों की बहाली की याचिकाओं का लिखित उत्तर।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "coming_soon"
  },
  {
    id: "settlement_terms",
    title: "Family Settlement Terms",
    titleHi: "पारिवारिक समझौता शर्तें (Settlement Deed)",
    category: "family",
    description: "Mutual settlement terms resolving alimony, child custody, and properties.",
    descriptionHi: "गुजारा भत्ता, बच्चे की कस्टडी और संपत्तियों को हल करने वाली आपसी समझौते की शर्तें।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 25,
    difficulty: "medium",
    status: "coming_soon"
  }
];

/**
 * runCatalogConsistencyChecks validates data integrity rules on the expanded catalog.
 */
export function runCatalogConsistencyChecks(): {
  isValid: boolean;
  totalItems: number;
  availableCount: number;
  comingSoonCount: number;
  duplicateIds: string[];
  errors: string[];
} {
  const duplicateIds: string[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  const categories = new Set([
    "agreements", "legal_notices", "family", "criminal", "civil",
    "affidavits", "lower_court", "high_court", "bail_criminal"
  ]);

  let availableCount = 0;
  let comingSoonCount = 0;

  DRAFT_CATALOG.forEach((item) => {
    // 1. Check duplicate IDs
    if (seenIds.has(item.id)) {
      duplicateIds.push(item.id);
      errors.push(`Duplicate ID found: ${item.id}`);
    }
    seenIds.add(item.id);

    // 2. Check valid category
    if (!categories.has(item.category)) {
      errors.push(`Item ${item.id} has invalid category: ${item.category}`);
    }

    // 3. Check English and Hindi title
    if (!item.title.trim()) {
      errors.push(`Item ${item.id} lacks English title`);
    }
    if (!item.titleHi.trim()) {
      errors.push(`Item ${item.id} lacks Hindi title`);
    }

    // 4. Check valid status
    if (item.status === "available") {
      availableCount++;
    } else if (item.status === "coming_soon") {
      comingSoonCount++;
    } else {
      errors.push(`Item ${item.id} has invalid status: ${item.status}`);
    }
  });

  return {
    isValid: errors.length === 0,
    totalItems: DRAFT_CATALOG.length,
    availableCount,
    comingSoonCount,
    duplicateIds,
    errors
  };
}
