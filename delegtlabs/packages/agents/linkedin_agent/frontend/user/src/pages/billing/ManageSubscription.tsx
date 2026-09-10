import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApi, type BillingPayment } from "@shared/api/billing";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PageHeader } from "@shared/components/shared-ui";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";

import { CreditsTab } from "../agents/post-gen/CreditsTab";
import { SubscriptionTab } from "../agents/post-gen/SubscriptionTab";
import { apiErrorMessage } from "../agents/post-gen/api-error";
import { formatInrFromMinor, slotLabel } from "./money";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Pending" },
] as const;

function statusVariant(status: string): "success" | "destructive" | "warning" | "muted" {
  if (status === "paid") return "success";
  if (status === "failed") return "destructive";
  if (status === "cancelled") return "muted";
  return "warning";
}

export default function ManageSubscriptionPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: config } = useQuery({
    queryKey: ["tenant-billing-config"],
    queryFn: billingApi.config,
  });
  const {
    data: quota,
    isLoading: quotaLoading,
    isError: quotaError,
    error: quotaErr,
  } = useQuery({
    queryKey: ["tenant-billing-quota"],
    queryFn: billingApi.quota,
  });
  const {
    data: tx,
    isLoading: txLoading,
    isError: txError,
    error: txErr,
  } = useQuery({
    queryKey: ["tenant-billing-payments", filter],
    queryFn: () => billingApi.payments(filter),
  });

  const payments = tx?.payments ?? [];
  const planName = quota?.plan?.name ?? "No active plan";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Subscription"
        description="Plans, credits, hourly post quota, and payment history."
      />

      {config && !config.configured ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Checkout is not configured yet. Plans and remaining posts still show below. Ask an admin
            to set Razorpay keys to buy a plan or credit pack.
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Scheduled posts</h2>
        {quotaLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : quotaError ? (
          <p className="text-sm text-destructive">
            {apiErrorMessage(quotaErr, "Could not load post quota.")}
          </p>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{planName}</CardTitle>
                {quota?.cron_would_skip ? (
                  <Badge variant="warning">Hourly cron will skip</Badge>
                ) : (
                  <Badge variant="success">Hourly cron will generate</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                The hourly job creates at most one draft per hour, using leftover quota first.
              </p>
            </CardHeader>
            <CardContent>
              {quota?.slots?.length ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {quota.slots.map((slot) => (
                    <div
                      key={slot.slot}
                      className="rounded-lg border border-border-subtle px-3 py-3"
                    >
                      <p className="text-sm text-muted-foreground">{slotLabel(slot.slot)}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {slot.remaining}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          left of {slot.cap}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{slot.used} used</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No plan is assigned, so the hourly job will skip this workspace.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Plans</h2>
        <SubscriptionTab />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Credits</h2>
        <CreditsTab />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Transactions</h2>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-max max-w-full">
            {FILTERS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {txLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : txError ? (
          <p className="text-sm text-destructive">
            {apiErrorMessage(txErr, "Could not load transactions.")}
          </p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions in this filter.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <ul className="divide-y">
              {payments.map((row) => (
                <TransactionRow key={row.id} payment={row} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function TransactionRow({ payment }: { payment: BillingPayment }) {
  const when = useMemo(() => {
    const raw = payment.paid_at || payment.created_at;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-IN");
  }, [payment.created_at, payment.paid_at]);

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{payment.sku_name}</p>
          <Badge variant={statusVariant(payment.status)}>{payment.status_label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {payment.kind === "credit_pack" ? "Credit pack" : "Subscription"} · {when}
          {payment.invoice_number ? ` · ${payment.invoice_number}` : ""}
        </p>
        {payment.failure_reason ? (
          <p className="mt-1 text-sm text-destructive">{payment.failure_reason}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <p className="font-medium">{formatInrFromMinor(payment.amount_inr_minor)}</p>
        {payment.has_invoice ? (
          <Button asChild size="sm" variant="outline" className="h-10">
            <Link to={`/dashboard/billing/invoices/${payment.id}`}>Invoice</Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
