import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Users as UsersIcon, UserCheck, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UsersTable } from "@/components/users/users-table";
import { UserDrawer } from "@/components/users/user-drawer";
import { users } from "@/components/users/user-data";

export const Route = createFileRoute("/_app/users")({
  head: () => ({
    meta: [
      { title: "Users — Delegate Labs" },
      { name: "description", content: "Manage users, roles and access across your workspace." },
      { property: "og:title", content: "Users — Delegate Labs" },
      { property: "og:description", content: "Manage users, roles and access." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const total = users.length;
  const active = users.filter((u) => u.status === "active").length;
  const invited = users.filter((u) => u.status === "invited").length;
  const suspended = users.filter((u) => u.status === "suspended").length;

  const stats = [
    { label: "Total users", value: total, icon: UsersIcon, tone: "text-primary bg-primary/10" },
    { label: "Active", value: active, icon: UserCheck, tone: "text-success bg-success/10" },
    { label: "Pending invites", value: invited, icon: UserPlus, tone: "text-info bg-info/10" },
    { label: "Suspended", value: suspended, icon: UserX, tone: "text-destructive bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Users</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your users, roles and permissions.
          </p>
        </div>
        <Button className="shadow-elegant" onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4" /> Add user
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card className="flex items-center gap-3 p-4">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <UsersTable />

      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} user={null} />
    </div>
  );
}
