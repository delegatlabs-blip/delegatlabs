"use client";

import { cn } from "@/lib/cn";

export type StatusTone = "success" | "running" | "error" | "neutral";

const toneMap: Record<StatusTone, { dot: string; text: string; bg: string }> = {
  success: {
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  running: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    text: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  error: {
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
    text: "text-rose-300",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  neutral: {
    dot: "bg-slate-400",
    text: "text-slate-300",
    bg: "bg-white/5 border-white/10",
  },
};

export function statusToneFromValue(value: string): StatusTone {
  const v = value.toLowerCase();
  if (["active", "success", "connected", "healthy", "published", "converted"].includes(v)) {
    return "success";
  }
  if (["running", "queued", "draft", "pending", "engaged"].includes(v)) return "running";
  if (["failed", "error", "missing", "expired"].includes(v)) return "error";
  return "neutral";
}

export function StatusPill({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  const resolved = tone ?? statusToneFromValue(label);
  const styles = toneMap[resolved];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}
