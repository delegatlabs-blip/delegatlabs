import React, { useState } from "react";
import { getTranslation, Language } from "../../lib/i18n";
import { Edit3, Save } from "lucide-react";

interface DraftDocumentPreviewProps {
  draftText: string;
  onSave: (updatedText: string) => void;
  currentLang: Language;
}

export const DraftDocumentPreview: React.FC<DraftDocumentPreviewProps> = ({
  draftText,
  onSave,
  currentLang
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(draftText);

  // Sync state if prop changes
  React.useEffect(() => {
    setEditedText(draftText);
  }, [draftText]);

  const handleSave = () => {
    onSave(editedText);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between action-header">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
          {currentLang === "hi" ? "दस्तावेज़ पाठ (संपादित करें)" : "Legal Document Preview"}
        </h3>
        
        {isEditing ? (
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition shadow active:scale-98"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{currentLang === "hi" ? "बदलाव सहेजें" : "Save Edited Draft"}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-400" />
            <span>{currentLang === "hi" ? "पाठ संपादित करें" : "Edit Draft Text"}</span>
          </button>
        )}
      </div>

      {/* A4 sheet page simulation card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-10 md:p-14 relative min-h-[500px] flex flex-col printable-document">
        {/* Red side margin line simulating court/bond stamp paper formats */}
        <div className="absolute top-0 bottom-0 left-[24px] sm:left-[45px] w-px bg-red-100/50 pointer-events-none margin-line" />

        {isEditing ? (
          <textarea
            rows={20}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full flex-grow p-4 border border-dashed border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-mono text-xs sm:text-sm leading-relaxed bg-slate-50/50 resize-none whitespace-pre-wrap ml-4 sm:ml-10"
          />
        ) : (
          <div className="font-mono text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-grow ml-4 sm:ml-10 printable-document-text">
            {draftText}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftDocumentPreview;
