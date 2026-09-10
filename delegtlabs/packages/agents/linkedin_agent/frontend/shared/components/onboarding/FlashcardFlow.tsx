import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { onboardingApi, type OnboardingAnswers } from "@shared/api";
import { ConfirmDialog } from "@shared/components/ui/confirm-dialog";
import { Button } from "@shared/components/ui/button";
import {
  AdaptiveQuestionRenderer,
  defaultAdaptiveValue,
  isAdaptiveAnswerValid,
} from "./AdaptiveQuestionRenderer";
import { SummaryCard } from "./SummaryCard";

export type FlashcardFlowProps = {
  mode?: "gate" | "edit";
  initialAnswers?: OnboardingAnswers | null;
  onCompleted?: () => void;
};

export function FlashcardFlow({
  mode = "edit",
  onCompleted,
}: FlashcardFlowProps = {}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: onboardingApi.get,
  });

  const adaptive = data?.adaptive;
  const question = adaptive?.currentQuestion ?? null;
  const coveragePct = Math.round((adaptive?.coverage ?? 0) * 100);
  const complete = adaptive?.status === "completed" || adaptive?.complete === true;
  const finishAcknowledged = Boolean(
    (adaptive as { finishAcknowledged?: boolean } | undefined)?.finishAcknowledged,
  );

  const [draft, setDraft] = useState<unknown>("");
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [resetOpen, setResetOpen] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [didFinish, setDidFinish] = useState(false);

  useEffect(() => {
    if (question) setDraft(defaultAdaptiveValue(question));
  }, [question?.id]);

  const applyResponse = (res: Awaited<ReturnType<typeof onboardingApi.adaptiveAnswer>>) => {
    qc.setQueryData(["onboarding"], res);
  };

  const answerMut = useMutation({
    mutationFn: () => {
      if (!question) throw new Error("No current question");
      return onboardingApi.adaptiveAnswer(question.id, draft);
    },
    onSuccess: applyResponse,
  });

  const backMut = useMutation({
    mutationFn: onboardingApi.adaptiveBack,
    onSuccess: applyResponse,
  });

  const resetMut = useMutation({
    mutationFn: onboardingApi.adaptiveReset,
    onSuccess: (res) => {
      setDidFinish(false);
      applyResponse(res);
    },
  });

  const busy = answerMut.isPending || backMut.isPending || resetMut.isPending || completeBusy;
  const canNext = !busy && question != null && isAdaptiveAnswerValid(question, draft);

  const handleFinish = async () => {
    try {
      setCompleteBusy(true);
      const res = await onboardingApi.adaptiveComplete();
      applyResponse(res);
      setDidFinish(true);
      onCompleted?.();
      if (mode === "gate") {
        navigate("/topics?tab=weights");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not finish onboarding. Please try again.");
    } finally {
      setCompleteBusy(false);
    }
  };

  const handleReset = () => {
    setResetOpen(true);
  };

  const answers = (data?.answers || {}) as OnboardingAnswers;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary-soft text-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none sm:text-base">Content Persona Onboarding</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {complete ? "Content profile ready" : `Building your content profile · ${coveragePct}% complete`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex size-11 items-center justify-center gap-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-auto sm:px-2.5"
            title="Reset answers"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, coveragePct)}%` }}
            role="progressbar"
            aria-valuenow={coveragePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Content profile coverage"
          />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading your profile…
          </div>
        ) : complete ? (
          <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-8">
            <SummaryCard
              answers={{
                industries: answers.industries || [],
                targetAudience: answers.targetAudience || "",
                contentGoal: answers.contentGoal || "",
                tone: answers.tone || "",
                contentFormats: answers.contentFormats || [],
                topicsOfInterest: answers.topicsOfInterest || [],
                opinionStyle: answers.opinionStyle || "",
                trendingNews: answers.trendingNews || "",
                postLength: answers.postLength || "",
                ctaUsage: answers.ctaUsage || "",
                emojiUsage: answers.emojiUsage || "",
                styleReference: answers.styleReference || "",
              }}
              onJumpToStep={() => undefined}
              onSubmit={handleFinish}
              isSubmitting={completeBusy}
              isSuccess={didFinish || finishAcknowledged}
              hideStepJump
            />
          </div>
        ) : (
          <>
            <div
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8 ${
                direction === "next" ? "animate-slide-up" : "animate-fade-in"
              }`}
            >
              {busy ? (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-center text-xs text-accent-foreground">
                  Personalizing your next question…
                </div>
              ) : null}
              {question ? (
                <AdaptiveQuestionRenderer question={question} value={draft} onChange={setDraft} />
              ) : (
                <p className="text-center text-sm text-muted-foreground">No question available.</p>
              )}
            </div>
            {question ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4 sm:px-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDirection("prev");
                    backMut.mutate();
                  }}
                  disabled={!adaptive?.canGoBack || busy}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <div className="font-mono text-xs text-muted-foreground">
                  {coveragePct}% · {adaptive?.questionsAnswered ?? 0} answered
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setDirection("next");
                    answerMut.mutate();
                  }}
                  disabled={!canNext}
                >
                  {answerMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restart onboarding?"
        description="Your content profile for this workspace will be reset."
        confirmLabel="Reset"
        destructive
        pending={resetMut.isPending}
        onConfirm={() => {
          resetMut.mutate();
          setResetOpen(false);
        }}
      />
    </div>
  );
}
