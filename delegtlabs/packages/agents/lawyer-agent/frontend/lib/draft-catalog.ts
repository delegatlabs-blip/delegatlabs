export type Category = "agreements" | "legal_notices" | "affidavits";
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
  {
    id: "rent_agreement",
    title: "Rent Agreement",
    titleHi: "किराया समझौता पत्र",
    category: "agreements",
    description: "Standard residential lease agreement between landlord and tenant.",
    descriptionHi: "मकान मालिक और किरायेदार के बीच आवासीय पट्टा समझौता।",
    supportedStates: ["Uttar Pradesh", "Delhi"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 15,
    difficulty: "easy",
    status: "available",
  },
  {
    id: "leave_license",
    title: "Leave and License Agreement",
    titleHi: "छुट्टी और लाइसेंस समझौता",
    category: "agreements",
    description: "Licensing agreement for temporary occupation of premises.",
    descriptionHi: "परिसर पर अस्थायी कब्जे के लिए लाइसेंस समझौता।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en"],
    estimatedTimeMinutes: 20,
    difficulty: "medium",
    status: "available",
  },
  {
    id: "legal_notice",
    title: "Legal Notice",
    titleHi: "विधिक नोटिस",
    category: "legal_notices",
    description: "Formal legal notice demanding action or remedy.",
    descriptionHi: "कार्रवाई या उपचार की मांग करने वाला औपचारिक विधिक नोटिस।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 12,
    difficulty: "easy",
    status: "available",
  },
  {
    id: "affidavit_general",
    title: "General Affidavit",
    titleHi: "सामान्य शपथ पत्र",
    category: "affidavits",
    description: "General-purpose affidavit for court or administrative use.",
    descriptionHi: "न्यायालय या प्रशासनिक उपयोग के लिए सामान्य शपथ पत्र।",
    supportedStates: ["Uttar Pradesh"],
    supportedLanguages: ["en", "hi"],
    estimatedTimeMinutes: 10,
    difficulty: "easy",
    status: "coming_soon",
  },
];
