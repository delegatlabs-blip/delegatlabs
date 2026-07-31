import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = {
  title: "Billing — Vertex OS",
  description: "Manage plans, invoices and payment methods.",
};

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 md:p-8">
      <PageHeader title="Billing" description="Manage plans, invoices and payment methods." />
      <EmptyState
        icon={CreditCard}
        title="Billing coming soon"
        description="View invoices, update payment methods and manage your subscription."
      />
    </div>
  );
}
