import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Product updates, feature releases, and improvements for DelegtLabs.",
};

export type ChangelogItem = {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: "Feature" | "Improvement" | "Fix" | "Security";
  details?: string[];
};

/** Genuine release entries array - currently empty pending product releases */
const changelogEntries: ChangelogItem[] = [];

function ChangelogEntryCard({ item }: { item: ChangelogItem }) {
  const categoryStyles = {
    Feature: "bg-blue-50 text-blue-700 border-blue-200",
    Improvement: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Fix: "bg-amber-50 text-amber-700 border-amber-200",
    Security: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryStyles[item.category]}`}
          >
            {item.category}
          </span>
          <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
        </div>
        <time className="text-xs font-medium text-slate-500">{item.date}</time>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.summary}</p>
      {item.details && item.details.length > 0 ? (
        <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-slate-600">
          {item.details.map((detail, idx) => (
            <li key={idx}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <ContentPage
      eyebrow="Updates"
      title="Changelog"
      description="Follow the latest product releases, features, and platform updates for DelegtLabs."
    >
      {changelogEntries.length > 0 ? (
        <div className="space-y-6">
          {changelogEntries.map((entry) => (
            <ChangelogEntryCard key={entry.id} item={entry} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No updates recorded yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Check back soon for future product releases, feature updates, and platform improvements.
          </p>
        </div>
      )}
    </ContentPage>
  );
}
