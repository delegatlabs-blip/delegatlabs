import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { RecentOrders } from "@/components/dashboard/recent-orders";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Vertex OS" },
      { name: "description", content: "Review, fulfill and reconcile every transaction on your platform." },
      { property: "og:title", content: "Orders — Vertex OS" },
      { property: "og:description", content: "Review, fulfill and reconcile every transaction on your platform." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <PageHeader title="Orders" description="Track and manage every order across regions and channels." />
      <RecentOrders />
    </div>
  );
}