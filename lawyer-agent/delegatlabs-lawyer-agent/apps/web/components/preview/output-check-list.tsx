import React from "react";
import { ValidationCheckItem } from "../../lib/output-validator";
import { Language } from "../../lib/i18n";
import { Check, X } from "lucide-react";

interface OutputCheckListProps {
  checks: ValidationCheckItem[];
  currentLang: Language;
}

export const OutputCheckList: React.FC<OutputCheckListProps> = ({
  checks,
  currentLang
}) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {currentLang === "hi" ? "संरचनात्मक मिलान सूची" : "Document Consistency Checks"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checks.map((check) => {
          const name = currentLang === "hi" ? check.nameHi : check.name;
          const msg = currentLang === "hi" ? check.messageHi : check.message;
          return (
            <div
              key={check.id}
              className={`flex items-start space-x-2.5 p-3 rounded-xl border text-xs font-semibold ${
                check.passed
                  ? "bg-green-50/10 border-green-100 text-green-800"
                  : "bg-red-50/10 border-red-100 text-red-800"
              }`}
            >
              <span className={`p-0.5 rounded mt-0.5 flex-shrink-0 ${
                check.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}>
                {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <div className="space-y-0.5">
                <span className="block font-bold text-slate-800">{name}</span>
                <span className="block text-[10px] text-slate-400 font-medium leading-relaxed">
                  {msg}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OutputCheckList;
