"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectedLanguage } from "../../lib/storage";
import { getTranslation, Language } from "../../lib/i18n";
import { getActiveCases, CaseRecord } from "../../lib/case-storage";
import AppHeader from "../../components/app-header";
import ActiveCasesEmptyState from "../../components/cases/active-cases-empty-state";
import CaseCard from "../../components/cases/case-card";
import { Plus, ArrowLeft, Filter } from "lucide-react";

export default function CasesListPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<"active" | "archived">("active");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setCases(getActiveCases());
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

  const displayedCases = cases.filter(c => 
    filterStatus === "archived" ? c.status === "archived" : c.status !== "archived"
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard"}</span>
        </button>

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {filterStatus === "archived" ? t.archived : t.active_cases}
            </h1>
            <p className="text-xs text-slate-500">
              {t.cases_desc}
            </p>
          </div>
          
          <button
            onClick={() => router.push("/cases/new")}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>{t.add_active_case}</span>
          </button>
        </div>

        {/* Filter Toggle Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                filterStatus === "active"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.active}
            </button>
            <button
              onClick={() => setFilterStatus("archived")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                filterStatus === "archived"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.archived}
            </button>
          </div>
          
          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
            <Filter className="h-3 w-3" />
            <span>
              {lang === "hi" ? `कुल ${displayedCases.length} मामले` : `Total ${displayedCases.length} cases`}
            </span>
          </div>
        </div>

        {/* List grid */}
        {displayedCases.length === 0 ? (
          <ActiveCasesEmptyState 
            message={filterStatus === "archived" 
              ? (lang === "hi" ? "कोई संग्रहित मामला नहीं मिला।" : "No archived cases found.")
              : t.no_active_cases
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayedCases.map((c) => (
              <CaseCard 
                key={c.id}
                caseRecord={c}
                onClick={() => router.push(`/cases/${c.id}`)}
                lang={lang}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
