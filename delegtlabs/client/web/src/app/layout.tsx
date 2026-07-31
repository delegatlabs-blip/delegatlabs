import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AdvancedCursor from "@/components/advanced-cursor";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";
import { listAgents } from "@/server/agents/repository";
import "./globals.css";

/** Navbar agents dropdown: 0–30 listed agents from the database. */
const NAV_AGENT_LIMIT = 30;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  applicationName: siteConfig.name,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "ai-content-declaration": "human-authored marketing content for AI agent marketplace",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { items } = await listAgents({ page: 1, pageSize: NAV_AGENT_LIMIT });
  const agentLinks = items.map((agent) => ({
    href: `/agents/${agent.slug}`,
    label: agent.name,
  }));

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AdvancedCursor />
        <JsonLd />
        <SiteHeader agentLinks={agentLinks} />
        {children}
        <SiteFooter />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
