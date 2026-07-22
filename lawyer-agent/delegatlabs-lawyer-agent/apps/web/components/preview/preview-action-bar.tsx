import React from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { printDraft } from "../../lib/export-service";
import { ArrowLeft, Printer, Download, FileText } from "lucide-react";

interface PreviewActionBarProps {
  onBack: () => void;
  isReady: boolean;
  currentLang: Language;
}

export const PreviewActionBar: React.FC<PreviewActionBarProps> = ({
  onBack,
  isReady,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  return (
    <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 preview-action-bar">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition back-button"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{currentLang === "hi" ? "पूर्वावलोकन पर वापस जाएं" : "Back to Prompt Preview"}</span>
      </button>

      {/* Export triggers */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={printDraft}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow active:scale-98"
          title="Print Draft"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>{currentLang === "hi" ? "प्रिंट करें" : "Print Draft"}</span>
        </button>

        <button
          disabled
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed shadow-inner"
          title="DOCX Export - Coming Soon"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{currentLang === "hi" ? "DOCX - जल्द आ रहा है" : "DOCX - Coming Soon"}</span>
        </button>

        <button
          disabled
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs cursor-not-allowed shadow-inner"
          title="PDF Export - Coming Soon"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>{currentLang === "hi" ? "PDF - जल्द आ रहा है" : "PDF - Coming Soon"}</span>
        </button>
      </div>
    </div>
  );
};

export default PreviewActionBar;
