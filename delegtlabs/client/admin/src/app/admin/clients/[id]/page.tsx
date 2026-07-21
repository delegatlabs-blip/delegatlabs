"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, SubNavTabs } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { adminApi } from "@/lib/api";

const tabs = ["Overview", "Subscription", "Agents", "Billing History"];

type ClientDetail = {
  client?: { org_name: string; owner_email: string; status: string; region?: string };
  active_subscription?: { plan_id: string; status: string; renews_at: string } | null;
  active_agents?: Array<{ id: string; agent_id: string; status: string }>;
  usage_summary?: { active_agents: number; active_subscription: number };
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("Overview");
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    adminApi
      .getClient(params.id)
      .then((d) => setDetail(d as ClientDetail))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [params.id]);

  async function impersonate() {
    if (!params.id) return;
    try {
      const out = await adminApi.impersonateClient(params.id);
      setToken(out.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (error)
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!detail?.client) return <p className="text-sm text-azia-muted">Loading client details...</p>;

  const { client, active_subscription, active_agents, usage_summary } = detail;

  return (
    <>
      <PageHeader title={client.org_name} subtitle={client.owner_email}>
        <Link href="/admin/clients" className="mt-auto text-sm text-azia-primary hover:underline">
          ← Back to Clients
        </Link>
        <button type="button" onClick={impersonate} className="azia-btn-primary mt-auto">
          Impersonate
        </button>
      </PageHeader>

      <SubNavTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {token && (
        <div className="mb-4 rounded border border-azia-border bg-purple-50 px-4 py-3 text-xs text-azia-primary">
          Impersonation token issued: {token.slice(0, 32)}...
        </div>
      )}

      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader title="Client Info" />
            <CardBody className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Status</p>
                <div className="mt-1">
                  <StatusBadge status={client.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Region</p>
                <p className="mt-1 text-sm text-azia-text">{client.region ?? "Not set"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Owner</p>
                <p className="mt-1 text-sm text-azia-text">{client.owner_email}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Usage Summary" />
            <CardBody className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-azia-muted">Active Agents</span>
                <span className="text-lg font-semibold text-azia-primary">{usage_summary?.active_agents ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-azia-muted">Active Subscription</span>
                <span className="text-lg font-semibold text-azia-text">{usage_summary?.active_subscription ?? 0}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody className="space-y-2">
              <button type="button" className="w-full rounded border border-azia-border py-2 text-sm text-azia-muted hover:border-azia-primary hover:text-azia-primary">
                Suspend Client
              </button>
              <button type="button" className="w-full rounded border border-azia-border py-2 text-sm text-azia-muted hover:border-azia-primary hover:text-azia-primary">
                Assign Plan
              </button>
              <button type="button" className="w-full rounded border border-azia-border py-2 text-sm text-azia-muted hover:border-azia-primary hover:text-azia-primary">
                Activate Agent
              </button>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "Subscription" && (
        <Card>
          <CardHeader title="Active Subscription" />
          <CardBody>
            {active_subscription ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Plan ID</p>
                  <p className="mt-1 text-sm font-mono text-azia-text">{active_subscription.plan_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={active_subscription.status} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Renews At</p>
                  <p className="mt-1 text-sm text-azia-text">
                    {new Date(active_subscription.renews_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-azia-muted">No active subscription</p>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "Agents" && (
        <Card>
          <CardBody className="p-0">
            <table className="azia-table w-full">
              <thead>
                <tr>
                  <th>Agent ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(active_agents ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs text-azia-muted">{a.agent_id}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
                {(active_agents ?? []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-azia-muted">
                      No active agents
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {activeTab === "Billing History" && (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">Billing history will appear here once Stripe is connected.</p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
