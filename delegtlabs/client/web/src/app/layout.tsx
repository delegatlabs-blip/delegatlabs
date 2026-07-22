import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delegatlabs — Multi-Agent Platform",
  description: "Dark-mode B2B workbench for LinkedIn Growth and Lawyer Drafting agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className={`${GeistSans.className} min-h-full antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
