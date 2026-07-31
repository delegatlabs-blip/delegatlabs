"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Direct", value: 4820, color: "var(--color-primary)" },
  { name: "Organic", value: 3140, color: "var(--color-info)" },
  { name: "Referral", value: 1870, color: "var(--color-success)" },
  { name: "Social", value: 1210, color: "var(--color-warning)" },
];

const total = data.reduce((a, b) => a + b.value, 0);

export function TrafficDonut() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Traffic sources</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={62} outerRadius={88} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold tracking-tight">{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">total visits</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.value.toLocaleString()}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
