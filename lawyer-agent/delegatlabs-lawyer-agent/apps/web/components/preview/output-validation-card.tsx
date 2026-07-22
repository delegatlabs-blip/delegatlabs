import React from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface OutputValidationCardProps {
  status: "passed" | "warning" | "failed";
  isReady: boolean;
  currentLang: Language;
}

export const OutputValidationCard: React.FC<OutputValidationCardProps> = ({
  status,
  isReady,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  const getStatusConfig = () => {
    switch (status) {
      case "passed":
        return {
          bg: "bg-green-50 border-green-200 text-green-700",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          title: currentLang === "hi" ? "सत्यापन सफल" : "Validation Passed",
          desc: currentLang === "hi" ? "दस्तावेज़ संरचना और आवश्यक तथ्य सत्यापित हैं।" : "Document structure and essential facts are verified."
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          title: currentLang === "hi" ? "चेतावनी मौजूद" : "Validation Warnings",
          desc: currentLang === "hi" ? "अनिवार्य तथ्य पूरे हैं, लेकिन कुछ अनुशंसित खंड गायब हो सकते हैं।" : "Required facts are complete, but some recommended clauses may be missing."
        };
      case "failed":
      default:
        return {
          bg: "bg-red-50 border-red-200 text-red-700",
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          title: currentLang === "hi" ? "सत्यापन विफल" : "Validation Failed",
          desc: currentLang === "hi" ? "आवश्यक तथ्य (नाम, किराया, आदि) गायब हैं या अपूर्ण हैं।" : "Essential facts (names, rent amount, etc.) are missing or incomplete."
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-4 border rounded-xl flex items-start space-x-3.5 shadow-sm ${config.bg}`}>
      <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
      <div className="space-y-0.5">
        <h4 className="font-extrabold text-xs sm:text-sm tracking-tight">{config.title}</h4>
        <p className="text-[11px] font-medium leading-relaxed opacity-90">{config.desc}</p>
        
        {isReady ? (
          <span className="inline-block mt-2 text-[9px] font-extrabold tracking-wider uppercase bg-green-600 text-white px-2 py-0.5 rounded shadow-sm">
            Ready for Export / प्रिंट करने के लिए तैयार
          </span>
        ) : (
          <span className="inline-block mt-2 text-[9px] font-extrabold tracking-wider uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
            Not Ready for Export / सुधार आवश्यक
          </span>
        )}
      </div>
    </div>
  );
};

export default OutputValidationCard;
