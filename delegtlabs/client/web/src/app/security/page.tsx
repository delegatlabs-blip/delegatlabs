import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security at Deleglabs",
  description: "Overview of security goals, data protection principles, and vulnerability reporting at DelegtLabs.",
};

export default function SecurityPage() {
  return (
    <ContentPage
      eyebrow="Legal & Security"
      title="Security at Deleglabs"
      description="Last updated: [Date Placeholder - Draft Pending Review]. Overview of our security goals, planned safeguards, and reporting guidelines."
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800 mb-6">
        <strong className="font-semibold">Notice:</strong> This policy is a <em>[Draft - Subject to Internal &amp; Security Team Review]</em>. Statements below describe intended security goals and planned practices.
      </div>

      <h2 className="text-lg font-semibold text-slate-900">1. Security approach overview</h2>
      <p>
        DelegtLabs aims to prioritize system integrity and data safety across our platform. We are committed to developing layered defense controls and restricting administrative access according to least-privilege guidelines.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">2. Data protection goals</h2>
      <p>
        We work to ensure customer data and agent task configurations are isolated within defined boundaries, striving to protect tenant resources against unauthorized access or cross-tenant exposure.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">3. Encryption practices</h2>
      <p>
        Our objective is to employ industry-standard encryption in transit and evaluate encrypted storage configurations for persistent database repositories and backups as infrastructure scales.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">4. Access controls</h2>
      <p>
        We intend to maintain role-based access controls (RBAC) to restrict internal access to production environments, aiming to enforce multi-factor authentication for maintenance and deployment workflows.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">5. Infrastructure &amp; monitoring</h2>
      <p>
        We plan to integrate active logging, operational threat checks, and automated health monitoring to support continuous platform availability and resilience.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">6. Incident response</h2>
      <p>
        We aim to maintain procedures for identifying, containing, and remediating potential security events, with a commitment to notifying affected stakeholders in accordance with applicable legal guidelines.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">7. Responsible vulnerability reporting</h2>
      <p>
        If you discover a potential vulnerability in our service, we encourage responsible disclosure. Please submit reports with step-by-step reproduction details to our team without disrupting live service operations.
      </p>

      <h2 className="text-lg font-semibold text-slate-900">8. Security contact information</h2>
      <p>
        For security reports or compliance inquiries, please reach out to:{" "}
        <a className="font-semibold text-blue-600 hover:text-blue-700" href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>{" "}
        <em>[Security Contact Placeholder - Pending Team Review]</em>.
      </p>
    </ContentPage>
  );
}
