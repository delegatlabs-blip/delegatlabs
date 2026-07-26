import React, { useState } from 'react';
import { ViewMode } from '../types';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <footer className="w-full py-20 border-t border-[#3a494a]/20 bg-[#060e20] text-[#b9caca]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* Brand Info */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <div className="text-2xl font-bold font-headline text-[#e9feff]">
            Aetheris <span className="text-[#00f5ff]">AI</span>
          </div>
          <p className="text-sm leading-relaxed text-[#b9caca]">
            Empowering the next generation of enterprise automation through sovereign intelligence and high-throughput AI agents.
          </p>
        </div>

        {/* Platform Links */}
        <div className="space-y-3">
          <h4 className="text-[#e9feff] font-bold text-base font-headline">Platform</h4>
          <nav className="flex flex-col gap-2 text-sm">
            <button onClick={() => onNavigate('browse')} className="text-left hover:text-[#00f5ff] transition-colors">
              Browse Agents
            </button>
            <button onClick={() => onNavigate('product')} className="text-left hover:text-[#00f5ff] transition-colors">
              API Documentation
            </button>
            <button onClick={() => onNavigate('enterprise')} className="text-left hover:text-[#00f5ff] transition-colors">
              Agent SDK (v2.1)
            </button>
            <button onClick={() => onNavigate('solutions')} className="text-left hover:text-[#00f5ff] transition-colors">
              System Status (99.99%)
            </button>
          </nav>
        </div>

        {/* Legal Links */}
        <div className="space-y-3">
          <h4 className="text-[#e9feff] font-bold text-base font-headline">Legal & Governance</h4>
          <nav className="flex flex-col gap-2 text-sm">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#00f5ff] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#00f5ff] transition-colors">
              Terms of Service
            </a>
            <a href="#compliance" onClick={(e) => e.preventDefault()} className="hover:text-[#00f5ff] transition-colors">
              SOC2 & HIPAA Audit Reports
            </a>
            <a href="#affiliate" onClick={(e) => e.preventDefault()} className="hover:text-[#00f5ff] transition-colors">
              Affiliate Program
            </a>
          </nav>
        </div>

        {/* Newsletter */}
        <div className="space-y-3">
          <h4 className="text-[#e9feff] font-bold text-base font-headline">Intelligence Dispatch</h4>
          <p className="text-xs text-[#b9caca]">
            Receive monthly benchmark releases and new AI agent announcements.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="bg-[#0b1326] border border-[#3a494a]/50 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#00f5ff] text-sm text-[#e9feff]"
              />
              <button
                type="submit"
                className="bg-[#00f5ff] text-[#002021] hover:bg-[#63f7ff] transition-colors p-2 rounded-lg font-bold flex items-center justify-center shrink-0"
                title="Subscribe"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
            {subscribed && (
              <p className="text-xs text-[#00f5ff] flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Subscribed to Aetheris Dispatch!
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-[#3a494a]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#849495] gap-4">
        <div>© 2024 Aetheris AI Marketplace. All rights reserved.</div>
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-1 text-[#00f5ff]">
            <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-ping" />
            All Edge Systems Operational
          </span>
          <span>SSL 256-bit Encrypted</span>
        </div>
      </div>
    </footer>
  );
};
