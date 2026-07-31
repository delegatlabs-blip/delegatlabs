import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DelegtLabs collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`Last updated: August 1, 2026. This policy explains how ${siteConfig.name} handles personal data.`}
    >
      <h2 className="text-lg font-semibold text-slate-900">1. Information we collect</h2>
      <p>
        We collect account details, usage data for marketplace agents, billing information
        processed by our payment providers, and messages you send through contact forms or email.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">2. How we use information</h2>
      <p>
        We use data to operate the marketplace, activate agents, provide support, improve
        product quality, and meet legal or security obligations.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">3. Cookies</h2>
      <p id="cookies">
        We use essential cookies for authentication and preferences, and optional analytics
        cookies where enabled. You can control non-essential cookies in your browser settings.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">4. Sharing</h2>
      <p>
        We do not sell personal data. We share information with processors that help us run
        the product (hosting, email, payments) under contractual safeguards.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">5. Contact</h2>
      <p>
        Privacy questions:{" "}
        <a className="font-semibold text-blue-600 hover:text-blue-700" href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
      </p>
    </ContentPage>
  );
}
