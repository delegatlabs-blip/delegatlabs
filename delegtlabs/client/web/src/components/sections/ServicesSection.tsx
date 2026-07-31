"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { servicesIntro, homePageServiceItems } from "@/data/services";

interface ServicesSectionProps {
  intro?: typeof servicesIntro;
  items?: typeof homePageServiceItems;
  maxItems?: number;
}

const COLOR_SCHEMES = [
  {
    gradient: "from-blue-500 to-purple-600",
    text: "text-white",
    description: "text-blue-50",
    border: "border-blue-400/30",
    cursorColor: "#3b82f6", // blue-500
  },
  {
    gradient: "from-green-500 to-teal-600",
    text: "text-white",
    description: "text-green-50",
    border: "border-green-400/30",
    cursorColor: "#22c55e", // green-500
  },
  {
    gradient: "from-orange-500 to-pink-600",
    text: "text-white",
    description: "text-orange-50",
    border: "border-orange-400/30",
    cursorColor: "#f97316", // orange-500
  },
  {
    gradient: "from-yellow-500 to-amber-600",
    text: "text-white",
    description: "text-yellow-50",
    border: "border-yellow-400/30",
    cursorColor: "#eab308", // yellow-500
  },
];

export function ServicesSection({
  intro = servicesIntro,
  items = homePageServiceItems,
  maxItems,
}: ServicesSectionProps) {
  const list = maxItems ? items.slice(0, maxItems) : items;

  const sectionRef  = useRef<HTMLElement>(null);
  const headingRef  = useRef<HTMLDivElement>(null);
  const cardsRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register inside useEffect — safe for SSR/Next.js
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {

      /* ── Heading: slide up on scroll ── */
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 82%",
            once: true,           // only plays once (no reverse flicker)
          },
        }
      );

      /* ── Cards: staggered pop-in on scroll ── */
      const cards = cardsRef.current
        ? Array.from(cardsRef.current.children)
        : [];

      if (cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 70, scale: 0.88, rotate: 2 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "back.out(1.3)",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 78%",
              once: true,
            },
          }
        );

        /* ── Per-card GSAP hover (lift + shadow) ── */
        cards.forEach((card) => {
          const el = card as HTMLElement;
          const enter = () =>
            gsap.to(el, { y: -8, scale: 1.03, duration: 0.28, ease: "power2.out",
              boxShadow: "0 24px 48px rgba(0,0,0,0.18)" });
          const leave = () =>
            gsap.to(el, { y: 0, scale: 1, duration: 0.28, ease: "power2.out",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)" });

          el.addEventListener("mouseenter", enter);
          el.addEventListener("mouseleave", leave);

          // Store cleanup on element for ctx.revert
          (el as HTMLElement & { _gsapEnter?: () => void; _gsapLeave?: () => void })._gsapEnter = enter;
          (el as HTMLElement & { _gsapLeave?: () => void })._gsapLeave = leave;
        });
      }
    }, sectionRef);

    const cardsEl = cardsRef.current;
    return () => {
      // Cleanup hover listeners (use captured variable, not ref.current)
      if (cardsEl) {
        Array.from(cardsEl.children).forEach((card) => {
          const el = card as HTMLElement & { _gsapEnter?: () => void; _gsapLeave?: () => void };
          if (el._gsapEnter) el.removeEventListener("mouseenter", el._gsapEnter);
          if (el._gsapLeave) el.removeEventListener("mouseleave", el._gsapLeave);
        });
      }
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 bg-[#f8f8f8]"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(11,27,59,0.06) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="container mx-auto px-6">

        {/* HEADING */}
        <div ref={headingRef} className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0b1b3b] tracking-wide">
            {intro.title}
          </h2>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            {intro.subtitle}
          </p>
        </div>

        {/* CARDS */}
        <div ref={cardsRef} className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((item, index) => {
            const colors = COLOR_SCHEMES[index % COLOR_SCHEMES.length];
            return (
              <div
                key={item.id}
                data-type="card"
                data-color={colors.cursorColor}
                data-value={item.title}
                className={`
                  bg-gradient-to-br ${colors.gradient}
                  border-2 ${colors.border}
                  rounded-2xl p-8 text-center
                  cursor-default
                `}
                style={{ willChange: "transform" }}
              >
                {/* TITLE */}
                <h3 className={`text-lg font-bold uppercase tracking-wide ${colors.text}`}>
                  {item.title}
                </h3>

                {/* DESCRIPTION */}
                <p className={`mt-4 text-sm ${colors.description} leading-relaxed opacity-95`}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
