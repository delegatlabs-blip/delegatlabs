"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { FacebookAdsConfig, defaultConfig } from "./config-schema";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<FacebookAdsConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch(`/api/user/agents/${slug}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Facebook Ads Optimizer configuration saved!
        </div>
      )}

      <h3 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
        Facebook Ads Campaign Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Ad Budget (USD)</label>
          <input
            type="number"
            value={config.monthly_budget_usd}
            onChange={(e) => setConfig({ ...config, monthly_budget_usd: parseFloat(e.target.value) || 1000 })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Target ROAS Multiplier</label>
          <input
            type="number"
            step="0.1"
            value={config.target_roas}
            onChange={(e) => setConfig({ ...config, target_roas: parseFloat(e.target.value) || 2.0 })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Target Countries</label>
          <input
            type="text"
            value={config.target_countries.join(", ")}
            onChange={(e) => setConfig({ ...config, target_countries: e.target.value.split(",").map((s) => s.trim()) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Ad Copy Tone</label>
          <input
            type="text"
            value={config.ad_copy_tone}
            onChange={(e) => setConfig({ ...config, ad_copy_tone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Facebook Ads Config"}
        </button>
      </div>
    </form>
  );
}
