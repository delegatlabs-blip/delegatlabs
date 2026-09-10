import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@shared/api";
import { Input } from "@shared/components/ui/input";
import { Badge } from "@shared/components/ui/badge";
import { PageHeader, InlineLoader } from "@shared/components/shared-ui";

export default function AdminTenantsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenants", q],
    queryFn: () => adminApi.tenants({ q: q || undefined }),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Tenants" description="Search and open any tenant workspace" />
      <Input
        placeholder="Search tenants…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      {isLoading ? (
        <InlineLoader label="Loading tenants" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Industry</th>
                <th className="px-3 py-2">Agents</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Credits</th>
              </tr>
            </thead>
            <tbody>
              {(data?.tenants || []).map((t: Record<string, unknown>) => (
                <tr key={String(t.id)} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link className="font-medium text-primary hover:underline" to={`/tenants/${t.id}`}>
                      {String(t.name)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{String(t.account_type)}</td>
                  <td className="px-3 py-2">{String(t.industry || "—")}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(t.agents) ? t.agents : []).map((a: { agent_kind: string; status: string }) => (
                        <Badge key={a.agent_kind} variant="secondary" className="text-[10px]">
                          {a.agent_kind}:{a.status}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{String(t.subscription_status)}</td>
                  <td className="px-3 py-2 font-mono">{String(t.credits_remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
