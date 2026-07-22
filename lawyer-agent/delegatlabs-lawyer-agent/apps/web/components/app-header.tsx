"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Scale, Languages } from "lucide-react";
import { getTranslation, Language } from "../lib/i18n";
import { setSelectedLanguage } from "../lib/storage";

interface AppHeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentLang, onLanguageChange }) => {
  const router = useRouter();
  const t = getTranslation(currentLang);

  const toggleLanguage = () => {
    const nextLang: Language = currentLang === "en" ? "hi" : "en";
    setSelectedLanguage(nextLang);
    onLanguageChange(nextLang);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => router.push("/dashboard")} 
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 active:scale-98 transition"
        >
          <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
            <Scale className="h-5 w-5 text-slate-800" />
          </div>
          <span className="text-md sm:text-lg font-bold text-slate-900 tracking-wide">
            {t.title}
          </span>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
          >
            <Languages className="h-4 w-4 text-slate-600" />
            <span>{currentLang === "en" ? "हिन्दी" : "English"}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default AppHeader;
