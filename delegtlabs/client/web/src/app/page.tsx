import dynamic from "next/dynamic";
import { AgentMarketplace } from "@/components/agent-marketplace";
import { Hero } from "@/components/hero";
import { AboutSection, ServicesSection } from "@/components/sections";
import { homePageServiceItems } from "@/data/services";
import { listAgents } from "@/server/agents/repository";

/** Featured cards on home: 0–4 listed agents from the database. */
const HOME_AGENT_COUNT = 4;

const PortfolioSection = dynamic(() =>
  import("@/components/sections/PortfolioSection").then((mod) => mod.PortfolioSection),
);

const TestimonialsSection = dynamic(() =>
  import("@/components/sections/TestimonialsSection").then(
    (mod) => mod.TestimonialsSection,
  ),
);

const ClientsSection = dynamic(() =>
  import("@/components/sections/ClientsSection").then((mod) => mod.ClientsSection),
);

const AchievementsSection = dynamic(() =>
  import("@/components/sections/AchievementsSection").then(
    (mod) => mod.AchievementsSection,
  ),
);

const ContactSection = dynamic(() =>
  import("@/components/sections/ContactSection").then((mod) => mod.ContactSection),
);

export default async function HomePage() {
  const { items, total } = await listAgents({
    page: 1,
    pageSize: HOME_AGENT_COUNT,
    featured: true,
  });

  return (
    <main>
      <Hero />
      <AgentMarketplace agents={items} total={total} />
      <AboutSection />
      <ServicesSection items={homePageServiceItems} />
      <PortfolioSection maxItems={6} />
      <TestimonialsSection maxItems={4} />
      <ClientsSection />
      <AchievementsSection />
      <ContactSection />
    </main>
  );
}
