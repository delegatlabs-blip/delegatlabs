"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
} from "lucide-react";
import ConfigForm from "./ConfigForm";
import { DRAFT_CATALOG, DraftCatalogItem } from "./lib/draft-catalog";
import { getBlueprint } from "./lib/draft-blueprints";
import { runCompletenessCheck } from "./lib/completeness-engine";
import { compileDraftPrompt } from "./lib/prompt-compiler";
import { defaultConfig, LawyerConfig } from "./config-schema";

type DraftStep = "catalog" | "intake" | "preview";

export default function LawyerUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "drafts">("drafts");
  const [config, setConfig] = useState<LawyerConfig>(defaultConfig);
  const [step, setStep] = useState<DraftStep>("catalog");
  const [selected, setSelected] = useState<DraftCatalogItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig({ ...defaultConfig, ...data });
        }
      } catch {
        /* keep defaults */
      }
    }
    loadConfig();
  }, [slug]);

  const blueprint = useMemo(() => (selected ? getBlueprint(selected.id) : null), [selected]);
  const completeness = useMemo(() => {
    if (!blueprint) return null;
    return runCompletenessCheck(blueprint, answers);
  }, [blueprint, answers]);

  const startDraft = (item: DraftCatalogItem) => {
    if (item.status !== "available") return;
    setSelected(item);
    setAnswers({});
    setDraftText("");
    setWarnings([]);
    setError(null);
    setStep("intake");
  };

  const generate = async () => {
    if (!selected || !blueprint || !completeness?.isReadyForGeneration) return;
    setGenerating(true);
    setError(null);
    try {
      const compiled = compileDraftPrompt({
        draftId: selected.id,
        draftTitle: selected.title,
        draftLanguage: config.draft_language,
        jurisdiction: config.jurisdiction,
        answers,
        blueprint,
      });
      const res = await fetch(`/api/user/agents/${slug}/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compiled),
      });
      if (!res.ok) {
        // Local mock fallback when API unavailable
        setDraftText(
          `${selected.title.toUpperCase()}\n\nGenerated offline mock draft for ${answers.owner_full_name || "[Party A]"} and ${answers.tenant_full_name || "[Party B]"}.\nJurisdiction: ${config.jurisdiction}.\n\n[Advocate review required.]`
        );
        setWarnings(["API unavailable — used offline preview."]);
        setStep("preview");
        return;
      }
      const data = await res.json();
      setDraftText(data.draftText || data.draft_text || "");
      setWarnings(data.warnings || []);
      setStep("preview");
    } catch (err) {
      console.error(err);
      setError("Failed to generate draft. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-amber-700/25 focus:ring-2";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-slate-300">|</span>
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lawyer Drafting Agent</h1>
          </div>
          <p className="text-sm text-slate-500">
            {config.firm_name || "Guided legal drafting"} · {config.jurisdiction}
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100/80 p-1">
        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === "drafts" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Draft Workspace
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === "config" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" /> Configuration
        </button>
      </div>

      {activeTab === "config" && <ConfigForm slug={slug} />}

      {activeTab === "drafts" && (
        <div className="space-y-6">
          {step !== "catalog" && (
            <button
              onClick={() => {
                if (step === "preview") setStep("intake");
                else {
                  setStep("catalog");
                  setSelected(null);
                }
              }}
              className="text-sm font-semibold text-amber-800 hover:underline"
            >
              ← {step === "preview" ? "Back to intake" : "Back to catalog"}
            </button>
          )}

          {step === "catalog" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {DRAFT_CATALOG.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.status !== "available"}
                  onClick={() => startDraft(item)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    item.status === "available"
                      ? "border-slate-200 bg-white shadow-sm hover:border-amber-300 hover:shadow-md"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {config.ui_language === "hi" ? item.titleHi : item.title}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        item.status === "available"
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status === "available" ? "Available" : "Soon"}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-slate-600">
                    {config.ui_language === "hi" ? item.descriptionHi : item.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> ~{item.estimatedTimeMinutes} min
                    </span>
                    <span className="capitalize">{item.difficulty}</span>
                    <span className="capitalize">{item.category.replace("_", " ")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === "intake" && selected && blueprint && completeness && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                    <p className="text-sm text-slate-600">Fill required fields, then generate a draft.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-800">{completeness.completionPercentage}%</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Complete</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                  <div
                    className="h-full rounded-full bg-amber-700 transition-all"
                    style={{ width: `${completeness.completionPercentage}%` }}
                  />
                </div>
              </div>

              {blueprint.sections.map((section) => {
                const fields = blueprint.requiredFields.filter((f) => f.sectionId === section.id);
                if (!fields.length) return null;
                return (
                  <div key={section.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-base font-bold text-slate-900">
                      {config.ui_language === "hi" ? section.titleHi : section.title}
                    </h3>
                    <p className="mb-4 text-sm text-slate-500">{section.description}</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.id} className={field.inputType === "textarea" ? "md:col-span-2" : ""}>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            {config.ui_language === "hi" ? field.labelHi : field.label}
                          </label>
                          {field.inputType === "textarea" ? (
                            <textarea
                              rows={3}
                              value={answers[field.id] || ""}
                              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                              className={inputClass}
                            />
                          ) : (
                            <input
                              type={field.inputType}
                              value={answers[field.id] || ""}
                              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                              placeholder={field.placeholder}
                              className={inputClass}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {completeness.warnings.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <ul className="list-disc pl-4">
                    {completeness.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!completeness.isReadyForGeneration || generating}
                  onClick={generate}
                  className="flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? "Generating..." : "Generate Draft"}
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Draft generated
              </div>
              {warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {warnings.join(" · ")}
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800">{draftText}</pre>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep("catalog");
                    setSelected(null);
                    setDraftText("");
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  New draft
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Print preview
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
