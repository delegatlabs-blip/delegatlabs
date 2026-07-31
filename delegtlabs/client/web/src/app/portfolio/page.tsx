import type { Metadata } from "next";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Project types and delivery work across web, mobile, AI, and marketplaces.",
};

export default function PortfolioPage() {
  return (
    <>
      <ContentPage
        eyebrow="Work"
        title="Portfolio"
        description="Types of projects we ship alongside the agent marketplace."
      >
        <p className="text-slate-600">Browse representative project categories below.</p>
      </ContentPage>
      <PortfolioSection showHeader={false} maxItems={8} />
    </>
  );
}
