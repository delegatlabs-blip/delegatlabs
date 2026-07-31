"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, UserCheck, FlaskConical, UserX } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomersTable } from "@/lib/domains/customer/features/customers-table";
import { CustomerDrawer } from "@/lib/domains/customer/features/customer-drawer";
import { listCustomers, type Customer } from "@/lib/domains/customer";

export default function CustomersPage() {
  usePageTitle("Customers — Delegate Labs");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCustomers(await listCustomers());
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const active = customers.filter((c) => c.status === "active").length;
  const trial = customers.filter((c) => c.status === "trial").length;
  const suspended = customers.filter((c) => c.status === "suspended").length;

  const stats = [
    { label: "Total customers", value: ready ? customers.length : "…", icon: Building2, tone: "text-primary bg-primary/10" },
    { label: "Active", value: ready ? active : "…", icon: UserCheck, tone: "text-success bg-success/10" },
    { label: "On trial", value: ready ? trial : "…", icon: FlaskConical, tone: "text-info bg-info/10" },
    { label: "Suspended", value: ready ? suspended : "…", icon: UserX, tone: "text-destructive bg-destructive/10" },
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
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Customers</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Track marketplace buyers, plans, and agent purchases.</p>
        </div>
        <Button className="shadow-elegant" onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
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

      {!ready ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center text-sm text-muted-foreground">Loading customers…</div>
      ) : (
        <CustomersTable data={customers} onRefresh={refresh} />
      )}

      <CustomerDrawer open={drawerOpen} onOpenChange={setDrawerOpen} customer={null} onSaved={refresh} />
    </div>
  );
}
