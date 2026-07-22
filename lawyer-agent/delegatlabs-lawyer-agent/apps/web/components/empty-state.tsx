import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionLabel,
  onActionClick
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl shadow-sm space-y-4">
      {/* Icon frame */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
        <FileText className="h-7 w-7" />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
        {message}
      </p>

      {/* Optional action button */}
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
