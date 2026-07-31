"use client";

type AgentsPaginationProps = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
};

/**
 * Windowed page list — renders at most 7 slots regardless of total pages,
 * so the control never overflows as the catalog grows.
 */
function buildPages(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("gap");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("gap");
  pages.push(totalPages);

  return pages;
}

const arrowClass =
  "inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700";

export function AgentsPagination({
  page,
  totalPages,
  disabled = false,
  onChange,
}: AgentsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-2"
      aria-label="Agent pages"
    >
      <button
        type="button"
        className={arrowClass}
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        data-cursor-exclude
      >
        <span aria-hidden="true">←</span> Prev
      </button>

      {buildPages(page, totalPages).map((entry, i) =>
        entry === "gap" ? (
          <span
            key={`gap-${i}`}
            className="px-1 text-sm text-slate-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            disabled={disabled}
            aria-current={entry === page ? "page" : undefined}
            aria-label={`Page ${entry}`}
            className={`h-10 w-10 rounded-xl border text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
              entry === page
                ? "border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-500/30"
                : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-700"
            }`}
            data-cursor-exclude
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        className={arrowClass}
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        data-cursor-exclude
      >
        Next <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
