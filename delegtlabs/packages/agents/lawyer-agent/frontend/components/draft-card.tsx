import React from "react";
import { Clock, Globe, Shield, ArrowRight, Sparkles } from "lucide-react";
import { DraftCatalogItem } from "../lib/draft-catalog";
import { getTranslation, Language } from "../lib/i18n";

interface DraftCardProps {
  item: DraftCatalogItem;
  currentLang: Language;
  onSelect: () => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  item,
  currentLang,
  onSelect
}) => {
  const t = getTranslation(currentLang);
  
  const titleText = currentLang === "hi" ? item.titleHi : item.title;
  const descText = currentLang === "hi" ? item.descriptionHi : item.description;
  const isComingSoon = item.status === "coming_soon";

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-50 text-green-700 border-green-200/50";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "hard":
        return "bg-red-50 text-red-700 border-red-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case "agreements":
        return t.cat_agreements;
      case "legal_notices":
        return t.cat_notices;
      case "family":
        return t.cat_family;
      case "criminal":
        return t.cat_criminal;
      case "civil":
        return t.cat_civil;
      case "affidavits":
        return t.cat_affidavits;
      case "lower_court":
        return t.cat_lower_court;
      case "high_court":
        return t.cat_high_court;
      case "bail_criminal":
        return t.cat_bail_criminal;
      default:
        return cat;
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isComingSoon) {
      const msg = currentLang === "hi" 
        ? "यह मसौदा वर्कफ़्लो तैयार किया जा रहा है।" 
        : "This draft workflow is being prepared.";
      alert(msg);
    } else {
      onSelect();
    }
  };

  return (
    <div 
      onClick={handleAction}
      className={`bg-white border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-5 cursor-pointer select-none ${
        isComingSoon 
          ? "border-slate-200 hover:border-slate-300 hover:shadow" 
          : "border-slate-200 hover:border-slate-800 hover:shadow-lg"
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-slate-600">
            {formatCategory(item.category)}
          </span>
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${getDifficultyColor(item.difficulty)}`}>
            {item.difficulty}
          </span>
          {isComingSoon ? (
            <span className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center space-x-1">
              <Sparkles className="h-2.5 w-2.5" />
              <span>{currentLang === "hi" ? "जल्द आ रहा है" : "Coming Soon"}</span>
            </span>
          ) : (
            <span className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-700">
              {currentLang === "hi" ? "उपलब्ध" : "Available"}
            </span>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-1.5">
          <h3 className={`font-bold text-slate-900 text-base line-clamp-1 ${isComingSoon ? "opacity-75" : ""}`}>
            {titleText}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {descText}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-px bg-slate-100 w-full" />

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">
              {item.estimatedTimeMinutes} {t.minutes_abbr}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium truncate max-w-[100px]" title={item.supportedStates.join(", ")}>
              {item.supportedStates[0]}
            </span>
          </div>
        </div>

        {/* Select Action Button */}
        {isComingSoon ? (
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-450 font-bold text-xs cursor-pointer hover:bg-slate-100 transition"
          >
            <span>{currentLang === "hi" ? "जल्द आ रहा है" : "Coming Soon"}</span>
          </button>
        ) : (
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-850 font-bold text-xs transition active:scale-[0.98]"
          >
            <span>{t.select_button}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DraftCard;
