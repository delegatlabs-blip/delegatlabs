import React from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { CheckCircle, XCircle } from "lucide-react";

interface ValidationResultsProps {
  totalRules: number;
  passedRuleIds: string[];
  failedRules: { id: string; error: string; errorHi: string }[];
  currentLang: Language;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  totalRules,
  passedRuleIds,
  failedRules,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  // We can show dynamic checks list
  // To avoid hardcoding, we reconstruct the rules list based on the checks
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          {currentLang === "hi" ? "कानूनी सत्यापन नियम" : "Legal Validation Rules"}
        </h3>
        <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600">
          Passed: {passedRuleIds.length} / {totalRules}
        </span>
      </div>

      <div className="space-y-3">
        {/* Render Failed Rules */}
        {failedRules.map((rule) => {
          const errMsg = currentLang === "hi" ? rule.errorHi : rule.error;
          return (
            <div key={rule.id} className="flex items-start space-x-2.5 p-3 rounded-xl border border-red-200 bg-red-50/10 text-xs font-semibold text-red-700">
              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
              <span>{errMsg}</span>
            </div>
          );
        })}

        {/* Render General Passed Rules Indicator */}
        {passedRuleIds.length > 0 && (
          <div className="p-3 bg-slate-50/50 border border-slate-200/45 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">
              {t.validation_passed} ({passedRuleIds.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {passedRuleIds.map((pid) => {
                // Return a simple friendly tag/text for each passed rule
                const ruleName = getRuleFriendlyName(pid, currentLang);
                return (
                  <div key={pid} className="flex items-center space-x-2 text-[11px] font-semibold text-slate-500">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <span className="truncate">{ruleName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// Friendly mappings
const getRuleFriendlyName = (id: string, lang: Language): string => {
  const mapping: Record<string, { en: string; hi: string }> = {
    val_party_complete: { en: "Party details complete", hi: "पक्षकार विवरण पूर्ण है" },
    val_names_distinct: { en: "Owner and tenant are distinct", hi: "मकान मालिक/किरायेदार नाम अलग हैं" },
    val_rent_positive: { en: "Rent amount positive", hi: "किराया शून्य से अधिक है" },
    val_deposit_positive: { en: "Security deposit validated", hi: "सुरक्षा जमा राशि वैध है" },
    val_start_date: { en: "Start date present", hi: "प्रारंभ तिथि दर्ज है" },
    val_duration_months: { en: "Duration specified", hi: "अनुबंध अवधि दर्ज है" },
    notice_period_positive: { en: "Notice period specified", hi: "नोटिस अवधि दर्ज है" },
    val_jurisdiction: { en: "Jurisdiction city declared", hi: "क्षेत्राधिकार शहर घोषित है" },
    val_witnesses: { en: "Witness details validated", hi: "गवाहों का विवरण वैध है" },
    val_lang_selected: { en: "Draft language selected", hi: "मसौदा भाषा का चयन है" }
  };
  const val = mapping[id];
  if (!val) return id;
  return lang === "hi" ? val.hi : val.en;
};

export default ValidationResults;
