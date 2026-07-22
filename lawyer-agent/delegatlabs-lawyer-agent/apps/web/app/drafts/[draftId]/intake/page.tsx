"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage } from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import AppHeader from "../../../../components/app-header";
import IntakeWizard from "../../../../components/intake/intake-wizard";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function DraftingIntake() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
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
    
    setIsClient(true);
  }, [draftId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.push(`/drafts/${draftId}/plan`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back_to_dashboard}</span>
        </button>

        {/* If blueprint does NOT exist */}
        {!blueprint ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-5 mt-10">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Guided intake coming soon for this draft.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We are currently building the intake wizard questionnaire structures for this document type. Please check back later.
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
          /* If blueprint DOES exist (Rent Agreement flow) */
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {titleText} - Intake Wizard
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Fill out the required information sections to compile the draft.
              </p>
            </div>
            
            <IntakeWizard
              blueprint={blueprint}
              currentLang={lang}
            />
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
