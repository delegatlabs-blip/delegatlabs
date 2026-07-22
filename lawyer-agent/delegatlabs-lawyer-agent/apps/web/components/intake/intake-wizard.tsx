"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DraftBlueprint, DraftField } from "../../lib/draft-blueprints";
import { getTranslation, Language } from "../../lib/i18n";
import { saveDraftIntake, getDraftIntake, clearDraftIntake } from "../../lib/storage";
import { getActiveCaseDraftContext, getActiveCase, updateCaseDraftLink, clearActiveCaseDraftContext } from "../../lib/case-storage";
import { buildCaseDraftPrefill } from "../../lib/case-draft-prefill";
import IntakeSectionNav from "./intake-section-nav";
import IntakeProgress from "./intake-progress";
import IntakeField from "./intake-field";
import IntakeSummary from "./intake-summary";
import { ArrowLeft, ArrowRight, RotateCcw, AlertTriangle, Link } from "lucide-react";

interface IntakeWizardProps {
  blueprint: DraftBlueprint;
  currentLang: Language;
}

export const IntakeWizard: React.FC<IntakeWizardProps> = ({
  blueprint,
  currentLang
}) => {
  const router = useRouter();
  const t = getTranslation(currentLang);

  // States
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [caseTitle, setCaseTitle] = useState<string>("");
  const [isCaseStale, setIsCaseStale] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [validationWarning, setValidationWarning] = useState<string>("");

  // Load answers from localStorage on mount
  useEffect(() => {
    const saved = getDraftIntake(blueprint.draftId);
    
    // Check if opened with case context
    const context = getActiveCaseDraftContext();
    let initialAnswers = { ...saved };
    let connectedCaseTitle = "";
    let stale = false;

    if (context && context.draftId === blueprint.draftId) {
      const caseRecord = getActiveCase(context.caseId);
      if (caseRecord) {
        connectedCaseTitle = caseRecord.caseTitle;
        
        // Build prefill values using buildCaseDraftPrefill
        const prefill = buildCaseDraftPrefill(caseRecord, blueprint);
        
        // Apply prefilled values ONLY once (if not already filled by user)
        let appliedPrefill = false;
        Object.keys(prefill).forEach((key) => {
          if (initialAnswers[key] === undefined || initialAnswers[key] === "") {
            initialAnswers[key] = prefill[key];
            appliedPrefill = true;
          }
        });

        if (appliedPrefill) {
          saveDraftIntake(blueprint.draftId, initialAnswers);
        }

        // Set status in case link
        updateCaseDraftLink(context.caseId, blueprint.draftId, {
          status: "intake_in_progress"
        });
      } else {
        // Stale or deleted case
        clearActiveCaseDraftContext();
        stale = true;
      }
    }

    setAnswers(initialAnswers);
    setCaseTitle(connectedCaseTitle);
    setIsCaseStale(stale);
    
    // Default to the first section
    if (blueprint.sections.length > 0) {
      setActiveSectionId(blueprint.sections[0].id);
    }
    
    setIsClient(true);
  }, [blueprint]);

  // Save to localStorage on answers change
  const handleAnswerChange = (fieldId: string, val: any) => {
    const updatedAnswers = { ...answers, [fieldId]: val };
    setAnswers(updatedAnswers);
    saveDraftIntake(blueprint.draftId, updatedAnswers);
    setValidationWarning(""); // Clear warnings
  };

  const handleReset = () => {
    const msg = currentLang === "hi"
      ? "क्या आप निश्चित रूप से अपना इनपुट रीसेट करना चाहते हैं? सभी सहेजे गए तथ्य हटा दिए जाएंगे।"
      : "Are you sure you want to reset this draft? All progress will be permanently deleted.";
      
    if (confirm(msg)) {
      clearDraftIntake(blueprint.draftId);
      setAnswers({});
      if (blueprint.sections.length > 0) {
        setActiveSectionId(blueprint.sections[0].id);
      }
      setValidationWarning("");
    }
  };

  if (!isClient || !activeSectionId) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 animate-pulse">
        Loading Wizard...
      </div>
    );
  }

  // Helper properties
  const activeSectionIndex = blueprint.sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = blueprint.sections[activeSectionIndex];
  const isFirstStep = activeSectionIndex === 0;
  const isLastStep = activeSectionIndex === blueprint.sections.length - 1;

  // Filter fields belonging to the active section
  const activeFields: DraftField[] = [
    ...blueprint.requiredFields.filter((f) => f.sectionId === activeSectionId),
    ...blueprint.recommendedFields.filter((f) => f.sectionId === activeSectionId),
    ...blueprint.optionalFields.filter((f) => f.sectionId === activeSectionId)
  ];

  // Completeness check
  const allRequiredFields = blueprint.requiredFields;
  const totalRequired = allRequiredFields.length;
  const filledRequired = allRequiredFields.filter(
    (f) => answers[f.id] !== undefined && String(answers[f.id]).trim() !== ""
  ).length;

  const completenessPercent = totalRequired > 0 
    ? Math.round((filledRequired / totalRequired) * 100) 
    : 100;

  // Validation check for the CURRENT section
  const currentSectionRequiredFields = blueprint.requiredFields.filter(
    (f) => f.sectionId === activeSectionId
  );
  
  const isCurrentSectionValid = currentSectionRequiredFields.every(
    (f) => answers[f.id] !== undefined && String(answers[f.id]).trim() !== ""
  );

  const handleNext = () => {
    if (!isCurrentSectionValid) {
      setValidationWarning(
        currentLang === "hi"
          ? "कृपया जारी रखने से पहले इस अनुभाग के सभी आवश्यक (*) फ़ील्ड भरें।"
          : "Please complete all required (*) fields in this section before continuing."
      );
      return;
    }

    setValidationWarning("");
    if (activeSectionIndex < blueprint.sections.length - 1) {
      setActiveSectionId(blueprint.sections[activeSectionIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    setValidationWarning("");
    if (activeSectionIndex > 0) {
      setActiveSectionId(blueprint.sections[activeSectionIndex - 1].id);
    }
  };

  const handleSectionJump = (sectionId: string) => {
    setValidationWarning("");
    setActiveSectionId(sectionId);
  };

  const activeSecTitle = currentLang === "hi" ? activeSection.titleHi : activeSection.title;
  const activeSecDesc = currentLang === "hi" ? activeSection.descriptionHi : activeSection.description;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Left sidebar: Stepper Section Selector */}
      <div className="space-y-4 lg:col-span-1">
        <IntakeSectionNav
          sections={blueprint.sections}
          activeSectionId={activeSectionId}
          onSectionClick={handleSectionJump}
          answers={answers}
          requiredFields={blueprint.requiredFields}
          currentLang={currentLang}
        />
        
        {/* Reset draft button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-dashed border-red-200 hover:border-red-500 hover:bg-red-50/50 text-red-600 font-bold text-xs transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{currentLang === "hi" ? "इनटेक रीसेट करें" : "Reset Draft Intake"}</span>
        </button>
      </div>

      {/* Right panel: Active Stepper Form */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Case Stale Warning Banner */}
        {isCaseStale && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 space-y-2 flex flex-col sm:flex-row sm:items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-extrabold text-xs">
                {currentLang === "hi" 
                  ? "सहेजा गया मामला संदर्भ लोड नहीं किया जा सका।" 
                  : "Saved case context could not be loaded."}
              </span>
              <span className="block text-[11px] opacity-90 leading-relaxed font-semibold">
                {currentLang === "hi"
                  ? "एक स्टैंडअलोन मसौदे के रूप में जारी रखें या मामलों की सूची पर वापस जाएं।"
                  : "Continue as a standalone draft or return to the cases list."}
              </span>
              <div className="pt-1.5 flex items-center space-x-2">
                <button
                  onClick={() => setIsCaseStale(false)}
                  className="px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-900 rounded font-bold text-[9px] hover:bg-amber-200/60 transition"
                >
                  {currentLang === "hi" ? "चेतावनी बंद करें" : "Dismiss"}
                </button>
                <button
                  onClick={() => router.push("/cases")}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded font-bold text-[9px] hover:bg-slate-50 transition"
                >
                  {currentLang === "hi" ? "मामलों पर वापस जाएं" : "Back to Cases"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected Case Warning/Notification Banner */}
        {caseTitle && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 rounded-2xl p-4 space-y-2 flex flex-col sm:flex-row sm:items-start gap-3">
            <Link className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-extrabold text-xs">
                {currentLang === "hi" ? `मामला विवरण जुड़ा हुआ है: ${caseTitle}` : `Case details connected: ${caseTitle}`}
              </span>
              <span className="block text-[11px] opacity-90 leading-relaxed font-semibold">
                {t.days_passed_warning}
                {currentLang === "hi"
                  ? "मामले के विवरण जहां सटीक मिलान उपलब्ध था, वहां पहले से भर दिए गए हैं। कृपया मसौदा तैयार करने से पहले सभी जानकारी की समीक्षा करें।"
                  : "Case details have been prefilled where an exact match was available. Please review all information before generating the draft."}
              </span>
            </div>
          </div>
        )}

        {/* Progress header widget */}
        <IntakeProgress
          currentStep={activeSectionIndex + 1}
          totalSteps={blueprint.sections.length}
          activeSectionTitle={activeSecTitle}
          completenessPercent={completenessPercent}
          currentLang={currentLang}
        />

        {/* Validation Error Banner */}
        {validationWarning && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-start space-x-2">
            <AlertTriangle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {/* Form fields card */}
        <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base">
              {activeSecTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {activeSecDesc}
            </p>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Render inputs dynamically */}
          {activeFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeFields.map((field) => (
                <div key={field.id} className={field.inputType === "textarea" ? "md:col-span-2" : ""}>
                  <IntakeField
                    field={field}
                    value={answers[field.id]}
                    onChange={(val) => handleAnswerChange(field.id, val)}
                    currentLang={currentLang}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Render final briefing summary on the last Review page */}
          {isLastStep && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {currentLang === "hi"
                    ? "कृपया नीचे दिए गए अपने सभी दर्ज किए गए विवरणों की समीक्षा करें। ड्राफ्टिंग विजार्ड के किसी भी हिस्से को सही करने के लिए आप पिछले चरणों पर वापस जा सकते हैं।"
                    : "Please review all your entered parameters below. You can navigate back to previous sections to correct any part of the drafting intake."}
                </p>
              </div>

              <IntakeSummary
                blueprint={blueprint}
                answers={answers}
                currentLang={currentLang}
              />
            </div>
          )}

          <div className="h-px bg-slate-100 w-full" />

          {/* Stepper Buttons Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              {currentLang === "hi" ? "पीछे" : "Previous"}
            </button>

            {isLastStep ? (
              <button
                onClick={() => router.push(`/drafts/${blueprint.draftId}/completeness`)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition shadow active:scale-98"
              >
                {t.continue_to_completeness}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow ${
                  isCurrentSectionValid
                    ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-200 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                <span>{currentLang === "hi" ? "आगे" : "Next"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default IntakeWizard;
