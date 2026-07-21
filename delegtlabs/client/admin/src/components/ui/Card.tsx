export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`azia-card ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-azia-border px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-azia-text">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-azia-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
