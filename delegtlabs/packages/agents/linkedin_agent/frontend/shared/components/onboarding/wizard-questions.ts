import type { OnboardingQuestion } from "./OnboardingStepCard";

/** Wizard questions mapped for OnboardingStepCard (id aligns with onboarding answer keys). */
export const wizardQuestions: OnboardingQuestion[] = [
  {
    id: "industries",
    text: "What primary industries or domains do you create content for?",
    type: "multi",
    options: [
      "Web Development",
      "AI/ML",
      "DevOps",
      "Mobile Development",
      "Cloud/Infra",
      "Cybersecurity",
      "Data Science",
      "Product/Design",
      "Startups/Founders",
    ],
  },
  {
    id: "targetAudience",
    text: "Who is your target audience on LinkedIn?",
    type: "single",
    options: [
      "Junior developers",
      "Senior developers",
      "Engineering Leadership / Managers",
      "Founders / Tech Entrepreneurs",
      "General Tech Audience",
    ],
  },
  {
    id: "contentGoal",
    text: "What is your primary content goal?",
    type: "single",
    options: [
      "Educate & Teach",
      "Build Thought Leadership",
      "Drive High Engagement",
      "Promote Product / Project",
      "Personal Branding & Career",
    ],
  },
  {
    id: "tone",
    text: "What tone of voice fits your style best?",
    type: "single",
    options: [
      "Casual & Conversational",
      "Professional & Polished",
      "Witty & Lighthearted",
      "Bold & Opinionated",
      "Neutral & Informative",
    ],
  },
  {
    id: "contentFormats",
    text: "What content formats do you prefer?",
    type: "multi",
    options: [
      "Short Takes",
      "How-to Guides",
      "Threads / Bulleted Lists",
      "News & Tech Commentary",
      "Comparisons (X vs Y)",
    ],
  },
  {
    id: "topicsOfInterest",
    text: "What specific topics do you want to cover?",
    type: "multi",
    options: [
      "Software Architecture",
      "Clean Code",
      "Developer Productivity",
      "Career Growth",
      "Open Source",
    ],
  },
  {
    id: "opinionStyle",
    text: "Should posts include personal opinions & strong takes?",
    type: "single",
    options: [
      "Yes, strong bold opinions",
      "Yes, balanced perspective",
      "No, stick strictly to facts",
    ],
  },
  {
    id: "trendingNews",
    text: "Should posts reference trending news & releases?",
    type: "single",
    options: ["Frequently", "Occasionally", "Evergreen only"],
  },
  {
    id: "postLength",
    text: "What is your preferred post length?",
    type: "single",
    options: ["short", "medium", "long"],
  },
  {
    id: "ctaUsage",
    text: "How should Call-to-Actions (CTAs) be used?",
    type: "single",
    options: [
      "Always include a question/CTA",
      "Sometimes when relevant",
      "Never include CTAs",
    ],
  },
  {
    id: "emojiUsage",
    text: "What is your preferred emoji density?",
    type: "single",
    options: ["None", "Minimal", "Frequent"],
  },
];

export function resumeIndexFromAnswers(
  questions: OnboardingQuestion[],
  answers: Record<string, unknown> | null | undefined,
): number {
  if (!answers) return 0;
  const idx = questions.findIndex((q) => answers[q.id] == null || answers[q.id] === "");
  return idx === -1 ? Math.max(0, questions.length - 1) : idx;
}
