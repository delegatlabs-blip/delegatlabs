"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  getSelectedLanguage, 
  getDraftIntake, 
  getDraftLanguage,
  getGeneratedDraft,
  saveGeneratedDraft
} from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import { validateGeneratedDraft, OutputValidationResult } from "../../../../lib/output-validator";
import AppHeader from "../../../../components/app-header";
import DraftDocumentPreview from "../../../../components/preview/draft-document-preview";
import OutputValidationCard from "../../../../components/preview/output-validation-card";
import OutputCheckList from "../../../../components/preview/output-check-list";
import PreviewActionBar from "../../../../components/preview/preview-action-bar";
import { ArrowLeft, AlertCircle, FileText, Cpu, Eye, AlertTriangle } from "lucide-react";

export default function DraftingPreview() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<"en" | "hi">("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Storage State
  const [draftResult, setDraftResult] = useState<any | null>(null);
  const [validation, setValidation] = useState<OutputValidationResult | null>(null);
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
    }

    const savedAnswers = getDraftIntake(draftId);
    setAnswers(savedAnswers);

    const generated = getGeneratedDraft(draftId);
    if (generated && matchedBlueprint) {
      setDraftResult(generated);
      const audit = validateGeneratedDraft({
        draftId,
        draftText: generated.draftText,
        blueprint: matchedBlueprint,
        answers: savedAnswers,
        draftLanguage: dl
      });
      setValidation(audit);
    }
    
    setIsClient(true);
  }, [draftId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleSaveText = (updatedText: string) => {
    if (!draftResult || !blueprint) return;

    const updatedResult = { ...draftResult, draftText: updatedText };
    setDraftResult(updatedResult);
    saveGeneratedDraft(draftId, updatedResult);

    // Re-run validation
    const audit = validateGeneratedDraft({
      draftId,
      draftText: updatedText,
      blueprint,
      answers,
      draftLanguage: draftLang
    });
    setValidation(audit);
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
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.push(`/drafts/${draftId}/prompt-preview`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "पूर्वावलोकन पर वापस जाएं" : "Back to Prompt Preview"}</span>
        </button>

        {/* If no generated draft exists, show empty state */}
        {!draftResult || !blueprint || !validation ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-5 mt-10">
            <AlertCircle className="h-10 w-10 text-slate-400" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                No generated draft found.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Please compile the draft instructions prompt first inside the Prompt Compiler deck before viewing preview sheets.
              </p>
            </div>
            <button
              onClick={() => router.push(`/drafts/${draftId}/prompt-preview`)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-98 shadow-md"
            >
              Back to Prompt Preview / पूर्वावलोकन पर जाएं
            </button>
          </div>
        ) : (
          /* If generated draft DOES exist (Rent Agreement preview dashboard) */
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="space-y-1 no-print">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {lang === "hi" ? "दस्तावेज़ पूर्वावलोकन" : "Draft Preview"} - {titleText}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Verify layout sheets, print readiness, and complete manual adjustments.
              </p>
            </div>

            {/* Config metadata cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 metadata-grid no-print">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Provider</span>
                <span className="block text-xs font-bold text-slate-700 capitalize">{draftResult.provider}</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Model</span>
                <span className="block text-xs font-mono font-bold text-slate-700">{draftResult.model}</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Draft Language</span>
                <span className="block text-xs font-bold text-slate-700">
                  {draftLang === "hi" ? "हिन्दी (Hindi)" : "English"}
                </span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Generation ID</span>
                <span className="block text-xs font-mono font-bold text-slate-700 truncate" title={draftResult.generationId}>
                  {draftResult.generationId}
                </span>
              </div>
            </div>

            {/* Validation header summary */}
            <div className="output-validation-card no-print">
              <OutputValidationCard
                status={validation.status}
                isReady={validation.isReadyForExport}
                currentLang={lang}
              />
            </div>

            {/* Pre-print Review warning note */}
            <div className="p-4 bg-amber-50 border border-amber-200/50 text-amber-800 text-xs font-semibold rounded-xl flex items-start space-x-2 print-note no-print">
              <AlertTriangle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>
                {lang === "hi" 
                  ? "कृपया प्रिंट करने से पहले मसौदे की सावधानीपूर्वक समीक्षा करें।" 
                  : "Please review the draft carefully before printing."}
              </span>
            </div>

            {/* Document sheet body preview */}
            <DraftDocumentPreview
              draftText={draftResult.draftText}
              onSave={handleSaveText}
              currentLang={lang}
            />

            {/* Checks list */}
            <div className="output-check-list no-print">
              <OutputCheckList
                checks={validation.checks}
                currentLang={lang}
              />
            </div>

            {/* Warnings alerts */}
            {validation.warnings.length > 0 && (
              <div className="bg-white border border-amber-200 shadow-sm rounded-2xl p-6 space-y-4 warnings-list no-print">
                <h3 className="text-sm font-bold text-amber-800 flex items-center space-x-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  <span>Validation Warnings ({validation.warnings.length})</span>
                </h3>
                
                <div className="space-y-2">
                  {validation.warnings.map((warn, i) => (
                    <div key={i} className="text-xs text-slate-600 font-semibold flex items-start space-x-2 p-2.5 rounded-xl border border-amber-100 bg-amber-50/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <PreviewActionBar
              onBack={() => router.push(`/drafts/${draftId}/prompt-preview`)}
              isReady={validation.isReadyForExport}
              currentLang={lang}
            />

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 no-print">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
