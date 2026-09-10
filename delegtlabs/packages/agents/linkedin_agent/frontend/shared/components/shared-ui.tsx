import type { ReactNode } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

import { Badge } from "@shared/components/ui/badge";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatEnumLabel } from "@shared/lib/format-label";
import { cn } from "@shared/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
      ) : null}
    </header>
  );
}

const tone: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  "Pending Review": "bg-warning/18 text-warning-foreground border-warning/35",
  pending_review: "bg-warning/18 text-warning-foreground border-warning/35",
  Approved: "bg-primary-soft text-accent-foreground border-primary/20",
  approved: "bg-primary-soft text-accent-foreground border-primary/20",
  Published: "bg-success/12 text-success border-success/25",
  published: "bg-success/12 text-success border-success/25",
  Partial: "bg-warning/18 text-warning-foreground border-warning/35",
  partial: "bg-warning/18 text-warning-foreground border-warning/35",
  Failed: "bg-destructive/10 text-destructive border-destructive/25",
  failed: "bg-destructive/10 text-destructive border-destructive/25",
  Rejected: "bg-destructive/10 text-destructive border-destructive/25",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
  Active: "bg-success/12 text-success border-success/25",
  Scheduled: "bg-primary-soft text-accent-foreground border-primary/20",
  scheduled: "bg-primary-soft text-accent-foreground border-primary/20",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
  partial: "Partial",
  failed: "Failed",
  rejected: "Rejected",
  scheduled: "Scheduled",
};

export function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? formatEnumLabel(status) ?? status;
  return (
    <Badge variant="outline" className={cn("font-medium", tone[status] ?? tone[label] ?? "bg-muted")}>
      {label}
    </Badge>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary-subtle text-primary">
        {icon ?? <FileText className="size-5" />}
      </div>
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Where LinkedIn offers "Continue with Google" — its consumer login page. */
export const LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login";

/**
 * Escape hatch for members whose LinkedIn account was created with "Continue with
 * Google" and so has no password.
 *
 * The page our Connect button lands on is LinkedIn's own /uas/login, which — unlike
 * www.linkedin.com/login — omits the Google button entirely. We cannot change what
 * LinkedIn renders there. What does work is arriving already authenticated: with a
 * live linkedin.com session, /oauth/v2/authorization skips the password prompt and
 * goes straight to the consent screen.
 *
 * Deliberately a passive hint rather than an interstitial — most members do have a
 * password, and gating every connect behind a dialog taxes them to help a minority.
 */
export function LinkedInSessionHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Created your LinkedIn account with Google? LinkedIn will ask for a password it
      never gave you.{" "}
      <a
        href={LINKEDIN_LOGIN_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="font-medium text-primary underline underline-offset-2"
      >
        Sign in to LinkedIn first
        <ExternalLink className="ml-0.5 inline size-3 align-[-0.1em]" />
      </a>{" "}
      — then come back and connect.
    </p>
  );
}
