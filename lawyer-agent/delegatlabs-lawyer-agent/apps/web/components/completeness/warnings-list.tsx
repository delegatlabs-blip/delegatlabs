import React from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { AlertTriangle } from "lucide-react";

interface WarningsListProps {
  warnings: { id: string; text: string; textHi: string }[];
  currentLang: Language;
}

export const WarningsList: React.FC<WarningsListProps> = ({
  warnings,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-amber-200/80 shadow-sm rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-amber-800 flex items-center space-x-2">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
        <span>{t.warnings_title} ({warnings.length})</span>
      </h3>
      
      <div className="space-y-2.5">
        {warnings.map((warn) => {
          const text = currentLang === "hi" ? warn.textHi : warn.text;
          return (
            <div key={warn.id} className="text-xs text-slate-600 font-medium flex items-start space-x-2 p-2.5 rounded-xl border border-amber-100 bg-amber-50/10">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarningsList;
