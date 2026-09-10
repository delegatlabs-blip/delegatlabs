import { Edit2, CheckCircle2 } from "lucide-react";
import type { OnboardingAnswers } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { formatEnumLabel, formatEnumList } from "@shared/lib/format-label";

interface SummaryCardProps {
  answers: OnboardingAnswers;
  onJumpToStep: (stepIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSuccess?: boolean;
  hideStepJump?: boolean;
}

export function SummaryCard({
  answers,
  onJumpToStep,
  onSubmit,
  isSubmitting,
  isSuccess,
  hideStepJump = false,
}: SummaryCardProps) {
  const groups = [
    {
      title: "Audience",
      items: [
        { label: "Industries", value: formatEnumList(answers.industries) || "Not specified", step: 0 },
        { label: "Target Audience", value: formatEnumLabel(answers.targetAudience) || "Not specified", step: 1 },
      ],
    },
    {
      title: "Voice & Positioning",
      items: [
        { label: "Tone of Voice", value: formatEnumLabel(answers.tone) || "Not specified", step: 3 },
        { label: "Opinion Style", value: formatEnumLabel(answers.opinionStyle) || "Not specified", step: 6 },
      ],
    },
    {
      title: "Content Strategy",
      items: [
        { label: "Content Goal", value: formatEnumLabel(answers.contentGoal) || "Not specified", step: 2 },
        { label: "Preferred Formats", value: formatEnumList(answers.contentFormats) || "Not specified", step: 4 },
        { label: "Topics of Interest", value: formatEnumList(answers.topicsOfInterest) || "Not specified", step: 5 },
      ],
    },
    {
      title: "Publishing Preferences",
      items: [
        { label: "Post Length", value: formatEnumLabel(answers.postLength) || "Not specified", step: 8 },
        { label: "Call to Actions", value: formatEnumLabel(answers.ctaUsage) || "Not specified", step: 9 },
        { label: "Trending News", value: formatEnumLabel(answers.trendingNews) || "Not specified", step: 7 },
        { label: "Emoji Usage", value: formatEnumLabel(answers.emojiUsage) || "Not specified", step: 10 },
        { label: "Style Reference", value: answers.styleReference || "None provided", step: 11 },
      ],
    },
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col animate-fade-in">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain">
        <div className="mb-2 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="size-3.5" /> Persona ready
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Your Content Persona
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Here is a summary of your selections. These preferences shape posts on your subscription
            schedule.
          </p>
        </div>

        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.title} className="overflow-hidden rounded-xl border border-border bg-card">
              <h3 className="border-b bg-surface-secondary px-4 py-2.5 text-sm font-semibold">
                {group.title}
              </h3>
              <ul className="divide-y divide-border-subtle">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                      <div className="mt-0.5 text-sm font-medium leading-snug">{item.value}</div>
                    </div>
                    {!hideStepJump && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() => onJumpToStep(item.step)}
                        title={`Edit ${item.label}`}
                        aria-label={`Edit ${item.label}`}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl shrink-0 space-y-4 border-t border-border-subtle pt-4 text-center">
        {isSuccess ? (
          <div className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-4 text-success">
            <div className="flex items-center justify-center gap-2 text-base font-semibold">
              <CheckCircle2 className="size-4.5" />
              Onboarding Complete!
            </div>
            <p className="text-xs opacity-80">
              Your content persona is saved. First posts come from your subscription schedule.
            </p>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Saving persona…
              </span>
            ) : (
              "Finish"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
