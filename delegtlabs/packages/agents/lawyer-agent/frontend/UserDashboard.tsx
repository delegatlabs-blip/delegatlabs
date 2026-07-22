"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Layers,
  Loader2,
  Scale,
  Settings,
  Sparkles,
} from "lucide-react";
import ConfigForm from "./ConfigForm";
import { generateDraft } from "./lib/api";

const TEMPLATES = [
  { id: "nda", title: "NDA", description: "Mutual or one-way non-disclosure" },
  { id: "service_agreement", title: "Service Agreement", description: "Scope, fees, and deliverables" },
  { id: "employment_contract", title: "Employment Contract", description: "Role, compensation, IP" },
  { id: "term_sheet", title: "Term Sheet", description: "Investment terms overview" },
];

type Stats = {
  status: string;
  recent_draft_count: number;
  drafts_this_month: number;
  avg_completeness: number;
};

type IntakeState = Record<string, string>;

const INTAKE_FIELDS = [
  { key: "party_a", label: "Party A (Disclosing / Employer)" },
  { key: "party_b", label: "Party B (Receiving / Employee)" },
  { key: "jurisdiction", label: "Governing jurisdiction" },
  { key: "effective_date", label: "Effective date" },
  { key: "term_months", label: "Term (months)" },
  { key: "consideration", label: "Consideration / fees" },
];

function compileLocalPreview(templateTitle: string, intake: IntakeState, overrides: string) {
  const facts = INTAKE_FIELDS.map((f) => `- **${f.label}:** ${intake[f.key] || `_[pending]_`}`).join("\n");
  return `# ${templateTitle}

## Structured facts
${facts}

## Custom instructions
${overrides || "_None_"}

---
_Compiled prompt package ready for generation._`;
}

export default function LawyerUserDashboard({ slug }: { slug: string }) {
  const [tab, setTab] = useState<"catalog" | "workbench" | "config">("catalog");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [intakeStep, setIntakeStep] = useState(0);
  const [intake, setIntake] = useState<IntakeState>({
    party_a: "",
    party_b: "",
    jurisdiction: "Uttar Pradesh",
    effective_date: "",
    term_months: "12",
    consideration: "",
  });
  const [overrides, setOverrides] = useState("");
  const [preview, setPreview] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/user/agents/${slug}/stats`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load lawyer stats");
        return res.json();
      })
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [slug]);

  const completeness = useMemo(() => {
    const filled = INTAKE_FIELDS.filter((f) => (intake[f.key] || "").trim().length > 0).length;
    return Math.round((filled / INTAKE_FIELDS.length) * 100);
  }, [intake]);

  const compiledPreview = useMemo(
    () => compileLocalPreview(selectedTemplate.title, intake, overrides),
    [intake, overrides, selectedTemplate],
  );

  const runGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateDraft(slug, {
        draftId: selectedTemplate.id,
        draftTitle: selectedTemplate.title,
        draftLanguage: "en",
        jurisdiction: intake.jurisdiction || "Uttar Pradesh",
        systemInstruction: "Draft a professional Indian legal document.",
        userInstruction: overrides || "Use intake facts only.",
        structuredFacts: {
          "Party Details": {
            "Owner Full Name": intake.party_a,
            "Tenant Full Name": intake.party_b,
          },
          "Agreement Terms": {
            "Agreement Duration (Months)": intake.term_months,
            "Agreement Start Date": intake.effective_date,
          },
          "Rent & Deposit": {
            "Monthly Rent Amount (INR)": intake.consideration,
            "Security Deposit Amount (INR)": "",
          },
          "Property Details": {
            "Property Full Address": "N/A",
          },
        },
        selectedClauses: [],
        guardrails: ["Do not invent case law"],
        outputRequirements: ["Markdown draft body"],
        validationSummary: `Completeness ${completeness}%`,
        customInstructions: overrides,
      });
      setPreview(result.draftText || compiledPreview);
      setTab("workbench");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const exportMarkdown = () => {
    const blob = new Blob([preview || compiledPreview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "catalog" as const, label: "Draft Catalog & Intake", icon: Layers },
    { id: "workbench" as const, label: "Generation Workbench", icon: Sparkles },
    { id: "config" as const, label: "Agent Configuration", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> My Agents
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Lawyer Drafting Agent</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {stats?.status || "active"}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Template: <span className="text-indigo-300">{selectedTemplate.title}</span>
            {" · "}
            Recent drafts: <span className="text-slate-200">{stats?.recent_draft_count ?? "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
          <Scale className="h-4 w-4 text-violet-300" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Completeness</p>
            <p className="text-lg font-semibold text-white">{completeness}%</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="flex gap-1 border-b border-white/10">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
                active
                  ? "border-violet-400 text-violet-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "catalog" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setIntakeStep(0);
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedTemplate.id === tpl.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-white/10 bg-[#111827] hover:border-white/20"
                }`}
              >
                <FileText className="mb-3 h-5 w-5 text-violet-300" />
                <h3 className="font-semibold text-white">{tpl.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{tpl.description}</p>
              </button>
            ))}
          </div>

          <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-white">
                Intake wizard · step {intakeStep + 1}/{INTAKE_FIELDS.length}
              </h2>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              {INTAKE_FIELDS[intakeStep].label}
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50"
              value={intake[INTAKE_FIELDS[intakeStep].key] || ""}
              onChange={(e) =>
                setIntake({ ...intake, [INTAKE_FIELDS[intakeStep].key]: e.target.value })
              }
            />
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                disabled={intakeStep === 0}
                onClick={() => setIntakeStep((s) => Math.max(0, s - 1))}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-40"
              >
                Back
              </button>
              {intakeStep < INTAKE_FIELDS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIntakeStep((s) => s + 1)}
                  className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("workbench")}
                  className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
                >
                  Open workbench
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "workbench" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-white/10 bg-[#111827] p-5">
            <h2 className="text-sm font-semibold text-white">Inputs & prompt compiler</h2>
            {INTAKE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs text-slate-500">{f.label}</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50"
                  value={intake[f.key] || ""}
                  onChange={(e) => setIntake({ ...intake, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs text-slate-500">Variable overrides / custom instructions</label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/50"
                value={overrides}
                onChange={(e) => setOverrides(e.target.value)}
                placeholder="e.g. Prefer Indian Contract Act phrasing…"
              />
            </div>
            <button
              type="button"
              disabled={generating}
              onClick={runGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate draft
            </button>
          </div>

          <div className="flex flex-col rounded-xl border border-white/10 bg-[#111827]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-white">Live compiled preview</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportMarkdown}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5"
                >
                  <Download className="h-3.5 w-3.5" /> Markdown
                </button>
                <button type="button" className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-500">
                  PDF
                </button>
                <button type="button" className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-500">
                  Word
                </button>
              </div>
            </div>
            <pre className="max-h-[640px] flex-1 overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-relaxed text-slate-300">
              {preview || compiledPreview}
            </pre>
          </div>
        </div>
      ) : null}

      {tab === "config" ? <ConfigForm slug={slug} /> : null}
    </div>
  );
}
