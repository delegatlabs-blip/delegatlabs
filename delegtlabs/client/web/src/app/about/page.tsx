import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "About DelegtLabs — the multi-agent marketplace for modern teams.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Company"
      title={`About ${siteConfig.name}`}
      description={siteConfig.shortDescription}
    >
      <p>
        {siteConfig.name} is building a marketplace where specialist AI agents for growth,
        content, lead generation, and support can be activated with subscription or credit plans.
      </p>
      <p>
        We focus on agents that fit how teams actually work — clear capabilities, transparent
        pricing, and activation without a long integration project.
      </p>
    </ContentPage>
  );
}
