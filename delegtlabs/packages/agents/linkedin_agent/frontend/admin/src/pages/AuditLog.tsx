import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { adminApi } from "@shared/api";
import { PageHeader } from "@shared/components/shared-ui";

export default function AdminAuditLogPage() {
  const { data } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => adminApi.auditLog({ limit: 150 }),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" description="Append-only admin actions" />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Resource</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries || []).map((e: Record<string, unknown>) => (
              <tr key={String(e.id)} className="border-t">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {e.created_at
                    ? formatDistanceToNow(new Date(String(e.created_at)), { addSuffix: true })
                    : "—"}
                </td>
                <td className="px-3 py-2">{String(e.actor_id)}</td>
                <td className="px-3 py-2 font-medium">{String(e.action)}</td>
                <td className="px-3 py-2 text-xs">
                  {String(e.resource_type)} {e.resource_id ? `#${e.resource_id}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
