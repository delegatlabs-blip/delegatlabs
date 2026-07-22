"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { LawyerConfig, defaultConfig } from "./config-schema";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<LawyerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setConfig({ ...defaultConfig, ...data });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadConfig();
  }, [slug]);

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

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-amber-700/25 focus:ring-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Lawyer agent configuration saved.
        </div>
      )}

      <h3 className="border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">Firm & Drafting Defaults</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Firm Name</label>
          <input
            type="text"
            value={config.firm_name}
            onChange={(e) => setConfig({ ...config, firm_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Jurisdiction</label>
          <input
            type="text"
            value={config.jurisdiction}
            onChange={(e) => setConfig({ ...config, jurisdiction: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">UI Language</label>
          <select
            value={config.ui_language}
            onChange={(e) => setConfig({ ...config, ui_language: e.target.value as "en" | "hi" })}
            className={inputClass}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Default Draft Language</label>
          <select
            value={config.draft_language}
            onChange={(e) => setConfig({ ...config, draft_language: e.target.value as "en" | "hi" })}
            className={inputClass}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">AI Provider</label>
          <select
            value={config.ai_provider}
            onChange={(e) =>
              setConfig({
                ...config,
                ai_provider: e.target.value as LawyerConfig["ai_provider"],
              })
            }
            className={inputClass}
          >
            <option value="mock">Mock (default)</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
