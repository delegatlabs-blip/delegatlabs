import React from "react";
import { getTranslation, Language } from "../../lib/i18n";

interface IntakeProgressProps {
  currentStep: number;
  totalSteps: number;
  activeSectionTitle: string;
  completenessPercent: number;
  currentLang: Language;
}

export const IntakeProgress: React.FC<IntakeProgressProps> = ({
  currentStep,
  totalSteps,
  activeSectionTitle,
  completenessPercent,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  return (
    <div className="w-full bg-white border border-slate-200/80 shadow-sm p-5 rounded-2xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Step Index Label */}
        <div className="space-y-0.5">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {currentLang === "hi" 
              ? `चरण ${currentStep} कुल ${totalSteps} में से` 
              : `Step ${currentStep} of ${totalSteps}`}
          </span>
          <h2 className="text-base font-extrabold text-slate-800">
            {activeSectionTitle}
          </h2>
        </div>
        
        {/* Completeness metrics */}
        <div className="text-right sm:space-y-0.5">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {currentLang === "hi" ? "दस्तावेज़ पूर्णता स्थिति" : "Intake Completeness"}
          </span>
          <span className="text-base font-extrabold text-slate-800">
            {completenessPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/20">
        <div
          className={`h-full transition-all duration-300 ${
            completenessPercent === 100 ? "bg-green-500" : "bg-slate-900"
          }`}
          style={{ width: `${completenessPercent}%` }}
        />
      </div>
    </div>
  );
};

export default IntakeProgress;
