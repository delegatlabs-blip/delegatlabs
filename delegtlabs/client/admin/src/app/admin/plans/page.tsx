"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Plan, adminApi } from "@/lib/api";

function formatPrice(value: string, currency: "INR" | "USD") {
  const amount = Number(value);
  if (amount === 0) return "Custom";

  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listPlans()
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Subscription Plans" subtitle="Manage tiers and included agent bundles.">
        <button type="button" className="azia-btn-primary mt-auto">
          + Create Plan
        </button>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">Loading plans...</p>
          </CardBody>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">No plans configured</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex h-full flex-col overflow-hidden">
              <div className="bg-azia-primary px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-xs capitalize opacity-80">{plan.billing_cycle} billing</p>
                  </div>
                  <span className="rounded border border-white/30 px-2 py-0.5 text-[11px] font-medium">
                    {plan.is_custom ? "Enterprise" : "Standard"}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-bold">
                  {formatPrice(plan.price_inr, "INR")}
                  <span className="text-sm font-normal opacity-80">/{plan.billing_cycle}</span>
                </p>
              </div>
              <CardBody className="flex h-full flex-col space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-azia-muted">USD Price</span>
                  <span className="font-medium text-azia-text">{formatPrice(plan.price_usd, "USD")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-azia-muted">Max Agents</span>
                  <span className="font-medium text-azia-text">{plan.max_agents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-azia-muted">Posts / Month</span>
                  <span className="font-medium text-azia-text">{plan.max_posts_per_month.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-azia-muted">Included Agents</span>
                  <span className="font-medium text-azia-primary">{plan.included_agents.length}</span>
                </div>
                <div className="rounded border border-azia-border bg-azia-bg px-3 py-2 text-xs leading-5 text-azia-muted">
                  {plan.is_custom
                    ? "Custom quotas, dedicated onboarding, and enterprise support."
                    : `${plan.included_agents.length} bundled agents with usage limits for campaign execution.`}
                </div>
                <button
                  type="button"
                  className="mt-auto w-full rounded border border-azia-border py-2 text-xs font-medium text-azia-primary hover:bg-purple-50"
                >
                  Edit Plan
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
