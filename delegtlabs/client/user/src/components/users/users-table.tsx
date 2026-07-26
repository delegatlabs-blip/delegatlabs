import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  MoreHorizontal, Pencil, Trash2, KeyRound, UserX, UserCheck, Copy, Eye, Search, Plus, Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers, type User } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserDrawer } from "./user-drawer";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      if (role !== "all" && u.role !== role) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    });
  }, [query, status, role]);

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

  function openEdit(u: User) {
    setEditUser(u);
    setDrawerOpen(true);
  }
  function openCreate() {
    setEditUser(null);
    setDrawerOpen(true);
  }

  return (
    <Card className="overflow-hidden border-border/60 p-0 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <TabsList className="h-9">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="invited">Invited</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-lg pl-9 sm:w-64"
            />
          </div>
          <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Role" /></SelectTrigger>
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
          <Button size="sm" className="h-9 shadow-[var(--shadow-glow)]" onClick={openCreate}>
            <Plus className="size-4" /> Add user
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-5 py-2.5 text-sm"
        >
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            <Button variant="outline" size="sm">Assign role</Button>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </motion.div>
      )}

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
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Last login</TableHead>
              <TableHead className="w-10 pr-5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="text-sm text-muted-foreground">No users match your filters.</div>
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
                          {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{u.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("rounded-full font-medium hover:opacity-90", roleStyles[u.role])}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.department}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("gap-1.5 rounded-full font-medium capitalize", statusStyles[u.status])}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(u.lastLogin), "MMM d, yyyy")}</TableCell>
                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="User actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEdit(u)}><Eye className="size-4" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Password reset sent")}><KeyRound className="size-4" /> Reset password</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Duplicated")}><Copy className="size-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.status === "active" ? (
                          <DropdownMenuItem onClick={() => toast("User deactivated")}><UserX className="size-4" /> Deactivate</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => toast.success("User activated")}><UserCheck className="size-4" /> Activate</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.error("User deleted")}>
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
          <Button variant="outline" size="sm" className="h-8" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="h-8" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </div>

      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={editUser} />
    </Card>
  );
}