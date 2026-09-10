import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@shared/api";
import { adminTenantOpsApi } from "@shared/api/admin-tenant-ops";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PageHeader } from "@shared/components/shared-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Switch } from "@shared/components/ui/switch";
import { ConfirmDialog } from "@shared/components/ui/confirm-dialog";

const healthColor: Record<string, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-destructive",
  pending: "bg-muted-foreground",
};

interface AdminTopic {
  id: number;
  name: string;
  slug: string;
  weight: number;
  is_active: boolean;
  selected_option_value: string | null;
  options: { value: string; label: string; description?: string | null }[];
  persona_generated: boolean;
}

export default function AdminTenantDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenant", id],
    queryFn: () => adminApi.tenant(id),
    enabled: !!id,
  });
  const { data: catalog } = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: () => adminApi.catalog(),
  });
  const { data: topicsData } = useQuery({
    queryKey: ["admin-tenant-topics", id],
    queryFn: () => adminTenantOpsApi.tenantTopics(id),
    enabled: !!id,
  });
  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("");
  const [planByAgent, setPlanByAgent] = useState<Record<string, string>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const creditMut = useMutation({
    mutationFn: () => adminApi.adjustCredits(id, { amount: Number(amount), reason }),
    onSuccess: () => {
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-tenant", id] });
    },
  });

  const subMut = useMutation({
    mutationFn: (p: { kind: string; status: string }) =>
      adminApi.updateSubscription(id, p.kind, { status: p.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenant", id] }),
  });

  const activateMut = useMutation({
    mutationFn: (p: { kind: string; planId: string }) => adminTenantOpsApi.activateSubscription(id, p.kind, p.planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenant", id] }),
  });

  const rollbackMut = useMutation({
    mutationFn: (p: { kind: string; version: number }) =>
      adminApi.rollbackConfig(id, p.kind, p.version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenant", id] }),
  });

  const topicMut = useMutation({
    mutationFn: (p: { topicId: number; data: Record<string, unknown> }) =>
      adminTenantOpsApi.updateTenantTopic(id, p.topicId, p.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenant-topics", id] }),
  });

  const resetMut = useMutation({
    mutationFn: () => adminTenantOpsApi.resetTenantOnboarding(id),
    onSuccess: () => {
      setResetOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-tenant", id] });
      qc.invalidateQueries({ queryKey: ["admin-tenant-topics", id] });
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const t = data.tenant;
  const topics: AdminTopic[] = topicsData?.topics || [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.name} description={`${t.account_type} · ${t.industry || "no industry"}`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Agent subscriptions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data.agents || []).map((a: Record<string, string>) => {
              const plansForAgent = (catalog?.plans || []).filter((p) => p.agent_kind === a.agent_kind && p.is_active);
              return (
                <div key={a.agent_kind} className="space-y-2 rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{a.agent_kind}</div>
                      <div className="text-xs text-muted-foreground">{a.tier} · {a.status}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => subMut.mutate({ kind: a.agent_kind, status: "active" })}>Resume</Button>
                      <Button size="sm" variant="outline" onClick={() => subMut.mutate({ kind: a.agent_kind, status: "paused" })}>Pause</Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={planByAgent[a.agent_kind] || ""}
                      onValueChange={(v) => setPlanByAgent((prev) => ({ ...prev, [a.agent_kind]: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assign a plan…" /></SelectTrigger>
                      <SelectContent>
                        {plansForAgent.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!planByAgent[a.agent_kind] || activateMut.isPending}
                      onClick={() => activateMut.mutate({ kind: a.agent_kind, planId: planByAgent[a.agent_kind] })}
                    >
                      Activate
                    </Button>
                  </div>
                </div>
              );
            })}
            {(data.agents || []).length === 0 && (
              <p className="text-muted-foreground">No agent subscriptions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Team</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(data.members || []).map((m: Record<string, string>) => (
              <div key={m.id} className="flex justify-between border-b py-1.5 last:border-0">
                <span>{m.display_name || m.email}</span>
                <Badge variant="secondary">{m.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">LinkedIn health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data.connections || []).map((c: Record<string, string>) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className={`size-2.5 rounded-full ${healthColor[c.health] || "bg-muted"}`} />
                <span className="capitalize">{c.surface}</span>
                <span className="text-muted-foreground">— {c.display_name || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Credit adjustment</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Balance: {t.credits_remaining}</p>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (+/−)" />
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" />
            <Button disabled={!reason.trim() || creditMut.isPending} onClick={() => creditMut.mutate()}>
              Apply
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Topics & content profile</CardTitle>
          <Button size="sm" variant="destructive" onClick={() => setResetOpen(true)}>
            Reset topics & onboarding
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {topics.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No persona topics generated yet for this tenant.
            </p>
          )}
          {topics.map((topic) => (
            <div key={topic.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
              <Switch
                checked={topic.is_active}
                onCheckedChange={(checked) =>
                  topicMut.mutate({ topicId: topic.id, data: { is_active: checked } })
                }
              />
              <Input
                defaultValue={topic.name}
                className="h-8 w-48"
                onBlur={(e) => {
                  if (e.target.value !== topic.name && e.target.value.trim()) {
                    topicMut.mutate({ topicId: topic.id, data: { name: e.target.value.trim() } });
                  }
                }}
              />
              {topic.options.length > 0 && (
                <Select
                  value={topic.selected_option_value || ""}
                  onValueChange={(v) => topicMut.mutate({ topicId: topic.id, data: { selected_option_value: v } })}
                >
                  <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Angle…" /></SelectTrigger>
                  <SelectContent>
                    {topic.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <span className="ml-auto text-xs text-muted-foreground">weight {topic.weight.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding answers (read-only)</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {(data.onboarding || []).length === 0 && <p className="text-muted-foreground">No answers yet</p>}
          {(data.onboarding || []).map((o: { question_id: string; value: unknown }) => (
            <div key={o.question_id}>
              <span className="font-medium">{o.question_id}:</span> {JSON.stringify(o.value)}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Config versions</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data.configs || []).map((c: Record<string, unknown>) => (
            <div key={String(c.id)} className="flex items-center justify-between gap-2 rounded-md border p-2">
              <span>{String(c.agent_kind)} v{String(c.version)}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rollbackMut.mutate({ kind: String(c.agent_kind), version: Number(c.version) })}
              >
                Rollback to this
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset topics & onboarding profile"
        description="This permanently deletes this tenant's generated topics, onboarding answers, and content profile. They will need to redo onboarding to generate a new topic catalog. This cannot be undone."
        confirmLabel="Reset"
        destructive
        pending={resetMut.isPending}
        onConfirm={() => resetMut.mutate()}
      />
    </div>
  );
}
