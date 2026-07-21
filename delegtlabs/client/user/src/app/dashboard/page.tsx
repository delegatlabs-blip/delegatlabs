"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Plus, Calendar, DollarSign, Award, Users, FileText, CheckCircle2, ArrowRight } from "lucide-react";

type GlobalDashboardData = {
  client_name: string;
  plan_name: string;
  renewal_date: string;
  total_monthly_spend: number;
  purchased_agents: Array<{
    slug: string;
    name: string;
    category: string;
    status: string;
    monthly_price: number;
    connected: boolean;
  }>;
  aggregate_metrics: {
    total_leads: number;
    total_posts: number;
  };
};

export default function UserGlobalDashboard() {
  const [data, setData] = useState<GlobalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/user/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // Fallback seeded data
          setData({
            client_name: "Acme SaaS Inc.",
            plan_name: "Growth Pro Plan",
            renewal_date: "2026-08-01T00:00:00Z",
            total_monthly_spend: 449.0,
            purchased_agents: [
              {
                slug: "linkedin-agent",
                name: "LinkedIn Growth Agent",
                category: "linkedin",
                status: "active",
                monthly_price: 250.0,
                connected: true,
              },
              {
                slug: "email-agent",
                name: "Outbound Email Agent",
                category: "email",
                status: "active",
                monthly_price: 199.0,
                connected: false,
              },
            ],
            aggregate_metrics: {
              total_leads: 482,
              total_posts: 34,
            },
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading User Dashboard...</div>;
  }

  if (!data) return null;

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            {data.plan_name}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">{data.client_name}</h1>
          <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Renews on {new Date(data.renewal_date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs uppercase font-semibold text-slate-400">Total Monthly Spend</span>
            <p className="text-2xl font-bold text-emerald-400">${data.total_monthly_spend.toFixed(2)}</p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add Agent
          </Link>
        </div>
      </div>

      {/* Aggregate Metrics Strip (Cross-Agent Rollup Payoff) */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          Cross-Agent Aggregate Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Leads Generated</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{data.aggregate_metrics.total_leads}</p>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Summed across all active agents</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Content & Posts</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{data.aggregate_metrics.total_posts}</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Summed across all active agents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Active Agents</h2>
          <span className="text-xs font-semibold text-slate-500">{data.purchased_agents.length} Agents Subscribed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.purchased_agents.map((agent) => (
            <div
              key={agent.slug}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    <Bot className="h-3.5 w-3.5" />
                    {agent.category.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-slate-900">${agent.monthly_price}/mo</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-4">{agent.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-1">{agent.slug}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    agent.connected ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {agent.connected ? "OAuth Account Connected" : "Connection Pending"}
                </span>

                <Link
                  href={`/dashboard/agents/${agent.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition-colors"
                >
                  Manage Agent <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Add Agent CTA Card */}
          <Link
            href="/pricing"
            className="group rounded-2xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all min-h-[220px]"
          >
            <div className="p-4 bg-slate-100 group-hover:bg-indigo-100 rounded-full text-slate-500 group-hover:text-indigo-600 transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Add Another Agent</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Expand your platform capabilities with Facebook Ads, Instagram, Email outreach, or SEO agents.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
