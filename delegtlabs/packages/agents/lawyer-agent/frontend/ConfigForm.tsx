"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { LawyerConfig, defaultConfig } from "./config-schema";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<LawyerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        if (!res.ok) throw new Error("Failed to load config");
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setConfig({ ...defaultConfig, ...data });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      }
    }
    loadConfig();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      const res = await fetch(`/api/user/agents/${slug}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-[#111827] p-6">
      {savedSuccess ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200">
          <CheckCircle2 className="h-5 w-5" /> Lawyer agent configuration saved.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <h3 className="border-b border-white/10 pb-2 text-sm font-semibold text-white">
        Jurisdiction, parties & model
      </h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">Firm / party default name</label>
          <input
            type="text"
            value={config.firm_name}
            onChange={(e) => setConfig({ ...config, firm_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">Jurisdiction default</label>
          <input
            type="text"
            value={config.jurisdiction}
            onChange={(e) => setConfig({ ...config, jurisdiction: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">UI language</label>
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
          <label className="mb-1 block text-xs font-semibold text-slate-400">Default draft language</label>
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
          <label className="mb-1 block text-xs font-semibold text-slate-400">Model preference</label>
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
          className="flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save configuration"}
        </button>
      </div>
    </form>
  );
}
