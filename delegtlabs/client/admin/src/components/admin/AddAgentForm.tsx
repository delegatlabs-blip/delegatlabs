"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Agent } from "@/lib/api";
import { adminApi } from "@/lib/api";

export type AddAgentFormValues = {
  name: string;
  slug: string;
  category: string;
  description: string;
  billing_unit: string;
  base_price_inr: string;
  base_price_usd: string;
  status: string;
  version: number;
};

const EMPTY_FORM: AddAgentFormValues = {
  name: "",
  slug: "",
  category: "linkedin",
  description: "",
  billing_unit: "flat_monthly",
  base_price_inr: "9999",
  base_price_usd: "119",
  status: "draft",
  version: 1,
};

const CATEGORIES = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "legal", label: "Legal" },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "Email" },
  { value: "seo", label: "SEO" },
  { value: "support", label: "Support" },
  { value: "pr", label: "PR" },
];

const BILLING_UNITS = [
  { value: "flat_monthly", label: "Flat Monthly" },
  { value: "per_post", label: "Per Post" },
  { value: "per_run", label: "Per Run" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "deprecated", label: "Deprecated" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

type AddAgentFormProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (agent: Agent) => void;
};

export function AddAgentForm({ open, onClose, onCreated }: AddAgentFormProps) {
  const [form, setForm] = useState<AddAgentFormValues>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      form.slug.trim().length > 1 &&
      form.category &&
      form.billing_unit &&
      Number(form.base_price_inr) >= 0 &&
      Number(form.base_price_usd) >= 0
    );
  }, [form]);

  if (!open) return null;

  function updateField<K extends keyof AddAgentFormValues>(key: K, value: AddAgentFormValues[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      description: form.description.trim() || null,
      billing_unit: form.billing_unit,
      base_price_inr: Number(form.base_price_inr).toFixed(2),
      base_price_usd: Number(form.base_price_usd).toFixed(2),
      status: form.status,
      version: Number(form.version) || 1,
      guardrail_config: {},
    };

    try {
      const created = await adminApi.createAgent(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      // Local fallback when API/DB is unavailable (matches listAgents dummy mode)
      const local: Agent = {
        id: crypto.randomUUID(),
        name: payload.name,
        slug: payload.slug,
        category: payload.category,
        description: payload.description,
        billing_unit: payload.billing_unit,
        base_price_inr: payload.base_price_inr,
        base_price_usd: payload.base_price_usd,
        status: payload.status,
        version: payload.version,
      };
      onCreated(local);
      onClose();
      console.warn("createAgent API unavailable; added locally", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px] sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-agent-title"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-white px-6 py-5">
          <div>
            <h2 id="add-agent-title" className="text-lg font-bold tracking-tight text-slate-900">
              Add Agent
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a new product in your agentic AI catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Agent Name
              </label>
              <input
                required
                autoFocus
                className="azia-input w-full"
                placeholder="e.g. Lawyer Drafting Agent"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Agent ID / Slug
              </label>
              <input
                required
                className="azia-input w-full font-mono text-sm"
                placeholder="lawyer-agent"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", slugify(e.target.value));
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </label>
              <select
                className="azia-input w-full"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea
                rows={3}
                className="azia-input w-full resize-y"
                placeholder="Short product description shown on the agent card."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Billing
              </label>
              <select
                className="azia-input w-full"
                value={form.billing_unit}
                onChange={(e) => updateField("billing_unit", e.target.value)}
              >
                {BILLING_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                className="azia-input w-full"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price (INR)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ₹
                </span>
                <input
                  required
                  type="number"
                  min={0}
                  step="1"
                  className="azia-input w-full pl-7"
                  value={form.base_price_inr}
                  onChange={(e) => updateField("base_price_inr", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price (USD)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  $
                </span>
                <input
                  required
                  type="number"
                  min={0}
                  step="1"
                  className="azia-input w-full pl-7"
                  value={form.base_price_usd}
                  onChange={(e) => updateField("base_price_usd", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Version
              </label>
              <input
                type="number"
                min={1}
                className="azia-input w-full"
                value={form.version}
                onChange={(e) => updateField("version", Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
