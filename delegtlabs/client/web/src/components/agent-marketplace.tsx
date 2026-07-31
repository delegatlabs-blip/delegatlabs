"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import {
  accentColors,
  formatPrice,
  type Accent,
  type Agent,
} from "@/lib/agents/types";
import { AnimatedSection } from "@/components/animated-section";

type PlanMode = "subscription" | "credit";

type AgentMarketplaceProps = {
  agents: Agent[];
  total: number;
};

export function AgentMarketplace({ agents, total }: AgentMarketplaceProps) {
  const [selected, setSelected] = useState<Agent | null>(null);
  const [planMode, setPlanMode] = useState<PlanMode>("subscription");
  const titleId = useId();
  const hasMore = total > agents.length;

  const close = useCallback(() => {
    setSelected(null);
    setPlanMode("subscription");
  }, []);

  useEffect(() => {
    if (!selected) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected, close]);

  return (
    <>
      <section
        className="site-section grid-wrap"
        id="agents"
        aria-labelledby="agents-heading"
      >
        <AnimatedSection className="section-head">
          <div>
            <p className="section-eyebrow">Marketplace</p>
            <h2 id="agents-heading">Featured agents</h2>
          </div>
          <p>Click any card to see what it does, and its plans.</p>
        </AnimatedSection>

        {agents.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">
            No agents are available right now. Please check back shortly.
          </p>
        ) : null}

        <div className="agent-grid" role="list">
          {agents.map((agent, i) => (
            <AnimatedSection key={agent.id} delay={i * 0.08}>
              <article id={`agent-${agent.slug}`} role="listitem">
                <button
                  type="button"
                  className="agent-card"
                  data-accent={agent.accent}
                  data-type="card"
                  data-value={agent.name}
                  data-color={accentColors[agent.accent as Accent]}
                  onClick={() => {
                    setSelected(agent);
                    setPlanMode("subscription");
                  }}
                  aria-haspopup="dialog"
                  aria-label={`View details for ${agent.name}`}
                >
                  <div className="agent-icon" aria-hidden="true">
                    {agent.icon}
                  </div>
                  <h3>{agent.name}</h3>
                  <p className="desc">{agent.desc}</p>
                  <div className="agent-meta">
                    <span className="agent-tag">{agent.tag}</span>
                    <div className="agent-arrow" aria-hidden="true">
                      →
                    </div>
                  </div>
                </button>

                <div className="sr-only">
                  <p>{agent.details}</p>
                  <p>Capabilities: {agent.caps.join(", ")}</p>
                  <p>
                    Subscription plans:{" "}
                    {agent.plans.subscription
                      .map((p) => `${p.name} — ${p.note} — ${formatPrice(p)}`)
                      .join("; ")}
                  </p>
                  <p>
                    Credit plans:{" "}
                    {agent.plans.credit
                      .map((p) => `${p.name} — ${p.note} — ${formatPrice(p)}`)
                      .join("; ")}
                  </p>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mt-12 flex justify-center">
          <Link
            href="/agents"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700 hover:shadow-md"
          >
            {hasMore ? `View all ${total} agents` : "View all agents"}
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </AnimatedSection>
      </section>

      <div
        className={`overlay${selected ? " open" : ""}`}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {selected ? (
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              type="button"
              className="modal-close"
              onClick={close}
              aria-label="Close"
              data-cursor-exclude
            >
              ✕
            </button>
            <div
              className="modal-icon"
              style={{
                background: `linear-gradient(135deg, ${accentColors[selected.accent as Accent]}, white)`,
              }}
              aria-hidden="true"
            >
              {selected.icon}
            </div>
            <h3 id={titleId}>{selected.name}</h3>
            <p className="modal-desc">{selected.details}</p>
            <div className="modal-tags">
              {selected.caps.map((cap) => (
                <span key={cap} className="capsule">
                  {cap}
                </span>
              ))}
            </div>

            <div className="plan-toggle" role="tablist" aria-label="Plan type">
              <button
                type="button"
                role="tab"
                aria-selected={planMode === "subscription"}
                className={planMode === "subscription" ? "active" : undefined}
                onClick={() => setPlanMode("subscription")}
                data-cursor-exclude
              >
                Subscription
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={planMode === "credit"}
                className={planMode === "credit" ? "active" : undefined}
                onClick={() => setPlanMode("credit")}
                data-cursor-exclude
              >
                Credit-based
              </button>
            </div>

            <div
              className={`plan-panel${planMode === "subscription" ? " active" : ""}`}
              role="tabpanel"
            >
              {selected.plans.subscription.map((p) => (
                <div key={p.id} className="plan-row">
                  <div>
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-note">{p.note}</div>
                  </div>
                  <div className="plan-price">{formatPrice(p)}</div>
                </div>
              ))}
            </div>

            <div
              className={`plan-panel${planMode === "credit" ? " active" : ""}`}
              role="tabpanel"
            >
              {selected.plans.credit.map((p) => (
                <div key={p.id} className="plan-row">
                  <div>
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-note">{p.note}</div>
                  </div>
                  <div className="plan-price">{formatPrice(p)}</div>
                </div>
              ))}
            </div>

            <Link
              href={`/agents/${selected.slug}`}
              className="plan-cta block text-center"
              data-cursor-exclude
            >
              View {selected.name}
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
