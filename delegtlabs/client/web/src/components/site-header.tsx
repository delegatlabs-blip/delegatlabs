"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site";

export type AgentNavLink = { href: string; label: string };

const DOT_COLORS = [
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-pink-400",
  "bg-green-500",
  "bg-emerald-400",
  "bg-blue-500",
  "bg-cyan-400",
  "bg-purple-500",
  "bg-indigo-400",
];

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    text: "hover:text-yellow-500",
    underline: "bg-gradient-to-r from-yellow-400 to-orange-500",
    bg: "hover:bg-yellow-50",
    dot: "bg-yellow-400",
  },
  {
    href: "/about",
    label: "About",
    text: "hover:text-orange-500",
    underline: "bg-gradient-to-r from-orange-400 to-red-500",
    bg: "hover:bg-orange-50",
    dot: "bg-orange-400",
  },
  {
    href: "/agents",
    label: "Agents",
    text: "hover:text-red-500",
    underline: "bg-gradient-to-r from-red-500 to-pink-500",
    bg: "hover:bg-red-50",
    dot: "bg-red-400",
    children: true,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    text: "hover:text-green-600",
    underline: "bg-gradient-to-r from-green-500 to-emerald-500",
    bg: "hover:bg-green-50",
    dot: "bg-green-500",
  },
  {
    href: "/contact",
    label: "Contact",
    text: "hover:text-purple-600",
    underline: "bg-gradient-to-r from-purple-500 to-indigo-500",
    bg: "hover:bg-purple-50",
    dot: "bg-purple-500",
  },
] as const;

export function SiteHeader({ agentLinks }: { agentLinks: AgentNavLink[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [mobileAgentsOpen, setMobileAgentsOpen] = useState(false);
  const telHref = `tel:${siteConfig.phoneDisplay.replace(/\s/g, "").replace(/-/g, "")}`;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 sm:h-[4.5rem] sm:px-8 lg:h-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-[19px] font-bold tracking-tight text-slate-900"
          aria-label={`${siteConfig.name} home`}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400"
            aria-hidden
          />
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const hasChildren = "children" in item && item.children;

            if (!hasChildren) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative group text-sm font-semibold transition-colors duration-200 ${
                    active ? "text-slate-900" : `text-slate-600 ${item.text}`
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-[2.5px] rounded-full ${item.underline} transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            }

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setAgentsOpen(true)}
                onMouseLeave={() => setAgentsOpen(false)}
              >
                <Link
                  href={item.href}
                  className={`relative group flex items-center gap-1 text-sm font-semibold transition-colors duration-200 ${
                    active || agentsOpen
                      ? "text-slate-900"
                      : `text-slate-600 ${item.text}`
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2.5px] rounded-full ${item.underline} transition-all duration-300 ${
                      active || agentsOpen ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                  <span
                    className={`inline-block text-[10px] transition-transform duration-200 ${
                      agentsOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </Link>

                <div
                  className={`absolute left-1/2 top-full z-50 mt-4 w-[95vw] max-w-[720px] -translate-x-1/2 origin-top rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl transition-all duration-300 ${
                    agentsOpen
                      ? "visible translate-y-0 scale-100 opacity-100"
                      : "invisible -translate-y-2 scale-95 opacity-0"
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Agents
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Select an agent to explore
                      </p>
                    </div>
                    <Link
                      href="/agents"
                      className="text-sm font-semibold text-red-500 hover:underline"
                      onClick={() => setAgentsOpen(false)}
                    >
                      View all →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {agentLinks.map((child, ci) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                        onClick={() => setAgentsOpen(false)}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[ci % DOT_COLORS.length]}`}
                        />
                        <p className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900">
                          {child.label}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <a
            href={telHref}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            data-cursor-exclude
          >
            <span className="text-slate-500">IN</span> {siteConfig.phoneDisplay}
          </a>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold leading-none text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            data-cursor-exclude
          >
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          data-cursor-exclude
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
            data-cursor-exclude
          />
          <div className="relative z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-[1180px] flex-col gap-1 px-4 py-4">
              {NAV_ITEMS.map((item) => {
                const hasChildren = "children" in item && item.children;
                if (!hasChildren) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors ${item.bg}`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => setMobileAgentsOpen((open) => !open)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors ${item.bg}`}
                      data-cursor-exclude
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                        {item.label}
                      </span>
                      <span
                        className={`transition-transform duration-200 ${
                          mobileAgentsOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                    {mobileAgentsOpen ? (
                      <div className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                        <Link
                          href="/agents"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View all agents
                        </Link>
                        {agentLinks.map((child, ci) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLORS[ci % DOT_COLORS.length]}`}
                            />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <a
                href={telHref}
                className="mt-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900"
                data-cursor-exclude
              >
                {siteConfig.phoneDisplay}
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold leading-none text-white shadow-sm transition hover:bg-blue-700"
                data-cursor-exclude
              >
                Get a Quote
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
