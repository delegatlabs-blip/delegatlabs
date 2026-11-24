(() => {
  "use strict";
  const root = document.documentElement;
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const themeControl = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(preference) {
    const theme = preference || (prefersDark.matches ? "dark" : "light");
    root.dataset.preference = preference || "";
    root.dataset.theme = theme;
    themeControl.setAttribute("aria-pressed", String(theme === "dark"));
    themeControl.title = theme === "dark" ? "Use light theme" : "Use dark theme";
    themeMeta.content = theme === "dark" ? "#0b0f1b" : "#ffffff";
    document.dispatchEvent(new Event("appearancechange"));
  }
  applyTheme(root.dataset.preference);
  themeControl.hidden = false;
  themeControl.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    const preference = (theme === "dark") === prefersDark.matches ? "" : theme;
    applyTheme(preference);
    try {
      if (preference) localStorage.setItem("delegatlabs.appearance", preference);
      else localStorage.removeItem("delegatlabs.appearance");
    } catch { /* Keep the chosen theme in this tab. */ }
  });
  prefersDark.addEventListener("change", () => applyTheme(root.dataset.preference));
  window.addEventListener("storage", event => {
    if (event.key === "delegatlabs.appearance" || event.key === null) {
      applyTheme(["dark","light"].includes(event.newValue) ? event.newValue : "");
    }
  });

  const header = document.querySelector(".header");
  const menu = header.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-nav");
  const navLinks = [...nav.querySelectorAll("a")];
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
  const compact = matchMedia("(max-width: 680px)");
  function showMenu(open) {
    header.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
  }
  header.classList.add("enhanced");
  menu.hidden = false;
  menu.addEventListener("click", () => showMenu(!header.classList.contains("menu-open")));
  nav.addEventListener("click", () => showMenu(false));
  compact.addEventListener("change", () => showMenu(false));
  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) showMenu(false);
  });
  document.addEventListener("focusin", event => {
    if (!header.contains(event.target)) showMenu(false);
  });
  header.addEventListener("keydown", event => {
    if (event.key === "Escape" && header.classList.contains("menu-open")) {
      showMenu(false);
      menu.focus();
    }
  });

  let ranges = [];
  let marker = 0;
  let active = -1;
  let scrollFrame = 0;
  function updateNav() {
    scrollFrame = 0;
    const y = window.scrollY;
    header.classList.toggle("raised", y > 6);
    const index = ranges.findIndex(([top, bottom]) => y + marker >= top && y + marker < bottom);
    if (index === active) return;
    active = index;
    navLinks.forEach((link, i) => {
      if (i === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function measureSections() {
    const y = window.scrollY;
    marker = header.offsetHeight + Math.min(innerHeight * .22, 152);
    ranges = sections.map(section => {
      const box = section.getBoundingClientRect();
      return [box.top + y, box.bottom + y];
    });
    updateNav();
  }
  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNav);
  }, {passive: true});
  window.addEventListener("resize", measureSections);
  if (window.ResizeObserver) {
    const geometry = new ResizeObserver(measureSections);
    [header, document.querySelector("main"), ...sections].forEach(el => geometry.observe(el));
  }
  measureSections();

  if (window.IntersectionObserver) {
    const reveal = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        reveal.unobserve(target);
        if (!reducedMotion.matches) target.classList.add("in-view");
      }
    }, {threshold: .12});
    document.querySelectorAll(".project-card, .section-copy, .steps li").forEach(el => reveal.observe(el));
  }
})();
