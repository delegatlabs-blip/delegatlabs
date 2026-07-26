import React, { useState } from 'react';
import { Agent, ViewMode } from '../types';

interface BrowseCatalogProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onNavigate: (view: ViewMode) => void;
  onOpenPlayground: (agent: Agent) => void;
}

export const BrowseCatalog: React.FC<BrowseCatalogProps> = ({
  agents,
  onSelectAgent,
  onNavigate,
  onOpenPlayground
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(agents.map((a) => a.category).filter(Boolean)))];

  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      ag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ag.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ag.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ag.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-28 pb-20 px-4 md:px-12 max-w-[1280px] mx-auto min-h-[85vh]">
      {/* Catalog Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-xs font-semibold uppercase tracking-widest">
          Enterprise Agent Marketplace
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient">
          Explore Autonomous AI Agents
        </h1>
        <p className="text-[#b9caca] text-base leading-relaxed">
          Deploy pre-trained, high-throughput AI reasoning engines equipped with SOC2 compliance, 2TB context windows, and sub-5ms latency.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agents by capability, framework, or model..."
            className="w-full bg-[#131b2e] border border-[#3a494a] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff] shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#849495] text-xl">
            search
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-[#00f5ff] text-[#002021] font-bold shadow-[0_0_15px_rgba(0,245,255,0.25)]'
                : 'glass-panel text-[#b9caca] hover:text-[#e9feff] border-[#3a494a]/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredAgents.map((ag) => (
          <div
            key={ag.id}
            className="glass-panel rounded-3xl p-6 md:p-8 border border-[#3a494a]/40 hover:border-[#00f5ff]/40 transition-all group hover:shadow-[0_0_30px_rgba(0,245,255,0.12)] flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#00f5ff] uppercase tracking-wider bg-[#00f5ff]/10 px-2 py-0.5 rounded-full border border-[#00f5ff]/20">
                    {ag.category}
                  </span>
                  <h3 className="text-2xl font-bold font-headline text-[#e9feff] mt-2 group-hover:text-[#00f5ff] transition-colors">
                    {ag.name}
                  </h3>
                  <p className="text-xs text-[#849495] font-mono">{ag.version}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-headline text-[#00f5ff]">${ag.monthlyPrice}</div>
                  <div className="text-[10px] text-[#b9caca]">/ month</div>
                </div>
              </div>

              <p className="text-sm text-[#b9caca] leading-relaxed">{ag.subtitle}</p>

              {/* Specs Chips */}
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-[#131b2e] border border-[#3a494a]/30 text-[#e9feff] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#00f5ff]">bolt</span>
                  {ag.latency}
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#131b2e] border border-[#3a494a]/30 text-[#e9feff] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#00f5ff]">verified</span>
                  {ag.compliance}
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#131b2e] border border-[#3a494a]/30 text-[#e9feff] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#00f5ff]">database</span>
                  {ag.contextWindow}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[#3a494a]/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-xs text-[#00f5ff] font-bold">
                <span className="material-symbols-outlined text-sm fill-1">star</span>
                <span>{ag.rating} / 5.0</span>
                <span className="text-[#849495] font-normal">({ag.reviewCount})</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenPlayground(ag)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#00f5ff] bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 border border-[#00f5ff]/30 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  Playground
                </button>

                <button
                  onClick={() => {
                    onSelectAgent(ag);
                    onNavigate('product');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#00f5ff] text-[#002021] text-xs font-bold hover:bg-[#63f7ff] transition-all shadow-[0_0_15px_rgba(0,245,255,0.2)]"
                >
                  View Spec & Deploy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
