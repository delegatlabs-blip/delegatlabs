import Image from "next/image";
import Link from "next/link";

import {
  accentColors,
  accentGradients,
  isSvg,
  startingPrice,
  type Agent,
} from "@/lib/agents/types";

type AgentRowProps = {
  agent: Agent;
  index: number;
  flipped: boolean;
};

export function AgentRow({ agent, index, flipped }: AgentRowProps) {
  const price = startingPrice(agent);

  return (
    <article className="ag-article py-16 md:py-24" id={`agent-${agent.slug}`}>
      <div
        className={`flex flex-col items-center gap-12 lg:gap-20 ${
          flipped ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        <div className="w-full space-y-5 lg:w-1/2">
          <span
            className="ag-num block select-none bg-gradient-to-br from-slate-100 to-slate-200 bg-clip-text text-7xl font-black leading-none text-transparent md:text-8xl"
            data-num={index}
            aria-hidden="true"
          >
            {String(index).padStart(2, "0")}
          </span>

          <h2 className="ag-line text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            {agent.name}
          </h2>

          <div className="ag-line flex flex-wrap gap-2">
            {agent.caps.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600"
              >
                {cap}
              </span>
            ))}
          </div>

          <p className="ag-line max-w-md text-base leading-relaxed text-slate-600">
            {agent.details}
          </p>

          <div className="ag-line flex flex-wrap items-center gap-4 pt-1">
            {price ? (
              <p className="inline-block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                From {price}
              </p>
            ) : null}
            <Link
              href={`/agents/${agent.slug}`}
              className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: accentColors[agent.accent],
                boxShadow: `0 12px 28px ${accentColors[agent.accent]}33`,
              }}
            >
              Explore agent
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>

        <div
          className="ag-img-wrap w-full lg:w-1/2"
          style={{ clipPath: "inset(0 100% 0 0 round 24px)" }}
        >
          <div
            className={`relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br ${
              accentGradients[agent.accent]
            } shadow-2xl shadow-slate-300/50 transition-shadow duration-500 hover:shadow-slate-400/60`}
          >
            <div className="pointer-events-none absolute right-3 top-3 z-10 h-14 w-14 rounded-full bg-white/25 blur-lg" />
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 h-8 w-8 rounded-full bg-black/10 blur-sm" />

            {agent.imageUrl ? (
              <Image
                src={agent.imageUrl}
                alt={`${agent.name} preview`}
                fill
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
      </div>
    </article>
  );
}
