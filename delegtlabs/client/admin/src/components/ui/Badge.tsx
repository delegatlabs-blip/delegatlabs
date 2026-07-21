export function TrendBadge({ value, positive }: { value: string; positive?: boolean }) {
  const up = positive ?? !value.startsWith("-");
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-azia-success" : "text-azia-danger"}`}
    >
      {up ? (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {value}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    deprecated: "bg-gray-100 text-gray-600 border-gray-200",
    trial: "bg-blue-50 text-blue-700 border-blue-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    paused: "bg-orange-50 text-orange-700 border-orange-200",
  };
  const cls = colors[status] ?? "bg-purple-50 text-purple-700 border-purple-200";
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
