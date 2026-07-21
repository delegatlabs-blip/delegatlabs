"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { CreditCard, CheckCircle2, Lock, ArrowRight, ShieldCheck } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get("plan") || "plan_growth";
  const agentsParam = searchParams.get("agents") || "linkedin-agent";
  const agentSlugs = agentsParam.split(",").filter(Boolean);

  const [email, setEmail] = useState("owner@acmesaassolution.com");
  const [orgName, setOrgName] = useState("Acme SaaS Solution");
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Call checkout session API endpoint
      const sessionRes = await fetch("/api/web/public/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan,
          agent_slugs: agentSlugs,
          email: email,
        }),
      });

      // 2. Trigger Stripe webhook to attach client + subscriptions + client_agents rows
      await fetch("/api/web/public/checkout/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": "t=12345,v1=mock_signature",
        },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              customer_email: email,
              metadata: { agents: agentsParam, org: orgName },
            },
          },
        }),
      });

      setCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (completed) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Payment Successful!</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your account <strong className="text-slate-900">{orgName}</strong> has been provisioned. We sent a welcome email to <strong className="text-slate-900">{email}</strong> with your login credentials.
        </p>

        <div className="p-4 bg-indigo-50 rounded-2xl text-left border border-indigo-100 space-y-2">
          <span className="text-xs uppercase font-bold text-indigo-700">Provisioned Agents:</span>
          <ul className="text-xs text-indigo-900 font-mono space-y-1">
            {agentSlugs.map((slug) => (
              <li key={slug} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                {slug} (OAuth Connection Required)
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          Go to User Dashboard <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: Summary */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Checkout Summary</span>
          <h2 className="text-2xl font-extrabold mt-2">Delegtlabs Subscription</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300 border-t border-slate-800 pt-6">
            <div className="flex justify-between">
              <span>Growth Pro Base Plan</span>
              <span className="font-bold text-white">$199.00/mo</span>
            </div>
            {agentSlugs.map((slug) => (
              <div key={slug} className="flex justify-between">
                <span className="capitalize">{slug.replace("-", " ")} Add-on</span>
                <span className="font-bold text-white">$250.00/mo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 mt-8">
          <div className="flex justify-between text-lg font-extrabold text-white">
            <span>Total Monthly:</span>
            <span className="text-emerald-400">$449.00/mo</span>
          </div>
        </div>
      </div>

      {/* Right: Payment Form */}
      <form onSubmit={handleStripeCheckout} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Lock className="h-4 w-4 text-emerald-600" /> Stripe Secure Checkout (Test Mode)
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Owner Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Card Details (Test Card)</label>
            <div className="rounded-xl border border-slate-300 p-3 flex items-center gap-3 bg-slate-50">
              <CreditCard className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                readOnly
                value="4242 •••• •••• 4242  (04/28)"
                className="w-full bg-transparent text-sm font-mono text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? "Processing Stripe Test Order..." : "Pay $449.00 & Complete Checkout"}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
