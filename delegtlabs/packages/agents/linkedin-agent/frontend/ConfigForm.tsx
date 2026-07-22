"use client";

import { useEffect, useState } from "react";
import { Plus, Save, CheckCircle2, Trash2, X } from "lucide-react";
import { LinkedInConfig, defaultConfig } from "./config-schema";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50";

export default function ConfigForm({
  slug,
  credentials,
}: {
  slug: string;
  credentials?: Array<{ provider: string; label: string; status: string }>;
}) {
  const [config, setConfig] = useState<LinkedInConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSource, setNewSource] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        if (!res.ok) throw new Error("Failed to load config");
        const data = await res.json();
        setConfig({
          lead_gen: { ...defaultConfig.lead_gen, ...data.lead_gen },
          post_gen: { ...defaultConfig.post_gen, ...data.post_gen },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Config load failed");
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

  const setWeight = (key: string, value: number) => {
    setConfig({
      ...config,
      post_gen: {
        ...config.post_gen,
        topic_weights: { ...config.post_gen.topic_weights, [key]: value },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {savedSuccess ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200">
          <CheckCircle2 className="h-5 w-5" /> Configuration saved.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Credential status</h3>
        <div className="flex flex-wrap gap-2">
          {(credentials || []).map((c) => (
            <span
              key={c.provider}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                c.status === "connected"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  c.status === "connected"
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                }`}
              />
              {c.label}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5 space-y-5">
        <h3 className="text-sm font-semibold text-white">Topic weights & content pillars</h3>
        <div className="space-y-4">
          {Object.entries(config.post_gen.topic_weights).map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span className="capitalize">{key.replaceAll("_", " ")}</span>
                <span>{Math.round(value * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Content pillar tags
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {config.post_gen.content_pillars.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    post_gen: {
                      ...config.post_gen,
                      content_pillars: config.post_gen.content_pillars.filter((t) => t !== tag),
                    },
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200"
              >
                {tag} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add pillar…"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                if (!newTag.trim()) return;
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    content_pillars: [...config.post_gen.content_pillars, newTag.trim()],
                  },
                });
                setNewTag("");
              }}
              className="rounded-lg border border-white/10 px-3 text-slate-300 hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Tone</label>
            <input
              className={inputClass}
              value={config.post_gen.tone}
              onChange={(e) =>
                setConfig({ ...config, post_gen: { ...config.post_gen, tone: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Approval mode</label>
            <select
              className={inputClass}
              value={config.post_gen.approval_mode}
              onChange={(e) =>
                setConfig({
                  ...config,
                  post_gen: {
                    ...config.post_gen,
                    approval_mode: e.target.value as LinkedInConfig["post_gen"]["approval_mode"],
                  },
                })
              }
            >
              <option value="review_first">Review first</option>
              <option value="auto_publish">Auto publish</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">News sources</h3>
        <ul className="space-y-2">
          {config.post_gen.news_sources.map((src) => (
            <li
              key={src}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
            >
              <span className="truncate font-mono text-xs">{src}</span>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    post_gen: {
                      ...config.post_gen,
                      news_sources: config.post_gen.news_sources.filter((s) => s !== src),
                    },
                  })
                }
                className="text-slate-500 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="https://…/feed/"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => {
              if (!newSource.trim()) return;
              setConfig({
                ...config,
                post_gen: {
                  ...config.post_gen,
                  news_sources: [...config.post_gen.news_sources, newSource.trim()],
                },
              });
              setNewSource("");
            }}
            className="rounded-lg border border-white/10 px-3 text-slate-300 hover:bg-white/5"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Lead criteria</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Roles</label>
            <input
              className={inputClass}
              value={config.lead_gen.target_job_titles.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    target_job_titles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Geography</label>
            <input
              className={inputClass}
              value={config.lead_gen.geography.join(", ")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: {
                    ...config.lead_gen,
                    geography: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
            />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Score threshold</span>
              <span>{config.lead_gen.score_threshold}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={config.lead_gen.score_threshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: { ...config.lead_gen, score_threshold: Number(e.target.value) },
                })
              }
              className="w-full accent-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-400">Connection message</label>
            <textarea
              rows={3}
              className={inputClass}
              value={config.lead_gen.connection_message_template}
              onChange={(e) =>
                setConfig({
                  ...config,
                  lead_gen: { ...config.lead_gen, connection_message_template: e.target.value },
                })
              }
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save configuration"}
        </button>
      </div>
    </form>
  );
}
