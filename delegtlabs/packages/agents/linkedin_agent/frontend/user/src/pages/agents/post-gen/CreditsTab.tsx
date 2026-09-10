import { useQuery } from "@tanstack/react-query";

import { billingApi } from "@shared/api/billing";
import { tenantApi, type CatalogPack } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatEnumLabel } from "@shared/lib/format-label";

import { apiErrorMessage } from "./api-error";
import { formatInrFromMinor } from "../../billing/money";
import { useBillingCheckout } from "../../billing/use-billing-checkout";

type UsageRow = {
  agent_kind?: string;
  usage_date?: string;
  credits_used?: number;
};

export function CreditsTab() {
  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErr,
  } = useQuery({
    queryKey: ["tenant-catalog"],
    queryFn: tenantApi.catalog,
  });
  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    error: walletErr,
  } = useQuery({
    queryKey: ["tenant-credits"],
    queryFn: tenantApi.credits,
  });

  const packs = catalog?.packs ?? [];
  const usage = Array.isArray(wallet?.usage) ? (wallet.usage as UsageRow[]) : [];
  const used = usage.reduce((sum, row) => sum + Number(row.credits_used ?? 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Credit balance</CardTitle>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <Skeleton className="h-16 w-40" />
          ) : walletError ? (
            <p className="text-sm text-destructive">
              {apiErrorMessage(walletErr, "Could not load credit balance.")}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">{wallet?.balance ?? 0}</p>
              </div>
              {usage.length > 0 ? (
                <div>
                  <p className="text-sm text-muted-foreground">Used (last 30 days)</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">{used}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {usage.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usage.slice(0, 12).map((row, i) => (
              <div
                key={`${row.usage_date ?? i}-${row.agent_kind ?? ""}`}
                className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {[row.usage_date, row.agent_kind ? formatEnumLabel(row.agent_kind) : null]
                    .filter(Boolean)
                    .join(" · ") || "Usage"}
                </span>
                <span className="font-medium">{row.credits_used ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {catalogLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : catalogError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(catalogErr, "Could not load credit packs.")}
        </p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No credit packs yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackCard({ pack }: { pack: CatalogPack }) {
  const startCheckout = useBillingCheckout();
  const { data: billing } = useQuery({
    queryKey: ["tenant-billing-config"],
    queryFn: billingApi.config,
  });
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{pack.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {pack.total_credits} credits · {formatInrFromMinor(pack.price_inr_minor)}
        </p>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          className="h-10 w-full"
          disabled={pack.price_inr_minor > 0 && billing?.configured === false}
          onClick={() =>
            startCheckout({
              kind: "credit_pack",
              pack_id: pack.id,
              label: pack.name,
            })
          }
        >
          Purchase
        </Button>
      </CardContent>
    </Card>
  );
}
