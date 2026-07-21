"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Bot, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

type Catalog = {
  plans: Array<{
    id: string;
    name: string;
    price_usd: number;
    price_inr: number;
    max_agents: number;
    features: string[];
  }>;
  agents: Array<{
    slug: string;
    name: string;
    category: string;
    status: string;
    price_usd: number;
    price_inr: number;
    description: string;
  }>;
};

export default function PricingPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("plan_growth");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["linkedin-agent"]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch("/api/web/public/checkout/catalog");
        if (res.ok) {
          const data = await res.json();
          setCatalog(data);
        } else {
          // Fallback static catalog
          setCatalog({
            plans: [
              { id: "plan_starter", name: "Starter Plan", price_usd: 49, price_inr: 3999, max_agents: 2, features: ["Standard AI Workers", "Email Notifications", "Basic Analytics"] },
              { id: "plan_growth", name: "Growth Pro Plan", price_usd: 199, price_inr: 15999, max_agents: 5, features: ["Priority AI Workers", "Unlimited Runs", "Advanced Sub-dashboards", "Dedicated Support"] },
            ],
            agents: [
              { slug: "linkedin-agent", name: "LinkedIn Growth Agent", category: "linkedin", status: "active", price_usd: 250, price_inr: 19999, description: "Automated B2B lead generation, connection outreach, and post generation." },
              { slug: "facebook-ads-agent", name: "Facebook Ads Optimizer", category: "facebook_ads", status: "active", price_usd: 299, price_inr: 24999, description: "Automated ad creative generation, ROAS tracking, and campaign optimization." },
              { slug: "instagram-agent", name: "Instagram Content Creator", category: "instagram", status: "active", price_usd: 199, price_inr: 15999, description: "Reels scriptwriting, content pillars, auto-scheduling, and engagement boost." },
              { slug: "email-agent", name: "Outbound Email Agent", category: "email", status: "active", price_usd: 199, price_inr: 15999, description: "Cold email sequence writer, deliverability warmer, and lead responder." },
              { slug: "seo-agent", name: "SEO & Content Ranker", category: "seo", status: "active", price_usd: 249, price_inr: 19999, description: "Keyword research, blog post generator, on-page optimization, and audit." },
            ],
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchCatalog();
  }, []);

  const toggleAgent = (slug: string) => {
    if (selectedAgents.includes(slug)) {
      setSelectedAgents(selectedAgents.filter((s) => s !== slug));
    } else {
      setSelectedAgents([...selectedAgents, slug]);
    }
  };

  const handleCheckout = () => {
    const query = new URLSearchParams({
      plan: selectedPlan,
      agents: selectedAgents.join(","),
    }).toString();
    router.push(`/checkout?${query}`);
  };

  if (!catalog) {
    return <div className="p-8 text-slate-500 font-medium">Loading Pricing Catalog...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-indigo-600" /> Modular Agent Platform Pricing
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Build Your AI Workforce
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Select a core platform plan and add modular AI growth agents tailored for your business needs.
        </p>
      </div>

      {/* Core Plans */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">1. Choose Core Platform Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {catalog.plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`cursor-pointer rounded-3xl border-2 p-8 shadow-sm transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-white ring-4 ring-indigo-600/10 shadow-indigo-950/5"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {isSelected && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">${plan.price_usd}</span>
                    <span className="text-sm text-slate-500 font-medium">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modular Agent Add-ons Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">2. Select Agent Add-ons</h2>
        <p className="text-xs text-slate-500 text-center mb-6">Active agents in standard registry catalog</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalog.agents.map((agent) => {
            const isChecked = selectedAgents.includes(agent.slug);
            return (
              <div
                key={agent.slug}
                onClick={() => toggleAgent(agent.slug)}
                className={`cursor-pointer rounded-2xl border-2 p-6 transition-all flex flex-col justify-between ${
                  isChecked
                    ? "border-indigo-600 bg-indigo-50/20 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      <Bot className="h-3.5 w-3.5" /> {agent.category.toUpperCase()}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-3">{agent.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{agent.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">${agent.price_usd}/mo</span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {isChecked ? "Added" : "+ Add Agent"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout CTA Bar */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <h3 className="text-2xl font-bold">Ready to Launch Your AI Platform?</h3>
          <p className="text-sm text-slate-300 mt-1">
            {selectedAgents.length} Agent(s) selected with Growth Pro Plan
          </p>
        </div>
        <button
          onClick={handleCheckout}
          className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-8 py-4 text-base font-bold text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/40 transition-all hover:scale-105"
        >
          Proceed to Checkout <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
