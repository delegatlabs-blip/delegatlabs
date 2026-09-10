import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Info } from "lucide-react";

import { billingApi } from "@shared/api/billing";
import { tenantApi, type CatalogPlan } from "@shared/api";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Skeleton } from "@shared/components/ui/skeleton";
import { cn } from "@shared/lib/utils";

import { apiErrorMessage } from "./api-error";
import { useBillingCheckout } from "../../billing/use-billing-checkout";
import { formatInrFromMinor } from "../../billing/money";

const CRON_MAX_POSTS_PER_UTC_DAY = 24;
const CRON_CAP_NOTE =
  "Scheduled generation is at most 1 post per hour (up to 24 per UTC day).";

function periodSuffix(billingPeriod: string): string {
  if (billingPeriod === "yearly") return "/yr";
  return "/mo";
}

function priceLabel(plan: CatalogPlan): string {
  return `${formatInrFromMinor(plan.price_inr_minor)}${periodSuffix(plan.billing_period)}`;
}

function quotaUnit(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** USER plan benefit: catalog quota mix, not monthly_credits. */
function quotaMixLines(plan: CatalogPlan): string[] {
  const dailyText = plan.daily_text ?? 0;
  const dailyImage = plan.daily_image ?? 0;
  const weeklyImage = plan.weekly_image ?? 0;
  const lines: string[] = [];
  if (dailyText > 0) {
    lines.push(`${quotaUnit(dailyText, "text-only post")} / day`);
  }
  if (dailyImage > 0) {
    lines.push(`${quotaUnit(dailyImage, "image post")} / day`);
  }
  if (weeklyImage > 0) {
    lines.push(`${quotaUnit(weeklyImage, "image post")} / week`);
  }
  if (dailyText + dailyImage > CRON_MAX_POSTS_PER_UTC_DAY) {
    lines.push(CRON_CAP_NOTE);
  }
  return lines;
}

function QuotaList({ lines, className }: { lines: string[]; className: string }) {
  if (lines.length === 0) {
    return <p className={className}>No scheduled posts</p>;
  }
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function SubscriptionTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenant-catalog"],
    queryFn: tenantApi.catalog,
  });
  const { data: agentData } = useQuery({
    queryKey: ["agent-config", "post_gen"],
    queryFn: () => tenantApi.agentConfig("post_gen"),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {apiErrorMessage(error, "Could not load plans.")}
      </p>
    );
  }

  const plans = data?.plans ?? [];

  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">No plans yet.</p>;
  }

  const assignedId = String(
    (agentData as { subscription?: { plan_id?: string | null } } | undefined)?.subscription
      ?.plan_id ?? "",
  );
  const currentPlanId =
    (assignedId && plans.some((p) => p.id === assignedId) ? assignedId : null) ??
    plans.find((p) => p.is_default)?.id ??
    plans.find((p) => p.code === "free")?.id ??
    null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === currentPlanId} />
      ))}
    </div>
  );
}

function PlanCard({ plan, isCurrent }: { plan: CatalogPlan; isCurrent: boolean }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const startCheckout = useBillingCheckout();
  const { data: billing } = useQuery({
    queryKey: ["tenant-billing-config"],
    queryFn: billingApi.config,
  });
  const features = Array.isArray(plan.features) ? plan.features : [];
  const quotaLines = quotaMixLines(plan);
  const description = plan.description?.trim() || "No description for this plan.";

  return (
    <>
      <Card
        className={cn(
          "flex flex-col",
          isCurrent && "border-primary shadow-raised ring-1 ring-primary/25",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{plan.name}</CardTitle>
            <div className="flex items-center gap-1">
              {isCurrent ? <Badge variant="success">Current</Badge> : null}
              {plan.badge ? <Badge variant="brand">{plan.badge}</Badge> : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label={`${plan.name} plan details`}
                onClick={() => setDetailsOpen(true)}
              >
                <Info className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{priceLabel(plan)}</p>
          <p className="text-xs text-muted-foreground">
            {plan.billing_period === "yearly" ? "Billed yearly" : "Billed monthly"}
          </p>
          <QuotaList lines={quotaLines} className="pt-2 text-sm text-muted-foreground" />
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-3">
          {features.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {isCurrent ? (
            <Button size="sm" variant="outline" className="h-10 w-full" disabled>
              Current
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-10 w-full"
              disabled={plan.price_inr_minor > 0 && billing?.configured === false}
              onClick={() =>
                startCheckout({
                  kind: "subscription",
                  plan_id: plan.id,
                  label: plan.name,
                })
              }
            >
              {plan.price_inr_minor === 0 ? "Select" : "Upgrade"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{plan.name}</DialogTitle>
            <p className="text-left text-lg font-semibold">{priceLabel(plan)}</p>
          </DialogHeader>
          <DialogDescription className="whitespace-pre-wrap text-sm">
            {description}
          </DialogDescription>
          <QuotaList lines={quotaLines} className="text-sm text-muted-foreground" />
          {features.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {features.map((f) => (
                <li key={f} className={cn("flex items-start gap-2")}>
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
