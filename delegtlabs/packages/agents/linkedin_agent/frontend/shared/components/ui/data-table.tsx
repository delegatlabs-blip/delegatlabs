import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";

type DataTableProps = {
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** When true the viewport fills remaining flex height and rows scroll. */
  fill?: boolean;
};

export function DataTable({ toolbar, footer, children, className, fill = true }: DataTableProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card",
        fill && "flex-1",
        className,
      )}
    >
      {toolbar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          {toolbar}
        </div>
      ) : null}
      <div className={cn("min-h-0 overflow-auto overscroll-contain", fill ? "flex-1 max-h-[min(40rem,calc(100dvh-var(--header-height)-var(--mobile-nav-height)-12rem))]" : "max-h-[min(32rem,calc(100dvh-16rem))]")}>
        {children}
      </div>
      {footer ? <div className="shrink-0 border-t border-border-subtle bg-card">{footer}</div> : null}
    </div>
  );
}
