import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { visiblePages } from "@shared/lib/pagination";

type PaginationBarProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function PaginationBar({
  page,
  limit,
  total,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onLimitChange,
}: PaginationBarProps) {
  const items = visiblePages(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          Rows
          <Select
            value={String(limit)}
            onValueChange={(v) => onLimitChange(Number(v))}
          >
            <SelectTrigger className="h-11 w-[72px] text-xs sm:h-9" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 min-w-11 sm:h-9 sm:min-w-9"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <span className="px-1 text-sm text-muted-foreground sm:hidden">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {items.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? "default" : "outline"}
                size="sm"
                className="min-h-11 min-w-11 px-2 sm:min-h-9 sm:min-w-9"
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 min-w-11 sm:h-9 sm:min-w-9"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </nav>
  );
}
