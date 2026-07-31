import Link from "next/link";

type AgentsHeroProps = {
  total: number;
};

export function AgentsHero({ total }: AgentsHeroProps) {
  return (
    <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden py-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-200/40 via-violet-100/25 to-emerald-100/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="hero-reveal mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 px-5 py-2 shadow-sm backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary-700">
          Marketplace
        </span>
      </div>

      <h1 className="hero-reveal hero-reveal-delay-1 mb-6 text-5xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
        All Agents
      </h1>

      <p className="hero-reveal hero-reveal-delay-2 mx-auto mb-10 max-w-lg text-lg leading-relaxed text-slate-500 md:text-xl">
        {total} specialist {total === 1 ? "agent" : "agents"} you can activate on
        subscription or credits — whichever fits how your team actually works.
      </p>

      <div className="hero-reveal hero-reveal-delay-3 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/contact"
          className="rounded-xl bg-primary-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
          data-cursor-exclude
        >
          Talk to us
        </Link>
        <Link
          href="/#agents"
          className="rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-400"
          data-cursor-exclude
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
