import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsFetching, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Edit3, ImageOff, Loader2, MoreHorizontal, RefreshCw, Repeat2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { postsApi, authApi, tenantApi, summarizePublishResults, type Post } from "@shared/api";
import { listPersonaTopics } from "@shared/api/topics-persona";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { ConfirmDialog } from "@shared/components/ui/confirm-dialog";
import { DataTable } from "@shared/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { PaginationBar } from "@shared/components/ui/pagination-bar";
import {
  PAGE_SIZE_OPTIONS,
  clampPage,
  pageCount,
  parseLimit,
  parsePage,
  toOffset,
} from "@shared/lib/pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Textarea } from "@shared/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { EmptyState, StatusBadge } from "@shared/components/shared-ui";
import { Skeleton } from "@shared/components/ui/skeleton";
import { apiErrorMessage } from "./api-error";
import { GeneratePostDialog } from "./GeneratePostDialog";

function excerpt(text: string, max = 80): string {
  const t = (text || "").trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, max)}…`;
}

export function PostsToolbar() {
  const qc = useQueryClient();
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["tenant-credits"],
    queryFn: tenantApi.credits,
  });
  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: listPersonaTopics,
  });
  const hasActiveTopic = (topics ?? []).some((t) => t.is_active);
  const postsFetching = useIsFetching({ queryKey: ["posts"] }) > 0;

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <Badge variant="outline" className="h-11 whitespace-nowrap px-3 text-sm font-medium sm:h-9">
          {wallet?.balance ?? 0} credits
        </Badge>
        <Button size="sm" className="h-11 min-w-0 flex-1 whitespace-nowrap sm:h-9 sm:flex-none" disabled={!hasActiveTopic} onClick={() => setGenerateOpen(true)}>
          Generate Post
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 sm:size-9"
          aria-label="Refresh"
          onClick={() => qc.invalidateQueries({ queryKey: ["posts"] })}
          disabled={postsFetching}
        >
          <RefreshCw className={`size-3.5 ${postsFetching ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      <GeneratePostDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        hasActiveTopic={hasActiveTopic}
      />
    </>
  );
}

function Thumb({ url, onOpen }: { url: string | null; onOpen: (url: string) => void }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="grid size-12 place-items-center rounded-lg border bg-muted text-muted-foreground">
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="block size-12 overflow-hidden rounded-lg border"
      onClick={() => onOpen(url)}
      aria-label="View image"
    >
      <img
        src={url}
        alt=""
        width={48}
        height={48}
        className="size-12 object-cover"
        onError={() => setBroken(true)}
      />
    </button>
  );
}

export function PostsTab() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const limit = parseLimit(searchParams.get("limit"));
  const offset = toOffset(page, limit);

  function writePaging(nextPage: number, nextLimit: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    next.set("limit", String(nextLimit));
    setSearchParams(next);
  }

  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const publishBlocked = authStatus != null && (authStatus.enabled_publishable_count ?? 0) === 0;
  const { data, isLoading } = useQuery({
    queryKey: ["posts", "post-gen-table", limit, offset],
    queryFn: () => postsApi.list({ limit, offset }),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data == null) return;
    const next = clampPage(page, data.total, limit);
    if (next === page) return;
    writePaging(next, limit);
  }, [data, page, limit]);

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: listPersonaTopics,
  });
  const hasActiveTopic = (topics ?? []).some((t) => t.is_active);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [editText, setEditText] = useState("");
  const [deleting, setDeleting] = useState<Post | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["posts"] });
  };

  const patchMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No post selected");
      return postsApi.patch(editing.id, { generated_text: editText });
    },
    onSuccess: () => {
      toast.success("Post updated");
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Update failed")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => {
      toast.success("Post deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Delete failed (published posts cannot be deleted)")),
  });

  const repostMut = useMutation({
    mutationFn: (id: number) => postsApi.repost(id),
    onSuccess: (data) => {
      toast.success(summarizePublishResults(data));
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Repost failed")),
  });

  const posts = data?.posts ?? [];

  function openEdit(post: Post) {
    setEditing(post);
    setEditText(post.generated_text || "");
  }

  function confirmDelete(post: Post) {
    if (post.status === "published") {
      toast.error("Published posts cannot be deleted");
      return;
    }
    setDeleting(post);
  }

  const pager = (
    <PaginationBar
      page={page}
      limit={limit}
      total={data?.total ?? 0}
      totalPages={pageCount(data?.total ?? 0, limit)}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      onPageChange={(next) => writePaging(next, limit)}
      onLimitChange={(nextLimit) => writePaging(1, nextLimit)}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} posts</p>
        {!topicsLoading && !hasActiveTopic ? (
          <p className="text-xs text-muted-foreground">Activate a topic on Topic Weights.</p>
        ) : null}
      </div>

      {isLoading ? (
        <DataTable fill={false} footer={null}>
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </DataTable>
      ) : (data?.total ?? 0) === 0 ? (
        <DataTable fill={false}>
          <EmptyState
            title="No posts yet"
            description="Use the Post Generation tab to create and publish your first post."
          />
        </DataTable>
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">
            <DataTable footer={pager}>
              <Table contained>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-36">Created</TableHead>
                    <TableHead className="w-44 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Thumb url={post.image_url} onOpen={setLightboxUrl} />
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                          {excerpt(post.generated_text, 140)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-9" aria-label="Edit" onClick={() => openEdit(post)}>
                                <Edit3 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9"
                                aria-label="Repost"
                                title={
                                  publishBlocked
                                    ? "Enable a publishable LinkedIn destination on Connections"
                                    : "Repost"
                                }
                                disabled={publishBlocked || repostMut.isPending}
                                onClick={() => repostMut.mutate(post.id)}
                              >
                                <Repeat2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {publishBlocked
                                ? "Enable a publishable LinkedIn destination on Connections"
                                : "Repost"}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 text-destructive hover:text-destructive"
                                aria-label="Delete"
                                disabled={deleteMut.isPending || post.status === "published"}
                                onClick={() => confirmDelete(post)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTable>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  <Thumb url={post.image_url} onOpen={setLightboxUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 text-sm font-medium leading-snug">
                      {excerpt(post.generated_text, 160)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-11 flex-1" onClick={() => openEdit(post)}>
                    <Edit3 className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1"
                    disabled={publishBlocked || repostMut.isPending}
                    onClick={() => repostMut.mutate(post.id)}
                  >
                    <Repeat2 className="size-4" />
                    Repost
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-11" aria-label="More actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={deleteMut.isPending || post.status === "published"}
                        className="text-destructive"
                        onClick={() => confirmDelete(post)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            ))}
            <div className="overflow-hidden rounded-xl border border-border bg-card">{pager}</div>
          </div>
        </>
      )}

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {lightboxUrl ? (
            <img src={lightboxUrl} alt="" className="max-h-[70vh] w-full rounded-lg object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={10}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => patchMut.mutate()} disabled={patchMut.isPending}>
              {patchMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this post?"
        description="This cannot be undone. Published posts cannot be deleted."
        confirmLabel="Delete"
        destructive
        pending={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
      />
    </div>
  );
}
