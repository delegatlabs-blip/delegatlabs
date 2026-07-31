import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { RecentOrders } from "@/lib/domains/dashboard/features/recent-orders";

export const metadata: Metadata = {
  title: "Orders — Vertex OS",
  description: "Review, fulfill and reconcile every transaction on your platform.",
  openGraph: {
    title: "Orders — Vertex OS",
    description: "Review, fulfill and reconcile every transaction on your platform.",
  },
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <PageHeader title="Orders" description="Track and manage every order across regions and channels." />
      <RecentOrders />
    </div>
  );
}
