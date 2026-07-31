import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { RevenueChart } from "@/lib/domains/dashboard/features/revenue-chart";
import { TrafficChart } from "@/lib/domains/dashboard/features/traffic-chart";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Analytics — Vertex OS",
  description: "Track key performance metrics and user behavior in real time.",
  openGraph: {
    title: "Analytics — Vertex OS",
    description: "Track key performance metrics and user behavior in real time.",
  },
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 md:p-8">
      <PageHeader title="Analytics" description="Deep-dive into revenue, acquisition and retention metrics." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <TrafficChart />
      </div>
      <EmptyState
        icon={BarChart3}
        title="Custom reports coming soon"
        description="Build tailored dashboards with filters, cohorts and saved views."
        action={<Button size="sm">Request early access</Button>}
      />
    </div>
  );
}
