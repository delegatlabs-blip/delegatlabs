import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Users as UsersIcon, ShoppingBag, TrendingUp, Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vertex OS" },
      { name: "description", content: "Real-time overview of revenue, users, and platform activity." },
      { property: "og:title", content: "Dashboard — Vertex OS" },
      { property: "og:description", content: "Real-time overview of revenue, users, and platform activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 md:p-8">
      <PageHeader
        title="Welcome back, Marcus"
        description="Here's what's happening across your workspace today."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" className="h-9 shadow-[var(--shadow-glow)]">
              <Plus className="size-4" /> New project
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total Revenue" value="$1,284,500" delta={12.4} icon={DollarSign} spark={[4, 6, 5, 8, 7, 9, 12]} />
        <StatCard index={1} label="Active Users" value="48,902" delta={5.2} icon={UsersIcon} spark={[7, 6, 8, 7, 9, 8, 10]} />
        <StatCard index={2} label="Monthly Orders" value="12,405" delta={8.1} icon={ShoppingBag} spark={[3, 4, 6, 7, 8, 9, 11]} />
        <StatCard index={3} label="Growth Rate" value="14.2%" delta={-2.4} icon={TrendingUp} spark={[9, 8, 7, 6, 5, 4, 3]} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <TrafficChart />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <ActivityFeed />
      </section>
    </div>
  );
}
