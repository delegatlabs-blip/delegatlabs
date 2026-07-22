"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Play,
  Settings,
  Share2,
  ThumbsUp,
  Users,
} from "lucide-react";
import ConfigForm from "./ConfigForm";

type Credential = { provider: string; label: string; status: string };
type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  score: number;
  status: string;
  engagement: string;
};
type Post = {
  id: string;
  content: string;
  status: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagement_score: number;
  published_at?: string | null;
  thumbnail_url?: string | null;
};

type UserStats = {
  status: string;
  worker_schedule: string;
  next_run_at?: string | null;
  credentials: Credential[];
  metrics: {
    generated_posts: number;
    engagement_score: number;
    published_prs: number;
  };
  leads: Lead[];
  posts: Post[];
};

function scoreBadge(score: number) {
  if (score >= 85) return { label: `${score} — Hot`, className: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
  if (score >= 70) return { label: `${score} — Warm`, className: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  return { label: `${score} — Cool`, className: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
}

function formatCountdown(iso?: string | null) {
  if (!iso) return "--:--:--";
  const target = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  const ms = Math.max(0, target.getTime() - Date.now());
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LinkedInUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "posts" | "leads">("config");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);

  const load = async () => {
    const res = await fetch(`/api/user/agents/${slug}/stats`);
    if (!res.ok) throw new Error("Failed to load LinkedIn stats");
    setStats(await res.json());
  };

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const countdown = useMemo(
    () => formatCountdown(stats?.next_run_at),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stats?.next_run_at, nowTick],
  );

  const triggerRun = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch(`/api/user/agents/${slug}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Pipeline trigger failed");
      const data = await res.json();
      setRunMsg(`Run ${data.run?.id?.slice?.(0, 8) || ""} completed — ${data.run?.status}`);
      await load();
    } catch (e) {
      setRunMsg(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const exportLeads = () => {
    if (!stats) return;
    const header = "Name,Role,Company,Score,Engagement\n";
    const body = stats.leads
      .map((l) => `"${l.name}","${l.title}","${l.company}",${l.score},"${l.engagement}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkedin-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "config" as const, label: "Configuration", icon: Settings },
    { id: "posts" as const, label: "Posts & PR", icon: FileText },
    { id: "leads" as const, label: "Leads", icon: Users },
  ];

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Loading LinkedIn dashboard…</div>;
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error || "No stats"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> My Agents
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">LinkedIn Growth Agent</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {stats.status}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Next run in <span className="font-mono text-indigo-300">{countdown}</span>{" "}
            <span className="text-slate-600">· cron {stats.worker_schedule}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={triggerRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Pipeline Now
        </button>
      </div>

      {runMsg ? (
        <div className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-slate-300">{runMsg}</div>
      ) : null}

      <div className="flex gap-1 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
                active
                  ? "border-indigo-400 text-indigo-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "config" ? <ConfigForm slug={slug} credentials={stats.credentials} /> : null}

      {activeTab === "posts" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Generated Posts</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stats.metrics.generated_posts}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Engagement Score</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stats.metrics.engagement_score}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Published PRs</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stats.metrics.published_prs}</p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.posts.map((post) => (
              <article
                key={post.id}
                className="flex gap-4 rounded-xl border border-white/10 bg-[#111827] p-4"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300">
                  <FileText className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                        post.status === "published"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      score {post.engagement_score}
                      {post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">{post.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" /> {post.likes}
                    </span>
                    <span>{post.comments} comments</span>
                    <span className="inline-flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" /> {post.shares}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-white/10 px-2.5 py-1 text-slate-300 hover:bg-white/5"
                      >
                        Schedule
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-indigo-500/20 px-2.5 py-1 text-indigo-200 hover:bg-indigo-500/30"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "leads" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportLeads}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.leads.map((lead) => {
                  const badge = scoreBadge(lead.score);
                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-slate-200">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-400">{lead.title}</td>
                      <td className="px-4 py-3 text-slate-400">{lead.company}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-400">{lead.engagement.replaceAll("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
