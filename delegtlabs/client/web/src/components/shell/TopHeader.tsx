"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, Command, Search, User } from "lucide-react";

export function TopHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [team, setTeam] = useState("Growth Team");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenSearch]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-[#0B0F17]/85 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-left text-sm text-slate-500 hover:border-white/20"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Search agents, runs, clients…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-[#111827] py-2 pl-3 pr-8 text-sm text-slate-200 outline-none"
          >
            <option>Growth Team</option>
            <option>Legal Ops</option>
            <option>Platform Eng</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <button
          type="button"
          className="relative rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-2 py-1.5 text-sm text-slate-200 hover:bg-white/5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
            <User className="h-3.5 w-3.5" />
          </span>
          <span className="hidden md:inline">Alex Chen</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
