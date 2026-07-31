"use client";

import Link from "next/link";
import { Bot, Gavel, Linkedin, Pause, Pencil, Play } from "lucide-react";
import type { AgentRecord } from "@/lib/domains/agent";
import { cn } from "@/lib/utils";

const accentBySlug = {
  "linkedin-agent": {
    card: "bg-gradient-to-br from-primary to-primary-glow",
    title: "text-[color-mix(in_oklab,var(--primary)_75%,black)]",
    text: "text-[color-mix(in_oklab,var(--primary)_55%,black)]",
    action: "text-primary",
    stroke: "stroke-primary",
    circle: "bg-primary-glow/25",
  },
  "lawyer-agent": {
    card: "bg-gradient-to-br from-info to-[oklch(0.62_0.14_230)]",
    title: "text-[color-mix(in_oklab,var(--info)_70%,black)]",
    text: "text-[color-mix(in_oklab,var(--info)_50%,black)]",
    action: "text-info",
    stroke: "stroke-info",
    circle: "bg-info/30",
  },
} as const;

function AgentGlyph({ slug, className }: { slug: AgentRecord["slug"]; className?: string }) {
  if (slug === "linkedin-agent") return <Linkedin className={className} />;
  if (slug === "lawyer-agent") return <Gavel className={className} />;
  return <Bot className={className} />;
}

export function AgentCard({
  agent,
  onEdit,
}: {
  agent: AgentRecord;
  onEdit: (agent: AgentRecord) => void;
}) {
  const accent = accentBySlug[agent.slug] ?? accentBySlug["linkedin-agent"];
  const StatusIcon =
    agent.status === "active" ? Play : agent.status === "paused" ? Pause : Bot;

  return (
    <div className="group relative h-[300px] w-[290px] [perspective:1000px]">
      <Link
        href={`/agents/${agent.id}`}
        className="block h-full w-full rounded-[50px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className={cn(
            "relative h-full rounded-[50px] transition-all duration-500 ease-in-out [transform-style:preserve-3d]",
            "shadow-[0_25px_25px_-5px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
            "group-hover:[transform:rotate3d(1,1,0,30deg)]",
            "group-hover:shadow-[30px_50px_25px_-40px_color-mix(in_oklab,var(--primary)_28%,transparent)]",
            accent.card,
          )}
        >
          <div className="absolute right-0 top-0 [transform-style:preserve-3d]">
            {[
              "w-[170px] [transform:translate3d(0,0,20px)] top-2 right-2",
              "w-[140px] [transform:translate3d(0,0,40px)] top-2.5 right-2.5 delay-200 group-hover:[transform:translate3d(0,0,60px)]",
              "w-[110px] [transform:translate3d(0,0,60px)] top-[17px] right-[17px] delay-300 group-hover:[transform:translate3d(0,0,80px)]",
              "w-[80px] [transform:translate3d(0,0,80px)] top-[23px] right-[23px] delay-500 group-hover:[transform:translate3d(0,0,100px)]",
              "grid w-[50px] place-content-center [transform:translate3d(0,0,100px)] top-[30px] right-[30px] delay-700 group-hover:[transform:translate3d(0,0,120px)]",
            ].map((cls, i) => (
              <span
                key={i}
                className={cn(
                  "absolute top-0 right-0 aspect-square rounded-full shadow-[rgba(100,100,111,0.2)_-10px_10px_20px_0px] backdrop-blur-[5px] transition-all duration-500 ease-in-out",
                  accent.circle,
                  cls,
                )}
              >
                {i === 4 ? <AgentGlyph slug={agent.slug} className="h-5 w-5 text-white" /> : null}
              </span>
            ))}
          </div>

          <div className="absolute inset-2 rounded-[55px] rounded-tr-full border-b border-l border-white bg-gradient-to-t from-white/35 to-white/80 transition-all duration-500 [transform:translate3d(0,0,25px)] [transform-style:preserve-3d]" />

          <div className="relative z-[1] px-[30px] pt-[100px] pr-[60px] [transform:translate3d(0,0,26px)]">
            <span className={cn("block text-xl font-black leading-tight", accent.title)}>
              {agent.name}
            </span>
          <span className={cn("mt-4 block line-clamp-3 text-[15px]", accent.text)}>
            {agent.listing?.shortDescription || agent.description}
          </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-[1] flex items-center justify-between [transform:translate3d(0,0,26px)] [transform-style:preserve-3d]">
            <div className="flex gap-2.5 [transform-style:preserve-3d]">
              <span className="grid h-[30px] w-[30px] place-content-center rounded-full bg-white shadow-md transition duration-200 group-hover:[transform:translate3d(0,0,50px)]">
                <StatusIcon className={cn("h-3.5 w-3.5", accent.title)} />
              </span>
              <span className="grid h-[30px] place-content-center rounded-full bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-wide text-foreground/70 shadow-md transition duration-200 delay-150 group-hover:[transform:translate3d(0,0,50px)]">
                {agent.status}
              </span>
              <span className="grid h-[30px] place-content-center rounded-full bg-white/90 px-2.5 text-[10px] font-bold tracking-wide text-foreground/70 shadow-md transition duration-200 delay-300 group-hover:[transform:translate3d(0,0,50px)]">
                ${agent.listing?.price ?? 0}
                <span className="ml-0.5 text-[9px] opacity-70">
                  {agent.listing?.paymentType === "credit"
                    ? " pack"
                    : `/${agent.listing?.billingInterval === "yearly" ? "yr" : agent.listing?.billingInterval === "one-time" ? "once" : "mo"}`}
                </span>
              </span>
            </div>

            <div className="flex w-[40%] items-center justify-end transition duration-200 group-hover:[transform:translate3d(0,0,10px)]">
              <span className={cn("text-xs font-bold", accent.action)}>Manage</span>
              <svg
                className={cn("ml-1 h-[15px] w-[15px] fill-none stroke-[3px]", accent.stroke)}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={`Edit ${agent.name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit(agent);
        }}
        className="absolute left-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/95 text-foreground shadow-md transition hover:bg-white hover:scale-105"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
