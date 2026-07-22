import React from "react";
import { DraftBlueprint, DraftField } from "../../lib/draft-blueprints";
import { Language } from "../../lib/i18n";
import { AlertCircle, CheckCircle } from "lucide-react";

interface IntakeSummaryProps {
  blueprint: DraftBlueprint;
  answers: Record<string, any>;
  currentLang: Language;
}

export const IntakeSummary: React.FC<IntakeSummaryProps> = ({
  blueprint,
  answers,
  currentLang
}) => {
  const getFieldValDisplay = (field: DraftField): React.ReactNode => {
    const val = answers[field.id];
    if (val === undefined || String(val).trim() === "") {
      if (field.required) {
        return (
          <span className="inline-flex items-center text-red-500 font-bold space-x-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>Missing / अनुपस्थित</span>
          </span>
        );
      }
      return <span className="text-slate-400 font-medium italic">Not Provided / खाली</span>;
    }
    
    // For select fields, show readable label if available
    if (field.inputType === "select" && field.options) {
      const opt = field.options.find(o => o.value === val);
      if (opt) {
        return currentLang === "hi" && opt.labelHi ? opt.labelHi : opt.label;
      }
    }
    
    return String(val);
  };

  return (
    <div className="space-y-6 w-full">
      {blueprint.sections.map((sec) => {
        // Exclude the final review section itself from listing fields
        if (sec.id === "review") {
          return null;
        }

        const secTitle = currentLang === "hi" ? sec.titleHi : sec.title;
        
        // Collect all fields belonging to this section
        const secFields = [
          ...blueprint.requiredFields.filter(f => f.sectionId === sec.id),
          ...blueprint.recommendedFields.filter(f => f.sectionId === sec.id),
          ...blueprint.optionalFields.filter(f => f.sectionId === sec.id)
        ];

        return (
          <div key={sec.id} className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-5 space-y-3">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-wide uppercase border-b border-slate-200/50 pb-2">
              {secTitle}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {secFields.map((field) => {
                const label = currentLang === "hi" ? field.labelHi : field.label;
                return (
                  <div key={field.id} className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      {getFieldValDisplay(field)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IntakeSummary;
