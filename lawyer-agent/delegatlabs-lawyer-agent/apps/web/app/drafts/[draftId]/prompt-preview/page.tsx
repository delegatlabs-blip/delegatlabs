"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  getSelectedLanguage, 
  getDraftIntake, 
  getDraftLanguage, 
  getDraftCustomInstructions,
  saveGeneratedDraft 
} from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import { compileDraftPrompt, CompiledPromptPackage } from "../../../../lib/prompt-compiler";
import { generateDraftMock, DraftGenerationResponse } from "../../../../lib/api";
import { getActiveCaseDraftContext, updateCaseDraftLink } from "../../../../lib/case-storage";
import AppHeader from "../../../../components/app-header";
import FactsSummaryCard from "../../../../components/prompt/facts-summary-card";
import ClauseSummaryCard from "../../../../components/prompt/clause-summary-card";
import GuardrailsCard from "../../../../components/prompt/guardrails-card";
import OutputRequirementsCard from "../../../../components/prompt/output-requirements-card";
import DeveloperPromptPreview from "../../../../components/prompt/developer-prompt-preview";
import { 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Cpu, 
  FileText, 
  Copy, 
  Loader2,
  AlertTriangle
} from "lucide-react";

export default function DraftingPromptPreview() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
  const [promptPackage, setPromptPackage] = useState<CompiledPromptPackage | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Generation States
  const [loading, setLoading] = useState(false);
  const [draftResult, setDraftResult] = useState<DraftGenerationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    const dl = getDraftLanguage("en");
    
    const matchedDraft = DRAFT_CATALOG.find((d) => d.id === draftId);
    if (matchedDraft) {
      setDraftItem(matchedDraft);
    }
    
    const matchedBlueprint = DRAFT_BLUEPRINTS[draftId];
    if (matchedBlueprint) {
      setBlueprint(matchedBlueprint);
      
      const answers = getDraftIntake(draftId);
      const customInst = getDraftCustomInstructions(draftId);
      const compiled = compileDraftPrompt({
        draftId,
        draftTitle: matchedDraft ? matchedDraft.title : "Draft",
        draftLanguage: dl,
        answers,
        blueprint: matchedBlueprint,
        customInstructions: customInst
      });
      setPromptPackage(compiled);
    }
    
    setIsClient(true);
  }, [draftId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleGenerateMock = async () => {
    if (!promptPackage) return;
    setLoading(true);
    setErrorMsg("");
    setDraftResult(null);

    try {
      const response = await generateDraftMock({
        draftId: promptPackage.draftId,
        draftTitle: promptPackage.draftTitle,
        draftLanguage: promptPackage.draftLanguage,
        jurisdiction: promptPackage.jurisdiction,
        systemInstruction: promptPackage.systemInstruction,
        userInstruction: promptPackage.userInstruction,
        structuredFacts: promptPackage.structuredFacts,
        selectedClauses: promptPackage.selectedClauses,
        guardrails: promptPackage.guardrails,
        outputRequirements: promptPackage.outputRequirements,
        validationSummary: promptPackage.validationSummary,
        customInstructions: promptPackage.customInstructions
      });

      const context = getActiveCaseDraftContext();
      const isCaseMatch = context && context.draftId === draftId;
      
      const responseWithMeta = {
        ...response,
        sourceType: isCaseMatch ? "case" : "standalone",
        sourceCaseId: isCaseMatch ? context.caseId : undefined,
        sourceCaseTitle: isCaseMatch ? context.caseTitle : undefined
      };

      saveGeneratedDraft(draftId, responseWithMeta);

      if (isCaseMatch) {
        updateCaseDraftLink(context.caseId, draftId, {
          status: "generated"
        });
      }

      // Wait a tiny bit and navigate to /preview
      setTimeout(() => {
        router.push(`/drafts/${draftId}/preview`);
      }, 500);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to generate mock draft. Ensure backend server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!draftResult) return;
    navigator.clipboard.writeText(draftResult.draftText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
          onClick={() => router.push(`/drafts/${draftId}/customize`)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "निर्देश संपादन पर वापस जाएं" : "Back to Customize"}</span>
        </button>

        {/* If blueprint does NOT exist */}
        {!blueprint || !promptPackage ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-5 mt-10">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Prompt compiler coming soon for this draft.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We are currently building the custom LLM compiler context and guardrail formats for this legal agreement type.
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
          /* If blueprint DOES exist (Rent Agreement compilation view) */
          <div className="space-y-6">
            
            {/* Header segment */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {lang === "hi" ? "संकलित मसौदा पूर्वावलोकन" : "Prompt Compiler Preview"} - {titleText}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Verify parameters, guardrails, and compliance instructions parsed for AI model drafting.
              </p>
            </div>

            {/* AI Status Badge */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-2 bg-green-50 border border-green-200 text-green-600 rounded-full flex-shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Compiler State
                  </span>
                  <span className="block text-sm font-bold text-slate-800">
                    AI-ready prompt prepared
                  </span>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerateMock}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    <span>Generate Mock Draft / मसौदा तैयार करें (Mock)</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-start space-x-2">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mock Output Preview Card */}
            {draftResult && (
              <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 md:p-8 space-y-6">
                
                {/* Provider metadata header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 border border-green-200 text-[10px] font-bold text-green-700 uppercase">
                      Generated by mock provider for development testing
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-1.5 mt-1">
                      <FileText className="h-4.5 w-4.5 text-slate-500" />
                      <span>Simulated Draft Text</span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      <div>Provider: <span className="text-slate-600 font-bold">{draftResult.provider}</span></div>
                      <div>Model: <span className="text-slate-600 font-mono font-bold">{draftResult.model}</span></div>
                    </div>
                    
                    <button
                      onClick={copyToClipboard}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition flex items-center justify-center"
                      title="Copy to Clipboard"
                    >
                      {copySuccess ? (
                        <span className="text-[10px] text-green-600 font-bold px-1">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Warnings banner */}
                {draftResult.warnings && draftResult.warnings.length > 0 && (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200/40 text-amber-800 text-[11px] font-semibold rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-bold">Provider Warnings:</span>
                    </div>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 font-medium">
                      {draftResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Text body */}
                <pre className="p-6 bg-slate-950 text-slate-200 border border-slate-900 rounded-xl font-mono text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap overflow-auto max-h-[500px]">
                  {draftResult.draftText}
                </pre>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1 text-center">
                  Generation ID: <span className="font-mono">{draftResult.generationId}</span> | Format compiled according to standard drafting parameters.
                </p>
              </div>
            )}

            {/* Facts summary card */}
            <FactsSummaryCard
              structuredFacts={promptPackage.structuredFacts}
              currentLang={lang}
            />

            {/* Clauses card */}
            <ClauseSummaryCard
              clauses={promptPackage.selectedClauses}
              currentLang={lang}
            />

            {/* Guardrails card */}
            <GuardrailsCard
              guardrails={promptPackage.guardrails}
            />

            {/* Output requirements card */}
            <OutputRequirementsCard
              requirements={promptPackage.outputRequirements}
            />

            {/* Custom instructions card if filled */}
            {promptPackage.customInstructions && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "hi" ? "दर्ज किए गए अतिरिक्त निर्देश" : "Custom Instructions"}
                </h3>
                <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 font-medium text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {promptPackage.customInstructions}
                </div>
              </div>
            )}

            {/* Developer prompt preview */}
            <DeveloperPromptPreview
              systemInstruction={promptPackage.systemInstruction}
              userInstruction={promptPackage.userInstruction}
            />

            {/* Action buttons footer */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                onClick={() => router.push(`/drafts/${draftId}/customize`)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center transition"
              >
                {lang === "hi" ? "पीछे" : "Back to Customize"}
              </button>

              <button
                disabled
                className="px-6 py-3 bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs rounded-xl cursor-not-allowed shadow-inner text-center sm:w-auto"
              >
                Continue to AI Generation - Coming Next
              </button>
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
