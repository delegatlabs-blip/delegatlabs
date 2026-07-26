import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { recentOrders } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles = {
  completed: "bg-[color:var(--success)]/12 text-[color:var(--success)] hover:bg-[color:var(--success)]/12",
  pending: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] hover:bg-[color:var(--warning)]/15",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
};

export function RecentOrders() {
  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent orders</CardTitle>
        <CardDescription>Latest transactions across the platform</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 text-[11px] font-semibold uppercase tracking-wider">Order</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="pr-6 text-right text-[11px] font-semibold uppercase tracking-wider">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer transition-colors">
                <TableCell className="pl-6">
                  <span className="font-mono text-xs font-medium">{o.id}</span>
                  <div className="text-[11px] text-muted-foreground">{o.date}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[11px]">
                        {o.customer.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{o.customer}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{o.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("gap-1.5 rounded-full font-medium capitalize", statusStyles[o.status])}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right font-semibold tabular-nums">
                  ${o.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}