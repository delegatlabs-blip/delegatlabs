"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage } from "../../../../lib/storage";
import { getTranslation, Language } from "../../../../lib/i18n";
import { DRAFT_CATALOG, DraftCatalogItem } from "../../../../lib/draft-catalog";
import { DRAFT_BLUEPRINTS, DraftBlueprint } from "../../../../lib/draft-blueprints";
import { getActiveCaseDraftContext, CaseDraftContext } from "../../../../lib/case-storage";
import AppHeader from "../../../../components/app-header";
import BlueprintSectionCard from "../../../../components/blueprint-section-card";
import RequiredFieldList from "../../../../components/required-field-list";
import ClauseList from "../../../../components/clause-list";
import { 
  ArrowLeft, 
  Clock, 
  Layers, 
  FileCheck, 
  HelpCircle, 
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Scale,
  Link,
  ChevronLeft
} from "lucide-react";

export default function DraftingPlan() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.draftId as string;

  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<string>("en");
  const [draftItem, setDraftItem] = useState<DraftCatalogItem | null>(null);
  const [blueprint, setBlueprint] = useState<DraftBlueprint | null>(null);
  const [caseContext, setCaseContext] = useState<CaseDraftContext | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    
    if (typeof window !== "undefined") {
      const savedDraftLang = localStorage.getItem("delegatlabs_draft_language") || "en";
      setDraftLang(savedDraftLang);
    }
    
    const matchedDraft = DRAFT_CATALOG.find((d) => d.id === draftId);
    if (matchedDraft) {
      setDraftItem(matchedDraft);
    }
    
    const matchedBlueprint = DRAFT_BLUEPRINTS[draftId];
    if (matchedBlueprint) {
      setBlueprint(matchedBlueprint);
    }

    const context = getActiveCaseDraftContext();
    if (context && context.draftId === draftId) {
      setCaseContext(context);
    }
    
    setIsClient(true);
  }, [draftId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleStartIntake = () => {
    // If case context is connected, append parameters
    if (caseContext) {
      router.push(`/drafts/${draftId}/intake?caseId=${caseContext.caseId}`);
    } else {
      router.push(`/drafts/${draftId}/intake`);
    }
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
  const descText = lang === "hi" ? draftItem.descriptionHi : draftItem.description;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Content Body */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (caseContext) {
                router.push(`/cases/${caseContext.caseId}/drafts/new`);
              } else {
                router.push("/drafts/new");
              }
            }}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{caseContext ? (lang === "hi" ? "टेम्पलेट सूची पर वापस जाएं" : "Back to Templates Selection") : t.back_to_dashboard}</span>
          </button>

          {caseContext && (
            <button
              onClick={() => router.push(`/cases/${caseContext.caseId}`)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{lang === "hi" ? "मामले पर वापस जाएं" : "Back to Case"}</span>
            </button>
          )}
        </div>

        {/* Connected Case Summary Banner */}
        {caseContext && (
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Link className="h-4 w-4 text-green-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === "hi" ? "मामले से जुड़े हुए मसौदे का निर्माण:" : "Creating draft from case:"}
              </h3>
              <span className="text-xs font-extrabold text-green-400">
                {caseContext.caseTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-[11px] font-semibold text-slate-300">
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Client</span>
                <span className="block mt-0.5 text-slate-200">{caseContext.clientName}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Role</span>
                <span className="block mt-0.5 text-slate-200">{caseContext.clientRole}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Opposite Party</span>
                <span className="block mt-0.5 text-slate-200">{caseContext.oppositePartyName}</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Court</span>
                <span className="block mt-0.5 text-slate-200">{caseContext.courtName}</span>
              </div>
              {caseContext.caseNumber && (
                <div>
                  <span className="block text-[8px] text-slate-500 uppercase">Case Number</span>
                  <span className="block mt-0.5 text-slate-200">{caseContext.caseNumber}</span>
                </div>
              )}
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Stage</span>
                <span className="block mt-0.5 text-slate-200">{caseContext.stage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Brand/Draft Meta Header */}
        <div className="space-y-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
            {t.planning_title}
          </span>
          
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {titleText}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            {descText}
          </p>
        </div>

        {/* Config metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center space-x-3">
            <Clock className="h-5 w-5 text-slate-500" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                {t.estimated_time}
              </span>
              <span className="block text-sm font-bold text-slate-800">
                {draftItem.estimatedTimeMinutes} {t.minutes_abbr}
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center space-x-3">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                {t.selected_draft_lang}
              </span>
              <span className="block text-sm font-bold text-slate-800">
                {draftLang === "hi" ? "हिन्दी (Hindi)" : "English"}
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center space-x-3">
            <FileCheck className="h-5 w-5 text-slate-500" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                {t.supported_states}
              </span>
              <span className="block text-sm font-bold text-slate-800 truncate max-w-[150px]" title={draftItem.supportedStates.join(", ")}>
                {draftItem.supportedStates.join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* If blueprint does NOT exist */}
        {!blueprint ? (
          <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <h3 className="font-bold text-lg text-slate-800">
              Blueprint coming soon for this draft.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              We are actively developing the intake blueprint variables and structures for this document category. Keep checking for updates.
            </p>
          </div>
        ) : (
          /* If blueprint DOES exist (Rent Agreement flow) */
          <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-6 md:p-8 space-y-8">
            
            {/* Sections */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
                <Layers className="h-4.5 w-4.5 text-slate-600" />
                <span>{t.sections_label} ({blueprint.sections.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blueprint.sections.map((sec) => (
                  <BlueprintSectionCard
                    key={sec.id}
                    section={sec}
                    currentLang={lang}
                  />
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Required Fields lists */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
                  <ClipboardList className="h-4.5 w-4.5 text-slate-600" />
                  <span>{t.required_info} ({blueprint.requiredFields.length} Required)</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {blueprint.recommendedFields.length} Recommended
                </span>
              </div>

              <RequiredFieldList
                fields={blueprint.requiredFields}
                currentLang={lang}
              />
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Clauses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
                  <Scale className="h-4.5 w-4.5 text-slate-600" />
                  <span>Mandatory Clauses ({blueprint.mandatoryClauses.length})</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {blueprint.recommendedClauses.length} Recommended Clauses
                </span>
              </div>

              <ClauseList
                clauses={blueprint.mandatoryClauses}
                currentLang={lang}
              />
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Validation Rules */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-slate-600" />
                <span>Validation Rules ({blueprint.validationRules.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 sm:pl-7">
                {blueprint.validationRules.map((rule) => {
                  const ruleText = lang === "hi" ? rule.ruleTextHi : rule.ruleText;
                  return (
                    <div key={rule.id} className="text-xs text-slate-500 leading-relaxed flex items-start space-x-2 font-medium">
                      <span className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span>{ruleText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Review Checklist */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
                <FileCheck className="h-4.5 w-4.5 text-slate-600" />
                <span>{t.completeness_check} ({blueprint.reviewChecklist.length} Items)</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 sm:pl-7">
                {blueprint.reviewChecklist.map((chk) => {
                  const checkText = lang === "hi" ? chk.checkTextHi : chk.checkText;
                  return (
                    <div key={chk.id} className="text-xs text-slate-500 leading-relaxed flex items-start space-x-2 font-medium">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span>{checkText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Start Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartIntake}
                className="px-6 py-3.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 font-semibold text-xs rounded-xl transition shadow active:scale-98"
              >
                {t.start_intake}
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
