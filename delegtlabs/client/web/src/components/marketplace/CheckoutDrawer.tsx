"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { createCheckoutSession, type RegisteredAgent } from "@/lib/api";

export function CheckoutDrawer({
  agent,
  open,
  onClose,
}: {
  agent: RegisteredAgent | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("alex@acme.io");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !agent) return null;

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createCheckoutSession({
        plan_id: "plan_growth",
        agent_slugs: [agent.slug],
        email,
        currency: "USD",
      });
      // Persist selection for checkout page / webhook simulation
      const url = new URL(session.checkout_url, window.location.origin);
      router.push(url.pathname + url.search);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configure & Subscribe</p>
            <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
            <p className="text-sm text-slate-300">
              Creates a Stripe Checkout session and provisions a <code className="text-indigo-300">client_agents</code>{" "}
              row for <span className="font-medium text-white">{agent.slug}</span>.
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              ${agent.price_usd ?? agent.base_price_usd ?? 199}
              <span className="text-sm font-normal text-slate-500"> /mo</span>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Billing email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Capabilities</p>
            <ul className="space-y-1.5">
              {(agent.capabilities || []).map((c) => (
                <li key={c} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                  {c.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>

        <div className="border-t border-white/10 p-5">
          <button
            type="button"
            disabled={loading || !email}
            onClick={subscribe}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Creating session…" : "Continue to Checkout"}
          </button>
        </div>
      </aside>
    </div>
  );
}
