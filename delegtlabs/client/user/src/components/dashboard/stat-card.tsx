import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  spark?: number[];
  index?: number;
};

export function StatCard({ label, value, delta, deltaLabel, icon: Icon, spark, index = 0 }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  const max = Math.max(...(spark ?? [1]));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-16 -top-16 size-40 rounded-full bg-[image:var(--gradient-primary)] opacity-10 blur-2xl" />
      </div>
      <div className="relative flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              positive
                ? "bg-[color:var(--success)]/12 text-[color:var(--success)]"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {deltaLabel && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{deltaLabel}</p>
        )}
      </div>
      {spark && (
        <div className="relative mt-4 flex h-10 items-end gap-1">
          {spark.map((v, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all",
                i === spark.length - 1 ? "bg-primary" : "bg-primary/15",
              )}
              style={{ height: `${(v / max) * 100}%` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}