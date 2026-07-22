"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const DEPTH_PAD = ["pl-0", "pl-3.5", "pl-7", "pl-[42px]", "pl-14", "pl-[70px]"] as const;

function Node({
  name,
  value,
  depth,
}: {
  name: string;
  value: unknown;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isObj = value !== null && typeof value === "object";
  const pad = DEPTH_PAD[Math.min(depth, DEPTH_PAD.length - 1)];

  if (!isObj) {
    return (
      <div className={cn("flex gap-2 font-mono text-xs", pad)}>
        <span className="text-indigo-300">{name}:</span>
        <span className="text-emerald-300">{JSON.stringify(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center gap-1 font-mono text-xs text-slate-300 hover:text-white", pad)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-indigo-300">{name}</span>
        <span className="text-slate-500">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </button>
      {open
        ? entries.map(([k, v]) => <Node key={`${name}.${k}`} name={k} value={v} depth={depth + 1} />)
        : null}
    </div>
  );
}

export function JsonInspector({
  data,
  title = "JSON",
  className,
}: {
  data: unknown;
  title?: string;
  className?: string;
}) {
  const normalized = useMemo(() => data ?? {}, [data]);
  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#0B0F17] p-4", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <Node name="root" value={normalized} depth={0} />
    </div>
  );
}
