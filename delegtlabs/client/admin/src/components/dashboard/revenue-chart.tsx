import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const data = [
  { m: "Jan", revenue: 24000, expenses: 12400 },
  { m: "Feb", revenue: 28400, expenses: 13100 },
  { m: "Mar", revenue: 32100, expenses: 14200 },
  { m: "Apr", revenue: 30800, expenses: 13800 },
  { m: "May", revenue: 38600, expenses: 15300 },
  { m: "Jun", revenue: 42900, expenses: 16400 },
  { m: "Jul", revenue: 48200, expenses: 17100 },
  { m: "Aug", revenue: 52400, expenses: 18200 },
  { m: "Sep", revenue: 58900, expenses: 19100 },
  { m: "Oct", revenue: 61200, expenses: 19800 },
  { m: "Nov", revenue: 68400, expenses: 20900 },
  { m: "Dec", revenue: 74800, expenses: 22300 },
];

export function RevenueChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Revenue overview</CardTitle>
          <CardDescription>Gross revenue and operating expenses</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Revenue
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-info" /> Expenses
          </Badge>
          <Tabs defaultValue="12m">
            <TabsList className="h-8">
              <TabsTrigger value="30d" className="text-xs">
                30d
              </TabsTrigger>
              <TabsTrigger value="3m" className="text-xs">
                3m
              </TabsTrigger>
              <TabsTrigger value="12m" className="text-xs">
                12m
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "var(--shadow-card)",
                }}
                formatter={(v: number) => `$${v.toLocaleString()}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.25} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="var(--color-info)" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
