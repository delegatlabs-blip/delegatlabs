"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PriceHistoryChart } from "@/components/ui/Charts";
import { Agent, adminApi } from "@/lib/api";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [history, setHistory] = useState<Array<{ changed_at: string; old_price: string; new_price: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    Promise.all([adminApi.getAgent(id), adminApi.getAgentPriceHistory(id)])
      .then(([a, h]) => {
        setAgent(a);
        setHistory(h);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [params.id]);

  if (error)
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!agent) return <p className="text-sm text-azia-muted">Loading agent details...</p>;

  return (
    <>
      <PageHeader title={agent.name} subtitle={agent.slug}>
        <Link href="/admin/agents" className="mt-auto text-sm text-azia-primary hover:underline">
          ← Back to Agents
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Agent Details" />
          <CardBody className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Category</p>
              <p className="mt-1 capitalize text-sm text-azia-text">{agent.category.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Status</p>
              <div className="mt-1">
                <StatusBadge status={agent.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Base Price (INR)</p>
              <p className="mt-1 text-lg font-semibold text-azia-text">₹{agent.base_price_inr}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Base Price (USD)</p>
              <p className="mt-1 text-lg font-semibold text-azia-text">${agent.base_price_usd}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Billing Unit</p>
              <p className="mt-1 text-sm capitalize text-azia-text">{agent.billing_unit.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Version</p>
              <p className="mt-1 text-sm text-azia-text">v{agent.version}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Price History" description="Track all price changes over time." />
          <CardBody>
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-azia-muted">No price updates yet.</p>
            ) : (
              <>
                <PriceHistoryChart data={history} />
                <div className="mt-6 space-y-2">
                  {history.map((row) => (
                    <div
                      key={`${row.changed_at}-${row.new_price}`}
                      className="flex items-center justify-between rounded border border-azia-border px-4 py-2.5 text-sm"
                    >
                      <span className="text-azia-muted">{new Date(row.changed_at).toLocaleString()}</span>
                      <span className="font-medium text-azia-text">
                        ₹{row.old_price} → <span className="text-azia-primary">₹{row.new_price}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
