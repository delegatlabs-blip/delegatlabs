import type { Metadata } from "next";

import { AgentsHero } from "@/components/agents/AgentsHero";
import { AgentsList } from "@/components/agents/AgentsList";
import { ContactSection } from "@/components/sections";
import { DEFAULT_PAGE_SIZE } from "@/lib/agents/types";
import { listAgents } from "@/server/agents/repository";

export const metadata: Metadata = {
  title: "All Agents",
  description:
    "Browse every specialist AI agent in the DelegtLabs marketplace, with plans on subscription or credits.",
  alternates: { canonical: "/agents" },
};

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1;
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  const data = listAgents({ page: parsePage(page), pageSize: DEFAULT_PAGE_SIZE });

  return (
    <main className="overflow-x-hidden bg-white">
      <AgentsHero total={data.total} />
      <AgentsList initialData={data} />
      <ContactSection />
    </main>
  );
}
