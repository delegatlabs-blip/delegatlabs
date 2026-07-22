"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage, getDraftCustomInstructions, saveDraftCustomInstructions } from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import AppHeader from "../../../../components/app-header";
import { ArrowLeft, Sparkles, AlertCircle, PlusCircle } from "lucide-react";

export default function DraftingCustomize() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    
    const matchedDraft = DRAFT_CATALOG.find((d) => d.id === draftId);
    if (matchedDraft) {
      setDraftItem(matchedDraft);
    }
    
    const matchedBlueprint = DRAFT_BLUEPRINTS[draftId];
    if (matchedBlueprint) {
      setBlueprint(matchedBlueprint);
    }

    const savedInstructions = getDraftCustomInstructions(draftId);
    setCustomInstructions(savedInstructions);
    
    setIsClient(true);
  }, [draftId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleTextChange = (val: string) => {
    setCustomInstructions(val);
    saveDraftCustomInstructions(draftId, val);
  };

  const applyExample = (text: string) => {
    const newVal = customInstructions ? `${customInstructions.trim()}\n${text}` : text;
    handleTextChange(newVal);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  if (!draftItem) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-600 font-semibold">Draft template not found.</p>
        <button
          onClick={() => router.push("/drafts/new")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  const titleText = lang === "hi" ? draftItem.titleHi : draftItem.title;

  const examples = [
    "Add clause that tenant cannot sublet the property.",
    "Add clause that rent will increase by 10% after 11 months.",
    "Add clause that owner will provide one parking space."
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.push(`/drafts/${draftId}/completeness`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "समीक्षा पर वापस जाएं" : "Back to Review"}</span>
        </button>

        {/* If blueprint does NOT exist */}
        {!blueprint ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-5 mt-10">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Customization coming soon for this draft.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We are currently building the custom instructions configurations for this document type. Please check back later.
              </p>
            </div>
            <button
              onClick={() => router.push("/drafts/new")}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-98 shadow-md"
            >
              Back to Catalog / कैटलॉग पर वापस जाएं
            </button>
          </div>
        ) : (
          /* If blueprint DOES exist (Rent Agreement customization flow) */
          <div className="space-y-6">
            
            {/* Header segment */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {lang === "hi" ? "निर्देश जोड़ें" : "Custom Instructions"} - {titleText}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Add special directives or custom clauses for the AI Junior Associate to include in the draft.
              </p>
            </div>

            {/* Form layout */}
            <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-6 md:p-8 space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "अतिरिक्त शर्तें / निर्देश" : "Custom Drafting Directives"}
                </label>
                <textarea
                  rows={6}
                  value={customInstructions}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={
                    lang === "hi" 
                      ? "उदाहरण के लिए: किरायेदार घर में पालतू जानवर नहीं रख सकता..." 
                      : "Type specific requirements (e.g. Tenant is responsible for keeping the flat painted...)"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 bg-white placeholder-slate-400 transition-all shadow-inner resize-none"
                />
                <p className="text-[10px] text-slate-400 font-semibold pl-1">
                  Drafting engine will translate and format these custom directives seamlessly.
                </p>
              </div>

              {/* Suggestions region */}
              <div className="space-y-3.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                  <span>{lang === "hi" ? "त्वरित उदाहरण" : "Quick Examples"}</span>
                </h4>
                
                <div className="flex flex-col space-y-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => applyExample(ex)}
                      className="text-left text-xs text-slate-600 hover:text-slate-900 font-semibold p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition flex items-center justify-between"
                    >
                      <span>{ex}</span>
                      <PlusCircle className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push(`/drafts/${draftId}/completeness`)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                >
                  {lang === "hi" ? "पीछे" : "Previous"}
                </button>

                <button
                  onClick={() => router.push(`/drafts/${draftId}/prompt-preview`)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow active:scale-98"
                >
                  {lang === "hi" ? "मसौदा निर्देश संकलित करें" : "Prepare Draft Prompt"}
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
