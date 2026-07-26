import React, { useEffect, useState } from 'react';
import { Agent, Review, ViewMode } from './types';
import { INITIAL_REVIEWS } from './data/agents';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AgentDetail } from './components/AgentDetail';
import { Checkout } from './components/Checkout';
import { BrowseCatalog } from './components/BrowseCatalog';
import { SolutionsView } from './components/SolutionsView';
import { EnterpriseView } from './components/EnterpriseView';
import { PricingView } from './components/PricingView';
import { ReviewModal } from './components/ReviewModal';
import { AgentPlaygroundModal } from './components/AgentPlaygroundModal';
import { fetchPublicAgents } from './lib/api';
import { mapApiAgentToUi } from './lib/map-agent';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('browse');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'subscription' | 'onetime'>('subscription');
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPlaygroundModalOpen, setIsPlaygroundModalOpen] = useState(false);
  const [playgroundAgent, setPlaygroundAgent] = useState<Agent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAgents(true);
      setLoadError(null);
      try {
        const apiAgents = await fetchPublicAgents();
        if (cancelled) return;
        const mapped = apiAgents.map(mapApiAgentToUi);
        setAgents(mapped);
        setSelectedAgent((prev) => prev ?? mapped[0] ?? null);
        setPlaygroundAgent((prev) => prev ?? mapped[0] ?? null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load agents');
          setAgents([]);
        }
      } finally {
        if (!cancelled) setLoadingAgents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPlaygroundForAgent = (agent?: Agent) => {
    setPlaygroundAgent(agent || selectedAgent);
    setIsPlaygroundModalOpen(true);
  };

  const handleAddReview = (newReviewData: Omit<Review, 'id' | 'date' | 'verified'>) => {
    const newRev: Review = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
      date: 'Just now',
      verified: true
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans selection:bg-[#00f5ff] selection:text-[#002021]">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenPlayground={() => handleOpenPlaygroundForAgent()}
        isLoggedIn={isLoggedIn}
        onToggleLogin={() => setIsLoggedIn(!isLoggedIn)}
      />

      <div className="flex-1">
        {loadingAgents && (
          <div className="pt-32 pb-20 text-center text-sm text-[#b9caca]">Loading agents from API…</div>
        )}
        {loadError && !loadingAgents && (
          <div className="pt-32 pb-20 px-4 text-center space-y-2">
            <p className="text-sm text-rose-300">{loadError}</p>
            <p className="text-xs text-[#849495]">
              Start the API with <code className="text-[#00f5ff]">uvicorn gateway.main:app --reload --port 8000</code>
            </p>
          </div>
        )}

        {!loadingAgents && !loadError && currentView === 'product' && selectedAgent && (
          <AgentDetail
            agent={selectedAgent}
            reviews={reviews}
            onNavigate={handleNavigate}
            onSelectPlan={(cycle) => setSelectedBillingCycle(cycle)}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenPlayground={() => handleOpenPlaygroundForAgent(selectedAgent)}
          />
        )}

        {!loadingAgents && !loadError && currentView === 'checkout' && selectedAgent && (
          <Checkout
            selectedAgent={selectedAgent}
            billingCycle={selectedBillingCycle}
            onNavigate={handleNavigate}
          />
        )}

        {!loadingAgents && !loadError && currentView === 'browse' && (
          <BrowseCatalog
            agents={agents}
            onSelectAgent={(ag) => setSelectedAgent(ag)}
            onNavigate={handleNavigate}
            onOpenPlayground={(ag) => handleOpenPlaygroundForAgent(ag)}
          />
        )}

        {currentView === 'solutions' && (
          <SolutionsView onNavigate={handleNavigate} />
        )}

        {currentView === 'enterprise' && (
          <EnterpriseView onNavigate={handleNavigate} />
        )}

        {currentView === 'pricing' && (
          <PricingView onNavigate={handleNavigate} />
        )}
      </div>

      <Footer onNavigate={handleNavigate} />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleAddReview}
      />

      {playgroundAgent && (
        <AgentPlaygroundModal
          isOpen={isPlaygroundModalOpen}
          onClose={() => setIsPlaygroundModalOpen(false)}
          agent={playgroundAgent}
        />
      )}
    </div>
  );
}
