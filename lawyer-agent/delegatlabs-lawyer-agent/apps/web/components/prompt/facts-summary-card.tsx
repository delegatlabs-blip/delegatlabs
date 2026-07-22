import React from "react";
import { Language } from "../../lib/i18n";
import { Check } from "lucide-react";

interface FactsSummaryCardProps {
  structuredFacts: Record<string, any>;
  currentLang: Language;
}

export const FactsSummaryCard: React.FC<FactsSummaryCardProps> = ({
  structuredFacts,
  currentLang
}) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {currentLang === "hi" ? "दर्ज किए गए तथ्य" : "Collected Facts"}
      </h3>
      <div className="space-y-4">
        {Object.entries(structuredFacts).map(([sectionTitle, fields]) => (
          <div key={sectionTitle} className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
              {sectionTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(fields).map(([label, val]) => (
                <div key={label} className="text-xs flex flex-col space-y-0.5">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{label}</span>
                  <span className="text-slate-700 font-semibold truncate" title={String(val)}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FactsSummaryCard;
