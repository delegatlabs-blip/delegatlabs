import React, { useState } from 'react';
import { ViewMode } from '../types';

interface PricingViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Sentinel Tier',
      price: billingCycle === 'monthly' ? '$129' : '$109',
      unit: '/ month per agent',
      features: [
        '512GB Context Window',
        '1.8ms Reasoning Latency',
        'SOC2 & HIPAA Compliant',
        '100,000 API Calls / Month',
        'Standard Email Support'
      ],
      buttonText: 'Deploy Sentinel-X',
      popular: false
    },
    {
      name: 'Pro Subscription',
      price: billingCycle === 'monthly' ? '$499' : '$425',
      unit: '/ month per agent',
      features: [
        '2.0TB Context Window',
        '3.2ms Latency (Aether-VII Core)',
        'Unlimited Reasoning Tasks',
        'Parallel Logic Branching',
        '128-bit High Precision Mode',
        'Dedicated SLA & 24/7 Support'
      ],
      buttonText: 'Deploy Sentient Logic Pro',
      popular: true
    },
    {
      name: 'Perpetual License',
      price: '$14,950',
      unit: 'one-time fee',
      features: [
        'Full On-Premise Binary Deployment',
        'Zero External Network Calls',
        'Unlimited On-Prem Nodes',
        'Lifetime Model Updates',
        'Air-Gapped GovCloud Support',
        'Dedicated Integration Engineer'
      ],
      buttonText: 'Acquire One-Time License',
      popular: false
    }
  ];

  return (
    <div className="pt-28 pb-20 px-4 md:px-12 max-w-[1280px] mx-auto min-h-[85vh]">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <span className="px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-xs font-semibold uppercase tracking-widest">
          Transparent Licensing
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient">
          Predictable AI Pricing Without Token Surprises
        </h1>
        <p className="text-[#b9caca] text-base leading-relaxed">
          Flat monthly subscriptions or full perpetual on-premise licensing with zero compute markups.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-[#00f5ff] font-bold' : 'text-[#b9caca]'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-14 h-8 bg-[#131b2e] border border-[#3a494a] rounded-full p-1 relative transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#00f5ff] transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-[#00f5ff] font-bold' : 'text-[#b9caca]'}`}>
            Annual Billing
            <span className="text-[10px] bg-[#00f5ff]/20 text-[#00f5ff] px-2 py-0.5 rounded-full uppercase font-bold">
              Save 15%
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`glass-panel p-8 rounded-3xl border flex flex-col justify-between relative ${
              plan.popular
                ? 'border-[#00f5ff] teal-glow bg-[#00f5ff]/5'
                : 'border-[#3a494a]/40'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00f5ff] text-[#002021] text-xs font-bold rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-headline text-[#e9feff]">{plan.name}</h3>
                <div className="text-4xl font-bold font-headline text-[#00f5ff] mt-2">
                  {plan.price}
                </div>
                <div className="text-xs text-[#b9caca] mt-0.5">{plan.unit}</div>
              </div>

              <ul className="space-y-3 border-t border-[#3a494a]/20 pt-6 text-sm text-[#b9caca]">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f5ff] text-base">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onNavigate('checkout')}
              className={`w-full py-3.5 rounded-xl font-bold text-sm mt-8 transition-all ${
                plan.popular
                  ? 'bg-[#00f5ff] text-[#002021] hover:bg-[#63f7ff] shadow-[0_0_20px_rgba(0,245,255,0.3)]'
                  : 'border border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff]/10'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
