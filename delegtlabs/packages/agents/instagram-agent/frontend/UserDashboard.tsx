"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Settings } from "lucide-react";
import ConfigForm from "./ConfigForm";

export default function InstagramUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "reels">("config");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-bold text-slate-900">Instagram Content Creator</h1>
      </div>

      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "config" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Settings className="h-4 w-4" /> Content Config
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "reels" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
          }`}
        >
          <Camera className="h-4 w-4" /> Reels & Posts
        </button>
      </div>

      {activeTab === "config" && <ConfigForm slug={slug} />}
      {activeTab === "reels" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Generated Instagram Content</h3>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase">Top Performing Reel</span>
            <p className="text-sm font-medium text-slate-800">"3 AI automation tools you need in 2026 🚀"</p>
            <p className="text-xs text-slate-500">542 Likes • 89 Comments</p>
          </div>
        </div>
      )}
    </div>
  );
}
