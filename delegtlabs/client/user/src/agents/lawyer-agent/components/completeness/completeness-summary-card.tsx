import React from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface CompletenessSummaryCardProps {
  isReady: boolean;
  percentage: number;
  completedRequired: number;
  totalRequired: number;
  currentLang: Language;
}

export const CompletenessSummaryCard: React.FC<CompletenessSummaryCardProps> = ({
  isReady,
  percentage,
  completedRequired,
  totalRequired,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Left side: Status badge and title */}
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full border ${
          isReady 
            ? "bg-green-50 border-green-200 text-green-600" 
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {isReady ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : (
            <AlertTriangle className="h-8 w-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Status
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
            {isReady ? t.ready_status : t.missing_status}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {t.fields_completed}: {completedRequired} / {totalRequired}
          </p>
        </div>
      </div>

      {/* Right side: Completeness bar */}
      <div className="w-full md:w-64 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Completeness / पूर्णता</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/20">
          <div
            className={`h-full transition-all duration-300 ${
              isReady ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default CompletenessSummaryCard;
