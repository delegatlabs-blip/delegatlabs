import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { trafficSources } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrafficChart() {
  const total = trafficSources.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="border-border/60 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Traffic sources</CardTitle>
        <CardDescription>User acquisition channels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={trafficSources} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {trafficSources.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="text-2xl font-semibold tracking-tight">{total}%</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {trafficSources.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: s.fill }} />
                <span className="text-foreground">{s.name}</span>
              </div>
              <span className="font-medium text-muted-foreground">{s.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}