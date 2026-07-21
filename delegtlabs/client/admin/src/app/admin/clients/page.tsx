"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilterField, PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, TrendBadge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Client, adminApi } from "@/lib/api";

function formatSpend(value?: string) {
  if (!value) return "Not set";
  const amount = Number(value);
  if (amount === 0) return "Custom";

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listClients({ search: search || undefined, status: status || undefined })
      .then(setClients)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [search, status]);

  const activeCount = clients.filter((c) => c.status === "active").length;

  return (
    <>
      <PageHeader title="Clients" subtitle="Manage tenants, subscriptions, and agent activations.">
        <FilterField label="Search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Org name or email"
            className="azia-input w-48"
          />
        </FilterField>
        <FilterField label="Status">
          <select className="azia-input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
          </select>
        </FilterField>
        <button type="button" className="azia-btn-primary mt-auto">
          Export
        </button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { label: "Total Clients", value: clients.length, trend: "+12.5%", up: true },
          { label: "Active", value: activeCount, trend: "+8.2%", up: true },
          { label: "Trial", value: clients.filter((c) => c.status === "trial").length, trend: "-2.1%", up: false },
        ].map((m) => (
          <Card key={m.label}>
            <CardBody>
              <p className="text-xs font-medium text-azia-muted">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-azia-text">{m.value}</p>
              <TrendBadge value={m.trend} positive={m.up} />
            </CardBody>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">Loading clients...</p>
          </CardBody>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">No clients found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex h-full flex-col">
              <CardBody className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-base font-semibold text-azia-primary hover:underline"
                    >
                      {client.org_name}
                    </Link>
                    <p className="mt-1 text-xs text-azia-muted">{client.owner_email}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded border border-azia-border px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Region</p>
                    <p className="mt-1 text-azia-text">{client.region ?? "Not set"}</p>
                  </div>
                  <div className="rounded border border-azia-border px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Plan</p>
                    <p className="mt-1 text-azia-text">{client.plan_name ?? "Unassigned"}</p>
                  </div>
                  <div className="rounded border border-azia-border px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Agents</p>
                    <p className="mt-1 font-semibold text-azia-text">{client.active_agents ?? 0} active</p>
                  </div>
                  <div className="rounded border border-azia-border px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">Spend</p>
                    <p className="mt-1 font-semibold text-azia-text">{formatSpend(client.monthly_spend_inr)}</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="text-xs text-azia-muted">
                    Last activity {client.last_activity ? new Date(client.last_activity).toLocaleDateString() : "unknown"}
                  </span>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="rounded border border-azia-border px-3 py-1.5 text-xs font-medium text-azia-muted hover:border-azia-primary hover:text-azia-primary"
                  >
                    View
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
