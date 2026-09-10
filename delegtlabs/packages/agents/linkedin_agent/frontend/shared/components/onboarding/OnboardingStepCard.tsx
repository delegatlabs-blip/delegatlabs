import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { cn } from "@shared/lib/utils";

export type OnboardingQuestion = {
  id: string;
  text: string;
  type: "single" | "multi";
  options: string[];
};

export type OnboardingLabels = {
  skip: string;
  continue: string;
  somethingElse: string;
  somethingElsePlaceholder: string;
  selectedCount: (n: number) => string;
  questionProgress: (x: number, y: number) => string;
  retry: string;
  saveFailed: string;
  emptyTitle: string;
  emptyDescription: string;
  close: string;
  previous: string;
  next: string;
};

export const defaultOnboardingLabels: OnboardingLabels = {
  skip: "Skip",
  continue: "Continue",
  somethingElse: "Something else",
  somethingElsePlaceholder: "Type your answer…",
  selectedCount: (n) => `${n} selected`,
  questionProgress: (x, y) => `${x} of ${y}`,
  retry: "Retry",
  saveFailed: "Couldn’t save. Check your connection and retry.",
  emptyTitle: "No questions yet",
  emptyDescription: "Onboarding questions are unavailable. Try again later.",
  close: "Close",
  previous: "Previous question",
  next: "Next question",
};

export type OnboardingStepCardProps = {
  questions: OnboardingQuestion[];
  currentIndex?: number;
  resumeFromIndex?: number;
  answers?: Record<string, string | string[]>;
  onAnswer: (questionId: string, value: string | string[]) => Promise<void>;
  onSkip?: (questionId: string) => void;
  onBack?: (index: number) => void;
  onClose?: () => void;
  labels?: Partial<OnboardingLabels>;
  className?: string;
};

export function OnboardingStepCard({
  questions,
  currentIndex: controlledIndex,
  resumeFromIndex,
  answers: initialAnswers = {},
  onAnswer,
  onSkip,
  onBack,
  onClose,
  labels: labelsProp,
  className,
}: OnboardingStepCardProps) {
  const labels = { ...defaultOnboardingLabels, ...labelsProp };
  const liveId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const firstUnanswered = (() => {
    if (typeof resumeFromIndex === "number") return resumeFromIndex;
    const idx = questions.findIndex((q) => initialAnswers[q.id] == null);
    return idx === -1 ? 0 : idx;
  })();

  const [index, setIndex] = useState(
    typeof controlledIndex === "number" ? controlledIndex : firstUnanswered,
  );
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [focusOpt, setFocusOpt] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [saving, setSaving] = useState(false);
  const [retryValue, setRetryValue] = useState<string | string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof controlledIndex === "number") setIndex(controlledIndex);
  }, [controlledIndex]);

  useEffect(() => {
    const q = questions[index];
    if (!q) return;
    const existing = answers[q.id];
    if (q.type === "multi" && Array.isArray(existing)) setMultiSel(existing);
    else setMultiSel([]);
    setCustomOpen(false);
    setCustomText("");
    setFocusOpt(0);
    setError(null);
    setRetryValue(null);
  }, [index, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap while open
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKeyDown);
    listFocus(focusables());
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [index, customOpen, error]);

  function listFocus(list: HTMLElement[]) {
    const prefer = optionRefs.current[0] || list[0];
    prefer?.focus();
  }

  const total = questions.length;
  const question = questions[index];

  const persist = useCallback(
    async (qid: string, value: string | string[], advance: boolean) => {
      setSaving(true);
      setError(null);
      try {
        await onAnswer(qid, value);
        setAnswers((a) => ({ ...a, [qid]: value }));
        setRetryValue(null);
        if (advance && index < total - 1) {
          setTimeout(() => setIndex((i) => i + 1), 280);
        }
      } catch {
        setRetryValue(value);
        setError(labels.saveFailed);
      } finally {
        setSaving(false);
      }
    },
    [onAnswer, index, total, labels.saveFailed],
  );

  const selectSingle = (value: string) => {
    if (!question || saving) return;
    void persist(question.id, value, true);
  };

  const toggleMulti = (opt: string) => {
    setMultiSel((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  const submitMulti = () => {
    if (!question || multiSel.length === 0) return;
    void persist(question.id, multiSel, true);
  };

  const submitCustom = () => {
    if (!question || !customText.trim()) return;
    if (question.type === "single") selectSingle(customText.trim());
    else {
      const next = [...multiSel.filter((x) => x !== customText.trim()), customText.trim()];
      setMultiSel(next);
      setCustomOpen(false);
      setCustomText("");
    }
  };

  const onKeyNav = (e: KeyboardEvent) => {
    if (!question) return;
    const opts = question.options;
    const rowCount = opts.length + 1; // + Something else

    if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setFocusOpt((f) => Math.min(f + 1, rowCount - 1));
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusOpt((f) => Math.max(f - 1, 0));
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const n = Number(e.key) - 1;
      if (n < opts.length) {
        e.preventDefault();
        if (question.type === "single") selectSingle(opts[n]);
        else toggleMulti(opts[n]);
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (document.activeElement?.tagName === "INPUT") return;
      e.preventDefault();
      if (focusOpt === opts.length) {
        setCustomOpen(true);
        return;
      }
      const opt = opts[focusOpt];
      if (!opt) return;
      if (question.type === "single") selectSingle(opt);
      else toggleMulti(opt);
    }
  };

  useEffect(() => {
    optionRefs.current[focusOpt]?.focus();
  }, [focusOpt]);

  if (!questions.length || !question) {
    return (
      <div
        className={cn(
          "mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-white/10 bg-[var(--brand-card,#0f1419)] p-10 text-center text-[var(--brand-fg,#f4f4f5)]",
          className,
        )}
        style={{
          ["--brand-card" as string]: "var(--brand-card, #0f1419)",
          ["--brand-accent" as string]: "var(--brand-accent, #3b82f6)",
        }}
      >
        <h2 className="text-lg font-semibold">{labels.emptyTitle}</h2>
        <p className="mt-2 text-sm text-zinc-400">{labels.emptyDescription}</p>
      </div>
    );
  }

  const selectedSingle = answers[question.id];
  const rows = [...question.options, "__other__"];

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${liveId}-title`}
      onKeyDown={onKeyNav}
      className={cn(
        "mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[var(--brand-card,#0f1419)] text-[var(--brand-fg,#f4f4f5)] shadow-2xl outline-none",
        className,
      )}
      style={{
        ["--brand-accent" as string]: "var(--brand-accent, #3b82f6)",
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <h2 id={`${liveId}-title`} className="text-left text-base font-semibold leading-snug sm:text-lg">
          {question.text}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 hidden text-xs text-zinc-400 sm:inline" aria-hidden>
            {labels.questionProgress(index + 1, total)}
          </span>
          <button
            type="button"
            aria-label={labels.previous}
            disabled={index === 0}
            onClick={() => {
              const next = Math.max(0, index - 1);
              setIndex(next);
              onBack?.(next);
            }}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            disabled={index >= total - 1}
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
          {onClose && (
            <button
              type="button"
              aria-label={labels.close}
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {labels.questionProgress(index + 1, total)}
      </div>

      <div className="relative px-5 pb-5 pt-3">
        {onSkip && (
          <button
            type="button"
            onClick={() => {
              onSkip(question.id);
              if (index < total - 1) setIndex((i) => i + 1);
            }}
            className="absolute right-5 top-3 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
          >
            {labels.skip}
          </button>
        )}

        <div
          role="listbox"
          aria-multiselectable={question.type === "multi"}
          aria-label={question.text}
          className="mt-8 space-y-2"
        >
          {rows.map((opt, i) => {
            const isOther = opt === "__other__";
            const label = isOther ? labels.somethingElse : opt;
            const selected =
              !isOther &&
              (question.type === "single"
                ? selectedSingle === opt
                : multiSel.includes(opt));
            return (
              <button
                key={isOther ? "other" : opt}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={!!selected}
                tabIndex={focusOpt === i ? 0 : -1}
                disabled={saving}
                onClick={() => {
                  setFocusOpt(i);
                  if (isOther) setCustomOpen(true);
                  else if (question.type === "single") selectSingle(opt);
                  else toggleMulti(opt);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]",
                  selected
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-semibold tabular-nums">
                  {isOther ? <Pencil className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
                {question.type === "multi" && !isOther ? (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded border",
                      selected ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]" : "border-white/30",
                    )}
                  >
                    {selected && <Check className="size-3 text-white" />}
                  </span>
                ) : (
                  <ArrowRight className="size-4 shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            );
          })}
        </div>

        {customOpen && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={labels.somethingElsePlaceholder}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={submitCustom}
              className="rounded-lg bg-[var(--brand-accent)] px-3 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {labels.continue}
            </button>
          </div>
        )}

        {question.type === "multi" && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">{labels.selectedCount(multiSel.length)}</span>
            <button
              type="button"
              disabled={multiSel.length === 0 || saving}
              onClick={submitMulti}
              className="rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {labels.continue}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <span>{error}</span>
            <button
              type="button"
              className="rounded-md bg-red-500/30 px-2 py-1 text-xs font-medium hover:bg-red-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              onClick={() => retryValue != null && void persist(question.id, retryValue, true)}
            >
              {labels.retry}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
