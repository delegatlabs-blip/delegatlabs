import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { users as usersSeed, type User, type UserStatus } from "./user-data";
import { UserDrawer } from "./user-drawer";
import { cn } from "@/lib/utils";

const statusStyles: Record<UserStatus, string> = {
  active: "bg-success/15 text-success border-success/25",
  invited: "bg-info/15 text-info border-info/25",
  suspended: "bg-destructive/15 text-destructive border-destructive/25",
};

export function UsersTable() {
  const [data, setData] = useState<User[]>(usersSeed);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filtered = useMemo(() => {
    return data.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    });
  }, [data, filter, roleFilter, statusFilter]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={row.original.avatar} />
              <AvatarFallback>{row.original.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
            <Shield className="h-3 w-3" /> {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.department}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={cn("capitalize", statusStyles[row.original.status])}>
            <span
              className={cn(
                "mr-1 h-1.5 w-1.5 rounded-full",
                row.original.status === "active" && "bg-success",
                row.original.status === "invited" && "bg-info",
                row.original.status === "suspended" && "bg-destructive"
              )}
            />
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "lastLogin",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last active <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.lastLogin), { addSuffix: true })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(row.original);
                    setDrawerOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setData((prev) =>
                      prev.map((u) =>
                        u.id === row.original.id
                          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
                          : u
                      )
                    );
                    toast.success(
                      row.original.status === "active"
                        ? `Suspended ${row.original.name}`
                        : `Activated ${row.original.name}`
                    );
                  }}
                >
                  {row.original.status === "active" ? (
                    <>
                      <UserX className="h-4 w-4" /> Suspend
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-card md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name, email or department…"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-[140px]">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {["Owner", "Admin", "Editor", "Viewer", "Billing"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <p className="text-sm">
            <span className="font-medium">{selectedCount}</span> selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              Change role
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                toast.success(`Deleted ${selectedCount} users`);
                setRowSelection({});
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3 text-left font-medium">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="mx-auto max-w-xs">
                      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No users match your filters</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try adjusting your search or resetting filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t transition-colors hover:bg-muted/30"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((c) => (
                      <td key={c.id} className="px-4 py-3">
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filtered.length
              )}
            </span>{" "}
            of <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[92px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[8, 15, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[80px] text-center text-xs text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span> from
              your workspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  setData((prev) => prev.filter((u) => u.id !== deleteTarget.id));
                  toast.success(`Deleted ${deleteTarget.name}`);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewUserButton onOpen={() => { setEditing(null); setDrawerOpen(true); }} />
    </div>
  );
}

function NewUserButton({ onOpen }: { onOpen: () => void }) {
  return null;
}

export function UsersHeaderActions({ onInvite }: { onInvite: () => void }) {
  return (
    <Button className="shadow-elegant" onClick={onInvite}>
      + Add user
    </Button>
  );
}
