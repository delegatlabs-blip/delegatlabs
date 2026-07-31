import type { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard — Delegate Labs",
  description: "Overview of revenue, customers, agents and activity across your workspace.",
  openGraph: {
    title: "Dashboard — Delegate Labs",
    description: "Overview of revenue, customers, agents and activity.",
  },
};

export default function Dashboard() {
  return <DashboardContent />;
}
