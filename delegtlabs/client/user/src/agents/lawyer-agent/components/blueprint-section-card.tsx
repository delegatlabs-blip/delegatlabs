import React from "react";
import { DraftSection } from "../lib/draft-blueprints";
import { Language } from "../lib/i18n";

interface BlueprintSectionCardProps {
  section: DraftSection;
  currentLang: Language;
}

export const BlueprintSectionCard: React.FC<BlueprintSectionCardProps> = ({
  section,
  currentLang
}) => {
  const titleText = currentLang === "hi" ? section.titleHi : section.title;
  const descText = currentLang === "hi" ? section.descriptionHi : section.description;

  return (
    <div className="flex items-start space-x-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/30">
      <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-lg bg-slate-900 text-white font-bold text-xs mt-0.5">
        {section.order}
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-xs sm:text-sm text-slate-800">{titleText}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">{descText}</p>
      </div>
    </div>
  );
};

export default BlueprintSectionCard;
