import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join DelegtLabs — build the multi-agent marketplace teams rely on.",
};

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Company"
      title="Careers"
      description="Help us build specialist AI agents that teams actually use."
    >
      <p>
        We are a small product and engineering team shipping an agent marketplace —
        from LinkedIn growth to support automation.
      </p>
      <p>
        Open roles are listed as we hire. If you want to work on multi-agent systems,
        product design, or go-to-market, email us with your profile and a short note
        on what you want to build.
      </p>
      <p>
        <a
          className="font-semibold text-blue-600 hover:text-blue-700"
          href={`mailto:${siteConfig.contactEmail}?subject=Careers%20at%20${encodeURIComponent(siteConfig.name)}`}
        >
          {siteConfig.contactEmail}
        </a>
      </p>
      <p>
        Prefer a form?{" "}
        <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">
          Contact us
        </Link>
        .
      </p>
    </ContentPage>
  );
}
