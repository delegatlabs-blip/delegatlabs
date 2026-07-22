"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { setSelectedLanguage } from "../lib/storage";
import { Scale } from "lucide-react";

export const LanguageSelector: React.FC = () => {
  const router = useRouter();

  const handleLanguageSelect = (lang: "en" | "hi") => {
    setSelectedLanguage(lang);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 flex flex-col items-center text-center space-y-8">
        
        {/* Professional emblem icon container */}
        <div className="p-4 bg-slate-100 rounded-full border border-slate-200/60 shadow-inner">
          <Scale className="h-10 w-10 text-slate-800" />
        </div>

        {/* Bilingual Header Title */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            Choose your language / अपनी भाषा चुनें
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            DelegatLabs Lawyer Agent
          </p>
        </div>

        <div className="w-full h-px bg-slate-100" />

        {/* Language Selection Buttons */}
        <div className="flex flex-col space-y-3.5 w-full">
          <button
            onClick={() => handleLanguageSelect("en")}
            className="w-full py-4 px-6 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-800 font-semibold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            English
          </button>
          <button
            onClick={() => handleLanguageSelect("hi")}
            className="w-full py-4 px-6 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-800 font-semibold transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            हिन्दी
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
