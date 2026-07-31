"use client";

import { DollarSign, Users, Bot, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/lib/domains/dashboard/features/stat-card";
import { RevenueChart } from "@/lib/domains/dashboard/features/revenue-chart";
import { TrafficDonut } from "@/lib/domains/dashboard/features/traffic-donut";
import { ActivityFeed } from "@/lib/domains/dashboard/features/activity-feed";
import { TasksWidget } from "@/lib/domains/dashboard/features/tasks-widget";
import { DashboardHeader } from "./dashboard-header";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <DashboardHeader>
        <div>
          <Badge
            variant="secondary"
            className="mb-3 gap-1 rounded-full border-primary/20 bg-primary/10 text-primary"
          >
            <Sparkles className="h-3 w-3" /> Weekly digest is ready
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, <span className="text-gradient">Avery</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspace today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button className="shadow-elegant">
            <Sparkles className="h-4 w-4" /> Generate report
          </Button>
        </div>
      </DashboardHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total Revenue"
          value="$284,392"
          change={12.4}
          icon={DollarSign}
          tone="primary"
          spark={[10, 12, 11, 14, 13, 16, 18, 17, 21, 24, 22, 27]}
        />
        <StatCard
          index={1}
          label="Active Customers"
          value="18,204"
          change={8.1}
          icon={Users}
          tone="info"
          spark={[5, 7, 6, 8, 9, 8, 11, 12, 11, 14, 15, 17]}
        />
        <StatCard
          index={2}
          label="Agents"
          value="12"
          change={4.2}
          icon={Bot}
          tone="warning"
          spark={[4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11, 12]}
        />
        <StatCard
          index={3}
          label="Conversion"
          value="4.62%"
          change={0.8}
          icon={Activity}
          tone="success"
          spark={[3, 3.2, 3.1, 3.4, 3.6, 3.8, 4, 4.1, 4.3, 4.4, 4.5, 4.6]}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart />
        <TrafficDonut />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <TasksWidget />
      </section>
    </div>
  );
}
