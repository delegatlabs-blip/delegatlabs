import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { revenueSeries } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RevenueChart() {
  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Revenue analytics</CardTitle>
          <CardDescription>Monthly revenue vs target performance</CardDescription>
        </div>
        <Tabs defaultValue="12m">
          <TabsList className="h-8">
            <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
            <TabsTrigger value="6m" className="text-xs">6m</TabsTrigger>
            <TabsTrigger value="12m" className="text-xs">12m</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tgt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="target" stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#tgt)" />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}