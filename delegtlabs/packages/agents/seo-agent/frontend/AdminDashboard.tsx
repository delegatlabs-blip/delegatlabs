"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SEOAdminDashboard({ slug }: { slug: string }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/agents" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-2xl font-bold text-slate-900">SEO & Content Ranker — Admin Sub-Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Active Customers</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">16</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Attributed MRR</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">$3,984.00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Articles Generated</span>
          <p className="text-3xl font-bold text-emerald-600 mt-2">312</p>
        </div>
      </div>
    </div>
  );
}
