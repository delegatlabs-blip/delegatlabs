"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-driven reveal for the agent rows: clip-path wipe on artwork,
 * count-up on the index number, staggered blur-fade on text, wipe on dividers.
 * Re-runs whenever `key` changes so a new page of results animates in too.
 */
export function useAgentsReveal(scope: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      root.querySelectorAll<HTMLElement>(".ag-img-wrap").forEach((el) => {
        el.style.clipPath = "inset(0 0% 0 0 round 24px)";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(".ag-article").forEach((article) => {
        const imgWrap = article.querySelector<HTMLElement>(".ag-img-wrap");
        const textLines = article.querySelectorAll<HTMLElement>(".ag-line");
        const numEl = article.querySelector<HTMLElement>(".ag-num");

        if (imgWrap) {
          gsap.fromTo(
            imgWrap,
            { clipPath: "inset(0 100% 0 0 round 24px)" },
            {
              clipPath: "inset(0 0% 0 0 round 24px)",
              duration: 1.1,
              ease: "expo.inOut",
              scrollTrigger: { trigger: imgWrap, start: "top 85%", once: true },
            },
          );
        }

        if (numEl) {
          const target = Number.parseInt(numEl.dataset.num ?? "0", 10);
          gsap.fromTo(
            numEl,
            { opacity: 0, scale: 0.6 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.7)",
              scrollTrigger: { trigger: numEl, start: "top 90%", once: true },
              onStart() {
                if (!Number.isFinite(target) || target <= 0) return;
                const counter = { val: 0 };
                gsap.to(counter, {
                  val: target,
                  duration: 1.2,
                  ease: "power2.out",
                  onUpdate() {
                    numEl.textContent = String(Math.round(counter.val)).padStart(2, "0");
                  },
                });
              },
            },
          );
        }

        if (textLines.length) {
          gsap.fromTo(
            textLines,
            { opacity: 0, y: 28, filter: "blur(6px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.65,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: textLines[0], start: "top 88%", once: true },
            },
          );
        }
      });

      gsap.utils.toArray<HTMLElement>(".ag-divider").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [scope, key]);
}
