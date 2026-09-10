import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Building2, ChevronDown, Link2, Loader2, RefreshCw, Unplug, User } from "lucide-react";
import { toast } from "sonner";

import {
  authApi,
  tenantApi,
  type LinkedInDestination,
  type TenantConnectionsResponse,
} from "@shared/api";
import { LinkedInSessionHint, PageHeader } from "@shared/components/shared-ui";
import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { ConfirmDialog } from "@shared/components/ui/confirm-dialog";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Switch } from "@shared/components/ui/switch";
import { cn } from "@shared/lib/utils";
import { formatEnumLabel } from "@shared/lib/format-label";

const healthColor: Record<string, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-destructive",
  pending: "bg-muted-foreground",
};

function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "Never synchronized";
  try {
    return `Last synchronized ${formatDistanceToNow(parseISO(iso), { addSuffix: true })}`;
  } catch {
    return `Last synchronized ${iso}`;
  }
}

function kindLabel(kind: string): string {
  return kind === "organization" ? "Company Page" : "Personal";
}

function connectionBadge(connected: boolean, health?: string) {
  if (!connected) return <Badge variant="muted">Disconnected</Badge>;
  if (health === "red" || health === "yellow") return <Badge variant="warning">Needs Attention</Badge>;
  return <Badge variant="success">Connected</Badge>;
}

function DestinationRow({
  dest,
  onToggle,
  toggling,
}: {
  dest: LinkedInDestination;
  onToggle: (id: string, is_enabled: boolean) => void;
  toggling: boolean;
}) {
  const KindIcon = dest.destination_kind === "organization" ? Building2 : User;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border-subtle px-3 py-3 last:border-b-0 sm:px-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", healthColor[dest.health] || "bg-muted")}
          aria-hidden
        />
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-secondary text-muted-foreground">
          <KindIcon className="size-4" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-sm font-medium">
            {dest.display_name || kindLabel(dest.destination_kind)}
          </span>
          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
            {kindLabel(dest.destination_kind)}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {dest.can_publish ? (
            <span className="text-success">Can publish</span>
          ) : (
            <span className="text-destructive">Access unavailable</span>
          )}
          {dest.role ? <span> · Role: {formatEnumLabel(dest.role)}</span> : null}
          <span className="sr-only">Health {dest.health}</span>
        </div>
      </div>
      <Switch
        id={`dest-pub-${dest.id}`}
        className="shrink-0"
        checked={dest.is_enabled}
        disabled={toggling || !dest.can_publish}
        onCheckedChange={(checked) => onToggle(dest.id, checked)}
        aria-label={`Publishing for ${dest.display_name || kindLabel(dest.destination_kind)}`}
      />
    </div>
  );
}

export default function TenantConnectionsPage() {
  const qc = useQueryClient();
  const [orgOpen, setOrgOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenant-connections"],
    queryFn: tenantApi.connections,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tenant-connections"] });
    qc.invalidateQueries({ queryKey: ["auth-status"] });
  };

  const syncMut = useMutation({
    mutationFn: () => tenantApi.syncLinkedIn(),
    onSuccess: (section) => {
      qc.setQueryData<TenantConnectionsResponse>(["tenant-connections"], (prev) =>
        prev ? { ...prev, linkedin: section } : { linkedin: section, integrations: [] },
      );
      qc.invalidateQueries({ queryKey: ["auth-status"] });
      if (section.acl_error) {
        toast.warning("Personal profile synced — Company Pages unavailable", {
          description:
            "LinkedIn denied organization access (API 403). Your Developer App needs Community Management / w_organization_social. Managing pages in LinkedIn UI is not enough.",
          duration: 14_000,
        });
      } else if ((section.organization_count ?? 0) === 0) {
        toast.success("Synced — no Company Pages returned for this account");
      } else {
        toast.success(
          `LinkedIn synchronized (${section.organization_count} Company Page${
            section.organization_count === 1 ? "" : "s"
          })`,
        );
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Sync failed";
      toast.error(typeof msg === "string" ? msg : "Sync failed");
    },
  });

  const patchMut = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      tenantApi.patchDestination(id, { is_enabled }),
    onSuccess: (updated) => {
      qc.setQueryData<TenantConnectionsResponse>(["tenant-connections"], (prev) => {
        if (!prev?.linkedin) return prev;
        return {
          ...prev,
          linkedin: {
            ...prev.linkedin,
            destinations: prev.linkedin.destinations.map((d) =>
              d.id === updated.id ? updated : d,
            ),
          },
        };
      });
      qc.invalidateQueries({ queryKey: ["auth-status"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not update destination";
      toast.error(typeof msg === "string" ? msg : "Could not update destination");
      invalidate();
    },
  });

  const disconnectMut = useMutation({
    mutationFn: () => authApi.disconnect(),
    onSuccess: (res) => {
      toast.success(
        `Disconnected${res.archived_destinations ? ` (${res.archived_destinations} destinations archived)` : ""}`,
      );
      setDisconnectOpen(false);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Disconnect failed";
      toast.error(typeof msg === "string" ? msg : "Disconnect failed");
    },
  });

  const connection = data?.linkedin?.connection;
  const destinations = data?.linkedin?.destinations ?? [];
  const connected = Boolean(connection?.connected ?? authStatus?.connected);
  const connectHref = authApi.loginUrl();
  const orgDestinations = destinations.filter((d) => d.destination_kind === "organization");
  const lastSynced =
    connection?.last_synced_at ||
    destinations.map((d) => d.last_synced_at).filter(Boolean).sort().at(-1) ||
    null;
  const showOrgAccessBanner = connected && orgDestinations.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Manage your publishing destinations and integrations."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
              <Link2 className="size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                LinkedIn
                {connectionBadge(connected, connection?.health)}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Publishing destination</p>
            </div>
          </div>
          {connected ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-11 sm:h-9"
                onClick={() => syncMut.mutate()}
                disabled={syncMut.isPending}
              >
                {syncMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Sync
              </Button>
              <Button variant="outline" size="sm" className="h-11 sm:h-9" asChild>
                <a href={connectHref}>
                  <RefreshCw className="size-3.5" />
                  Reconnect
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9"
                onClick={() => setDisconnectOpen(true)}
                disabled={disconnectMut.isPending}
              >
                {disconnectMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unplug className="size-3.5" />
                )}
                Disconnect
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {showOrgAccessBanner ? (
            <Alert variant="info">
              <AlertTitle className="flex items-center justify-between gap-2">
                Company Pages unavailable
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setOrgOpen((v) => !v)}
                >
                  Learn more
                  <ChevronDown className={cn("size-3.5 transition-transform", orgOpen && "rotate-180")} />
                </Button>
              </AlertTitle>
              <AlertDescription className="text-sm">
                LinkedIn denied organization access, so only your personal profile can publish here.
                {orgOpen ? (
                  <span className="mt-2 block text-muted-foreground">
                    Being an admin in the LinkedIn “Me → Manage” menu is not enough — the LinkedIn
                    Developer Application must have Community Management access and the{" "}
                    <code className="text-xs">w_organization_social</code> scope. Until that is
                    approved, Company Pages (KoshaTech, Delegatlabs.ai, etc.) cannot be listed.
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not load connections
                {error instanceof Error ? `: ${error.message}` : "."}
              </AlertDescription>
            </Alert>
          ) : !connected ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect LinkedIn to discover your personal profile and Company Pages you can
                publish to.
              </p>
              <Button asChild>
                <a href={connectHref}>
                  <Link2 className="size-3.5" />
                  Connect LinkedIn
                </a>
              </Button>
              <LinkedInSessionHint className="max-w-md" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-surface-secondary p-4 text-sm">
                <div className="font-medium">
                  {connection?.display_name || authStatus?.display_name || "Connected"}
                </div>
                {(connection?.email || authStatus?.email) && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {connection?.email || authStatus?.email}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  <span>{formatSyncedAt(lastSynced)}</span>
                </div>
              </div>

              {destinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No destinations yet. Run Sync LinkedIn to discover personal and Company Page
                  destinations.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <p className="border-b bg-surface-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Destinations
                  </p>
                  {destinations.map((dest) => (
                    <DestinationRow
                      key={dest.id}
                      dest={dest}
                      toggling={patchMut.isPending}
                      onToggle={(id, is_enabled) => patchMut.mutate({ id, is_enabled })}
                    />
                  ))}
                </div>
              )}

              {(authStatus?.enabled_publishable_count ?? 0) === 0 && (
                <Alert>
                  <AlertDescription>
                    No enabled publishable destinations. Turn on Publishing for at least one
                    destination that can publish before using Publish / Repost.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect LinkedIn?"
        description="All destinations will be archived until you reconnect."
        confirmLabel="Disconnect"
        destructive
        pending={disconnectMut.isPending}
        onConfirm={() => disconnectMut.mutate()}
      />
    </div>
  );
}
