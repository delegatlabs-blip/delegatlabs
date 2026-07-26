import React, { useState } from 'react';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenPlayground: () => void;
  isLoggedIn: boolean;
  onToggleLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenPlayground,
  isLoggedIn,
  onToggleLogin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/80 backdrop-blur-xl border-b border-[#3a494a]/30 h-20 shadow-sm transition-all">
      <div className="flex justify-between items-center w-full px-4 md:px-12 max-w-[1280px] mx-auto h-full">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('product')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/30 flex items-center justify-center text-[#00f5ff] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl font-bold">memory</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#e9feff] font-headline">
            Aetheris <span className="text-[#00f5ff]">AI</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8 items-center">
          <button
            onClick={() => onNavigate('browse')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 ${
              currentView === 'browse'
                ? 'text-[#e9feff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#e9feff]'
            }`}
          >
            Browse
          </button>

          <button
            onClick={() => onNavigate('product')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 ${
              currentView === 'product'
                ? 'text-[#e9feff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#e9feff]'
            }`}
          >
            Agent Details
          </button>

          <button
            onClick={() => onNavigate('solutions')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 ${
              currentView === 'solutions'
                ? 'text-[#e9feff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#e9feff]'
            }`}
          >
            Solutions
          </button>

          <button
            onClick={() => onNavigate('enterprise')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 ${
              currentView === 'enterprise'
                ? 'text-[#e9feff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#e9feff]'
            }`}
          >
            Enterprise
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 ${
              currentView === 'pricing'
                ? 'text-[#e9feff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#e9feff]'
            }`}
          >
            Pricing
          </button>

          <button
            onClick={() => onNavigate('checkout')}
            className={`font-medium transition-all duration-200 text-sm py-1 border-b-2 flex items-center gap-1.5 ${
              currentView === 'checkout'
                ? 'text-[#00f5ff] border-[#00f5ff] font-bold'
                : 'text-[#b9caca] border-transparent hover:text-[#00f5ff]'
            }`}
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            Checkout
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPlayground}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 hover:bg-[#00f5ff]/20 text-xs font-semibold transition-all"
            title="Try agent in interactive playground"
          >
            <span className="material-symbols-outlined text-sm animate-pulse">terminal</span>
            <span>Live Sandbox</span>
          </button>

          <button
            onClick={onToggleLogin}
            className="text-[#b9caca] font-medium hover:text-[#e9feff] transition-all px-3 py-2 text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg">
              {isLoggedIn ? 'account_circle' : 'login'}
            </span>
            <span>{isLoggedIn ? 'Alex S.' : 'Log In'}</span>
          </button>

          <button
            onClick={() => onNavigate('browse')}
            className="bg-[#00f5ff] text-[#002021] font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-all active:scale-95 text-sm shadow-[0_0_15px_rgba(0,245,255,0.2)]"
          >
            Get Started
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#b9caca] hover:text-[#e9feff] p-2"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b1326] border-b border-[#3a494a]/30 px-6 py-4 space-y-3">
          <button
            onClick={() => { onNavigate('browse'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#dae2fd] hover:text-[#00f5ff]"
          >
            Browse Agents
          </button>
          <button
            onClick={() => { onNavigate('product'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#dae2fd] hover:text-[#00f5ff]"
          >
            Sentient Logic Pro
          </button>
          <button
            onClick={() => { onNavigate('solutions'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#dae2fd] hover:text-[#00f5ff]"
          >
            Solutions
          </button>
          <button
            onClick={() => { onNavigate('enterprise'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#dae2fd] hover:text-[#00f5ff]"
          >
            Enterprise
          </button>
          <button
            onClick={() => { onNavigate('pricing'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#dae2fd] hover:text-[#00f5ff]"
          >
            Pricing
          </button>
          <button
            onClick={() => { onNavigate('checkout'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#00f5ff] font-semibold"
          >
            Secure Checkout
          </button>
          <button
            onClick={() => { onOpenPlayground(); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-[#00f5ff] font-semibold"
          >
            Open Live Sandbox
          </button>
        </div>
      )}
    </nav>
  );
};
