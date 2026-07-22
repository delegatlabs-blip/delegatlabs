"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Settings,
  Scale,
  Search,
  Sparkles,
  FileText,
  Briefcase,
  Plus,
  Clock,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle,
  Cpu,
} from "lucide-react";
import ConfigForm from "./ConfigForm";
import CategoryFilter from "./components/category-filter";
import DraftCard from "./components/draft-card";
import BlueprintSectionCard from "./components/blueprint-section-card";
import RequiredFieldList from "./components/required-field-list";
import ClauseList from "./components/clause-list";
import IntakeWizard from "./components/intake/intake-wizard";
import CompletenessSummaryCard from "./components/completeness/completeness-summary-card";
import MissingFieldsList from "./components/completeness/missing-fields-list";
import ValidationResults from "./components/completeness/validation-results";
import WarningsList from "./components/completeness/warnings-list";
import FactsSummaryCard from "./components/prompt/facts-summary-card";
import ClauseSummaryCard from "./components/prompt/clause-summary-card";
import GuardrailsCard from "./components/prompt/guardrails-card";
import OutputRequirementsCard from "./components/prompt/output-requirements-card";
import DeveloperPromptPreview from "./components/prompt/developer-prompt-preview";
import DraftDocumentPreview from "./components/preview/draft-document-preview";
import OutputValidationCard from "./components/preview/output-validation-card";
import OutputCheckList from "./components/preview/output-check-list";
import PreviewActionBar from "./components/preview/preview-action-bar";
import CaseCard from "./components/cases/case-card";
import ActiveCasesEmptyState from "./components/cases/active-cases-empty-state";
import { DRAFT_CATALOG, type DraftCatalogItem } from "./lib/draft-catalog";
import { getDraftBlueprint } from "./lib/draft-blueprints";
import { runCompletenessCheck } from "./lib/completeness-engine";
import { compileDraftPrompt, type CompiledPromptPackage } from "./lib/prompt-compiler";
import { validateGeneratedDraft, type OutputValidationResult } from "./lib/output-validator";
import { generateDraft } from "./lib/api";
import {
  getSelectedLanguage,
  setSelectedLanguage,
  getDraftLanguage,
  getDraftIntake,
  getDraftCustomInstructions,
  saveDraftCustomInstructions,
  getGeneratedDraft,
  saveGeneratedDraft,
} from "./lib/storage";
import {
  getActiveCases,
  saveActiveCase,
  getActiveCase,
  saveActiveCaseDraftContext,
  getActiveCaseDraftContext,
  updateCaseDraftLink,
  saveCaseDraftLink,
  CASE_ROLE_SUGGESTIONS,
  type CaseRecord,
  type CaseDraftContext,
  runStorageMigration,
} from "./lib/case-storage";
import { getTranslation, type Language } from "./lib/i18n";

type View =
  | "home"
  | "catalog"
  | "cases"
  | "case-new"
  | "case-detail"
  | "plan"
  | "intake"
  | "completeness"
  | "customize"
  | "generate"
  | "preview"
  | "settings";

export default function LawyerUserDashboard({ slug }: { slug: string }) {
  const [view, setView] = useState<View>("home");
  const [lang, setLang] = useState<Language>("en");
  const [draftLang, setDraftLang] = useState<"en" | "hi">("en");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<DraftCatalogItem | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [promptPackage, setPromptPackage] = useState<CompiledPromptPackage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [draftResult, setDraftResult] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<OutputValidationResult | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [caseFilter, setCaseFilter] = useState<"active" | "archived">("active");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [caseContext, setCaseContext] = useState<CaseDraftContext | null>(null);
  const [ready, setReady] = useState(false);

  // New case form
  const [newCase, setNewCase] = useState({
    caseTitle: "",
    caseType: "Rent",
    courtType: "Rent Control Authority",
    courtName: "",
    stage: "Final Arguments",
    partyAName: "",
    partyARole: "Landlord",
    partyBName: "",
    partyBRole: "Tenant",
    clientSide: "partyA" as "partyA" | "partyB",
  });

  useEffect(() => {
    runStorageMigration();
    setLang(getSelectedLanguage("en"));
    setDraftLang(getDraftLanguage("en"));
    setCases(getActiveCases());
    setReady(true);
  }, []);

  const t = getTranslation(lang);
  const blueprint = useMemo(
    () => (selected ? getDraftBlueprint(selected.id) : undefined),
    [selected]
  );
  const answers = useMemo(
    () => (selected ? getDraftIntake(selected.id) : {}),
    [selected, view]
  );
  const completeness = useMemo(() => {
    if (!blueprint) return null;
    return runCompletenessCheck(blueprint, answers, draftLang);
  }, [blueprint, answers, draftLang, view]);

  const filteredCatalog = useMemo(() => {
    return DRAFT_CATALOG.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.titleHi.includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.descriptionHi.includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const displayedCases = cases.filter((c) =>
    caseFilter === "archived" ? c.status === "archived" : c.status !== "archived"
  );
  const activeCase = activeCaseId ? getActiveCase(activeCaseId) : null;

  const setUiLang = (next: Language) => {
    setLang(next);
    setSelectedLanguage(next);
  };

  const openCatalog = () => {
    setView("catalog");
  };

  const selectDraft = (item: DraftCatalogItem) => {
    if (item.status !== "available") return;
    if (typeof window !== "undefined") {
      localStorage.setItem("delegatlabs_draft_language", draftLang);
    }
    setSelected(item);
    setCustomInstructions(getDraftCustomInstructions(item.id));
    setPromptPackage(null);
    setDraftResult(null);
    setValidation(null);
    setGenError("");
    setView("plan");
  };

  const startCaseDraft = (caseRecord: CaseRecord, item: DraftCatalogItem) => {
    const opposite =
      caseRecord.clientParty === "partyA" ? caseRecord.partyB : caseRecord.partyA;
    const context: CaseDraftContext = {
      caseId: caseRecord.id,
      draftId: item.id,
      caseTitle: caseRecord.caseTitle,
      caseType: caseRecord.caseType,
      clientName: caseRecord.clientName,
      clientRole: caseRecord.clientRole,
      oppositePartyName: opposite.name,
      oppositePartyRole: opposite.legalRole,
      courtType: caseRecord.courtType,
      courtName: caseRecord.courtName,
      caseNumber: caseRecord.caseNumber,
      cnrNumber: caseRecord.cnrNumber,
      firNumber: caseRecord.firNumber,
      policeStation: caseRecord.policeStation,
      sections: caseRecord.sections,
      stage: caseRecord.stage,
      previousDate: caseRecord.previousDate,
      nextDate: caseRecord.nextDate,
      remarks: caseRecord.remarks,
      nextAction: caseRecord.nextAction,
      createdAt: new Date().toISOString(),
    };
    saveActiveCaseDraftContext(context);
    saveCaseDraftLink({
      caseId: caseRecord.id,
      draftId: item.id,
      draftTitle: item.title,
      status: "started",
    });
    setCaseContext(context);
    selectDraft(item);
  };

  const goIntake = () => setView("intake");

  const onIntakeComplete = () => {
    setView("completeness");
  };

  const goCustomize = () => setView("customize");

  const goGenerate = () => {
    if (!selected || !blueprint) return;
    const compiled = compileDraftPrompt({
      draftId: selected.id,
      draftTitle: selected.title,
      draftLanguage: draftLang,
      answers: getDraftIntake(selected.id),
      blueprint,
      customInstructions: getDraftCustomInstructions(selected.id),
    });
    setPromptPackage(compiled);
    setView("generate");
  };

  const runGenerate = async () => {
    if (!promptPackage || !selected) return;
    setGenerating(true);
    setGenError("");
    try {
      const response = await generateDraft(slug, {
        draftId: promptPackage.draftId,
        draftTitle: promptPackage.draftTitle,
        draftLanguage: promptPackage.draftLanguage,
        jurisdiction: promptPackage.jurisdiction,
        systemInstruction: promptPackage.systemInstruction,
        userInstruction: promptPackage.userInstruction,
        structuredFacts: promptPackage.structuredFacts,
        selectedClauses: promptPackage.selectedClauses,
        guardrails: promptPackage.guardrails,
        outputRequirements: promptPackage.outputRequirements,
        validationSummary: promptPackage.validationSummary,
        customInstructions: promptPackage.customInstructions,
      });

      const context = getActiveCaseDraftContext();
      const isCaseMatch = context && context.draftId === selected.id;
      const responseWithMeta = {
        ...response,
        sourceType: isCaseMatch ? "case" : "standalone",
        sourceCaseId: isCaseMatch ? context?.caseId : undefined,
        sourceCaseTitle: isCaseMatch ? context?.caseTitle : undefined,
      };
      saveGeneratedDraft(selected.id, responseWithMeta);
      if (isCaseMatch && context) {
        updateCaseDraftLink(context.caseId, selected.id, { status: "generated" });
      }
      setDraftResult(responseWithMeta);
      const bp = getDraftBlueprint(selected.id);
      if (bp) {
        const audit = validateGeneratedDraft({
          draftId: selected.id,
          draftText: response.draftText,
          blueprint: bp,
          answers: getDraftIntake(selected.id),
          draftLanguage: draftLang,
        });
        setValidation(audit);
      }
      setView("preview");
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setGenerating(false);
    }
  };

  const openPreview = () => {
    if (!selected) return;
    const generated = getGeneratedDraft(selected.id);
    const bp = getDraftBlueprint(selected.id);
    if (generated && bp) {
      setDraftResult(generated);
      setValidation(
        validateGeneratedDraft({
          draftId: selected.id,
          draftText: String(generated.draftText || ""),
          blueprint: bp,
          answers: getDraftIntake(selected.id),
          draftLanguage: draftLang,
        })
      );
    }
    setView("preview");
  };

  const savePreviewText = (updatedText: string) => {
    if (!draftResult || !selected || !blueprint) return;
    const updated = { ...draftResult, draftText: updatedText };
    setDraftResult(updated);
    saveGeneratedDraft(selected.id, updated);
    setValidation(
      validateGeneratedDraft({
        draftId: selected.id,
        draftText: updatedText,
        blueprint,
        answers: getDraftIntake(selected.id),
        draftLanguage: draftLang,
      })
    );
  };

  const createCase = () => {
    if (!newCase.caseTitle.trim() || !newCase.courtName.trim() || !newCase.partyAName.trim() || !newCase.partyBName.trim()) {
      return;
    }
    const clientName =
      newCase.clientSide === "partyA" ? newCase.partyAName : newCase.partyBName;
    const clientRole =
      newCase.clientSide === "partyA" ? newCase.partyARole : newCase.partyBRole;
    const created = saveActiveCase({
      caseTitle: newCase.caseTitle,
      caseType: newCase.caseType,
      courtType: newCase.courtType,
      courtName: newCase.courtName,
      stage: newCase.stage,
      partyA: { name: newCase.partyAName, legalRole: newCase.partyARole },
      partyB: { name: newCase.partyBName, legalRole: newCase.partyBRole },
      clientParty: newCase.clientSide,
      clientRole,
      clientName,
    });
    setCases(getActiveCases());
    setActiveCaseId(created.id);
    setView("case-detail");
  };

  const onCaseTypeChange = (caseType: string) => {
    const roles = CASE_ROLE_SUGGESTIONS[caseType] || CASE_ROLE_SUGGESTIONS.Other;
    setNewCase((prev) => ({
      ...prev,
      caseType,
      partyARole: roles.firstRole,
      partyBRole: roles.secondRole,
    }));
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <div className="animate-pulse text-sm font-medium">Loading Lawyer Agent…</div>
      </div>
    );
  }

  const titleText = selected
    ? lang === "hi"
      ? selected.titleHi
      : selected.title
    : "";

  return (
    <div className="min-h-[70vh] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-stone-50 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white shadow">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Lawyer Agent
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              {lang === "hi"
                ? "मार्गदर्शित कानूनी मसौदा · मामले · सेटिंग्स"
                : "Guided legal drafting · Cases · Settings"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-[11px] font-bold">
            <button
              onClick={() => setUiLang("en")}
              className={`px-2.5 py-1.5 ${lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              EN
            </button>
            <button
              onClick={() => setUiLang("hi")}
              className={`px-2.5 py-1.5 ${lang === "hi" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              हिं
            </button>
          </div>
          <button
            onClick={() => setView("home")}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
              view === "home"
                ? "border-amber-700 bg-amber-700 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              setCases(getActiveCases());
              setView("cases");
            }}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
              view === "cases" || view === "case-new" || view === "case-detail"
                ? "border-amber-700 bg-amber-700 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              Cases
            </span>
          </button>
          <button
            onClick={() => setView("settings")}
            title={lang === "hi" ? "एजेंट सेटिंग्स" : "Manage agent settings"}
            className={`rounded-lg border p-2 transition ${
              view === "settings"
                ? "border-amber-700 bg-amber-700 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-label="Agent settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* HOME */}
      {view === "home" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900">
              {lang === "hi" ? "कानूनी मसौदा वर्कस्पेस" : "Legal Drafting Workspace"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {lang === "hi"
                ? "कैटलॉग से दस्तावेज़ चुनें, तथ्यों का सेवन करें, पूर्णता जाँचें, और प्रिंट-रेडी मसौदा बनाएँ।"
                : "Pick a document from the catalog, complete guided intake, verify completeness, then generate a print-ready draft."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={openCatalog}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4" />
                {lang === "hi" ? "नया मसौदा शुरू करें" : "Start New Draft"}
              </button>
              <button
                onClick={() => {
                  setCases(getActiveCases());
                  setView("cases");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Briefcase className="h-4 w-4" />
                {lang === "hi" ? "मामले प्रबंधित करें" : "Manage Cases"}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {lang === "hi" ? "उपलब्ध टेम्पलेट" : "Available Templates"}
              </h3>
              <button onClick={openCatalog} className="text-xs font-bold text-amber-800 hover:underline">
                {lang === "hi" ? "सभी देखें" : "View all"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {DRAFT_CATALOG.filter((d) => d.status === "available")
                .slice(0, 3)
                .map((item) => (
                  <DraftCard
                    key={item.id}
                    item={item}
                    currentLang={lang}
                    onSelect={() => selectDraft(item)}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* CATALOG */}
      {view === "catalog" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("home")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "होम पर वापस" : "Back to Home"}
          </button>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {lang === "hi" ? "मसौदा चुनें" : "Select a Draft"}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {lang === "hi"
                ? "दस्तावेज़ भाषा चुनें, फिर टेम्पलेट चुनकर योजना देखें।"
                : "Choose document language, then pick a template to open its drafting plan."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === "hi" ? "दस्तावेज़ भाषा" : "Document language"}
            </span>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-[11px] font-bold">
              <button
                onClick={() => setDraftLang("en")}
                className={`px-3 py-1.5 ${draftLang === "en" ? "bg-amber-700 text-white" : "bg-white text-slate-600"}`}
              >
                English
              </button>
              <button
                onClick={() => setDraftLang("hi")}
                className={`px-3 py-1.5 ${draftLang === "hi" ? "bg-amber-700 text-white" : "bg-white text-slate-600"}`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "hi" ? "टेम्पलेट खोजें…" : "Search templates…"}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-amber-700/20 focus:ring-2"
            />
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            currentLang={lang}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCatalog.map((item) => (
              <DraftCard
                key={item.id}
                item={item}
                currentLang={lang}
                onSelect={() => selectDraft(item)}
              />
            ))}
          </div>
          {filteredCatalog.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {lang === "hi" ? "कोई टेम्पलेट नहीं मिला।" : "No templates matched your filters."}
            </div>
          )}
        </div>
      )}

      {/* CASES LIST */}
      {view === "cases" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setView("home")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {lang === "hi" ? "होम पर वापस" : "Back to Home"}
            </button>
            <button
              onClick={() => setView("case-new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {lang === "hi" ? "नया मामला" : "Add Case"}
            </button>
          </div>

          <div className="flex gap-2">
            {(["active", "archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCaseFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold ${
                  caseFilter === f
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {f === "active"
                  ? lang === "hi"
                    ? "सक्रिय"
                    : "Active"
                  : lang === "hi"
                    ? "संग्रहीत"
                    : "Archived"}
              </button>
            ))}
          </div>

          {displayedCases.length === 0 ? (
            <ActiveCasesEmptyState
              message={
                lang === "hi"
                  ? "अभी कोई मामला नहीं है। नया मामला जोड़कर शुरू करें।"
                  : "No cases yet. Add a case to start linking drafts."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {displayedCases.map((c) => (
                <CaseCard
                  key={c.id}
                  caseRecord={c}
                  lang={lang}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setView("case-detail");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CASE NEW */}
      {view === "case-new" && (
        <div className="mx-auto max-w-2xl space-y-5">
          <button
            onClick={() => setView("cases")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "मामलों पर वापस" : "Back to Cases"}
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">
            {lang === "hi" ? "नया मामला जोड़ें" : "Add New Case"}
          </h2>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {(
              [
                ["caseTitle", "Case Title", "मामले का शीर्षक"],
                ["courtName", "Court Name", "न्यायालय का नाम"],
                ["partyAName", "Party A Name", "पक्षकार A नाम"],
                ["partyBName", "Party B Name", "पक्षकार B नाम"],
              ] as const
            ).map(([key, en, hi]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  {lang === "hi" ? hi : en}
                </label>
                <input
                  value={newCase[key]}
                  onChange={(e) => setNewCase({ ...newCase, [key]: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-700/25 focus:ring-2"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Case Type</label>
                <select
                  value={newCase.caseType}
                  onChange={(e) => onCaseTypeChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.keys(CASE_ROLE_SUGGESTIONS).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Client Side</label>
                <select
                  value={newCase.clientSide}
                  onChange={(e) =>
                    setNewCase({
                      ...newCase,
                      clientSide: e.target.value as "partyA" | "partyB",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="partyA">Party A ({newCase.partyARole})</option>
                  <option value="partyB">Party B ({newCase.partyBRole})</option>
                </select>
              </div>
            </div>
            <button
              onClick={createCase}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              {lang === "hi" ? "मामला सहेजें" : "Save Case"}
            </button>
          </div>
        </div>
      )}

      {/* CASE DETAIL */}
      {view === "case-detail" && activeCase && (
        <div className="space-y-5">
          <button
            onClick={() => setView("cases")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "मामलों पर वापस" : "Back to Cases"}
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
              {activeCase.caseType}
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900">{activeCase.caseTitle}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeCase.courtName} · {activeCase.stage}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-800">{activeCase.partyA.name}</div>
                <div className="text-slate-500">{activeCase.partyA.legalRole}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-800">{activeCase.partyB.name}</div>
                <div className="text-slate-500">{activeCase.partyB.legalRole}</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-600">
              Client: {activeCase.clientName} ({activeCase.clientRole})
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-800">
              {lang === "hi" ? "इस मामले से मसौदा शुरू करें" : "Start Draft from this Case"}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {DRAFT_CATALOG.filter((d) => d.status === "available").map((item) => (
                <DraftCard
                  key={item.id}
                  item={item}
                  currentLang={lang}
                  onSelect={() => startCaseDraft(activeCase, item)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAN */}
      {view === "plan" && selected && (
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => setView(caseContext ? "case-detail" : "catalog")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "वापस" : "Back"}
          </button>

          {caseContext && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-semibold text-amber-900">
              Linked to case: {caseContext.caseTitle}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{titleText}</h2>
            <p className="text-xs text-slate-500">
              {lang === "hi" ? selected.descriptionHi : selected.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                <Clock className="h-3 w-3" /> {selected.estimatedTimeMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                <Layers className="h-3 w-3" /> {selected.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                <FileText className="h-3 w-3" /> {draftLang.toUpperCase()}
              </span>
            </div>
          </div>

          {!blueprint ? (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-3 font-extrabold text-slate-800">
                {lang === "hi"
                  ? "इस टेम्पलेट के लिए पूर्ण ब्लूप्रिंट जल्द आ रहा है।"
                  : "Full blueprint coming soon for this template."}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Rent Agreement has the complete guided flow today. Other templates are listed for discovery.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === "hi" ? "अनुभाग योजना" : "Section Plan"}
                </h3>
                <div className="space-y-2">
                  {blueprint.sections.map((section) => (
                    <BlueprintSectionCard
                      key={section.id}
                      section={section}
                      currentLang={lang}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === "hi" ? "आवश्यक फ़ील्ड" : "Required Fields"}
                </h3>
                <RequiredFieldList fields={blueprint.requiredFields} currentLang={lang} />
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === "hi" ? "अनिवार्य खंड" : "Mandatory Clauses"}
                </h3>
                <ClauseList clauses={blueprint.mandatoryClauses} currentLang={lang} />
              </div>

              <button
                onClick={goIntake}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow hover:bg-slate-800"
              >
                {lang === "hi" ? "सेवन शुरू करें" : "Start Intake"}
              </button>
            </>
          )}
        </div>
      )}

      {/* INTAKE */}
      {view === "intake" && selected && blueprint && (
        <div className="space-y-4">
          <button
            onClick={() => setView("plan")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "योजना पर वापस" : "Back to Plan"}
          </button>
          <IntakeWizard
            blueprint={blueprint}
            currentLang={lang}
            onComplete={onIntakeComplete}
            onBackToCases={() => setView("cases")}
          />
        </div>
      )}

      {/* COMPLETENESS */}
      {view === "completeness" && selected && (
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => setView("intake")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.action_back_intake || "Back to Intake"}
          </button>

          {!blueprint || !completeness ? (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-3 font-extrabold text-slate-800">
                Completeness check coming soon for this draft.
              </h3>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t.completeness_header || "Completeness"} — {titleText}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review required fields and validation rules before generation.
                </p>
              </div>
              <CompletenessSummaryCard
                isReady={completeness.isReadyForGeneration}
                percentage={completeness.completionPercentage}
                completedRequired={completeness.completedRequiredFields}
                totalRequired={completeness.totalRequiredFields}
                currentLang={lang}
              />
              <MissingFieldsList
                blueprint={blueprint}
                missingFieldIds={completeness.missingRequiredFields}
                currentLang={lang}
              />
              <ValidationResults
                totalRules={completeness.totalValidationRules}
                passedRuleIds={completeness.passedValidationRules}
                failedRules={completeness.failedValidationRules}
                currentLang={lang}
              />
              <WarningsList warnings={completeness.warnings} currentLang={lang} />
              <button
                disabled={!completeness.isReadyForGeneration}
                onClick={goCustomize}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {lang === "hi" ? "अनुकूलन पर जाएँ" : "Continue to Customize"}
              </button>
            </>
          )}
        </div>
      )}

      {/* CUSTOMIZE */}
      {view === "customize" && selected && (
        <div className="mx-auto max-w-3xl space-y-6">
          <button
            onClick={() => setView("completeness")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "समीक्षा पर वापस" : "Back to Review"}
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {lang === "hi" ? "अनुकूल निर्देश" : "Custom Instructions"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Optional advocate directives appended to the generation prompt.
            </p>
          </div>
          <textarea
            value={customInstructions}
            onChange={(e) => {
              setCustomInstructions(e.target.value);
              saveDraftCustomInstructions(selected.id, e.target.value);
            }}
            rows={8}
            placeholder="Add clause that tenant cannot sublet the property…"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none ring-amber-700/20 focus:ring-2"
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Add clause that tenant cannot sublet the property.",
              "Add clause that rent will increase by 10% after 11 months.",
              "Add clause that owner will provide one parking space.",
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  const next = customInstructions ? `${customInstructions.trim()}\n${ex}` : ex;
                  setCustomInstructions(next);
                  saveDraftCustomInstructions(selected.id, next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                + {ex.slice(0, 42)}…
              </button>
            ))}
          </div>
          <button
            onClick={goGenerate}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow hover:bg-slate-800"
          >
            {lang === "hi" ? "प्रॉम्प्ट पूर्वावलोकन" : "Continue to Prompt Preview"}
          </button>
        </div>
      )}

      {/* GENERATE / PROMPT PREVIEW */}
      {view === "generate" && selected && promptPackage && (
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => setView("customize")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "अनुकूलन पर वापस" : "Back to Customize"}
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {lang === "hi" ? "प्रॉम्प्ट पूर्वावलोकन" : "Prompt Preview"} — {titleText}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Review compiled facts, clauses, and guardrails before generating.
            </p>
          </div>
          <FactsSummaryCard structuredFacts={promptPackage.structuredFacts} currentLang={lang} />
          <ClauseSummaryCard clauses={promptPackage.selectedClauses} currentLang={lang} />
          <GuardrailsCard guardrails={promptPackage.guardrails} />
          <OutputRequirementsCard requirements={promptPackage.outputRequirements} />
          <DeveloperPromptPreview
            systemInstruction={promptPackage.systemInstruction}
            userInstruction={promptPackage.userInstruction}
          />

          {genError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {genError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={runGenerate}
              disabled={generating}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cpu className="h-4 w-4" />
              )}
              {generating
                ? lang === "hi"
                  ? "उत्पन्न हो रहा है…"
                  : "Generating…"
                : lang === "hi"
                  ? "मसौदा उत्पन्न करें"
                  : "Generate Draft"}
            </button>
            {getGeneratedDraft(selected.id) && (
              <button
                onClick={openPreview}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Open Preview
              </button>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {view === "preview" && selected && (
        <div className="mx-auto max-w-5xl space-y-6">
          {!draftResult || !blueprint || !validation ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-extrabold text-slate-800">No generated draft found.</h3>
              <button
                onClick={() => setView("generate")}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                Go to Prompt Preview
              </button>
            </div>
          ) : (
            <>
              <PreviewActionBar
                onBack={() => setView("generate")}
                isReady={validation.isReadyForExport}
                currentLang={lang}
              />
              <OutputValidationCard
                status={validation.status}
                isReady={validation.isReadyForExport}
                currentLang={lang}
              />
              <OutputCheckList checks={validation.checks} currentLang={lang} />
              <DraftDocumentPreview
                draftText={String(draftResult.draftText || "")}
                onSave={savePreviewText}
                currentLang={lang}
              />
            </>
          )}
        </div>
      )}

      {/* SETTINGS (gear) */}
      {view === "settings" && (
        <div className="mx-auto max-w-3xl space-y-5">
          <button
            onClick={() => setView("home")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "hi" ? "होम पर वापस" : "Back to Home"}
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {lang === "hi" ? "एजेंट सेटिंग्स" : "Agent Settings"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Jurisdiction, languages, AI provider, and firm defaults for this lawyer agent.
            </p>
          </div>
          <ConfigForm slug={slug} />
        </div>
      )}
    </div>
  );
}
