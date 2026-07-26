import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { UsersTable } from "@/components/users/users-table";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users — Vertex OS" },
      { name: "description", content: "Manage members, roles, and permissions across your organization." },
      { property: "og:title", content: "Users — Vertex OS" },
      { property: "og:description", content: "Manage members, roles, and permissions across your organization." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
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