(() => {
  "use strict";
  const homeTitle = document.title;
  const cards = [...document.querySelectorAll(".case-card")];
  const reader = document.getElementById("case-study");
  const planner = document.getElementById("brief");
  const form = document.getElementById("brief-form");
  const interest = document.getElementById("interest");
  const task = document.getElementById("task");
  const decision = document.getElementById("decision");
  const status = document.getElementById("brief-status");
  const manualCopy = document.getElementById("manual-copy");
  let currentCard = null;
  let entryCard = null;
  let pendingBrief = null;
  let returning = false;
  let edited = false;
  let plannerTrigger = null;

  function openPlanner(trigger, record) {
    plannerTrigger = trigger;
    status.textContent = "";
    manualCopy.hidden = true;
    if (record && !edited) {
      interest.value = record.dataset.interest;
      task.value = record.dataset.task;
      decision.value = record.dataset.decision;
    } else if (record) {
      status.textContent = "Your in-progress brief is open.";
    } else if (trigger.dataset.interest) {
      interest.value = trigger.dataset.interest;
    }
    task.setCustomValidity("");
    planner.showModal();
    const focusTarget = matchMedia("(pointer: coarse)").matches ? document.getElementById("brief-title") : task;
    focusTarget.focus({preventScroll:true});
  }
  document.querySelectorAll(".project-link, #brief-open").forEach(trigger => {
    trigger.addEventListener("click", event => {
      event.preventDefault();
      openPlanner(trigger);
    });
  });
  document.getElementById("brief-close").addEventListener("click", () => planner.close());
  planner.addEventListener("close", () => {
    if (!reader.open && !planner.open) plannerTrigger?.focus({preventScroll:true});
  });
  form.addEventListener("input", () => {
    edited = true;
    task.setCustomValidity("");
    status.textContent = "";
    manualCopy.hidden = true;
  });

  function briefText() {
    task.setCustomValidity(task.value.trim() ? "" : "Describe the task you would like to improve.");
    if (!form.reportValidity()) return null;
    return ["Delegatlabs.AI — Project brief", "", "Area of interest", interest.value,
      "", "What we want to improve", task.value.trim(),
      "", "What a person should review", decision.value.trim() || "To discuss"].join("\n");
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = briefText();
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "delegatlabs-project-brief.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1500);
    status.textContent = "Your brief is ready to save.";
  });
  document.getElementById("copy-brief").addEventListener("click", async () => {
    const text = briefText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      manualCopy.hidden = true;
      status.textContent = "Brief copied to clipboard.";
    } catch {
      const field = document.getElementById("copy-text");
      field.value = text;
      manualCopy.hidden = false;
      field.focus();
      field.select();
      status.textContent = "The brief is selected. Use your device’s Copy command.";
    }
  });

  function changeArtwork(art, direction) {
    const frame = document.getElementById("reader-art");
    frame.querySelector(".leaving-art")?.remove();
    const previous = frame.firstElementChild;
    const oldVideo = previous?.querySelector("video");
    if (oldVideo && !oldVideo.paused) oldVideo.pause();
    if (!previous || !direction || !previous.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.replaceChildren(art);
      return;
    }
    previous.inert = true;
    previous.setAttribute("aria-hidden", "true");
    previous.classList.add("leaving-art");
    frame.prepend(art);
    const timing = {duration: 240, easing: "cubic-bezier(.22,.72,.22,1)"};
    art.animate([{transform: `translateX(${direction * 8}px)`}, {transform: "none"}], timing);
    const dissolve = previous.animate([{opacity: 1}, {opacity: 0, transform: `translateX(${-direction * 6}px)`}], timing);
    dissolve.onfinish = () => previous.remove();
  }

  const stages = [...document.querySelectorAll(".workflow-stages button")];
  const stageCopy = [
    document.getElementById("stage-copy").textContent,
    "The agent prepares a draft asking for feedback on the two profiles and whether the client wants to arrange interviews.",
    "A manager checks the wording. The recruiter checks for a recent reply and decides whether to send."
  ];
  stages.forEach((button, index) => button.addEventListener("click", () => {
    stages.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    document.getElementById("stage-copy").textContent = stageCopy[index];
    document.querySelector(".walkthrough .draft-note b").textContent = ["Awaiting feedback", "Draft prepared", "Ready for review"][index];
  }));
  document.querySelector(".walkthrough .draft-note b").textContent = "Awaiting feedback";

  function rememberPosition() {
    const film = reader.querySelector("#reader-art > :first-child video");
    const galleryFilm = currentCard?.closest(".project-card").querySelector("video");
    if (film?.readyState && galleryFilm) galleryFilm.currentTime = film.currentTime;
  }
  function showStudy(card, direction) {
    const record = document.getElementById(card.hash.slice(1));
    rememberPosition();
    const original = card.closest(".project-card").querySelector(".artboard");
    const video = original.querySelector("video");
    let art;
    if (video) {
      art = document.createElement("studio-player");
      art.className = "artboard";
      art.dataset.duration = original.dataset.duration;
      const copy = video.cloneNode(true);
      const position = video.currentTime;
      if (position) copy.currentTime = position;
      copy.controls = true;
      art.append(copy);
    } else {
      art = original.cloneNode(true);
    }
    const title = record.querySelector(".record-name").cloneNode(true);
    title.id = "reader-title";
    title.tabIndex = -1;
    document.title = title.textContent + " — Delegatlabs.AI";
    changeArtwork(art, direction);
    document.getElementById("reader-content").replaceChildren(
      title, record.querySelector(".record-deck").cloneNode(true), record.querySelector(".study-fields").cloneNode(true), record.querySelector(".study-example").cloneNode(true)
    );
    document.getElementById("example-type").textContent = card.querySelector(".case-kind").textContent;
    if (planner.open) planner.close();
    document.getElementById("study-position").textContent = (cards.indexOf(card) + 1) + " / " + cards.length;
    const actions = {recruitment:"Plan a follow-up workflow", legal:"Plan a drafting workflow", intake:"Plan an enquiry workflow", linkedin:"Plan a LinkedIn workflow"};
    document.getElementById("study-brief").firstChild.textContent = actions[card.dataset.example] + " ";
    currentCard = card;
    if (!reader.open) {
      entryCard = card;
      reader.showModal();
    } else {
      title.focus({preventScroll:true});
    }
    reader.querySelector(".reader-scroll").scrollTop = 0;
  }
  function syncStudy(direction = 0) {
    const card = cards.find(item => item.hash === location.hash);
    returning = false;
    if (card) {
      pendingBrief = null;
      if (card !== currentCard || !reader.open) showStudy(card, direction);
      return;
    }
    if (!reader.open) return;
    document.title = homeTitle;
    const trigger = entryCard;
    const record = pendingBrief;
    reader.querySelector("video")?.pause();
    rememberPosition();
    reader.close();
    currentCard = entryCard = pendingBrief = null;
    if (record) openPlanner(trigger,record);
    else trigger.focus({preventScroll:true});
  }
  function exitStudy(startBrief) {
    if (returning || !currentCard) return;
    returning = true;
    if (startBrief) pendingBrief = document.getElementById(currentCard.hash.slice(1));
    if (history.state?.delegatlabsStudy && history.length > 1) {
      history.back();
    } else {
      // An external deep link opens directly on the study. Close into its gallery.
      history.replaceState(history.state,"","#work");
      entryCard.scrollIntoView({block:"center",behavior:"instant"});
      syncStudy();
    }
  }
  cards.forEach(card => card.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const open = () => {
      history.pushState({...history.state,delegatlabsStudy:true},"",card.hash);
      syncStudy();
    };
    if (!document.startViewTransition || !matchMedia("(min-width: 681px) and (prefers-reduced-motion: no-preference)").matches) {
      open();
      return;
    }
    const source = card.closest(".project-card").querySelector(".artboard");
    source.style.viewTransitionName = "study-frame";
    const transition = document.startViewTransition(() => {
      source.style.viewTransitionName = "";
      open();
      document.querySelector("#reader-art > :first-child").style.viewTransitionName = "study-frame";
    });
    transition.finished.finally(() => {
      source.style.viewTransitionName = "";
      document.querySelectorAll("#reader-art > *").forEach(item => item.style.viewTransitionName = "");
    });
  }));
  document.getElementById("case-close").addEventListener("click", () => exitStudy(false));
  reader.addEventListener("cancel", event => { event.preventDefault(); exitStudy(false); });
  document.getElementById("study-brief").addEventListener("click", () => exitStudy(true));
  function moveStudy(direction) {
    if (returning || !currentCard) return;
    const index = (cards.indexOf(currentCard) + direction + cards.length) % cards.length;
    history.replaceState(history.state, "", cards[index].hash);
    syncStudy(direction);
  }
  document.getElementById("next-study").addEventListener("click", () => moveStudy(1));
  document.getElementById("prev-study").addEventListener("click", () => moveStudy(-1));
  window.addEventListener("hashchange", () => syncStudy());
  window.addEventListener("popstate", () => syncStudy());
  document.querySelector(".study-records").hidden = true;
  syncStudy();

  function closeOnBackdrop(dialog,close) {
    let onBackdrop = false;
    function outside(event) {
      const box = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom);
    }
    dialog.addEventListener("pointerdown", event => { onBackdrop = outside(event); });
    dialog.addEventListener("click", event => {
      if (onBackdrop && outside(event)) close();
      onBackdrop = false;
    });
  }
  closeOnBackdrop(reader,() => exitStudy(false));
  closeOnBackdrop(planner,() => planner.close());

  document.getElementById("email-brief").addEventListener("click", () => {
    const text = briefText();
    if (!text) return;
    const email = document.getElementById("project-email").href;
    location.href = email + "?subject=" + encodeURIComponent("Delegatlabs.AI project enquiry") +
      "&body=" + encodeURIComponent(text);
  });
})();
