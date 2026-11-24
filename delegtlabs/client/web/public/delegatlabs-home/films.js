(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const hero = document.getElementById("studio-film");
  const heroButton = document.getElementById("film-control");
  const heroFile = heroButton.parentElement.querySelector(".film-file");
  const heroAction = heroButton.querySelector(".film-action");
  const preferAutoplay = () => !reducedMotion.matches && !navigator.connection?.saveData;
  let wantsAmbient = preferAutoplay();
  let heroVisible = false;
  let heroFailed = false;

  function pauseOtherFilms(active) {
    document.querySelectorAll("video").forEach(video => {
      if (video !== active && !video.paused) video.pause();
    });
  }

  function onMediaFailure(video, handler) {
    video.addEventListener("error", handler);
    // Browsers can report an exhausted source list on its last source alone.
    video.querySelector("source:last-of-type")?.addEventListener("error", handler);
  }

  function showHeroState(failed = false) {
    heroFailed = failed;
    const state = failed ? "error" : hero.paused ? "paused" : "playing";
    const action = failed ? "Retry" : hero.paused ? "Play" : "Pause";
    heroButton.dataset.state = state;
    heroAction.textContent = action + " film";
    heroButton.setAttribute("aria-label", action + " studio film");
    heroFile.hidden = !failed;
  }

  function startHero(explicit) {
    if (explicit && heroFailed) hero.load();
    hero.muted = true;
    hero.play().catch(error => {
      if (error.name === "AbortError") return;
      if (!explicit && error.name === "NotAllowedError") wantsAmbient = false;
      showHeroState(explicit || error.name !== "NotAllowedError");
    });
  }

  function syncAmbient() {
    if (!heroVisible || !wantsAmbient || document.hidden || document.querySelector("dialog[open]")) {
      hero.pause();
    } else if (!heroFailed && hero.paused && ![...document.querySelectorAll("studio-player video")].some(video => !video.paused)) {
      startHero(false);
    }
  }

  heroButton.addEventListener("click", () => {
    wantsAmbient = hero.paused || heroFailed;
    if (wantsAmbient) startHero(true);
    else hero.pause();
  });
  hero.addEventListener("playing", () => showHeroState());
  hero.addEventListener("pause", () => showHeroState(heroFailed));
  onMediaFailure(hero, () => showHeroState(true));
  heroButton.hidden = false;
  showHeroState();
  reducedMotion.addEventListener("change", () => { wantsAmbient = preferAutoplay(); syncAmbient(); });

  document.addEventListener("play", event => {
    if (event.target instanceof HTMLVideoElement) pauseOtherFilms(event.target);
  }, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseOtherFilms(null);
    else syncAmbient();
  });
  const dialogs = new MutationObserver(() => {
    const open = document.querySelector("dialog[open]");
    if (open) document.querySelectorAll("video").forEach(video => { if (!open.contains(video) && !video.paused) video.pause(); });
    syncAmbient();
  });
  document.querySelectorAll("dialog").forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ["open"] }));

  const visibility = window.IntersectionObserver && new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === hero) {
        heroVisible = entry.isIntersecting;
        syncAmbient();
      } else if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
    }
  });
  if (visibility) visibility.observe(hero);
  else { heroVisible = true; syncAmbient(); }

  const tools = document.getElementById("film-tools");
  const clock = seconds => Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");

  class StudioPlayer extends HTMLElement {
    connectedCallback() {
      if (!this.video) this.mount();
      visibility?.observe(this.video);
    }

    disconnectedCallback() {
      visibility?.unobserve(this.video);
      if (!this.video.paused) this.video.pause();
    }

    mount() {
      const video = this.querySelector("video");
      this.video = video;
      const title = video.getAttribute("aria-label");
      const cover = document.createElement("img");
      cover.className = "film-cover";
      cover.alt = "";
      cover.loading = "lazy";
      cover.decoding = "async";
      cover.src = video.poster;
      this.append(cover, tools.content.cloneNode(true));
      const button = this.querySelector(".film-hit");
      const command = this.querySelector(".film-command");
      const time = this.querySelector(".film-clock");
      const timeline = this.querySelector(".film-timeline");
      const seek = timeline.querySelector("input");
      const fill = timeline.querySelector("i");
      const expand = this.querySelector(".film-expand");
      const updateExpand = () => {
        const available = document.fullscreenEnabled || video.webkitSupportsFullscreen;
        expand.hidden = !this.hasAttribute("data-started") || !available || this.dataset.state === "error";
        expand.setAttribute("aria-label", (document.fullscreenElement === this ? "Exit full screen for " : "Full screen for ") + title);
      };
      expand.addEventListener("click", () => {
        if (document.fullscreenElement === this) document.exitFullscreen().catch(() => {});
        else if (document.fullscreenEnabled) this.requestFullscreen().catch(() => { if (video.webkitSupportsFullscreen) video.webkitEnterFullscreen(); });
        else if (video.webkitSupportsFullscreen) video.webkitEnterFullscreen();
      });
      this.addEventListener("fullscreenchange", updateExpand);
      const file = this.querySelector(".film-file");
      file.href = video.querySelector('source[type="video/mp4"]').src;
      file.setAttribute("aria-label", "Open " + title + " as an MP4");
      seek.setAttribute("aria-label", "Seek in " + title);

      const updateTime = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : Number(this.dataset.duration);
        const total = Math.ceil(duration);
        const elapsed = video.ended ? total : Math.floor(video.currentTime);
        const display = this.hasAttribute("data-started") ? clock(elapsed) + " / " + clock(total) : clock(total);
        if (time.textContent !== display) time.textContent = display;
        seek.max = duration;
        seek.value = video.currentTime;
        seek.setAttribute("aria-valuetext", elapsed + " of " + total + " seconds");
        fill.style.transform = "scaleX(" + Math.min(video.currentTime / duration, 1) + ")";
      };
      const setState = state => {
        this.dataset.state = state;
        const action = { idle: "Play", loading: "Cancel", playing: "Pause", paused: "Resume", ended: "Replay", error: "Retry" }[state];
        command.textContent = action + " film";
        button.setAttribute("aria-label", action + " " + title);
        file.hidden = state !== "error";
        timeline.hidden = !this.hasAttribute("data-started") || state === "error";
        updateExpand();
        updateTime();
      };
      button.addEventListener("click", () => {
        if (this.dataset.state === "error") video.load();
        else if (!video.paused && !video.ended) { video.pause(); return; }
        if (video.ended) video.currentTime = 0;
        setState("loading");
        video.play().catch(error => { if (error.name !== "AbortError") setState("error"); });
      });
      seek.addEventListener("input", () => {
        if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value);
        updateTime();
      });
      video.addEventListener("playing", () => { this.setAttribute("data-started", ""); setState("playing"); });
      video.addEventListener("pause", () => {
        if (!video.ended && this.dataset.state !== "error") setState(this.hasAttribute("data-started") ? "paused" : "idle");
      });
      video.addEventListener("ended", () => setState("ended"));
      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", updateTime);
      onMediaFailure(video, () => setState("error"));
      video.muted = true;
      video.controls = false;
      setState("idle");
    }
  }
  customElements.define("studio-player", StudioPlayer);
})();
