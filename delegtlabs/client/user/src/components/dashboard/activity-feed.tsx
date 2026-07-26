import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityFeed } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  success: { Icon: CheckCircle2, cls: "bg-[color:var(--success)]/12 text-[color:var(--success)]" },
  info: { Icon: Info, cls: "bg-primary/10 text-primary" },
  warning: { Icon: AlertTriangle, cls: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]" },
};

export function ActivityFeed() {
  return (
    <Card className="border-border/60 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {activityFeed.map((a, i) => {
            const { Icon, cls } = iconMap[a.type];
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-3"
              >
                <div className={cn("z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card", cls)}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground/70">{a.time}</span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}