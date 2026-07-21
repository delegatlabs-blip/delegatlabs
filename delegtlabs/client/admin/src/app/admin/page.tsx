"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilterField, PageHeader, SubNavTabs } from "@/components/admin/PageHeader";
import { StatusBadge, TrendBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DualLineChart, MiniAreaChart, MiniBarChart, StackedBarChart } from "@/components/ui/Charts";
import { adminApi, type Agent, type Client, type Plan } from "@/lib/api";

const chartData = [
  { label: "Oct 21", primary: 4200, secondary: 3100 },
  { label: "Oct 22", primary: 5100, secondary: 3800 },
  { label: "Oct 23", primary: 4800, secondary: 4200 },
  { label: "Oct 24", primary: 6200, secondary: 4500 },
];

const miniArea = [{ v: 3 }, { v: 5 }, { v: 4 }, { v: 7 }, { v: 6 }, { v: 9 }, { v: 8 }];
const miniBar = [{ v: 4 }, { v: 6 }, { v: 3 }, { v: 8 }, { v: 5 }, { v: 7 }];
const stacked = [
  { label: "Mon", a: 12, b: 8 },
  { label: "Tue", a: 18, b: 10 },
  { label: "Wed", a: 14, b: 12 },
  { label: "Thu", a: 20, b: 9 },
  { label: "Fri", a: 16, b: 14 },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function DashboardPage() {
  const [tab, setTab] = useState("Overview");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    Promise.all([adminApi.listAgents(), adminApi.listPlans(), adminApi.listClients()])
      .then(([a, p, c]) => {
        setAgents(a);
        setPlans(p);
        setClients(c);
      })
      .catch(() => {});
  }, []);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const activeClients = clients.filter((c) => c.status === "active").length;

  return (
    <>
      <PageHeader title="Hi, welcome back!" subtitle="Your agentic AI marketing automation ops dashboard.">
        <FilterField label="Start Date">
          <input type="date" className="azia-input w-36" defaultValue="2026-01-01" />
        </FilterField>
        <FilterField label="End Date">
          <input type="date" className="azia-input w-36" defaultValue="2026-07-08" />
        </FilterField>
        <FilterField label="Event Category">
          <select className="azia-input w-40">
            <option>All Categories</option>
            <option>Agents</option>
            <option>Clients</option>
          </select>
        </FilterField>
        <button type="button" className="azia-btn-primary mt-auto">
          Export
        </button>
      </PageHeader>

      <SubNavTabs tabs={["Overview", "Audiences", "Demographics", "More"]} active={tab} onChange={setTab} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Main metrics chart */}
        <Card className="lg:col-span-8">
          <CardHeader
            title="Platform Audience Metrics"
            description="Measure how your agents, clients, and subscriptions are trending."
            action={
              <div className="flex rounded border border-azia-border text-xs">
                {["Day", "Week", "Month"].map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    className={`px-3 py-1.5 ${i === 2 ? "bg-azia-primary text-white" : "text-azia-muted hover:text-azia-primary"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Agents", value: agents.length.toLocaleString(), sub: `${activeAgents} active` },
                { label: "Clients", value: clients.length.toLocaleString(), sub: `${activeClients} active` },
                { label: "Plans", value: plans.length.toLocaleString(), sub: "subscription tiers" },
                { label: "MRR Est.", value: "₹2.4L", sub: "monthly recurring" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-azia-muted">{m.label}</p>
                  <p className="mt-1 text-xl font-semibold text-azia-text">{m.value}</p>
                  <p className="text-xs text-azia-muted">{m.sub}</p>
                </div>
              ))}
            </div>
            <DualLineChart data={chartData} />
          </CardBody>
        </Card>

        {/* Side metric cards */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          <Card>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-azia-muted">Active Rate</p>
                  <p className="mt-1 text-2xl font-semibold text-azia-text">
                    {clients.length ? Math.round((activeClients / clients.length) * 100) : 0}%
                  </p>
                  <TrendBadge value="+18.02%" />
                </div>
              </div>
              <div className="mt-3">
                <MiniAreaChart data={miniArea} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-azia-muted">Total Clients</p>
                  <p className="mt-1 text-2xl font-semibold text-azia-text">{clients.length || "0"}</p>
                  <TrendBadge value="-0.86%" positive={false} />
                </div>
              </div>
              <div className="mt-3">
                <MiniBarChart data={miniBar} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-xs font-medium text-azia-muted">All Sessions</p>
              <p className="mt-1 text-2xl font-semibold text-azia-text">16,869</p>
              <TrendBadge value="+2.87%" />
              <p className="mt-2 text-xs leading-relaxed text-azia-muted">
                The average number of sessions per client. Up from previous period.
              </p>
              <div className="mt-3">
                <StackedBarChart data={stacked} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Agents cards */}
        <Card className="lg:col-span-6">
          <CardHeader
            title="Agents by Category"
            description="Product catalog overview"
            action={
              <Link href="/admin/agents" className="text-xs font-medium text-azia-primary hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {agents.slice(0, 5).map((agent) => (
              <Link
                key={agent.id}
                href={`/admin/agents/detail/${agent.id}`}
                className="block rounded border border-azia-border px-4 py-3 hover:border-azia-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-azia-primary">{agent.name}</p>
                    <p className="mt-1 text-xs capitalize text-azia-muted">{formatLabel(agent.category)}</p>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="capitalize text-azia-muted">{formatLabel(agent.billing_unit)}</span>
                  <span className="font-semibold text-azia-text">₹{agent.base_price_inr}</span>
                </div>
              </Link>
            ))}
            {agents.length === 0 && <p className="py-8 text-center text-sm text-azia-muted">No agents yet</p>}
          </CardBody>
        </Card>

        {/* Clients cards */}
        <Card className="lg:col-span-6">
          <CardHeader
            title="Clients by Status"
            description="Tenant overview"
            action={
              <Link href="/admin/clients" className="text-xs font-medium text-azia-primary hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="block rounded border border-azia-border px-4 py-3 hover:border-azia-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-azia-primary">{client.org_name}</p>
                    <p className="mt-1 text-xs text-azia-muted">{client.owner_email}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-azia-muted">{client.region ?? "Region not set"}</span>
                  <span className="font-semibold text-azia-text">{client.plan_name ?? "No plan"}</span>
                </div>
              </Link>
            ))}
            {clients.length === 0 && <p className="py-8 text-center text-sm text-azia-muted">No clients yet</p>}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
