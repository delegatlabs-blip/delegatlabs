"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { LinkedInConfig, defaultConfig } from "./config-schema";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<LinkedInConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setConfig(data);
          }
        }
      } catch (err) {
        console.error("Failed loading agent config", err);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          LinkedIn agent configuration saved and persisted successfully!
        </div>
      )}

      {/* Lead Generation Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Lead Generation Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target Job Titles (comma separated)</label>
            <input
              type="text"
              value={config.lead_gen.target_job_titles.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    target_job_titles: e.target.value.split(",").map((s) => s.trim()),
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Target Industries (comma separated)</label>
            <input
              type="text"
              value={config.lead_gen.industries.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    industries: e.target.value.split(",").map((s) => s.trim()),
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company Size Ranges</label>
            <input
              type="text"
              value={config.lead_gen.company_size.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    company_size: e.target.value.split(",").map((s) => s.trim()),
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Daily Connection Cap</label>
            <input
              type="number"
              value={config.lead_gen.daily_connection_cap}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    daily_connection_cap: parseInt(e.target.value) || 10,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Connection Message Template</label>
            <textarea
              rows={3}
              value={config.lead_gen.connection_message_template}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    connection_message_template: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Post Generation Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Post Generation Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Content Pillars (comma separated)</label>
            <input
              type="text"
              value={config.post_gen.content_pillars.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    content_pillars: e.target.value.split(",").map((s) => s.trim()),
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tone & Voice</label>
            <input
              type="text"
              value={config.post_gen.tone}
              onChange={(e) =>
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    tone: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Posting Frequency</label>
            <select
              value={config.post_gen.posting_frequency}
              onChange={(e) =>
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    posting_frequency: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily">1x Daily</option>
              <option value="3x_per_week">3x per Week</option>
              <option value="weekly">1x Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Approval Mode</label>
            <select
              value={config.post_gen.approval_mode}
              onChange={(e) =>
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    approval_mode: e.target.value as "auto_publish" | "review_first",
                  },
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="review_first">Review First (Save as Draft)</option>
              <option value="auto_publish">Auto Publish</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Configuration..." : "Save Agent Configuration"}
        </button>
      </div>
    </form>
  );
}
