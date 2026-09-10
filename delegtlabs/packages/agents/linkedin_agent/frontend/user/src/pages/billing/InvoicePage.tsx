import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApi } from "@shared/api/billing";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";

import { apiErrorMessage } from "../agents/post-gen/api-error";
import { formatInrFromMinor } from "./money";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenant-billing-invoice", id],
    queryFn: () => billingApi.invoice(id || ""),
    enabled: Boolean(id),
  });

  const invoice = data?.invoice;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" className="h-10">
          <Link to="/dashboard/billing">Back to subscription</Link>
        </Button>
        <Button className="h-10" onClick={() => window.print()} disabled={!invoice}>
          Print / Save as PDF
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error, "Could not load invoice.")}</p>
      ) : !invoice ? (
        <p className="text-sm text-muted-foreground">Invoice is not available for this payment.</p>
      ) : (
        <Card className="print:border-0 print:shadow-none">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AntGrav</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Invoice</h1>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{invoice.number}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.issued_at ? new Date(invoice.issued_at).toLocaleString("en-IN") : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billed to</p>
                <p className="mt-1 font-medium">{invoice.buyer_name}</p>
                {invoice.buyer_email ? (
                  <p className="text-sm text-muted-foreground">{invoice.buyer_email}</p>
                ) : null}
                {invoice.workspace ? (
                  <p className="text-sm text-muted-foreground">{invoice.workspace}</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</p>
                <p className="mt-1 font-medium">{invoice.seller}</p>
                <p className="text-sm text-muted-foreground">LinkedIn content agent</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">{invoice.description}</p>
                    <p className="text-muted-foreground">
                      {invoice.kind === "credit_pack" ? "Credit pack" : "Subscription"} · INR
                    </p>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatInrFromMinor(invoice.amount_inr_minor)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {invoice.payment_reference ? `Payment ${invoice.payment_reference}` : "Paid"}
              </p>
              <p className="text-lg font-semibold">
                Total {formatInrFromMinor(invoice.amount_inr_minor)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
