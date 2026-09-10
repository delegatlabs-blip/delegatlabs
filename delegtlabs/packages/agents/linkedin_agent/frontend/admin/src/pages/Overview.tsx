import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  Bot,
  KeyRound,
  ClipboardCheck,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { adminApi, adminPostsApi } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { PageHeader, InlineLoader } from "@shared/components/shared-ui";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  to,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  accent?: string;
  to?: string;
}) {
  const content = (
    <Card className="shadow-card transition-shadow hover:shadow-raised">
      <CardContent className="flex items-end justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${accent || ""}`}>{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function OverviewPage() {
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => adminApi.tenants(),
  });

  const { data: approvalsData } = useQuery({
    queryKey: ["admin-approvals", "", ""],
    queryFn: () => adminApi.approvals({ status: "pending" }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: postsData } = useQuery({
    queryKey: ["admin-posts-overview"],
    queryFn: () => adminPostsApi.list({ limit: 200 }),
    staleTime: 30_000,
  });

  const { data: keysData } = useQuery({
    queryKey: ["platform-keys"],
    queryFn: adminApi.platformKeys,
  });

  if (tenantsLoading) return <InlineLoader label="Loading platform overview" />;

  const tenants = tenantsData?.tenants || [];
  const active = tenants.filter((t: { subscription_status: string }) =>
    ["active", "trialing"].includes(t.subscription_status),
  ).length;
  const credits = tenants.reduce(
    (s: number, t: { credits_remaining?: number }) => s + Number(t.credits_remaining || 0),
    0,
  );

  const pendingApprovals = approvalsData?.items?.length ?? 0;

  const posts = postsData?.posts || [];
  const publishedPosts = posts.filter((p: { status: string }) => p.status === "published").length;
  const draftPosts = posts.filter((p: { status: string }) =>
    ["draft", "pending_review"].includes(p.status),
  ).length;

  const keys = keysData?.keys || {};
  const configuredKeys = Object.values(keys).filter((k: unknown) => (k as { configured: boolean }).configured).length;
  const totalKeys = Object.keys(keys).length;
  const allKeysOk = configuredKeys === totalKeys && totalKeys > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform overview"
        description="Full control: users, agents, and API keys"
      />

      {/* Primary KPIs */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Platform health
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users / tenants" value={tenants.length} icon={Building2} to="/tenants" />
          <StatCard label="Active subscriptions" value={active} icon={Bot} to="/tenants" />
          <StatCard label="Credits in wallets" value={credits.toLocaleString()} icon={Bot} />
          <StatCard
            label="Pending approvals"
            value={pendingApprovals}
            icon={ClipboardCheck}
            accent={pendingApprovals > 0 ? "text-amber-600" : ""}
            to="/approvals"
          />
        </div>
      </div>

      {/* Content stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Content
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Posts published" value={publishedPosts} icon={TrendingUp} to="/posts" />
          <StatCard
            label="Drafts / in review"
            value={draftPosts}
            icon={FileText}
            accent={draftPosts > 0 ? "text-muted-foreground" : ""}
            to="/posts"
          />
          <StatCard label="Total posts" value={postsData?.total ?? posts.length} icon={FileText} to="/posts" />
        </div>
      </div>

      {/* API key health */}
      {totalKeys > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            API keys
          </h2>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {allKeysOk ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                {configuredKeys}/{totalKeys} keys configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(keys).map(([key, val]) => {
                  const configured = (val as { configured: boolean }).configured;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {configured ? (
                        <CheckCircle2 className="size-3 text-success" />
                      ) : (
                        <AlertCircle className="size-3 text-destructive" />
                      )}
                      <code className="text-muted-foreground">{key}</code>
                      {!configured && (
                        <Badge variant="destructive" className="text-[10px]">
                          missing
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button asChild size="sm" variant="outline" className="mt-4 gap-1.5">
                <Link to="/api-keys">
                  <KeyRound className="size-3.5" />
                  Manage API keys
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending approvals alert */}
      {pendingApprovals > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-card dark:border-amber-900/30 dark:bg-amber-900/10">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {pendingApprovals} item{pendingApprovals !== 1 ? "s" : ""} awaiting approval
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500">
                  Review and approve or reject pending content
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400">
              <Link to="/approvals">
                Review now
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/tenants">
            <Building2 className="size-3.5" />
            Users & subscriptions
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/posts">
            <FileText className="size-3.5" />
            All posts
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/agents">
            <Bot className="size-3.5" />
            All agents
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/compliance">
            <ClipboardCheck className="size-3.5" />
            Compliance
          </Link>
        </Button>
      </div>
    </div>
  );
}
