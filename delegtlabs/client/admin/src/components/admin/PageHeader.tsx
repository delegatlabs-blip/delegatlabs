type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-azia-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-end gap-3 lg:flex-nowrap">{children}</div>}
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-azia-muted">{label}</label>
      {children}
    </div>
  );
}

export function SubNavTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange?: (t: string) => void }) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-azia-border">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange?.(tab)}
            className={`azia-tab ${active === tab ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="hidden items-center gap-4 pb-2 text-xs text-azia-muted sm:flex">
        <button type="button" className="flex items-center gap-1 hover:text-azia-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Report
        </button>
        <button type="button" className="flex items-center gap-1 hover:text-azia-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to PDF
        </button>
      </div>
    </div>
  );
}
