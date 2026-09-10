export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 50;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

export function parseLimit(raw: string | null): PageSize {
  const n = Number(raw);
  if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) return n as PageSize;
  return DEFAULT_PAGE_SIZE;
}

export function toOffset(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit);
}

export function pageCount(total: number, limit: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

export function clampPage(page: number, total: number, limit: number): number {
  const pages = pageCount(total, limit);
  return Math.min(Math.max(1, page), pages);
}

/** Compact page list: all pages if ≤7, else 1 … window … last. */
export function visiblePages(current: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (i > 0 && n - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(n);
  }
  return out;
}
