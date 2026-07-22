import React from "react";
import { DraftBlueprint } from "../../lib/draft-blueprints";
import { getTranslation, Language } from "../../lib/i18n";
import { AlertCircle } from "lucide-react";

interface MissingFieldsListProps {
  blueprint: DraftBlueprint;
  missingFieldIds: string[];
  currentLang: Language;
}

export const MissingFieldsList: React.FC<MissingFieldsListProps> = ({
  blueprint,
  missingFieldIds,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  if (missingFieldIds.length === 0) {
    return null;
  }

  // Get field details from blueprint
  const missingFields = missingFieldIds
    .map((fid) => blueprint.requiredFields.find((f) => f.id === fid))
    .filter(Boolean);

  return (
    <div className="bg-white border border-red-200/80 shadow-sm rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-red-700 flex items-center space-x-2">
        <AlertCircle className="h-4.5 w-4.5" />
        <span>{t.missing_fields_title} ({missingFields.length})</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 sm:pl-7">
        {missingFields.map((field) => {
          if (!field) return null;
          const label = currentLang === "hi" ? field.labelHi : field.label;
          const sec = blueprint.sections.find((s) => s.id === field.sectionId);
          const secTitle = sec ? (currentLang === "hi" ? sec.titleHi : sec.title) : "";

          return (
            <div key={field.id} className="text-xs text-slate-600 font-medium flex flex-col space-y-0.5 bg-red-50/20 border border-red-100 p-2.5 rounded-xl">
              <span className="text-slate-800 font-bold">{label}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Section: {secTitle} ({field.id})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissingFieldsList;
