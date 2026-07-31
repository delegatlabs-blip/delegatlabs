import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product updates, agent playbooks, and marketplace notes from DelegtLabs.",
};

const posts = [
  {
    title: "Welcome to the DelegtLabs blog",
    excerpt: "Notes on multi-agent workflows, marketplace launches, and how teams ship with AI agents.",
    href: "/blog",
  },
  {
    title: "Subscription vs credits: picking a plan",
    excerpt: "A short guide to choosing the billing model that matches how your team actually works.",
    href: "/blog",
  },
];

export default function BlogPage() {
  return (
    <ContentPage
      eyebrow="Company"
      title="Blog"
      description="Product updates, agent playbooks, and marketplace notes."
    >
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.title}>
            <Link
              href={post.href}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
