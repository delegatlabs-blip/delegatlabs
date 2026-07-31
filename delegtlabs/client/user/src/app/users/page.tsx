import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { UsersTable } from "@/lib/domains/member/features/users-table";

export const metadata: Metadata = {
  title: "Users — Vertex OS",
  description: "Manage members, roles, and permissions across your organization.",
  openGraph: {
    title: "Users — Vertex OS",
    description: "Manage members, roles, and permissions across your organization.",
  },
};

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <PageHeader
        title="Users"
        description="Invite members, manage roles, and control access to your workspace."
      />
      <UsersTable />
    </div>
  );
}
