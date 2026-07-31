import type { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard — Vertex OS",
  description: "Real-time overview of revenue, users, and platform activity.",
  openGraph: {
    title: "Dashboard — Vertex OS",
    description: "Real-time overview of revenue, users, and platform activity.",
  },
};

export default function Dashboard() {
  return <DashboardContent />;
}
