"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 8,
  searchable = true,
  searchKeys,
  onSelectionChange,
  emptyTitle = "No rows",
  emptyDescription,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: Array<(row: T) => string>;
  onSelectionChange?: (ids: string[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let next = rows;
    if (query.trim() && searchKeys?.length) {
      const q = query.toLowerCase();
      next = next.filter((row) => searchKeys.some((fn) => fn(row).toLowerCase().includes(q)));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        next = [...next].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return sortDir === "asc" ? -1 : 1;
          if (av > bv) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return next;
  }, [rows, query, searchKeys, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleAll = () => {
    const ids = pageRows.map((r) => r.id);
    const next = new Set(selected);
    const allSelected = ids.every((id) => next.has(id));
    ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    setSelected(next);
    onSelectionChange?.([...next]);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onSelectionChange?.([...next]);
  };

  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#111827]", className)}>
      {searchable ? (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Filter rows…"
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {onSelectionChange ? (
                  <th className="px-4 py-3">
                    <input type="checkbox" onChange={toggleAll} className="rounded border-white/20 bg-transparent" />
                  </th>
                ) : null}
                {columns.map((col) => (
                  <th key={col.key} className={cn("px-4 py-3 font-semibold", col.className)}>
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-slate-300"
                      >
                        {col.header}
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  {onSelectionChange ? (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="rounded border-white/20 bg-transparent"
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-slate-300", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-500">
        <span>
          {filtered.length} row{filtered.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
