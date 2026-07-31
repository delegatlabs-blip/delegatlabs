import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = {
  title: "Projects — Vertex OS",
  description: "Organize initiatives and track delivery across your teams.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 md:p-8">
      <PageHeader title="Projects" description="Organize initiatives and track delivery across your teams." />
      <EmptyState
        icon={FolderKanban}
        title="Projects coming soon"
        description="Plan, assign and track project milestones from one place."
      />
    </div>
  );
}
