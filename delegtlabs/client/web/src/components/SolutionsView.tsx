import React from 'react';
import { ViewMode } from '../types';

interface SolutionsViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const SolutionsView: React.FC<SolutionsViewProps> = ({ onNavigate }) => {
  const solutions = [
    {
      title: 'Automated Financial Intelligence',
      icon: 'trending_up',
      tag: 'FINANCIAL SERVICES',
      description: 'High-frequency market signal parsing, automated portfolio risk rebalancing, and FINRA compliant document audit streams.',
      metrics: '3.2ms Execution Latency | 99.9% Accuracy'
    },
    {
      title: 'Autonomous DevOps & CI/CD Refactoring',
      icon: 'terminal',
      tag: 'ENGINEERING',
      description: 'Continuous code regression monitoring, automated performance bottleneck detection, and zero-defect git refactoring.',
      metrics: '85% Fewer Production Regressions'
    },
    {
      title: 'Global Supply Chain Orchestration',
      icon: 'hub',
      tag: 'LOGISTICS & FREIGHT',
      description: 'Multi-jurisdictional cargo tracking, predictive port congestion rerouting, and real-time customs clearance automation.',
      metrics: '2.0TB Context Window for Full Logistics Telemetry'
    },
    {
      title: 'Enterprise Cyber Threat Telemetry',
      icon: 'shield_lock',
      tag: 'CYBERSECURITY',
      description: 'Sub-second packet inspection, AI-driven zero-day threat isolation, and automated incident response mitigation.',
      metrics: 'ISO 27001 & SOC2 Type II Certified'
    }
  ];

  return (
    <div className="pt-28 pb-20 px-4 md:px-12 max-w-[1280px] mx-auto min-h-[85vh]">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <span className="px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-xs font-semibold uppercase tracking-widest">
          Industry Solutions
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-gradient">
          AI Architecture Built for Enterprise Scale
        </h1>
        <p className="text-[#b9caca] text-base leading-relaxed">
          From high-frequency financial reasoning to autonomous DevOps orchestration, explore tailored agent configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {solutions.map((sol, idx) => (
          <div key={idx} className="glass-panel p-8 rounded-3xl border border-[#3a494a]/40 space-y-4 hover:border-[#00f5ff]/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00f5ff]/15 border border-[#00f5ff]/30 flex items-center justify-center text-[#00f5ff]">
                <span className="material-symbols-outlined text-2xl">{sol.icon}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#00f5ff] uppercase tracking-wider">{sol.tag}</span>
                <h3 className="text-xl font-bold font-headline text-[#e9feff]">{sol.title}</h3>
              </div>
            </div>

            <p className="text-sm text-[#b9caca] leading-relaxed">{sol.description}</p>

            <div className="pt-4 border-t border-[#3a494a]/20 flex justify-between items-center text-xs">
              <span className="text-[#00f5ff] font-semibold">{sol.metrics}</span>
              <button
                onClick={() => onNavigate('browse')}
                className="text-[#e9feff] hover:text-[#00f5ff] font-bold flex items-center gap-1 transition-colors"
              >
                <span>Deploy Solution</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
