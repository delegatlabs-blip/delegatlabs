import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact DelegtLabs for sales, support, partnerships, or press.",
};

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Get in touch"
      title="Contact"
      description="Sales, support, partnerships, or press — we read every message."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Email
        </p>
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="mt-2 inline-block text-xl font-semibold text-blue-600 hover:text-blue-700"
        >
          {siteConfig.contactEmail}
        </a>
      </div>

      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" action={`mailto:${siteConfig.contactEmail}`} method="get">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            data-cursor-exclude
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            data-cursor-exclude
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
            Message
          </label>
          <textarea
            id="message"
            name="body"
            required
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            data-cursor-exclude
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          data-cursor-exclude
        >
          Send message
        </button>
      </form>
    </ContentPage>
  );
}
