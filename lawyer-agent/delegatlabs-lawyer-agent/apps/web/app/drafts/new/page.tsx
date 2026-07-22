"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectedLanguage } from "../../../lib/storage";
import { getTranslation, Language } from "../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../lib/draft-catalog";
import AppHeader from "../../../components/app-header";
import CategoryFilter from "../../../components/category-filter";
import DraftCard from "../../../components/draft-card";
import { 
  ArrowLeft, 
  Search, 
  Sparkles,
  FileText
} from "lucide-react";

export default function NewDraft() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<"en" | "hi">("en");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setIsClient(true);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleDraftSelect = (item: DraftCatalogItem) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("delegatlabs_draft_language", draftLang);
    }
    router.push(`/drafts/${item.id}/plan`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  // Client-side Filter & Search Logic
  const filteredCatalog = DRAFT_CATALOG.filter((item) => {
    // 1. Category Filter
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }
    
    // 2. Search Query Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatches = item.title.toLowerCase().includes(query) || item.titleHi.includes(query);
      const descMatches = item.description.toLowerCase().includes(query) || item.descriptionHi.includes(query);
      return titleMatches || descMatches;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back_to_dashboard}</span>
        </button>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.create_new_draft}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t.select_document_type}
          </p>
        </div>

        {/* Draft Language selection */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
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
              className={`py-3 px-5 rounded-xl border text-xs font-bold transition-all ${
                draftLang === "en"
                  ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDraftLang("hi")}
              className={`py-3 px-5 rounded-xl border text-xs font-bold transition-all ${
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
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category selection */}
            <div className="w-full md:w-auto flex-grow max-w-2xl">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                currentLang={lang}
              />
            </div>

            {/* Search Input */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Info footer */}
          <div className="p-4 bg-slate-100/50 border border-slate-200/60 rounded-xl text-center text-xs text-slate-500 font-semibold">
            {t.draft_catalog_message}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
