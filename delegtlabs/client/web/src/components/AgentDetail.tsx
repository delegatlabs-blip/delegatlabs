import React, { useState } from 'react';
import { Agent, Review, ViewMode } from '../types';
import { AVATARS } from '../data/agents';

interface AgentDetailProps {
  agent: Agent;
  reviews: Review[];
  onNavigate: (view: ViewMode) => void;
  onSelectPlan: (billingCycle: 'subscription' | 'onetime') => void;
  onOpenReviewModal: () => void;
  onOpenPlayground: () => void;
}

export const AgentDetail: React.FC<AgentDetailProps> = ({
  agent,
  reviews,
  onNavigate,
  onSelectPlan,
  onOpenReviewModal,
  onOpenPlayground
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'subscription' | 'onetime'>('subscription');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'nodejs'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const getCodeSnippet = () => {
    switch (activeCodeTab) {
      case 'curl':
        return `curl -X POST https://api.aetheris.ai/v1/agents/${agent.id}/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Analyze the quarterly risk report...",
    "context_depth": "high",
    "format": "structured_json"
  }'`;
      case 'python':
        return `import aetheris

client = aetheris.Client(api_key="YOUR_API_KEY")

response = client.agents.invoke(
    agent_id="${agent.id}",
    prompt="Analyze the quarterly risk report...",
    context_depth="high",
    format="structured_json"
)

print(response.analysis)`;
      case 'nodejs':
        return `import { AetherisAI } from '@aetheris/sdk';

const aetheris = new AetherisAI({ apiKey: process.env.AETHERIS_API_KEY });

const result = await aetheris.agents.invoke({
  agentId: '${agent.id}',
  prompt: 'Analyze the quarterly risk report...',
  contextDepth: 'high',
  format: 'structured_json'
});

console.log(result.data);`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeploy = () => {
    onSelectPlan(selectedPlan);
    onNavigate('checkout');
  };

  return (
    <div className="pt-24 pb-20">
      {/* Hero Header */}
      <header className="relative w-full border-b border-[#3a494a]/20 py-16 md:py-24 overflow-hidden">
        <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            {/* Left Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/20 text-[#00f5ff] text-xs font-semibold uppercase tracking-widest">
                {agent.version}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold font-headline text-gradient leading-tight">
                {agent.name}
              </h1>

              <p className="text-[#b9caca] text-lg max-w-xl leading-relaxed">
                {agent.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl">
                  <span className="material-symbols-outlined text-[#00f5ff] fill-1 text-xl">bolt</span>
                  <span className="text-xs font-bold text-[#e9feff] uppercase tracking-wide">
                    {agent.latency}
                  </span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl">
                  <span className="material-symbols-outlined text-[#00f5ff] fill-1 text-xl">verified</span>
                  <span className="text-xs font-bold text-[#e9feff] uppercase tracking-wide">
                    {agent.compliance}
                  </span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl">
                  <span className="material-symbols-outlined text-[#00f5ff] fill-1 text-xl">database</span>
                  <span className="text-xs font-bold text-[#e9feff] uppercase tracking-wide">
                    {agent.contextWindow}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  onClick={handleDeploy}
                  className="bg-[#00f5ff] text-[#002021] font-bold px-6 py-3 rounded-xl hover:bg-[#63f7ff] shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all active:scale-95 text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">rocket_launch</span>
                  Deploy {agent.name}
                </button>

                <button
                  onClick={onOpenPlayground}
                  className="glass-panel text-[#00f5ff] font-semibold px-6 py-3 rounded-xl hover:bg-[#00f5ff]/10 border border-[#00f5ff]/30 transition-all text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">terminal</span>
                  Test in Live Sandbox
                </button>
              </div>
            </div>

            {/* Right Graphic Core */}
            <div className="shrink-0 w-full md:w-[460px] h-[320px] md:h-[440px] glass-panel rounded-3xl p-6 relative overflow-hidden group teal-glow">
              <div className="absolute inset-0 bg-[#00f5ff]/5 mix-blend-overlay group-hover:bg-[#00f5ff]/10 transition-all" />
              <img
                src={agent.imageUrl}
                alt="AI Neural Brain Core"
                className="w-full h-full object-cover rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-10 left-10 right-10 bg-[#0b1326]/80 backdrop-blur-md border border-[#3a494a]/50 p-3 rounded-xl flex items-center justify-between text-xs text-[#e9feff]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-ping" />
                  <span>Agent: <strong className="text-[#00f5ff]">NEURAL CORE X7-B3</strong></span>
                </div>
                <div className="text-[#00f5ff] font-bold">ACTIVE & OPERATIONAL</div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <section className="px-6 md:px-12 max-w-[1280px] mx-auto py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Specs, Use Cases, Integration */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Bento Technical Specifications */}
            <div id="specifications">
              <h2 className="text-2xl font-bold font-headline text-[#00f5ff] mb-6">
                Technical Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-panel p-8 rounded-3xl space-y-4">
                  <span className="material-symbols-outlined text-[#00f5ff] text-4xl">memory</span>
                  <h3 className="text-lg font-bold text-[#e9feff] font-headline">Neural Engine Architecture</h3>
                  <p className="text-[#b9caca] text-sm leading-relaxed">
                    {agent.specs.neuralEngine}
                  </p>
                </div>

                <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
                  <div className="text-[#00f5ff] font-bold font-headline text-4xl">{agent.accuracy}</div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#e9feff]">Reasoning Accuracy</h3>
                    <p className="text-xs text-[#b9caca]">Validated against SLP-Bench</p>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
                  <div className="text-[#00f5ff] font-bold font-headline text-4xl">{agent.firstTokenTime}</div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#e9feff]">Time to First Token</h3>
                    <p className="text-xs text-[#b9caca]">Global edge deployment</p>
                  </div>
                </div>

                <div className="md:col-span-2 glass-panel p-8 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#00f5ff] text-2xl">security</span>
                    <h3 className="text-lg font-bold text-[#e9feff] font-headline">Security & Governance</h3>
                  </div>
                  <ul className="grid grid-cols-2 gap-3 text-[#b9caca] text-sm">
                    {agent.specs.security.map((secItem, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#00f5ff] text-base">check_circle</span>
                        <span>{secItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div id="use-cases">
              <h2 className="text-2xl font-bold font-headline text-[#00f5ff] mb-6">
                Strategic Use Cases
              </h2>
              <div className="space-y-6">
                {agent.useCases.map((uc, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className="shrink-0 w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-[#00f5ff] group-hover:scale-110 transition-all border border-[#00f5ff]/20">
                      <span className="material-symbols-outlined text-3xl">{uc.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#e9feff] mb-1 font-headline">{uc.title}</h3>
                      <p className="text-[#b9caca] text-sm leading-relaxed">{uc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Guide */}
            <div className="glass-panel p-8 md:p-10 rounded-3xl border border-[#00f5ff]/20" id="integration">
              <h2 className="text-2xl font-bold font-headline text-[#00f5ff] mb-2">Integration Guide</h2>
              <p className="text-[#b9caca] text-sm mb-6">
                Implementing {agent.name} into your tech stack is seamless with our REST API and SDKs.
              </p>

              <div className="bg-[#060e20] rounded-2xl p-6 font-mono text-xs overflow-x-auto border border-[#3a494a]/30">
                <div className="flex justify-between items-center mb-4 border-b border-[#3a494a]/20 pb-3">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveCodeTab('curl')}
                      className={`pb-1 transition-all ${
                        activeCodeTab === 'curl'
                          ? 'text-[#00f5ff] border-b-2 border-[#00f5ff] font-bold'
                          : 'text-[#b9caca] hover:text-[#e9feff]'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('python')}
                      className={`pb-1 transition-all ${
                        activeCodeTab === 'python'
                          ? 'text-[#00f5ff] border-b-2 border-[#00f5ff] font-bold'
                          : 'text-[#b9caca] hover:text-[#e9feff]'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('nodejs')}
                      className={`pb-1 transition-all ${
                        activeCodeTab === 'nodejs'
                          ? 'text-[#00f5ff] border-b-2 border-[#00f5ff] font-bold'
                          : 'text-[#b9caca] hover:text-[#e9feff]'
                      }`}
                    >
                      Node.js
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[#b9caca] hover:text-[#00f5ff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="text-[#dae2fd] whitespace-pre-wrap leading-relaxed">
                  <code>{getCodeSnippet()}</code>
                </pre>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={onOpenPlayground}
                  className="flex items-center justify-between p-4 bg-[#171f33] rounded-xl border border-[#3a494a]/30 hover:border-[#00f5ff]/50 transition-all text-sm font-semibold text-[#e9feff]"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f5ff]">terminal</span>
                    Full API Interactive Sandbox
                  </span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <a
                  href="#sdk-download"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`SDK v2.1 package @aetheris/sdk for ${agent.name} ready for download or npm install.`);
                  }}
                  className="flex items-center justify-between p-4 bg-[#171f33] rounded-xl border border-[#3a494a]/30 hover:border-[#00f5ff]/50 transition-all text-sm font-semibold text-[#e9feff]"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f5ff]">download</span>
                    Download SDK (v2.1.0)
                  </span>
                  <span className="material-symbols-outlined">download</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Licensing Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
            <div className="glass-panel p-8 rounded-3xl teal-glow border border-[#00f5ff]/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#b9caca] mb-1">
                    Licensing Options
                  </h3>
                  <div className="text-3xl font-bold font-headline text-[#00f5ff]">
                    {selectedPlan === 'subscription' ? `$${agent.monthlyPrice}` : `$${agent.oneTimePrice.toLocaleString()}`}
                    <span className="text-sm font-normal text-[#b9caca]">
                      {selectedPlan === 'subscription' ? '/month' : ' perpetual'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-[#3e90ff]/20 text-[#aac7ff] text-[10px] font-bold rounded uppercase">
                  Most Popular
                </span>
              </div>

              {/* Radio Selection */}
              <div className="space-y-3 mb-6">
                <label
                  onClick={() => setSelectedPlan('subscription')}
                  className={`block p-4 border rounded-xl cursor-pointer relative transition-all ${
                    selectedPlan === 'subscription'
                      ? 'border-[#00f5ff] bg-[#00f5ff]/5'
                      : 'border-[#3a494a]/30 hover:border-[#00f5ff]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlan === 'subscription'}
                    onChange={() => setSelectedPlan('subscription')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 accent-[#00f5ff]"
                  />
                  <div className="font-bold text-[#e9feff] text-sm">Pro Subscription</div>
                  <div className="text-xs text-[#b9caca]">Unlimited reasoning tasks + API</div>
                </label>

                <label
                  onClick={() => setSelectedPlan('onetime')}
                  className={`block p-4 border rounded-xl cursor-pointer relative transition-all ${
                    selectedPlan === 'onetime'
                      ? 'border-[#00f5ff] bg-[#00f5ff]/5'
                      : 'border-[#3a494a]/30 hover:border-[#00f5ff]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlan === 'onetime'}
                    onChange={() => setSelectedPlan('onetime')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 accent-[#00f5ff]"
                  />
                  <div className="font-bold text-[#e9feff] text-sm">One-Time License</div>
                  <div className="text-xs text-[#b9caca]">Perpetual local deployment - ${agent.oneTimePrice.toLocaleString()}</div>
                </label>
              </div>

              {/* Deploy Action */}
              <button
                onClick={handleDeploy}
                className="w-full bg-[#00f5ff] text-[#002021] py-4 rounded-xl font-bold text-base hover:bg-[#63f7ff] active:scale-95 transition-all mb-3 shadow-[0_0_20px_rgba(0,245,255,0.25)] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Deploy Now
              </button>

              <button
                onClick={handleDeploy}
                className="w-full border border-[#00f5ff] text-[#00f5ff] py-3.5 rounded-xl font-bold text-sm hover:bg-[#00f5ff]/10 transition-all"
              >
                Start 14-Day Free Trial
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[#b9caca] text-xs">
                <span className="material-symbols-outlined text-sm text-[#00f5ff]">lock</span>
                Secure checkout powered by Aetheris Pay
              </div>
            </div>

            {/* Trust Stats */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#b9caca]">Active Instances</span>
                <span className="text-[#e9feff] font-bold">{agent.activeInstances}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#b9caca]">Uptime SLA</span>
                <span className="text-[#e9feff] font-bold">{agent.uptime}</span>
              </div>

              <div className="w-full h-px bg-[#3a494a]/20" />

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img src={AVATARS.exec} alt="Exec" className="w-8 h-8 rounded-full border-2 border-[#0b1326] object-cover" />
                  <img src={AVATARS.architect} alt="Architect" className="w-8 h-8 rounded-full border-2 border-[#0b1326] object-cover" />
                  <img src={AVATARS.manager} alt="Manager" className="w-8 h-8 rounded-full border-2 border-[#0b1326] object-cover" />
                  <div className="w-8 h-8 rounded-full bg-[#2d3449] border-2 border-[#0b1326] flex items-center justify-center text-[10px] font-bold text-[#e9feff]">
                    +2k
                  </div>
                </div>
                <p className="text-xs text-[#b9caca] leading-tight">
                  Trusted by leading DevOps and Analytics teams worldwide.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-[#060e20] py-16 border-t border-[#3a494a]/20">
        <div className="px-6 md:px-12 max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h2 className="text-2xl font-bold font-headline text-[#00f5ff] mb-2">User Experiences</h2>
              <div className="flex items-center gap-4">
                <div className="flex text-[#00f5ff]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined fill-1">star</span>
                  ))}
                </div>
                <span className="text-[#e9feff] font-bold">{agent.rating} / 5.0</span>
                <span className="text-[#b9caca] text-sm">({reviews.length + 425} Verified Reviews)</span>
              </div>
            </div>

            <button
              onClick={onOpenReviewModal}
              className="px-6 py-3 glass-panel rounded-xl font-bold text-sm text-[#e9feff] hover:text-[#00f5ff] transition-colors border border-[#00f5ff]/30 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">rate_review</span>
              Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="glass-panel p-6 rounded-3xl space-y-4 relative">
                {rev.verified && (
                  <span className="absolute top-6 right-6 text-[10px] font-bold bg-[#00f5ff]/10 text-[#00f5ff] px-2 py-0.5 rounded-full border border-[#00f5ff]/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Verified
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatarUrl}
                    alt={rev.author}
                    className="w-10 h-10 rounded-full object-cover border border-[#00f5ff]/30"
                  />
                  <div>
                    <div className="font-bold text-[#e9feff] text-sm">{rev.author}</div>
                    <div className="text-xs text-[#b9caca]">{rev.role}, {rev.company}</div>
                  </div>
                </div>
                <div className="flex text-[#00f5ff] text-sm">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined fill-1">star</span>
                  ))}
                </div>
                <p className="text-[#b9caca] text-sm italic leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
