"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PURPLE = "#6f42c1";
const BLUE = "#4facfe";
const LIGHT_PURPLE = "rgba(111, 66, 193, 0.15)";
const LIGHT_BLUE = "rgba(79, 172, 254, 0.2)";

export function DualLineChart({ data }: { data: { label: string; primary: number; secondary: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8392a5" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8392a5" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e3e7ed" }} />
        <Line type="monotone" dataKey="primary" stroke={PURPLE} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="secondary" stroke={BLUE} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniAreaChart({ data, color = BLUE }: { data: { v: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} fill={color === PURPLE ? LIGHT_PURPLE : LIGHT_BLUE} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({ data }: { data: { v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey="v" fill={BLUE} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedBarChart({ data }: { data: { label: string; a: number; b: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8392a5" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Bar dataKey="a" stackId="s" fill={PURPLE} radius={[0, 0, 0, 0]} />
        <Bar dataKey="b" stackId="s" fill={BLUE} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceHistoryChart({
  data,
}: {
  data: { changed_at: string; old_price: string; new_price: string }[];
}) {
  const chartData = data.map((row) => ({
    label: new Date(row.changed_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    price: Number(row.new_price),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8392a5" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8392a5" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e3e7ed" }} />
        <Area type="monotone" dataKey="price" stroke={PURPLE} fill={LIGHT_PURPLE} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
