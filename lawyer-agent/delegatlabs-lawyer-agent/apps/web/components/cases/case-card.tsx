import React from "react";
import { CaseRecord } from "../../lib/case-storage";
import { Calendar, User, Scale } from "lucide-react";

interface CaseCardProps {
  caseRecord: CaseRecord;
  onClick: () => void;
  lang: "en" | "hi";
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseRecord,
  onClick,
  lang
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div className="space-y-2">
        {/* Case Badge & CNR */}
        <div className="flex items-center justify-between">
          <span className="inline-block text-[9px] font-extrabold tracking-wider uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded">
            {caseRecord.caseType}
          </span>
          {caseRecord.cnrNumber && (
            <span className="text-[9px] font-mono text-slate-400">
              CNR: {caseRecord.cnrNumber}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-sm text-slate-800 line-clamp-1">
          {caseRecord.caseTitle}
        </h3>

        {/* Court details */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold">
          <Scale className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {caseRecord.courtType} - {caseRecord.courtName}
          </span>
        </div>

        {/* Client details */}
        {caseRecord.clientName && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold">
            <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>
              {lang === "hi" ? "मुवक्किल" : "Client"}: {caseRecord.clientName} ({caseRecord.clientRole})
            </span>
          </div>
        )}
      </div>

      {/* Footer hearing timeline */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="space-y-0.5">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "hi" ? "चरण / सुनवाई" : "Case Stage"}
          </span>
          <span className="block font-bold text-slate-700">{caseRecord.stage}</span>
        </div>

        <div className="space-y-0.5 text-right">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "hi" ? "अगली तारीख" : "Next Date"}
          </span>
          <span className="inline-flex items-center space-x-1 font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span>{caseRecord.nextDate || (lang === "hi" ? "निश्चित नहीं" : "Not Fixed")}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;
