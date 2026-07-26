import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info";
  spark?: number[];
  index?: number;
};

const toneMap = {
  primary: "from-primary/20 to-primary-glow/10 text-primary",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
  info: "from-info/20 to-info/5 text-info",
};

export function StatCard({ label, value, change, icon: Icon, tone = "primary", spark, index = 0 }: StatCardProps) {
  const positive = change >= 0;
  const points = spark ?? [];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 30 - ((p - min) / range) * 26 - 2;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Card className="group relative overflow-hidden border-border/60 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-70", toneMap[tone])} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                )}
              >
                {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-background/70 shadow-sm ring-1 ring-border", toneMap[tone].split(" ").pop())}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {points.length > 0 && (
          <svg viewBox="0 0 100 32" className="relative mt-3 h-10 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sp-${label}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L100,32 L0,32 Z`} fill={`url(#sp-${label})`} className={toneMap[tone].split(" ").pop()} />
            <path d={path} fill="none" strokeWidth={1.75} stroke="currentColor" className={toneMap[tone].split(" ").pop()} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Card>
    </motion.div>
  );
}
