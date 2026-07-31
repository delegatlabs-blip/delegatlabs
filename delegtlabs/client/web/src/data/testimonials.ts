export type Testimonial = {
  id: string;
  author: string;
  role: string;
  company: string;
  title: string;
  rating: number;
  quote: string;
  image?: string;
};

export const testimonialsIntro = {
  title: "Reviews",
  sectionTitle: "What clients say about working with us",
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    author: "Homofix",
    role: "Company",
    company: "Homofix Company",
    title: "Exceptional service and outstanding results",
    image: "/Homofix.png",
    rating: 5,
    quote:
      "DelegtLabs delivered an exceptional solution that exceeded our expectations. Their team demonstrated professionalism, technical expertise, and a deep understanding of our business needs.",
  },
  {
    id: "2",
    author: "GrowthOps",
    role: "Marketing Lead",
    company: "GrowthOps",
    title: "Agents that actually ship content",
    image: "/Homofix.png",
    rating: 5,
    quote:
      "We activated the LinkedIn and content agents in a day. Scheduling and review flows cut our weekly publishing time in half without losing quality.",
  },
  {
    id: "3",
    author: "Northline",
    role: "Founder",
    company: "Northline",
    title: "Clear plans, fast activation",
    image: "/Homofix.png",
    rating: 5,
    quote:
      "Subscription vs credits was easy to choose, and support from the agent marketplace felt production-ready from week one.",
  },
];
