import React from "react";
import { DraftClause } from "../lib/draft-blueprints";
import { Language } from "../lib/i18n";
import { Scale } from "lucide-react";

interface ClauseListProps {
  clauses: DraftClause[];
  currentLang: Language;
}

export const ClauseList: React.FC<ClauseListProps> = ({
  clauses,
  currentLang
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 sm:pl-7">
      {clauses.map((clause) => {
        const title = currentLang === "hi" ? clause.titleHi : clause.title;
        return (
          <div key={clause.id} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <span className="p-1 bg-slate-100 rounded text-slate-500">
              <Scale className="h-3 w-3" />
            </span>
            <span className="truncate">{title}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ClauseList;
