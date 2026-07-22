import React from "react";
import { Shield } from "lucide-react";

interface GuardrailsCardProps {
  guardrails: string[];
}

export const GuardrailsCard: React.FC<GuardrailsCardProps> = ({ guardrails }) => {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
        <Shield className="h-4 w-4 text-slate-500" />
        <span>Guardrails / एआई सुरक्षा नियम</span>
      </h3>
      <div className="space-y-2">
        {guardrails.map((g, i) => (
          <div key={i} className="text-xs text-slate-600 font-semibold leading-relaxed flex items-start space-x-2">
            <span className="h-1.5 w-1.5 bg-slate-900 rounded-full mt-1.5 flex-shrink-0" />
            <span>{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuardrailsCard;
