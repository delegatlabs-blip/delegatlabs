"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Settings } from "lucide-react";
import ConfigForm from "./ConfigForm";

export default function EmailUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "sequences">("config");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-bold text-slate-900">Outbound Email Agent</h1>
      </div>

      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "config" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Settings className="h-4 w-4" /> Outbound Settings
        </button>
        <button
          onClick={() => setActiveTab("sequences")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "sequences" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Mail className="h-4 w-4" /> Cold Sequences
        </button>
      </div>

      {activeTab === "config" && <ConfigForm slug={slug} />}
      {activeTab === "sequences" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Active Email Sequences</h3>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Sequence #1</span>
            <p className="text-sm font-semibold text-slate-900">"Quick question regarding tech stack"</p>
            <p className="text-xs text-emerald-600 font-semibold">68% Open Rate • 14% Reply Rate</p>
          </div>
        </div>
      )}
    </div>
  );
}
