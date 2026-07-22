import React from "react";
import { DraftSection, DraftField } from "../../lib/draft-blueprints";
import { getTranslation, Language } from "../../lib/i18n";
import { CheckCircle } from "lucide-react";

interface IntakeSectionNavProps {
  sections: DraftSection[];
  activeSectionId: string;
  onSectionClick: (sectionId: string) => void;
  answers: Record<string, any>;
  requiredFields: DraftField[];
  currentLang: Language;
}

export const IntakeSectionNav: React.FC<IntakeSectionNavProps> = ({
  sections,
  activeSectionId,
  onSectionClick,
  answers,
  requiredFields,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  const isSectionComplete = (secId: string): boolean => {
    // Collect required fields for this section
    const secRequiredFields = requiredFields.filter((f) => f.sectionId === secId);
    if (secRequiredFields.length === 0) {
      return true;
    }
    return secRequiredFields.every(
      (f) => answers[f.id] !== undefined && String(answers[f.id]).trim() !== ""
    );
  };

  return (
    <div className="flex flex-col space-y-1 w-full bg-white border border-slate-200/80 shadow-sm p-4 rounded-2xl">
      <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 pl-2">
        {currentLang === "hi" ? "दस्तावेज़ अनुभाग" : "Sections"}
      </h3>
      {sections.map((sec) => {
        const isActive = sec.id === activeSectionId;
        const isComplete = isSectionComplete(sec.id);
        const title = currentLang === "hi" ? sec.titleHi : sec.title;

        return (
          <button
            key={sec.id}
            onClick={() => onSectionClick(sec.id)}
            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
              isActive
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <span className="truncate">{title}</span>
            {isComplete ? (
              <CheckCircle className={`h-4 w-4 flex-shrink-0 ml-2 ${isActive ? "text-white" : "text-green-500"}`} />
            ) : (
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ml-2 ${isActive ? "bg-white" : "bg-slate-300"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default IntakeSectionNav;
