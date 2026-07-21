"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Settings } from "lucide-react";
import ConfigForm from "./ConfigForm";

export default function SEOUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "rankings">("config");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-bold text-slate-900">SEO & Content Ranker</h1>
      </div>

      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "config" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Settings className="h-4 w-4" /> SEO Keywords Config
        </button>
        <button
          onClick={() => setActiveTab("rankings")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "rankings" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Search className="h-4 w-4 text-emerald-600" /> Rankings & Articles
        </button>
      </div>

      {activeTab === "config" && <ConfigForm slug={slug} />}
      {activeTab === "rankings" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Ranked Keywords & Traffic</h3>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-xs font-bold text-emerald-600 uppercase">Rank #1 Keyword</span>
            <p className="text-sm font-semibold text-slate-900">"multi agent delegation platform"</p>
            <p className="text-xs text-slate-500">Search Volume: 840/mo • 3,420 Organic Clicks</p>
          </div>
        </div>
      )}
    </div>
  );
}
