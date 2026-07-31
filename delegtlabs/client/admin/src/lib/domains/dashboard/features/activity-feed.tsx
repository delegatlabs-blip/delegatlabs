"use client";

import { motion } from "framer-motion";
import { CheckCircle2, GitPullRequest, MessageSquare, UserPlus, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  {
    icon: UserPlus,
    tone: "text-info bg-info/15",
    who: "Priya Raman",
    avatar: "https://i.pravatar.cc/64?img=47",
    what: "invited 3 teammates to Delegate Labs",
    time: "12m ago",
  },
  {
    icon: CheckCircle2,
    tone: "text-success bg-success/15",
    who: "Marcus Lin",
    avatar: "https://i.pravatar.cc/64?img=52",
    what: "closed 4 tickets in Billing",
    time: "42m ago",
  },
  {
    icon: GitPullRequest,
    tone: "text-primary bg-primary/15",
    who: "Elena Ortiz",
    avatar: "https://i.pravatar.cc/64?img=32",
    what: "merged PR #2114 — Payment retries",
    time: "1h ago",
  },
  {
    icon: MessageSquare,
    tone: "text-warning bg-warning/15",
    who: "Kenji Yamada",
    avatar: "https://i.pravatar.cc/64?img=15",
    what: "commented on Q4 roadmap",
    time: "3h ago",
  },
  {
    icon: Zap,
    tone: "text-info bg-info/15",
    who: "System",
    avatar: "",
    what: "auto-scaled workers to 12 instances",
    time: "5h ago",
  },
];

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        <CardDescription>What&apos;s happening across your workspace</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" />
        <ul className="space-y-4">
          {items.map((it, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-start gap-3"
            >
              <div className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-card ${it.tone}`}>
                <it.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  {it.avatar && (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={it.avatar} />
                      <AvatarFallback>{it.who[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">{it.who}</span>{" "}
                    <span className="text-muted-foreground">{it.what}</span>
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.time}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
