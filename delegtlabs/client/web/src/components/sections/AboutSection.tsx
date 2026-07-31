import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

// Three colored check-mark rows
const HIGHLIGHTS = [
  {
    title: "Fast iterations",
    body: "with predictable scope and timelines.",
    from: "from-yellow-400",
    to: "to-orange-500",
    ring: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    title: "Modern UX",
    body: "that reduces friction and improves retention.",
    from: "from-green-500",
    to: "to-emerald-500",
    ring: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
  {
    title: "Production-ready",
    body: "performance, security, and maintainability.",
    from: "from-blue-500",
    to: "to-cyan-500",
    ring: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
];

export function AboutSection() {
  return (
    <section className="relative py-20 sm:py-24 bg-slate-50">
      {/* Dot pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative container mx-auto px-6">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-16">

          {/* Left: Illustration */}
          <div className="relative">
            <div
              data-type="image"
              data-value="/HeroSection.jpg"
              className="relative overflow-hidden rounded-[44px] border border-slate-200 bg-white shadow-card"
            >
              {/* Ambient blobs */}
              <div aria-hidden className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/30 blur-2xl" />
              <div aria-hidden className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-cyan-300/30 blur-2xl" />

              <div className="p-6 sm:p-8">
                <Image
                  src="/home/about-illustration.svg"
                  alt={`${siteConfig.name} product engineering illustration`}
                  width={1200}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-auto"
                  priority={false}
                />
              </div>
            </div>

            {/* Accent chips */}
            <div className="absolute -bottom-5 left-6 sm:left-8 flex gap-3 flex-wrap">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                Agents • Marketplace • AI
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                Product-first
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                Multi-agent
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="pt-6 lg:pt-0">
            {/* Section label */}
            <p className="text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              About us
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {siteConfig.name}
            </h2>

            <p className="mt-6 text-slate-600 leading-relaxed">
              We help teams activate specialist AI agents for LinkedIn growth, content,
              lead generation, and support—with clear plans and predictable delivery.
            </p>

            {/* Highlighted points */}
            <ul className="mt-6 grid gap-4 text-slate-700">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-3 items-start">
                  <span className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${h.ring} text-white text-xs font-bold shadow-sm`}>
                    ✓
                  </span>
                  <span>
                    <span className={`font-semibold bg-gradient-to-r ${h.from} ${h.to} bg-clip-text text-transparent`}>
                      {h.title}
                    </span>{" "}
                    {h.body}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/about"
                data-cursor-exclude
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600 transition-all duration-300"
              >
                Learn more about {siteConfig.name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/contact"
                data-cursor-exclude
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:border-primary-400 hover:bg-slate-50 transition-all duration-300"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
