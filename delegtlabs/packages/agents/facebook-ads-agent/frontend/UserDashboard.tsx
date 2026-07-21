"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, TrendingUp, DollarSign, Settings } from "lucide-react";
import ConfigForm from "./ConfigForm";

export default function FacebookUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "campaigns">("config");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-bold text-slate-900">Facebook Ads Optimizer</h1>
      </div>

      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "config" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Settings className="h-4 w-4" /> Campaign Configuration
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "campaigns" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Megaphone className="h-4 w-4" /> Active Campaigns
        </button>
      </div>

      {activeTab === "config" && <ConfigForm slug={slug} />}
      {activeTab === "campaigns" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Facebook Ad Campaigns & ROAS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Retargeting Campaign</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">4.2x ROAS</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">182 Conversions ($1,500 Budget)</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Lookalike 1% Intent</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">3.6x ROAS</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">240 Conversions ($2,500 Budget)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
