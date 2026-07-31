import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentPlans } from "@/components/agents/AgentPlans";
import { ContactSection } from "@/components/sections";
import { accentColors, accentGradients, isSvg } from "@/lib/agents/types";
import { getAgentBySlug, listAgentSlugs } from "@/server/agents/repository";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listAgentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) return { title: "Agent not found" };

  return {
    title: agent.name,
    description: agent.desc,
    alternates: { canonical: `/agents/${agent.slug}` },
    openGraph: { title: agent.name, description: agent.desc, images: [agent.imageUrl] },
  };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) notFound();

  return (
    <main className="overflow-x-hidden bg-white">
      <section className="site-section pb-8 pt-16 md:pt-24">
        <Link
          href="/agents"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary-600"
        >
          <span aria-hidden="true">←</span> All agents
        </Link>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {agent.tag}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              {agent.name}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              {agent.details}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {agent.caps.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br ${
              accentGradients[agent.accent]
            } shadow-2xl shadow-slate-300/50`}
          >
            {agent.imageUrl ? (
              <Image
                src={agent.imageUrl}
                alt={`${agent.name} preview`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={isSvg(agent.imageUrl)}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center text-6xl font-bold"
                style={{ color: accentColors[agent.accent] }}
                aria-hidden="true"
              >
                {agent.icon}
              </div>
            )}
          </div>
        </div>
      </section>

      <AgentPlans agent={agent} />
      <ContactSection />
    </main>
  );
}
