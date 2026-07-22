"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectedLanguage } from "../../lib/storage";
import { getTranslation, Language } from "../../lib/i18n";
import { getActiveCases, CaseRecord } from "../../lib/case-storage";
import AppHeader from "../../components/app-header";
import EmptyState from "../../components/empty-state";
import CaseCard from "../../components/cases/case-card";
import { Plus, HelpCircle, FileText, Scale } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setCases(getActiveCases().filter(c => c.status !== "archived"));
    setIsClient(true);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  // Dynamic titles/subtitles
  const headingText = lang === "hi" ? "कानूनी प्रारूपण डैशबोर्ड" : "Legal Drafting Dashboard";
  const subtitleText = lang === "hi" 
    ? "निर्देशित चरणों के साथ कानूनी मसौदे बनाएं, समीक्षा करें और प्रिंट करें।" 
    : "Create, review, and print legal drafts with guided steps.";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main dashboard content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {headingText}
            </h1>
            <p className="text-xs text-slate-500">
              {subtitleText}
            </p>
          </div>
          
          <button
            onClick={() => router.push("/drafts/new")}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow shadow-slate-950/20 active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>{t.create_new_draft}</span>
          </button>
        </div>

        {/* Layout column splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Recent Drafts & Active Cases */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Drafts Section */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                {t.recent_drafts}
              </h2>
              <EmptyState 
                message={lang === "hi" ? "कोई हालिया मसौदा नहीं मिला।" : "No recent drafts found."}
              />
            </div>

            {/* Active Cases Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h2 className="text-md font-bold text-slate-900 tracking-wide uppercase">
                    {t.active_cases}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {t.cases_desc}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push("/cases")}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    {t.view_cases}
                  </button>
                  <button
                    onClick={() => router.push("/cases/new")}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow active:scale-98"
                  >
                    {t.add_active_case}
                  </button>
                </div>
              </div>

              {cases.length === 0 ? (
                <EmptyState 
                  message={t.no_active_cases}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cases.slice(0, 4).map((c) => (
                    <CaseCard 
                      key={c.id}
                      caseRecord={c}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: User Guidance */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "मार्गदर्शन" : "Advocate Guidance"}</span>
              </h3>
              
              <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
                <p>
                  {lang === "hi" 
                    ? "डेलीगेटलैब्स में आपका स्वागत है। V1.5 में, आप अपने सक्रिय मुकदमों को सहेज सकते हैं और उन्हें व्यवस्थित रख सकते हैं।" 
                    : "Welcome to DelegatLabs. In V1.5, you can save active cases to keep deponent details structured."}
                </p>
                <p>
                  {lang === "hi" 
                    ? "मामले सहेजने से भविष्य में इनटेक फ़ॉर्म में मुवक्किल और अदालत का विवरण स्वतः भरने में सहायता मिलेगी।" 
                    : "Saving cases will later allow pre-filling client and court particulars in guided intake steps."}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
