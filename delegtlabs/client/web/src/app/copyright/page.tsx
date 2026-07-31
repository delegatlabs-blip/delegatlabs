import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Copyright",
  description: "Copyright and intellectual property notice for DelegtLabs.",
};

export default function CopyrightPage() {
  const year = new Date().getFullYear();

  return (
    <ContentPage
      eyebrow="Legal"
      title="Copyright"
      description={`Intellectual property notice for ${siteConfig.name}.`}
    >
      <p>
        © {year} {siteConfig.name}. All rights reserved.
      </p>
      <p>
        The {siteConfig.name} name, logos, website design, documentation, and marketplace
        software are protected by copyright and other intellectual property laws.
        You may not copy, modify, distribute, or create derivative works without prior
        written permission, except for fair use or rights granted under your account agreement.
      </p>
      <h2 className="text-lg font-semibold text-slate-900">Security &amp; reporting</h2>
      <p>
        To report suspected infringement or a security concern, email{" "}
        <a className="font-semibold text-blue-600 hover:text-blue-700" href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
        .
      </p>
    </ContentPage>
  );
}
