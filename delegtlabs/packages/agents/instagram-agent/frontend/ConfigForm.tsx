"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { InstagramConfig, defaultConfig } from "./config-schema";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<InstagramConfig>(defaultConfig);
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
          Instagram Content Creator configuration saved!
        </div>
      )}

      <h3 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
        Instagram Content Strategy & Pillars
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Content Pillars (comma separated)</label>
          <input
            type="text"
            value={config.content_pillars.join(", ")}
            onChange={(e) => setConfig({ ...config, content_pillars: e.target.value.split(",").map((s) => s.trim()) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Visual Aesthetic & Tone</label>
          <input
            type="text"
            value={config.visual_style}
            onChange={(e) => setConfig({ ...config, visual_style: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Hashtags Count per Post</label>
          <input
            type="number"
            value={config.hashtag_count}
            onChange={(e) => setConfig({ ...config, hashtag_count: parseInt(e.target.value) || 10 })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Auto Post Reels</label>
          <select
            value={config.auto_post_reels ? "true" : "false"}
            onChange={(e) => setConfig({ ...config, auto_post_reels: e.target.value === "true" })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="false">Save as Draft (Review First)</option>
            <option value="true">Auto Publish Reels</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Instagram Config"}
        </button>
      </div>
    </form>
  );
}
