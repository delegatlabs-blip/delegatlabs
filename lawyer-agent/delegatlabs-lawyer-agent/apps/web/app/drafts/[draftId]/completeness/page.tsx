"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage, getDraftIntake, getDraftLanguage } from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import { runCompletenessCheck, CompletenessResult } from "../../../../lib/completeness-engine";
import AppHeader from "../../../../components/app-header";
import CompletenessSummaryCard from "../../../../components/completeness/completeness-summary-card";
import MissingFieldsList from "../../../../components/completeness/missing-fields-list";
import ValidationResults from "../../../../components/completeness/validation-results";
import WarningsList from "../../../../components/completeness/warnings-list";
import { ArrowLeft, AlertCircle, Sparkles, AlertOctagon } from "lucide-react";

export default function DraftingCompleteness() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<string>("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
  const [result, setResult] = useState<CompletenessResult | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    const dl = getDraftLanguage("en");
    setDraftLang(dl);
    
    const matchedDraft = DRAFT_CATALOG.find((d) => d.id === draftId);
    if (matchedDraft) {
      setDraftItem(matchedDraft);
    }
    
    const matchedBlueprint = DRAFT_BLUEPRINTS[draftId];
    if (matchedBlueprint) {
      setBlueprint(matchedBlueprint);
      
      const answers = getDraftIntake(draftId);
      const checkResult = runCompletenessCheck(matchedBlueprint, answers, dl);
      setResult(checkResult);
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
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.push(`/drafts/${draftId}/intake`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.action_back_intake}</span>
        </button>

        {/* If blueprint does NOT exist */}
        {!blueprint || !result ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-5 mt-10">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Completeness check coming soon for this draft.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We are currently building the automatic verification logic and validation matrices for this template type.
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
          /* If blueprint DOES exist (Rent Agreement audit results) */
          <div className="space-y-6">
            
            {/* Title segment */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {t.completeness_header} - {titleText}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Review verified rules, required info checks, and recommended improvements before generating draft.
              </p>
            </div>

            {/* Summary card widget */}
            <CompletenessSummaryCard
              isReady={result.isReadyForGeneration}
              percentage={result.completionPercentage}
              completedRequired={result.completedRequiredFields}
              totalRequired={result.totalRequiredFields}
              currentLang={lang}
            />

            {/* If missing required fields, show alert banner */}
            {!result.isReadyForGeneration && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl flex items-start space-x-2">
                <AlertOctagon className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{t.generation_disabled_message}</span>
              </div>
            )}

            {/* Missing fields block */}
            <MissingFieldsList
              blueprint={blueprint}
              missingFieldIds={result.missingRequiredFields}
              currentLang={lang}
            />

            {/* Validation Rules checks */}
            <ValidationResults
              totalRules={result.totalValidationRules}
              passedRuleIds={result.passedValidationRules}
              failedRules={result.failedValidationRules}
              currentLang={lang}
            />

            {/* Warnings list recommended fields */}
            <WarningsList
              warnings={result.warnings}
              currentLang={lang}
            />

            {/* Action buttons footer */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                onClick={() => router.push(`/drafts/${draftId}/intake`)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center transition"
              >
                {t.action_back_intake}
              </button>

              {result.isReadyForGeneration ? (
                <button
                  onClick={() => router.push(`/drafts/${draftId}/customize`)}
                  className="px-6 py-3 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl transition shadow active:scale-98 text-center"
                >
                  {lang === "hi" ? "आउटपुट अनुकूलित करें" : "Continue to Draft Instructions"}
                </button>
              ) : (
                <div className="text-right">
                  <button
                    disabled
                    className="px-6 py-3 bg-slate-100 border border-slate-200 text-slate-300 font-bold text-xs rounded-xl cursor-not-allowed shadow-inner text-center w-full sm:w-auto"
                  >
                    Generate Draft
                  </button>
                  <p className="text-[10px] text-red-500 font-semibold mt-1.5 pl-1 text-center sm:text-right">
                    {lang === "hi" 
                      ? "ड्राफ्ट बनाने से पहले आवश्यक जानकारी पूरी होनी चाहिए।" 
                      : "Required information must be completed before generation."}
                  </p>
                </div>
              )}
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
