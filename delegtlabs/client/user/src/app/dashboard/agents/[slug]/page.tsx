"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Key } from "lucide-react";
import { agentUserDashboardMap } from "../../agent-user-dashboard-map";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function UserAgentDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    async function checkCredential() {
      try {
        const res = await fetch(`/api/user/agents/${slug}/config`);
        // Mock check if OAuth is required / missing
        setConnected(true);
      } catch (e) {
        setConnected(true);
      }
    }
    checkCredential();
  }, [slug]);

  const handleOAuthConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`/api/user/agents/${slug}/callback?code=mock_oauth_auth_code`);
      if (res.ok) {
        setConnected(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const DashboardComponent = agentUserDashboardMap[slug];

  if (!DashboardComponent) {
    return (
      <div className="space-y-6 p-6">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Agent surface coming soon</h2>
          <p className="text-sm text-slate-500 mt-2">No user dashboard is registered for {slug}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      {/* OAuth Banner if disconnected */}
      {connected === false && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-sm">Account Connection Required</p>
              <p className="text-xs text-amber-700">
                You must connect your LinkedIn account credentials before this agent can execute runs.
              </p>
            </div>
          </div>
          <button
            onClick={handleOAuthConnect}
            disabled={connecting}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm"
          >
            <Key className="h-4 w-4" />
            {connecting ? "Connecting..." : "Connect LinkedIn Account"}
          </button>
        </div>
      )}

      <DashboardComponent slug={slug} />
    </div>
  );
}
