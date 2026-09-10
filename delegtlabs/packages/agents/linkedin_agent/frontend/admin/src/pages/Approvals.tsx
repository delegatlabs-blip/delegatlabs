import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  AlertTriangle,
  User,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { adminApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent } from "@shared/components/ui/card";
import { Textarea } from "@shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { PageHeader, EmptyState, InlineLoader } from "@shared/components/shared-ui";

const REJECT_TEMPLATES = [
  {
    label: "Off-brand tone",
    value:
      "Post tone does not align with brand guidelines. Please revise to sound more professional and authoritative.",
  },
  {
    label: "Compliance issue",
    value:
      "This content contains restricted phrases or unverified claims that violate compliance rules. Remove and revise.",
  },
  {
    label: "Too promotional",
    value:
      "Post reads as overly promotional. Reduce marketing language and add genuine educational value.",
  },
  {
    label: "Needs source",
    value:
      "Claims in this post require a cited source. Add a reference URL before resubmitting.",
  },
  {
    label: "Weak hook",
    value:
      "The opening line is too weak to stop the scroll. Start with a bolder, more specific hook.",
  },
  {
    label: "Too long",
    value:
      "Post exceeds LinkedIn's optimal length. Trim to under 1,300 characters for better engagement.",
  },
];

function LinkedInPreview({ text, imageUrl }: { text: string; imageUrl?: string }) {
  const [showFull, setShowFull] = useState(false);
  const PREVIEW_LIMIT = 210;
  const needsTruncation = text.length > PREVIEW_LIMIT;
  const displayed = showFull || !needsTruncation ? text : `${text.slice(0, PREVIEW_LIMIT)}…`;

  return (
    <div className="rounded-xl border bg-white p-4 text-[13px] leading-relaxed shadow-sm dark:bg-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          LI
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground">LinkedIn User</div>
          <div className="text-xs text-muted-foreground">Just now · 🌐</div>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-foreground">{displayed}</p>
      {needsTruncation && (
        <button
          className="mt-1 text-xs font-semibold text-[#0A66C2] hover:underline"
          onClick={() => setShowFull((v) => !v)}
        >
          {showFull ? "see less" : "…see more"}
        </button>
      )}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post visual"
          className="mt-3 w-full rounded-lg object-cover max-h-56 border"
        />
      )}
      <div className="mt-3 flex items-center gap-4 border-t pt-2 text-xs text-muted-foreground">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>↗ Send</span>
      </div>
    </div>
  );
}

function ApprovalCard({
  item,
  onDecision,
  isPending,
}: {
  item: Record<string, string>;
  onDecision: (id: string, status: string, reason?: string) => void;
  isPending: boolean;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [template, setTemplate] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const body: string = item.body || "";
  const charCount = body.length;
  const overLimit = charCount > 3000;

  function handleTemplate(val: string) {
    setTemplate(val);
    const tmpl = REJECT_TEMPLATES.find((t) => t.label === val);
    if (tmpl) setReason(tmpl.value);
  }

  function handleApprove() {
    onDecision(item.id, "approved");
    setRejectOpen(false);
  }

  function handleReject() {
    onDecision(item.id, "rejected", reason);
    setRejectOpen(false);
    setReason("");
    setTemplate("");
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="size-3.5 text-muted-foreground" />
              {item.tenant_name || "Unknown tenant"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {item.agent_kind}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.item_type}
              </Badge>
              {item.created_at && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {format(parseISO(item.created_at), "MMM d, HH:mm")}
                </span>
              )}
            </div>
          </div>
          <Badge className="border-amber-200 bg-amber-500/10 text-amber-600">Pending</Badge>
        </div>

        {/* Character count bar */}
        <div className="mb-3 flex items-center gap-3 text-xs">
          <div className="flex-1">
            <div className="mb-1 flex justify-between">
              <span className="text-muted-foreground">LinkedIn character count</span>
              <span className={overLimit ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {charCount.toLocaleString()} / 3,000
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  overLimit
                    ? "bg-destructive"
                    : charCount > 2500
                    ? "bg-warning"
                    : "bg-success"
                }`}
                style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
              />
            </div>
          </div>
          {overLimit && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="size-3" />
              Over limit
            </span>
          )}
        </div>

        {/* Source URL */}
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            {item.source_url}
          </a>
        )}

        {/* Post body / LinkedIn preview toggle */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Content</span>
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Show raw text" : "LinkedIn preview"}
            </button>
          </div>
          {showPreview ? (
            <LinkedInPreview text={body} imageUrl={item.image_url} />
          ) : (
            <>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt="Post visual"
                  className="w-full max-h-48 rounded-lg object-cover border"
                />
              )}
              <div className="max-h-64 overflow-y-auto rounded-lg bg-muted/50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!rejectOpen ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-success/30 text-success hover:bg-success/10"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
            >
              <XCircle className="size-3.5" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-xs font-semibold text-destructive">Rejection reason (required)</p>
            <Select value={template} onValueChange={handleTemplate}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Quick template…" />
              </SelectTrigger>
              <SelectContent>
                {REJECT_TEMPLATES.map((t) => (
                  <SelectItem key={t.label} value={t.label} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Or type a custom reason…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={!reason.trim() || isPending}
                onClick={handleReject}
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRejectOpen(false);
                  setReason("");
                  setTemplate("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminApprovalsPage() {
  const qc = useQueryClient();
  const [tenantFilter, setTenantFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-approvals", tenantFilter, agentFilter],
    queryFn: () =>
      adminApi.approvals({
        tenant_id: tenantFilter || undefined,
        agent_kind: agentFilter || undefined,
        status: "pending",
      }),
    refetchInterval: 30_000,
  });

  const mut = useMutation({
    mutationFn: (p: { id: string; status: string; reason?: string }) =>
      adminApi.decideApproval(p.id, { status: p.status, reason: p.reason }),
    onMutate: (p) => setPendingIds((s) => new Set(s).add(p.id)),
    onSettled: (_, __, p) => {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(p.id);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin-approvals"] });
    },
  });

  const items: Record<string, string>[] = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Cross-tenant content waiting for platform review"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Input
          className="max-w-xs text-sm"
          placeholder="Filter by tenant name…"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
        />
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All agents</SelectItem>
            <SelectItem value="post_gen">Post Gen</SelectItem>
            <SelectItem value="lead_gen">Lead Gen</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{items.length} pending</Badge>
      </div>

      {isLoading ? (
        <InlineLoader label="Loading approvals" />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-14">
            <EmptyState
              title="All clear!"
              description="No content is awaiting approval right now."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              isPending={pendingIds.has(item.id)}
              onDecision={(id, status, reason) => mut.mutate({ id, status, reason })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
