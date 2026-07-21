"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { EmailConfig, defaultConfig } from "./config-schema";

export default function ConfigForm({ slug }: { slug: string }) {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
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
          Outbound Email Agent configuration saved!
        </div>
      )}

      <h3 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
        Cold Email Sending & Warmup Config
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Sending Domain / Subdomain</label>
          <input
            type="text"
            value={config.sending_domain}
            onChange={(e) => setConfig({ ...config, sending_domain: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Daily Email Sending Cap</label>
          <input
            type="number"
            value={config.daily_sending_limit}
            onChange={(e) => setConfig({ ...config, daily_sending_limit: parseInt(e.target.value) || 100 })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Reply-To Address</label>
          <input
            type="email"
            value={config.reply_to_email}
            onChange={(e) => setConfig({ ...config, reply_to_email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Domain Warmup Protocol</label>
          <select
            value={config.warmup_enabled ? "true" : "false"}
            onChange={(e) => setConfig({ ...config, warmup_enabled: e.target.value === "true" })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="true">Enabled (Automated Deliverability Warmup)</option>
            <option value="false">Disabled</option>
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
          {saving ? "Saving..." : "Save Email Config"}
        </button>
      </div>
    </form>
  );
}
