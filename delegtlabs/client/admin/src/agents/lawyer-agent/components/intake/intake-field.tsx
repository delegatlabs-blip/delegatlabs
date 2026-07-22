import React from "react";
import { DraftField } from "../../lib/draft-blueprints";
import { Language } from "../../lib/i18n";

interface IntakeFieldProps {
  field: DraftField;
  value: any;
  onChange: (val: any) => void;
  currentLang: Language;
}

export const IntakeField: React.FC<IntakeFieldProps> = ({
  field,
  value = "",
  onChange,
  currentLang
}) => {
  const label = currentLang === "hi" ? field.labelHi : field.label;
  const placeholder = currentLang === "hi" ? field.placeholderHi : field.placeholder;
  const helperText = currentLang === "hi" ? field.helperTextHi : field.helperText;

  const baseInputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 text-sm font-medium text-slate-800 bg-white placeholder-slate-400 transition-all shadow-sm";

  return (
    <div className="space-y-1.5 w-full">
      {/* Label */}
      <label className="text-xs font-bold text-slate-700 flex items-center">
        <span>{label}</span>
        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>

      {/* Inputs */}
      {field.inputType === "text" && (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}

      {field.inputType === "number" && (
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}

      {field.inputType === "date" && (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}

      {field.inputType === "textarea" && (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} resize-none`}
        />
      )}

      {field.inputType === "select" && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208.825L1.175%204H10.825L6%208.825Z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_16px_center] bg-no-repeat`}
        >
          <option value="">
            {currentLang === "hi" ? "-- एक विकल्प चुनें --" : "-- Select Option --"}
          </option>
          {field.options?.map((opt) => {
            const optLabel = currentLang === "hi" && opt.labelHi ? opt.labelHi : opt.label;
            return (
              <option key={opt.value} value={opt.value}>
                {optLabel}
              </option>
            );
          })}
        </select>
      )}

      {/* Helper text */}
      {helperText && (
        <p className="text-[10px] text-slate-400 font-semibold pl-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default IntakeField;
