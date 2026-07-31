import { siteConfig } from "@/lib/site";

export const contactIntro = {
  title: "Let's talk about your product.",
  subtitle: "Get in touch",
};

export const contactForm = {
  nameLabel: "Name",
  emailLabel: "Email",
  countryLabel: "Country",
  mobileLabel: "Mobile",
  servicesLabel: "Services",
  messageLabel: "Tell us what you're building (goals, timeline, budget)…",
  submitLabel: "Request a callback",
};

export const offices = [
  {
    id: "india",
    country: "India",
    phone: siteConfig.phoneDisplay || "+91 9307509511",
    address: "India",
    email: siteConfig.contactEmail,
  },
];
