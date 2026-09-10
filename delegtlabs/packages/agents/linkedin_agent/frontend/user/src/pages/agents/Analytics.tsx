import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { performanceApi, tenantApi } from "@shared/api";
import type { AnalyticsConfig } from "@shared/types/agent-configs";
import { defaultAnalyticsConfig } from "@shared/types/agent-configs";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PageHeader } from "@shared/components/shared-ui";
import { formatEnumLabel } from "@shared/lib/format-label";

export default function AnalyticsAgentPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["agent-config", "analytics"],
    queryFn: () => tenantApi.agentConfig("analytics"),
  });
  const { data: perf } = useQuery({
    queryKey: ["performance-summary"],
    queryFn: performanceApi.summary,
  });
  const [config, setConfig] = useState<AnalyticsConfig>(defaultAnalyticsConfig);

  useEffect(() => {
    const raw = data?.latest?.config;
    if (raw && typeof raw === "object") setConfig({ ...defaultAnalyticsConfig, ...raw });
  }, [data]);

  const save = useMutation({
    mutationFn: () => tenantApi.saveConfig("analytics", config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-config", "analytics"] }),
  });

  if (data?.inactive) {
    return (
      <div className="space-y-4">
        <PageHeader title="Analytics" description="Agent inactive" />
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">Upgrade to unlock Analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const digest = (perf?.topicSummary || [])
    .slice(0, 5)
    .map(
      (t) =>
        `• ${formatEnumLabel(t.name)}: avg score ${t.avg_score ?? "—"}, ${t.published_count} published, ${t.total_likes} likes`,
    )
    .join("\n");

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="KPIs, alerts, and report digest" />
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
            placeholder="KPIs (comma-separated)"
            value={config.kpis.join(", ")}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                kpis: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />
          <Input
            placeholder="Cadence: daily | weekly | monthly"
            value={config.cadence}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                cadence: e.target.value as AnalyticsConfig["cadence"],
              }))
            }
          />
          <Input
            placeholder="Comparison: wow | mom | yoy"
            value={config.comparisonMode}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                comparisonMode: e.target.value as AnalyticsConfig["comparisonMode"],
              }))
            }
          />
          <Input
            placeholder="Delivery channels (email, slack, in_app)"
            value={config.deliveryChannels.join(", ")}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                deliveryChannels: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as AnalyticsConfig["deliveryChannels"],
              }))
            }
          />
          <Button className="h-11 sm:h-9" onClick={() => save.mutate()} disabled={save.isPending}>Save new version</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Report digest</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
            {digest || "No performance data yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
