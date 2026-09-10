import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "@shared/api";
import { Badge } from "@shared/components/ui/badge";
import { PageHeader, InlineLoader } from "@shared/components/shared-ui";

const AGENT_LABELS: Record<string, string> = {
  post_gen: "Post Gen",
  lead_gen: "Lead Gen",
  analytics: "Analytics",
};

type AgentRow = {
  tenant_id: string;
  tenant_name: string;
  agent_kind: string;
  tier: string;
  status: string;
};

export default function AgentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-tenants-agents"],
    queryFn: () => adminApi.tenants(),
  });

  const rows: AgentRow[] = [];
  for (const t of data?.tenants || []) {
    const agents = Array.isArray(t.agents) ? t.agents : [];
    for (const a of agents) {
      rows.push({
        tenant_id: t.id,
        tenant_name: t.name,
        agent_kind: a.agent_kind,
        tier: a.tier,
        status: a.status,
      });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="All agents"
        description="Post Gen, Lead Gen, and Analytics across every tenant"
      />
      {isLoading ? (
        <InlineLoader label="Loading agents" />
      ) : isError ? (
        <p className="text-sm text-destructive">
          Failed to load agents{(error as Error)?.message ? `: ${(error as Error).message}` : ""}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.tenant_id}-${r.agent_kind}`} className="border-t">
                  <td className="px-3 py-2">
                    <Link className="text-primary hover:underline" to={`/tenants/${r.tenant_id}`}>
                      {r.tenant_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {AGENT_LABELS[r.agent_kind] || r.agent_kind}
                  </td>
                  <td className="px-3 py-2">{r.tier}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{r.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No agent subscriptions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
