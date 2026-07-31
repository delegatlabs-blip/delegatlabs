"use client";

import { useEffect, useRef } from "react";

export default function AdvancedCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on non-touch devices and if user doesn't prefer reduced motion
    if (
      typeof window === "undefined" ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const cursor = cursorRef.current;
    const mediaContainer = mediaRef.current;

    if (!cursor || !mediaContainer) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const speed = 0.18;
    let rafId: number | null = null;

    // Track the currently active [data-type] element to avoid redundant updates
    let activeTarget: HTMLElement | null = null;

    // ─── Cursor state helpers ────────────────────────────────────────────────

    const showDefault = () => {
      cursor.style.width = "12px";
      cursor.style.height = "12px";
      cursor.style.background = "#000000";
      cursor.style.border = "none";
      cursor.style.borderRadius = "50%";
      cursor.style.boxShadow = "none";
      cursor.style.mixBlendMode = "normal";
      cursor.style.display = "block";
      cursor.style.alignItems = "";
      cursor.style.justifyContent = "";

      mediaContainer.innerHTML = "";
      mediaContainer.style.cssText = "width:100%;height:100%;border-radius:50%;display:block;";
    };

    const showForTarget = (target: HTMLElement) => {
      const type = (target.dataset.type || "").toLowerCase();
      const src = target.dataset.value;
      const color = target.dataset.color || "#000000";

      mediaContainer.innerHTML = "";

      if (type === "button") {
        const buttonText = src || "Click";
        cursor.style.width = "120px";
        cursor.style.height = "48px";
        cursor.style.background = color;
        cursor.style.border = "none";
        cursor.style.borderRadius = "24px";
        cursor.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        cursor.style.mixBlendMode = "normal";
        cursor.style.display = "flex";
        cursor.style.alignItems = "center";
        cursor.style.justifyContent = "center";

        mediaContainer.style.cssText =
          "width:100%;height:100%;border-radius:24px;display:flex;align-items:center;justify-content:center;";

        const span = document.createElement("span");
        span.textContent = buttonText;
        span.style.cssText =
          "color:#fff;font-size:14px;font-weight:600;letter-spacing:0.5px;pointer-events:none;";
        mediaContainer.appendChild(span);
      } else if (type === "card") {
        // Card cursor: rounded rectangle with card color background and heading text
        const cardText = src || "";
        
        // Measure text width to determine cursor size dynamically
        const measureSpan = document.createElement("span");
        measureSpan.style.cssText =
          "position:absolute;visibility:hidden;white-space:nowrap;font-size:13px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;";
        measureSpan.textContent = cardText;
        document.body.appendChild(measureSpan);
        const textWidth = measureSpan.offsetWidth;
        document.body.removeChild(measureSpan);
        
        // Calculate cursor dimensions with padding (min 200px, max 400px width)
        const padding = 32; // 16px on each side
        const minWidth = 200;
        const maxWidth = 400;
        const calculatedWidth = Math.min(Math.max(textWidth + padding, minWidth), maxWidth);
        const height = 80;
        
        cursor.style.width = `${calculatedWidth}px`;
        cursor.style.height = `${height}px`;
        cursor.style.background = color;
        cursor.style.border = "none";
        cursor.style.borderRadius = "16px";
        cursor.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
        cursor.style.mixBlendMode = "normal";
        cursor.style.display = "flex";
        cursor.style.alignItems = "center";
        cursor.style.justifyContent = "center";

        mediaContainer.style.cssText =
          "width:100%;height:100%;border-radius:16px;display:flex;align-items:center;justify-content:center;padding:12px 16px;";

        const span = document.createElement("span");
        span.textContent = cardText;
        span.style.cssText =
          "color:#fff;font-size:13px;font-weight:700;letter-spacing:0.8px;text-align:center;pointer-events:none;text-transform:uppercase;line-height:1.2;white-space:nowrap;";
        mediaContainer.appendChild(span);
      } else if (type === "video" && src) {
        cursor.style.width = "200px";
        cursor.style.height = "200px";
        cursor.style.background = "transparent";
        cursor.style.border = "none";
        cursor.style.borderRadius = "50%";
        cursor.style.boxShadow = "none";
        cursor.style.mixBlendMode = "normal";
        cursor.style.display = "block";
        cursor.style.alignItems = "";
        cursor.style.justifyContent = "";

        mediaContainer.style.cssText = "width:100%;height:100%;border-radius:50%;display:block;";

        const video = document.createElement("video");
        video.src = src;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText =
          "width:100%;height:100%;object-fit:cover;border-radius:50%;";
        mediaContainer.appendChild(video);
      } else if (type === "image" && src) {
        cursor.style.width = "200px";
        cursor.style.height = "200px";
        cursor.style.background = "transparent";
        cursor.style.border = "none";
        cursor.style.borderRadius = "50%";
        cursor.style.boxShadow = "none";
        cursor.style.mixBlendMode = "normal";
        cursor.style.display = "block";
        cursor.style.alignItems = "";
        cursor.style.justifyContent = "";

        mediaContainer.style.cssText = "width:100%;height:100%;border-radius:50%;display:block;";

        const img = document.createElement("img");
        img.src = src;
        img.style.cssText =
          "width:100%;height:100%;object-fit:cover;border-radius:50%;";
        mediaContainer.appendChild(img);
      }
    };

    // ─── Animation loop ──────────────────────────────────────────────────────

    const animate = () => {
      currentX += (mouseX - currentX) * speed;
      currentY += (mouseY - currentY) * speed;

      const width = parseFloat(cursor.style.width) || 12;
      const height = parseFloat(cursor.style.height) || 12;
      cursor.style.transform = `translate3d(${currentX - width / 2}px, ${currentY - height / 2}px, 0)`;

      rafId = requestAnimationFrame(animate);
    };

    // ─── Helper: Check if cursor is over actual content (text/image) ────────
    //
    // For video/image types, only show cursor when hovering over actual content,
    // not whitespace/padding within the container.

    const isOverContent = (el: Element | null, target: HTMLElement | null): boolean => {
      if (!el || !target) return false;

      const type = (target.dataset.type || "").toLowerCase();

      // For video/image types, check if we're over actual content
      if (type === "video" || type === "image") {
        // If the element itself is the target (image container), it's content
        if (el === target) return true;

        // Check if we're over an image or video element directly
        if (el.tagName === "IMG" || el.tagName === "VIDEO") return true;

        // Check if we're over a content element (h1, h2, p, span, etc.)
        const contentElements = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "A", "BUTTON"];
        let current: Element | null = el;
        
        // Walk up the DOM tree to find content elements
        while (current && current !== target) {
          if (contentElements.includes(current.tagName)) {
            // For text elements, check if they have actual text content
            const text = current.textContent?.trim() || "";
            if (text.length > 0) {
              // Additional check: see if the element has visible text
              const rect = current.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                return true;
              }
            }
          }
          current = current.parentElement;
        }

        // Try to check if we're over a text node using caretRangeFromPoint (if available)
        if (typeof document.caretRangeFromPoint === "function") {
          try {
            const range = document.caretRangeFromPoint(mouseX, mouseY);
            if (range) {
              const textNode = range.startContainer;
              if (textNode.nodeType === Node.TEXT_NODE) {
                const text = textNode.textContent?.trim() || "";
                if (text.length > 0) return true;
              }
            }
          } catch (e) {
            // caretRangeFromPoint may fail in some cases, ignore
          }
        }

        // If we're inside the target but not over any content, it's whitespace
        return false;
      }

      // For button and card types, always show (no content check needed)
      if (type === "button" || type === "card") {
        return true;
      }

      return false;
    };

    // ─── Single mousemove handler — no mouseenter/mouseleave complexity ──────
    //
    // Using elementFromPoint on mousemove is simpler and more reliable than
    // capturing mouseenter/mouseleave: no bouncing, no debounce needed.

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Walk up from the element under the cursor to find a [data-type] ancestor
      const el = document.elementFromPoint(mouseX, mouseY);
      const target = el?.closest("[data-type]") as HTMLElement | null;

      // Skip elements that are excluded (e.g. buttons inside a video zone)
      const excluded = el?.closest("[data-cursor-exclude]");

      // If no target found, we're outside any interactive zone - show default
      if (!target) {
        if (activeTarget !== null) {
          activeTarget = null;
          showDefault();
        }
        return;
      }

      // If target is excluded, show default
      if (excluded) {
        if (activeTarget !== null) {
          activeTarget = null;
          showDefault();
        }
        return;
      }

      // Check if we're actually over content (not just whitespace)
      const overContent = isOverContent(el, target);

      // If we have a target and we're over content, show the cursor for that target
      if (overContent && target !== activeTarget) {
        activeTarget = target;
        showForTarget(target);
      } else if (!overContent && activeTarget !== null) {
        // Moved to whitespace within the target, show default
        activeTarget = null;
        showDefault();
      }
    };

    // ─── Bootstrap ──────────────────────────────────────────────────────────

    document.addEventListener("mousemove", onMouseMove);
    document.body.classList.add("has-advanced-cursor");
    animate();

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.classList.remove("has-advanced-cursor");
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="advanced-cursor"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "12px",
        height: "12px",
        background: "#000000",
        border: "none",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translate3d(0,0,0)",
        willChange: "transform",
        overflow: "hidden",
        transition:
          "width 0.3s ease, height 0.3s ease, background 0.3s ease, border 0.3s ease",
        boxShadow: "none",
        mixBlendMode: "normal",
      }}
    >
      <div
        ref={mediaRef}
        style={{ width: "100%", height: "100%", borderRadius: "50%" }}
      />
    </div>
  );
}
