"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const initial = [
  { id: 1, title: "Review Q4 billing changes", tag: "Finance", done: true },
  { id: 2, title: "Approve onboarding copy", tag: "Design", done: false },
  { id: 3, title: "Publish changelog v3.4.1", tag: "Release", done: false },
  { id: 4, title: "Reply to enterprise leads", tag: "Sales", done: false },
  { id: 5, title: "Audit permission scopes", tag: "Security", done: true },
];

export function TasksWidget() {
  const [tasks, setTasks] = useState(initial);
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Your tasks</CardTitle>
            <CardDescription>
              {done}/{tasks.length} completed today
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-muted/50"
          >
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) =>
                setTasks((prev) => prev.map((p) => (p.id === t.id ? { ...p, done: !!v } : p)))
              }
            />
            <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>{t.title}</span>
            <Badge variant="secondary" className="text-[10px]">
              {t.tag}
            </Badge>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
