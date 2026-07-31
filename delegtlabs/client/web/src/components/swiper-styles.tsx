"use client";

import { useEffect } from "react";

const SWIPER_CSS_HREF = "/swiper-bundle.min.css"; // copied in postinstall from node_modules/swiper
const ID = "swiper-async-styles";

/**
 * Injects Swiper CSS asynchronously so it doesn't block initial render.
 * Call once from a Swiper-using component (e.g. when section is in view).
 */
export function useSwiperStyles() {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(ID)) return;
    const link = document.createElement("link");
    link.id = ID;
    link.rel = "stylesheet";
    link.href = SWIPER_CSS_HREF;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
    };
    document.head.appendChild(link);
  }, []);
}
