"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Eye,
  Search,
  Plus,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserDrawer } from "./user-drawer";
import { AUTH_DISABLED } from "@/lib/api";
import { useAuthStore } from "@/lib/domains/auth";
import {
  deleteMemberUseCase,
  listMembersUseCase,
  updateMemberUseCase,
  type Member,
} from "@/lib/domains/member";

const statusStyles = {
  active: "bg-[color:var(--success)]/12 text-[color:var(--success)]",
  invited: "bg-primary/10 text-primary",
  suspended: "bg-destructive/10 text-destructive",
};

const roleStyles: Record<string, string> = {
  Owner: "bg-[image:var(--gradient-primary)] text-white",
  Admin: "bg-primary/10 text-primary",
  Editor: "bg-accent/15 text-foreground",
  Viewer: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 8;

export function UsersTable() {
  const tenantId = useAuthStore((s) => s.claims?.tenant_id);
  const [data, setData] = useState<Member[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUser, setEditUser] = useState<Member | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await listMembersUseCase());
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to load members");
      setData([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return data.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      if (role !== "all" && u.role !== role) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    });
  }, [data, query, status, role]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = pageItems.length > 0 && pageItems.every((u) => selected.has(u.id));

  function toggleAll() {
    const next = new Set(selected);
    if (allSelected) pageItems.forEach((u) => next.delete(u.id));
    else pageItems.forEach((u) => next.add(u.id));
    setSelected(next);
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <Card className="overflow-hidden border-border/60 p-0 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <TabsList className="h-9">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="invited">Invited</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-[11px] text-muted-foreground">
            Scoped to tenant{" "}
            <code className="rounded bg-muted px-1">
              {AUTH_DISABLED ? "demo (auth disabled)" : tenantId?.slice(0, 8) || "…"}
            </code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg pl-9 sm:w-64"
            />
          </div>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="Owner">Owner</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={() => toast.success("Exported CSV")}>
            <Download className="size-4" /> Export
          </Button>
          <Button
            size="sm"
            className="h-9 shadow-[var(--shadow-glow)]"
            onClick={() => {
              setEditUser(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="size-4" /> Add user
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-5">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">User</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Role</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Department</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Updated</TableHead>
              <TableHead className="w-10 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!ready ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-sm text-muted-foreground">
                  Loading members…
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-sm text-muted-foreground">
                  No users in this tenant yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((u) => (
                <TableRow key={u.id} className="group">
                  <TableCell className="pl-5">
                    <Checkbox
                      checked={selected.has(u.id)}
                      onCheckedChange={() => toggleOne(u.id)}
                      aria-label={`Select ${u.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs">
                          {u.name
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{u.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("rounded-full font-medium hover:opacity-90", roleStyles[u.role] || roleStyles.Viewer)}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.department || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("gap-1.5 rounded-full font-medium capitalize", statusStyles[u.status])}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.updatedAt ? format(new Date(u.updatedAt), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          aria-label="User actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditUser(u);
                            setDrawerOpen(true);
                          }}
                        >
                          <Eye className="size-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditUser(u);
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={async () => {
                            const next = u.status === "active" ? "suspended" : "active";
                            try {
                              await updateMemberUseCase(u.id, { status: next });
                              toast.success(next === "suspended" ? "Suspended" : "Activated");
                              await refresh();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Update failed");
                            }
                          }}
                        >
                          {u.status === "active" ? (
                            <>
                              <UserX className="size-4" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-4" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={async () => {
                            try {
                              await deleteMemberUseCase(u.id);
                              toast.success(`Deleted ${u.name}`);
                              await refresh();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Delete failed");
                            }
                          }}
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{pageItems.length}</span> of{" "}
          <span className="font-medium text-foreground">{filtered.length}</span> users
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={editUser} onSaved={refresh} />
    </Card>
  );
}
