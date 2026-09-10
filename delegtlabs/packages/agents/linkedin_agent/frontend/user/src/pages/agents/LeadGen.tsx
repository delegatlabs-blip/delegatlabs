import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tenantApi } from "@shared/api";
import type { LeadGenConfig } from "@shared/types/agent-configs";
import { defaultLeadGenConfig } from "@shared/types/agent-configs";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PageHeader } from "@shared/components/shared-ui";
import { cn } from "@shared/lib/utils";

function SafeMeter({ label, count, limit, pct }: { label: string; count: number; limit: number; pct: number }) {
  const warn = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={cn("font-mono", warn && "text-warning")}>
          {count}/{limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", warn ? "bg-warning" : "bg-primary")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function LeadGenAgentPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["agent-config", "lead_gen"],
    queryFn: () => tenantApi.agentConfig("lead_gen"),
  });
  const { data: limits } = useQuery({
    queryKey: ["safe-limits"],
    queryFn: tenantApi.safeLimits,
  });
  const [config, setConfig] = useState<LeadGenConfig>(defaultLeadGenConfig);

  useEffect(() => {
    const raw = data?.latest?.config;
    if (raw && typeof raw === "object") setConfig({ ...defaultLeadGenConfig, ...raw });
  }, [data]);

  const save = useMutation({
    mutationFn: () => tenantApi.saveConfig("lead_gen", config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-config", "lead_gen"] }),
  });

  if (data?.inactive) {
    return (
      <div className="space-y-4">
        <PageHeader title="Lead Gen" description="Agent inactive" />
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">Upgrade to configure Lead Gen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lead Gen" description="ICP, outreach, and LinkedIn safe limits" />

      <Card>
        <CardHeader><CardTitle className="text-base">Safe limits meter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SafeMeter
            label="Messages today"
            count={limits?.messages?.count ?? 0}
            limit={limits?.messages?.limit ?? 50}
            pct={limits?.messages?.pct ?? 0}
          />
          <SafeMeter
            label="Connections this week"
            count={limits?.connections?.count ?? 0}
            limit={limits?.connections?.limit ?? 100}
            pct={limits?.connections?.pct ?? 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between text-base">
            Configuration
            {data?.latest?.created_at && (
              <span className="text-xs font-normal text-muted-foreground">
                Last changed {formatDistanceToNow(new Date(data.latest.created_at), { addSuffix: true })}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="ICP titles (comma-separated)"
            value={config.icp.titles.join(", ")}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                icp: { ...c.icp, titles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) },
              }))
            }
          />
          <Input
            placeholder="Industries"
            value={config.icp.industries.join(", ")}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                icp: {
                  ...c.icp,
                  industries: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                },
              }))
            }
          />
          <Input
            placeholder="Enrichment provider"
            value={config.enrichmentProvider || ""}
            onChange={(e) => setConfig((c) => ({ ...c, enrichmentProvider: e.target.value || null }))}
          />
          <Input
            placeholder="CRM destination"
            value={config.crmDestination || ""}
            onChange={(e) => setConfig((c) => ({ ...c, crmDestination: e.target.value || null }))}
          />
          <Textarea
            placeholder="Outreach template body"
            value={config.outreachTemplates[0]?.body || ""}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                outreachTemplates: [
                  { id: "default", name: "Default", body: e.target.value },
                ],
              }))
            }
          />
          <Button className="h-11 sm:h-9" onClick={() => save.mutate()} disabled={save.isPending}>Save new version</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Outreach draft queue</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pending outreach drafts appear in Admin → Approvals after generation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
