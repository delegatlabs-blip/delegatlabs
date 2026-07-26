import React from 'react';
import { ViewMode } from '../types';

interface EnterpriseViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const EnterpriseView: React.FC<EnterpriseViewProps> = ({ onNavigate }) => {
  return (
    <div className="pt-28 pb-20 px-4 md:px-12 max-w-[1280px] mx-auto min-h-[85vh]">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <span className="px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-xs font-semibold uppercase tracking-widest">
          Sovereign Enterprise Infrastructure
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient">
          Dedicated On-Prem & Private VPC Agent Clusters
        </h1>
        <p className="text-[#b9caca] text-base leading-relaxed">
          Air-gapped deployments, custom weight fine-tuning, and dedicated hardware acceleration with zero data retention guarantee.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="glass-panel p-8 rounded-3xl border border-[#3a494a]/40 space-y-4">
          <span className="material-symbols-outlined text-[#00f5ff] text-4xl">vpn_lock</span>
          <h3 className="text-xl font-bold font-headline text-[#e9feff]">Private VPC & Isolated Clusters</h3>
          <p className="text-sm text-[#b9caca] leading-relaxed">
            Deploy dedicated agent nodes directly within AWS GovCloud, Google Cloud Private Service Connect, or Azure Confidential Compute.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-[#3a494a]/40 space-y-4">
          <span className="material-symbols-outlined text-[#00f5ff] text-4xl">tune</span>
          <h3 className="text-xl font-bold font-headline text-[#e9feff]">Custom Weight Fine-Tuning</h3>
          <p className="text-sm text-[#b9caca] leading-relaxed">
            Train Aetheris transformer models on your proprietary enterprise datasets with full data privacy and weight ownership.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-[#3a494a]/40 space-y-4">
          <span className="material-symbols-outlined text-[#00f5ff] text-4xl">verified_user</span>
          <h3 className="text-xl font-bold font-headline text-[#e9feff]">99.99% Financial SLA</h3>
          <p className="text-sm text-[#b9caca] leading-relaxed">
            Guaranteed execution throughput backed by financial service level agreements and 24/7 dedicated AI engineer support.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 md:p-12 border border-[#00f5ff]/30 text-center max-w-3xl mx-auto space-y-6 teal-glow">
        <h2 className="text-3xl font-bold font-headline text-[#e9feff]">
          Ready to deploy sovereign AI agent clusters?
        </h2>
        <p className="text-sm text-[#b9caca]">
          Schedule a technical architectural briefing with our senior AI systems engineering team.
        </p>
        <button
          onClick={() => onNavigate('checkout')}
          className="bg-[#00f5ff] text-[#002021] font-bold px-8 py-3.5 rounded-xl hover:bg-[#63f7ff] transition-all shadow-[0_0_20px_rgba(0,245,255,0.3)] text-sm"
        >
          Request Enterprise Provisioning
        </button>
      </div>
    </div>
  );
};
