"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage } from "../../../../../lib/storage";
import { getTranslation, Language } from "../../../../../lib/i18n";
import { 
  getActiveCase, 
  saveActiveCaseDraftContext, 
  saveCaseDraftLink, 
  CaseRecord 
} from "../../../../../lib/case-storage";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../../lib/draft-catalog";
import AppHeader from "../../../../../components/app-header";
import CategoryFilter from "../../../../../components/category-filter";
import DraftCard from "../../../../../components/draft-card";
import { ArrowLeft, Search, Sparkles, FileText, Scale, User, ShieldAlert } from "lucide-react";

export default function NewCaseDraftSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<"en" | "hi">("en");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setCaseRecord(getActiveCase(caseId));
    setIsClient(true);
  }, [caseId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleDraftSelect = (item: DraftCatalogItem) => {
    if (!caseRecord) return;

    // Backward compatibility logic mapping for legacy Level 15 cases
    const partyA = caseRecord.partyA || {
      name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.partyName || "",
      legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.legalRole || ""
    };
    const partyB = caseRecord.partyB || {
      name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.partyName || "",
      legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.legalRole || ""
    };
    const oppositeParty = caseRecord.clientParty === "partyA" ? partyB : partyA;

    // 1. Save Active Case Draft Context
    saveActiveCaseDraftContext({
      caseId: caseRecord.id,
      draftId: item.id,
      caseTitle: caseRecord.caseTitle,
      caseType: caseRecord.caseType,
      clientName: caseRecord.clientName,
      clientRole: caseRecord.clientRole,
      oppositePartyName: oppositeParty.name,
      oppositePartyRole: oppositeParty.legalRole,
      courtType: caseRecord.courtType,
      courtName: caseRecord.courtName,
      caseNumber: caseRecord.caseNumber,
      cnrNumber: caseRecord.cnrNumber,
      firNumber: caseRecord.firNumber,
      policeStation: caseRecord.policeStation,
      sections: caseRecord.sections,
      stage: caseRecord.stage,
      previousDate: caseRecord.previousDate,
      nextDate: caseRecord.nextDate,
      remarks: caseRecord.remarks,
      nextAction: caseRecord.nextAction,
      createdAt: new Date().toISOString()
    });

    // 2. Save Case-Draft Link with 'started' status
    saveCaseDraftLink({
      caseId: caseRecord.id,
      draftId: item.id,
      draftTitle: item.title,
      status: "started"
    });

    // 3. Set draft output language preference
    if (typeof window !== "undefined") {
      localStorage.setItem("delegatlabs_draft_language", draftLang);
    }

    // 4. Navigate to Draft Plan page with case context
    router.push(`/drafts/${item.id}/plan?caseId=${caseId}`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  if (!caseRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-10 w-10 text-slate-400" />
        <p className="text-slate-600 font-semibold">
          {lang === "hi" ? "मामला नहीं मिला।" : "Case record not found."}
        </p>
        <button
          onClick={() => router.push("/cases")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Backward compatibility logic mapping for legacy Level 15 cases
  const partyA = caseRecord.partyA || {
    name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.partyName || "",
    legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.legalRole || ""
  };
  const partyB = caseRecord.partyB || {
    name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.partyName || "",
    legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.legalRole || ""
  };
  const oppositeParty = caseRecord.clientParty === "partyA" ? partyB : partyA;

  // Filter Catalog
  const filteredCatalog = DRAFT_CATALOG.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.titleHi.includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.descriptionHi.includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => router.push(`/cases/${caseId}`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "पीछे जाएं" : "Back to Case Details"}</span>
        </button>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {lang === "hi" ? "इस मामले से नया मसौदा बनाएं" : "Create Draft From Case"}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "hi" ? "मामले के संदर्भ का उपयोग करके कानूनी मसौदा शुरू करें।" : "Select a template below to draft using case context details."}
          </p>
        </div>

        {/* Case Summary Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <Scale className="h-4 w-4 text-slate-400" />
            <span>{lang === "hi" ? "संबद्ध मामला सारांश" : "Connected Case Summary"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Case Title</span>
              <span className="block text-slate-800 font-bold mt-0.5">{caseRecord.caseTitle}</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Our Client</span>
              <span className="block text-slate-800 font-bold mt-0.5">{caseRecord.clientName} ({caseRecord.clientRole})</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Opposite Party</span>
              <span className="block text-slate-800 font-bold mt-0.5">{oppositeParty.name} ({oppositeParty.legalRole})</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Court & Forum</span>
              <span className="block text-slate-800 mt-0.5">{caseRecord.courtName} ({caseRecord.courtType})</span>
            </div>
          </div>
        </div>

        {/* Draft Language selection */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-slate-700" />
              <span>{t.draft_language_selection}</span>
            </h2>
            <p className="text-xs text-slate-500">{t.draft_lang_desc}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setDraftLang("en")}
              className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                draftLang === "en"
                  ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDraftLang("hi")}
              className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                draftLang === "hi"
                  ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Search & Category Filter Section */}
        <div className="space-y-4 pt-4 border-t border-slate-250">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {lang === "hi" ? "इस मामले के लिए एक मसौदा चुनें" : "Choose a draft for this case"}
          </h2>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-auto flex-grow max-w-xl">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                currentLang={lang}
              />
            </div>

            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 text-xs font-semibold text-slate-700 bg-white"
              />
            </div>
          </div>

          {/* Catalog grid */}
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-400 flex flex-col items-center justify-center space-y-3">
              <FileText className="h-8 w-8 text-slate-300" />
              <span className="text-xs font-medium">No templates matched search / filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCatalog.map((item) => (
                <DraftCard
                  key={item.id}
                  item={item}
                  currentLang={lang}
                  onSelect={() => handleDraftSelect(item)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
