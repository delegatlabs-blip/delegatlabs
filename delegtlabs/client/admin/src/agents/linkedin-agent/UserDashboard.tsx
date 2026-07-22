"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, FileText, Settings, ThumbsUp, MessageSquare, Share2, Award, CheckCircle } from "lucide-react";
import ConfigForm from "./ConfigForm";

type UserStats = {
  leads: Array<{
    id: string;
    name: string;
    title: string;
    company: string;
    status: string;
    matched_criteria: string;
  }>;
  posts: Array<{
    id: string;
    content: string;
    status: string;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    published_at?: string;
  }>;
  best_performing_criteria: string;
  best_performing_post_id: string;
};

export default function LinkedInUserDashboard({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<"config" | "leads" | "posts">("config");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          // Fallback seeded data
          setStats({
            leads: [
              { id: "1", name: "Sarah Jenkins", title: "VP Marketing", company: "Acme Corp", status: "connected", matched_criteria: "VP Marketing, SaaS" },
              { id: "2", name: "David Chen", title: "Head of Growth", company: "TechScale", status: "replied", matched_criteria: "Head of Growth, Tech" },
              { id: "3", name: "Elena Rostova", title: "CMO", company: "CloudFlow", status: "converted", matched_criteria: "CMO, B2B" },
              { id: "4", name: "Michael Scott", title: "Regional Manager", company: "Dunder Mifflin", status: "connected", matched_criteria: "Manager" },
            ],
            posts: [
              { id: "p1", content: "How we scaled our outreach to 10k prospects with automated AI workflows...", status: "published", likes: 142, comments: 38, shares: 12, impressions: 3400, published_at: "2026-07-20" },
              { id: "p2", content: "B2B SaaS growth tactics for 2026: Why personal branding is your strongest distribution channel.", status: "published", likes: 289, comments: 54, shares: 29, impressions: 8200, published_at: "2026-07-18" },
              { id: "p3", content: "Draft: 5 common mistakes founders make when setting up outbound campaigns.", status: "draft", likes: 0, comments: 0, shares: 0, impressions: 0 },
            ],
            best_performing_criteria: "VP Marketing in B2B SaaS",
            best_performing_post_id: "p2",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [slug]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-2xl font-bold text-slate-900">LinkedIn Growth Agent</h1>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "config"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" /> Agent Configurations
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "leads"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" /> Stats: Leads
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 ${
            activeTab === "posts"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Stats: Posts
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "config" && <ConfigForm slug={slug} />}

      {activeTab === "leads" && stats && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
            <Award className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-xs uppercase font-bold text-indigo-700">Best Performing Criteria:</span>
              <p className="text-sm font-medium text-indigo-950">{stats.best_performing_criteria}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Generated LinkedIn Leads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Matched Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{lead.name}</td>
                      <td className="py-3 px-4">{lead.title}</td>
                      <td className="py-3 px-4">{lead.company}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" /> {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{lead.matched_criteria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "posts" && stats && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Generated LinkedIn Posts & Engagement</h3>
            <div className="space-y-4">
              {stats.posts.map((post) => {
                const isBest = post.id === stats.best_performing_post_id;
                return (
                  <div
                    key={post.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isBest
                        ? "border-amber-300 bg-amber-50/40 ring-2 ring-amber-400/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {isBest && (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                        <Award className="h-4 w-4 text-amber-500" /> Best Performing Post
                      </div>
                    )}
                    <p className="text-sm text-slate-800 font-medium mb-3">{post.content}</p>
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-blue-600" /> {post.likes} Likes</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-indigo-600" /> {post.comments} Comments</span>
                        <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5 text-emerald-600" /> {post.shares} Shares</span>
                        <span>{post.impressions} Impressions</span>
                      </div>
                      <span className="font-semibold capitalize text-slate-700">Status: {post.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
