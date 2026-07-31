import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the DelegtLabs agent marketplace.",
};

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of Service"
      description={`Last updated: August 1, 2026. By using ${siteConfig.name}, you agree to these terms.`}
    >
      <h2 className="text-lg font-semibold text-slate-900">1. Accounts</h2>
      <p>
        You are responsible for account credentials and for activity under your account.
        Provide accurate information and keep access secure.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">2. Marketplace use</h2>
      <p>
        Agents are provided for lawful business use. You must not misuse the platform,
        reverse engineer services beyond permitted APIs, or violate third-party rights when
        connecting accounts (for example LinkedIn or email providers).
      </p>

      <h2 className="text-lg font-semibold text-slate-900">3. Billing</h2>
      <p>
        Subscription and credit plans renew or deplete according to the plan you choose.
        Fees are non-refundable except where required by law or stated at purchase.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">4. Availability</h2>
      <p>
        We aim for reliable service but do not guarantee uninterrupted availability.
        Features may change as we improve the marketplace.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">5. Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a className="font-semibold text-blue-600 hover:text-blue-700" href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
      </p>
    </ContentPage>
  );
}
