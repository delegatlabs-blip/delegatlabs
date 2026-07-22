import React from "react";
import { FileText } from "lucide-react";

interface OutputRequirementsCardProps {
  requirements: string[];
}

export const OutputRequirementsCard: React.FC<OutputRequirementsCardProps> = ({ requirements }) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
        <FileText className="h-4 w-4 text-slate-500" />
        <span>Output Format / ड्राफ्ट आउटपुट प्रारूप</span>
      </h3>
      <div className="space-y-2">
        {requirements.map((req, i) => (
          <div key={i} className="text-xs text-slate-600 font-semibold leading-relaxed flex items-start space-x-2">
            <span className="h-1.5 w-1.5 bg-slate-900 rounded-full mt-1.5 flex-shrink-0" />
            <span>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutputRequirementsCard;
