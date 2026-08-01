import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for DelegtLabs explaining cookie usage and management.",
};

export default function CookiesPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="Last updated: [Date Placeholder - Draft Pending Review]. This policy outlines how DelegtLabs uses cookies and tracking technologies."
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 mb-6">
        <strong className="font-semibold">Notice:</strong> This document is a <em>[Draft - Subject to Legal Review]</em> and represents a template for formal adoption.
      </div>

      <h2 className="text-lg font-semibold text-slate-900">1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help
        remember your preferences, support essential functionality, and provide anonymized data
        to improve site performance.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">2. Cookies DelegtLabs uses</h2>
      <p>
        We use cookies and similar browser storage mechanisms to ensure security and optimize user experience across our platform:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong className="font-medium text-slate-900">Essential cookies:</strong> Required for foundational platform operations, authentication session maintenance, and security controls.
        </li>
        <li>
          <strong className="font-medium text-slate-900">Analytics cookies:</strong> Help us measure visitor interaction patterns and aggregated traffic performance to continuously enhance marketplace navigation.
        </li>
        <li>
          <strong className="font-medium text-slate-900">Preference cookies:</strong> Store user-selected interface settings and localized display options across browsing sessions.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-slate-900">3. Managing cookie preferences</h2>
      <p>
        You can configure your browser to block or alert you about cookies. Note that disabling essential cookies may impact platform functionality and authentication flows.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">4. Contact information</h2>
      <p>
        For inquiries regarding our cookie practices or browser data management, please contact:{" "}
        <a className="font-semibold text-blue-600 hover:text-blue-700" href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>{" "}
        <em>[Pending Team Review]</em>.
      </p>
    </ContentPage>
  );
}
