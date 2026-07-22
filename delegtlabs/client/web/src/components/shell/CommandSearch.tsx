"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const ACTIONS = [
  { label: "Overview", href: "/overview" },
  { label: "My Agents", href: "/agents" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Activity Logs", href: "/activity" },
  { label: "Admin Console", href: "/admin" },
  { label: "LinkedIn Growth Agent", href: "/dashboard/agents/linkedin-agent" },
  { label: "Lawyer Drafting Agent", href: "/dashboard/agents/lawyer-agent" },
  { label: "Settings", href: "/settings" },
];

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ACTIONS;
    return ACTIONS.filter((a) => a.label.toLowerCase().includes(query));
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to…"
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-indigo-500/15 hover:text-indigo-100"
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500">No matches</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
