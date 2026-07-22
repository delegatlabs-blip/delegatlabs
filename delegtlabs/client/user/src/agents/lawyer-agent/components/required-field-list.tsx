import React from "react";
import { DraftField } from "../lib/draft-blueprints";
import { Language } from "../lib/i18n";
import { Check } from "lucide-react";

interface RequiredFieldListProps {
  fields: DraftField[];
  currentLang: Language;
}

export const RequiredFieldList: React.FC<RequiredFieldListProps> = ({
  fields,
  currentLang
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1 sm:pl-7">
      {fields.map((field) => {
        const label = currentLang === "hi" ? field.labelHi : field.label;
        return (
          <div key={field.id} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <span className="p-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">
              <Check className="h-3 w-3" />
            </span>
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">({field.id})</span>
          </div>
        );
      })}
    </div>
  );
};

export default RequiredFieldList;
