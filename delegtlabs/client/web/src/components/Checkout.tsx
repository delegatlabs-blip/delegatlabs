import React, { useState } from 'react';
import { Agent, CheckoutFormState, ViewMode } from '../types';
import { TRUST_BADGES } from '../data/agents';

interface CheckoutProps {
  selectedAgent: Agent;
  billingCycle: 'subscription' | 'onetime';
  onNavigate: (view: ViewMode) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  selectedAgent,
  billingCycle,
  onNavigate
}) => {
  const [formState, setFormState] = useState<CheckoutFormState>({
    fullName: 'Alex Sterling',
    workEmail: 'alex@aetheris.ai',
    cardNumber: '4242 •••• •••• 4242',
    expiryDate: '12 / 28',
    cvc: '888',
    billingCycle
  });

  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [deploymentDetails, setDeploymentDetails] = useState<{
    instanceId: string;
    apiKey: string;
    endpoint: string;
  } | null>(null);

  // Calculations
  const basePrice = billingCycle === 'subscription' ? selectedAgent.monthlyPrice : selectedAgent.oneTimePrice;
  const computeOverhead = Math.round(basePrice * 0.05 * 100) / 100;
  const totalAmount = (basePrice + computeOverhead).toFixed(2);

  const handleInputChange = (field: keyof CheckoutFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompletePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseStatus !== 'idle') return;

    setPurchaseStatus('processing');

    setTimeout(() => {
      setPurchaseStatus('success');
      setDeploymentDetails({
        instanceId: `inst_${Math.random().toString(36).substring(2, 9)}`,
        apiKey: `aeth_live_${Math.random().toString(36).substring(2, 18)}`,
        endpoint: `https://${selectedAgent.id}-cluster.aetheris.ai/v1`
      });
    }, 2000);
  };

  return (
    <main className="pt-28 pb-24 px-4 md:px-12 max-w-[1280px] mx-auto min-h-[85vh]">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#00f5ff] mb-2 uppercase tracking-widest">
          <button onClick={() => onNavigate('product')} className="hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Agent Spec
          </button>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-headline text-[#00f5ff] mb-2">
          Secure Checkout
        </h1>
        <p className="text-[#b9caca] text-sm md:text-base">
          Review your configuration and finalize your agent deployment.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact & Payment Forms */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Contact Information Section */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 border border-[#3a494a]/40">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#00f5ff] text-2xl">contact_mail</span>
              <h2 className="text-xl font-bold font-headline text-[#e9feff]">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#00f5ff] uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] transition-all"
                  placeholder="Alex Sterling"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#00f5ff] uppercase tracking-wider">
                  Work Email
                </label>
                <input
                  type="email"
                  value={formState.workEmail}
                  onChange={(e) => handleInputChange('workEmail', e.target.value)}
                  className="bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] transition-all"
                  placeholder="alex@aetheris.ai"
                />
              </div>
            </div>
          </section>

          {/* Payment Details Section */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 border border-[#3a494a]/40">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#00f5ff] text-2xl">
                account_balance_wallet
              </span>
              <h2 className="text-xl font-bold font-headline text-[#e9feff]">Payment Details</h2>
            </div>

            <form onSubmit={handleCompletePurchase} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#00f5ff] uppercase tracking-wider">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formState.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className="w-full bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] transition-all pl-12 font-mono"
                    placeholder="•••• •••• •••• ••••"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#849495]">
                    credit_card
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#00f5ff] uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={formState.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] transition-all font-mono"
                    placeholder="MM / YY"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#00f5ff] uppercase tracking-wider">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={formState.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value)}
                    className="bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] transition-all font-mono"
                    placeholder="•••"
                  />
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-[#3a494a]/30 flex flex-wrap gap-6 items-center text-xs text-[#b9caca]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f5ff] text-lg">verified_user</span>
                  SSL Secure Encryption
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f5ff] text-lg">payments</span>
                  PCI Compliance Level 1
                </div>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-[#00f5ff]/30 teal-glow">
            
            {/* Header background banner */}
            <div className="h-28 bg-[#2d3449] relative flex items-end p-6 bg-gradient-to-t from-[#171f33] to-transparent">
              <h3 className="text-2xl font-bold font-headline text-[#e9feff]">Order Summary</h3>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Selected Product */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#131b2e] border border-[#3a494a]/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00f5ff]/20 flex items-center justify-center text-[#00f5ff] shrink-0">
                    <span className="material-symbols-outlined text-2xl fill-1">smart_toy</span>
                  </div>
                  <div>
                    <div className="text-[#e9feff] font-bold text-sm">{selectedAgent.name}</div>
                    <div className="text-[#b9caca] text-xs">{selectedAgent.version}</div>
                  </div>
                </div>
                <div className="text-[#00f5ff] font-bold text-base font-headline">
                  ${basePrice.toFixed(2)}
                </div>
              </div>

              {/* Calculations Breakdown */}
              <div className="space-y-3 pt-2 border-t border-[#3a494a]/20 text-sm">
                <div className="flex justify-between text-[#b9caca]">
                  <span>Subtotal</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#b9caca]">
                  <span>Compute Overhead (5%)</span>
                  <span>${computeOverhead.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#b9caca]">
                  <span>Priority Queueing</span>
                  <span className="text-[#00f5ff] font-bold">FREE</span>
                </div>

                <div className="flex justify-between text-2xl font-bold font-headline text-[#e9feff] pt-4 mt-2 border-t border-[#3a494a]/40">
                  <span>Total</span>
                  <span className="text-[#00f5ff]">${totalAmount}</span>
                </div>
              </div>

              {/* Purchase Button & Terms */}
              <div className="space-y-4 pt-2">
                <button
                  type="button"
                  onClick={handleCompletePurchase}
                  disabled={purchaseStatus === 'processing'}
                  className="w-full bg-[#00f5ff] text-[#002021] py-4 rounded-xl font-bold text-base hover:bg-[#63f7ff] transition-all active:scale-98 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-70"
                >
                  {purchaseStatus === 'processing' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                      <span>Processing Deployment...</span>
                    </>
                  ) : purchaseStatus === 'success' ? (
                    <>
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                      <span>Deployment Provisioned!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">lock</span>
                      <span>Complete Purchase</span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#b9caca] opacity-75 leading-relaxed">
                  By completing your purchase, you agree to the{' '}
                  <a href="#terms" onClick={(e) => e.preventDefault()} className="underline text-[#00f5ff]">
                    Terms of Service
                  </a>
                  . Recurring billing starts after 30 days.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Trust Logos */}
          <div className="mt-6 flex justify-center gap-6 grayscale opacity-60 items-center">
            {TRUST_BADGES.map((badgeUrl, idx) => (
              <img
                key={idx}
                src={badgeUrl}
                alt="Payment Security Badge"
                className="h-6 object-contain"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Confirmation Modal */}
      {purchaseStatus === 'success' && deploymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060e20]/90 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-[#00f5ff]/50 shadow-[0_0_50px_rgba(0,245,255,0.25)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#00f5ff]/20 border border-[#00f5ff] flex items-center justify-center text-[#00f5ff] mx-auto teal-glow">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-headline text-[#e9feff]">
                Agent Deployed Successfully!
              </h3>
              <p className="text-xs text-[#b9caca] mt-1">
                Your instance of {selectedAgent.name} is now live in production.
              </p>
            </div>

            <div className="bg-[#131b2e] border border-[#3a494a]/40 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-[#dae2fd]">
              <div className="flex justify-between">
                <span className="text-[#849495]">Instance ID:</span>
                <span className="text-[#00f5ff] font-bold">{deploymentDetails.instanceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#849495]">Cluster Endpoint:</span>
                <span className="text-[#e9feff] truncate max-w-[200px]">{deploymentDetails.endpoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#849495]">Live API Key:</span>
                <span className="text-[#00f5ff]">{deploymentDetails.apiKey}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => onNavigate('product')}
                className="px-5 py-2.5 rounded-xl border border-[#3a494a] text-[#dae2fd] hover:text-[#00f5ff] text-sm font-semibold transition-colors"
              >
                View Agent Spec
              </button>
              <button
                onClick={() => onNavigate('browse')}
                className="px-6 py-2.5 rounded-xl bg-[#00f5ff] text-[#002021] font-bold text-sm hover:bg-[#63f7ff] shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all"
              >
                Return to Marketplace
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
