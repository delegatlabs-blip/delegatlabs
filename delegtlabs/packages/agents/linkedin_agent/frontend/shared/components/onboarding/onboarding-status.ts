/** True when persona onboarding is complete (adaptive DNA or legacy 12-question blob). */
export function isOnboardingComplete(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  if (!payload || typeof payload !== "object") return false;
  const adaptive = payload.adaptive as { status?: string; complete?: boolean } | undefined;
  if (adaptive?.status === "completed" || adaptive?.complete === true) return true;

  const answers = (
    payload.answers && typeof payload.answers === "object"
      ? payload.answers
      : payload
  ) as Record<string, unknown>;

  const industries = answers.industries;
  const topics = answers.topicsOfInterest;
  return (
    Array.isArray(industries) &&
    industries.length > 0 &&
    Array.isArray(topics) &&
    topics.length > 0 &&
    Boolean(answers.targetAudience) &&
    Boolean(answers.contentGoal) &&
    Boolean(answers.tone)
  );
}
