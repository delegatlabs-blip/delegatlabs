"use client";

import { useEffect, useState } from "react";
import { FilterField, PageHeader } from "@/components/admin/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { AuditRow, adminApi } from "@/lib/api";

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [targetType, setTargetType] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listAuditLog({
        target_type: targetType || undefined,
        admin_user_id: adminUser || undefined,
      })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [targetType, adminUser]);

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Track all admin mutations and impersonation events.">
        <FilterField label="Target Type">
          <input
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            placeholder="e.g. agent, client"
            className="azia-input w-40"
          />
        </FilterField>
        <FilterField label="Admin User">
          <input
            value={adminUser}
            onChange={(e) => setAdminUser(e.target.value)}
            placeholder="Admin user ID"
            className="azia-input w-44"
          />
        </FilterField>
        <button type="button" className="azia-btn-primary mt-auto">
          Export
        </button>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-azia-muted">Loading audit log...</p>
          ) : (
            <table className="azia-table w-full">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-azia-muted">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="font-mono text-xs">{row.admin_user_id.slice(0, 12)}...</td>
                    <td>
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-azia-primary">
                        {row.action}
                      </span>
                    </td>
                    <td className="capitalize text-azia-muted">{row.target_type.replace(/_/g, " ")}</td>
                    <td className="font-mono text-xs text-azia-muted">{row.target_id?.slice(0, 12) ?? "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-azia-muted">
                      No audit entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
