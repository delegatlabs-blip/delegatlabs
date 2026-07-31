import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = {
  title: "Notifications — Vertex OS",
  description: "Stay on top of activity across your workspace.",
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 md:p-8">
      <PageHeader title="Notifications" description="Stay on top of activity across your workspace." />
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="You're all caught up. New alerts will show up here."
      />
    </div>
  );
}
