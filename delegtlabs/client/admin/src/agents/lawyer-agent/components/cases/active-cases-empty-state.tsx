import React from "react";
import { Folder } from "lucide-react";

interface ActiveCasesEmptyStateProps {
  message: string;
}

export const ActiveCasesEmptyState: React.FC<ActiveCasesEmptyStateProps> = ({ message }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl shadow-sm space-y-4">
      {/* Icon frame */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
        <Folder className="h-7 w-7" />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default ActiveCasesEmptyState;
