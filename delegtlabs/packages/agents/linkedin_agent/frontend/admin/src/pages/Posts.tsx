import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  RefreshCw,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { adminPostsApi } from "@shared/api";
import type { Post, PostStatus } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent } from "@shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { PageHeader, InlineLoader, EmptyState } from "@shared/components/shared-ui";

const STATUS_META: Record<
  PostStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  draft: { label: "Draft", icon: Sparkles, className: "text-muted-foreground" },
  pending_review: { label: "Pending", icon: Clock, className: "text-amber-600" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-success" },
  published: { label: "Published", icon: Send, className: "text-primary" },
  partial: { label: "Partial", icon: AlertCircle, className: "text-amber-600" },
  failed: { label: "Failed", icon: AlertCircle, className: "text-destructive" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-destructive" },
};

function PostRow({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[post.status] || STATUS_META.draft;
  const Icon = meta.icon;

  return (
    <div className="border-t first:border-t-0">
      <div className="flex items-start gap-3 p-4">
        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="size-14 shrink-0 rounded-lg border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-medium ${meta.className}`}>
              <Icon className="size-3" />
              {meta.label}
            </span>
            {post.topic_name && (
              <Badge variant="secondary" className="text-xs">
                {post.topic_name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(parseISO(post.created_at), "MMM d, yyyy")}
            </span>
            {post.published_at && (
              <span className="text-xs text-muted-foreground">
                · Published {format(parseISO(post.published_at), "MMM d")}
              </span>
            )}
          </div>

          <p
            className={`text-sm leading-relaxed text-muted-foreground ${
              expanded ? "whitespace-pre-wrap" : "line-clamp-2"
            }`}
          >
            {post.generated_text}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {post.generated_text.length > 140 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show less" : `Show more (${post.generated_text.length} chars)`}
              </button>
            )}
            {post.linkedin_post_urn && !post.linkedin_post_urn.includes("dev_mock") && (
              <a
                href={`https://www.linkedin.com/feed/update/${encodeURIComponent(post.linkedin_post_urn)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                LinkedIn
              </a>
            )}
            {post.latest_score != null && (
              <span className="text-xs text-muted-foreground">
                Score: <strong>{Number(post.latest_score).toFixed(0)}</strong>
              </span>
            )}
            {post.rejection_reason && (
              <span className="text-xs text-destructive">
                Rejected: {post.rejection_reason}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminPostsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-posts", statusFilter, page],
    queryFn: () =>
      adminPostsApi.list({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const posts: Post[] = data?.posts || [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusCounts = posts.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Posts"
        description="Platform-wide view of all generated and published content"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        }
      />

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_META).map(([status, meta]) => {
          const count = statusCounts[status];
          if (!count) return null;
          const Icon = meta.icon;
          return (
            <button
              key={status}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 hover:bg-muted/60"
              }`}
              onClick={() => {
                setStatusFilter(statusFilter === status ? "" : status);
                setPage(0);
              }}
            >
              <Icon className={`size-3 ${meta.className}`} />
              {meta.label}
              <Badge variant="secondary" className="ml-0.5 rounded-full text-[10px]">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px] text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {total.toLocaleString()} post{total !== 1 ? "s" : ""} total
        </span>
      </div>

      {/* Post list */}
      {isLoading ? (
        <InlineLoader label="Loading posts" />
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-14">
            <EmptyState
              title="No posts found"
              description={statusFilter ? "Try clearing the status filter." : "No posts have been generated yet."}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
