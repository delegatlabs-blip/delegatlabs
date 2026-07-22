import React from "react";
import { Language } from "../../lib/i18n";
import { Scale } from "lucide-react";

interface ClauseSummaryCardProps {
  clauses: { id: string; title: string; titleHi?: string }[];
  currentLang: Language;
}

export const ClauseSummaryCard: React.FC<ClauseSummaryCardProps> = ({
  clauses,
  currentLang
}) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {currentLang === "hi" ? "शामिल किए जाने वाले खंड" : "Clauses to Include"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {clauses.map((clause) => {
          const title = currentLang === "hi" && clause.titleHi ? clause.titleHi : clause.title;
          return (
            <div key={clause.id} className="flex items-center space-x-2 text-xs text-slate-600 font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <Scale className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate" title={title}>{title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClauseSummaryCard;
