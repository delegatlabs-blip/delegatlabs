export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  gradient: string;
  hover: string;
  links: FooterLink[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    gradient: "from-yellow-400 to-orange-500",
    hover: "hover:text-orange-500",
    links: [
      { label: "Pricing", href: "/#agents" },
      { label: "Features", href: "/#agents" },
      { label: "Integrations", href: "/#agents" },
      { label: "Portfolio", href: "/portfolio" },
    ],
  },
  {
    title: "Company",
    gradient: "from-red-500 to-pink-500",
    hover: "hover:text-pink-500",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/blog" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Resources",
    gradient: "from-green-500 to-emerald-500",
    hover: "hover:text-emerald-600",
    links: [
      { label: "Documentation", href: "/contact" },
      { label: "API Docs", href: "/contact" },
      { label: "Help Center", href: "/contact" },
      { label: "Tutorials", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    gradient: "from-blue-500 to-cyan-500",
    hover: "hover:text-cyan-600",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/privacy" },
      { label: "Security", href: "/copyright" },
    ],
  },
];
