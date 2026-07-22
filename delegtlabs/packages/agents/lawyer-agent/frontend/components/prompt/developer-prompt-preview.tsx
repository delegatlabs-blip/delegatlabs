import React, { useState } from "react";
import { ChevronDown, ChevronUp, Code, AlertTriangle } from "lucide-react";

interface DeveloperPromptPreviewProps {
  systemInstruction: string;
  userInstruction: string;
}

export const DeveloperPromptPreview: React.FC<DeveloperPromptPreviewProps> = ({
  systemInstruction,
  userInstruction
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
      {/* Collapse button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-xs sm:text-sm text-slate-700 hover:text-slate-900 transition"
      >
        <div className="flex items-center space-x-2">
          <Code className="h-4 w-4 text-slate-500" />
          <span>Developer Prompt Preview (AI-View Only)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 pt-2 transition-all">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-semibold rounded-xl flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              This section is visible in development mode only. In production, prompt compilation packages are sent directly to the model API endpoints behind the scenes.
            </span>
          </div>

          {/* System Instructions */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              System Instruction / सिस्टम निर्देश
            </h4>
            <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[10px] sm:text-xs font-mono overflow-auto max-h-60 leading-relaxed whitespace-pre-wrap">
              {systemInstruction}
            </pre>
          </div>

          {/* User Instructions */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              User Instruction / उपयोगकर्ता निर्देश
            </h4>
            <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[10px] sm:text-xs font-mono overflow-auto max-h-60 leading-relaxed whitespace-pre-wrap">
              {userInstruction}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperPromptPreview;
