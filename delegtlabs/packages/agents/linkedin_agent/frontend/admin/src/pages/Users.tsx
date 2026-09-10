import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUser } from "@shared/api";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { PageHeader, InlineLoader } from "@shared/components/shared-ui";

function UserName({ user }: { user: AdminUser }) {
  const name = user.full_name || user.email;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {user.avatar_url ? (
        <img className="size-8 rounded-full object-cover" src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
      ) : (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => adminApi.users({ q: q || undefined }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Identity and access. Plans and credits belong to each user’s workspace."
      />
      <Input
        placeholder="Search name or email…"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        className="max-w-sm"
      />
      {isLoading ? <InlineLoader label="Loading users" /> : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Sign-in</th>
                <th className="px-3 py-2">Workspace billing</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((user) => (
                <tr key={user.id} className="border-t align-top hover:bg-muted/30">
                  <td className="px-3 py-2"><UserName user={user} /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.providers.map((provider) => <Badge key={provider} variant="secondary">{provider}</Badge>)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {user.workspaces.map((workspace) => (
                      <Link key={workspace.tenant_id} className="block text-primary hover:underline" to={`/tenants/${workspace.tenant_id}`}>
                        {workspace.name} · {workspace.credits_remaining} credits
                      </Link>
                    ))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={user.status === "suspended" ? "destructive" : "secondary"}>{user.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending || user.status === "pending"}
                        onClick={() => statusMutation.mutate({
                          id: user.id,
                          status: user.status === "suspended" ? "active" : "suspended",
                        })}
                      >
                        {user.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.users || []).length === 0 && (
                <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
