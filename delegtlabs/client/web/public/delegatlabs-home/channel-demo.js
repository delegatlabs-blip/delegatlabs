(() => {
  "use strict";

  const decisions = {
    whatsapp: [
      {
        action: "Ask for a time",
        result: "Draft reply",
        sample: "“What time on Friday afternoon would suit you?”",
        review: "Reception approves the wording.",
        task: "Draft a WhatsApp follow-up when a visit request is missing a time.",
        decision: "Reception checks the requested date and approves the wording before sending."
      },
      {
        action: "Check the diary",
        result: "Reception task",
        sample: "Check Friday between 12 and 5. Return two available visit times.",
        review: "Reception confirms the slots before offering them.",
        task: "Route WhatsApp visit requests to reception for an availability check.",
        decision: "Reception confirms the available slots before offering a customer a visit."
      }
    ],
    instagram: [
      {
        action: "Ask for size",
        result: "Draft DM",
        sample: "“Which size would you like in the olive linen shirt?”",
        review: "The shop team checks the item before replying.",
        task: "Prepare Instagram DMs that clarify a shopper’s preferred product size.",
        decision: "Our shop team checks the item and approves the reply."
      },
      {
        action: "Check stock",
        result: "Stock check",
        sample: "Olive linen shirt · Check which sizes are available in store today.",
        review: "The stock lead verifies availability before a reply.",
        task: "Turn Instagram product enquiries into stock checks for our shop team.",
        decision: "The stock lead confirms current availability before a reply goes out."
      }
    ],
    facebook: [
      {
        action: "Ask the venue",
        result: "Venue task",
        sample: "Confirm step-free access from the street to the workshop room.",
        review: "The venue lead verifies the route.",
        task: "Route Facebook Page accessibility questions to the person who knows the venue.",
        decision: "The venue lead verifies the accessible route before we publish a reply."
      },
      {
        action: "Draft a reply",
        result: "Public reply draft",
        sample: "“Thanks for asking. We’ll check the entrance with the venue and follow up here.”",
        review: "The Page manager approves the public reply.",
        task: "Draft acknowledgements for Facebook Page enquiries while the team checks details.",
        decision: "Our Page manager approves the wording and assigns someone to follow up."
      }
    ]
  };

  for (const [channel, choices] of Object.entries(decisions)) {
    const panel = document.getElementById("panel-" + channel);
    const brief = panel?.querySelector(".channel-description .project-link");
    if (!brief) continue;
    const demo = document.createElement("div");
    demo.className = "channel-decision";
    demo.innerHTML = `<fieldset><legend>What should the agent do?</legend><div class="decision-options"></div></fieldset>
      <div class="decision-response" aria-live="polite" aria-atomic="true"><span class="decision-kind"></span>
      <p class="decision-sample"></p><small class="decision-owner"></small></div>`;
    const options = demo.querySelector(".decision-options");
    const response = demo.querySelector(".decision-response");
    const kind = response.querySelector(".decision-kind");
    const sample = response.querySelector(".decision-sample");
    const owner = response.querySelector(".decision-owner");
    let animation;
    function update(choice, animate) {
      kind.textContent = choice.result;
      sample.textContent = choice.sample;
      owner.textContent = choice.review;
      brief.dataset.task = choice.task;
      brief.dataset.decision = choice.decision;
      if (animate && response.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animation?.cancel();
        animation = response.animate(
          [{ opacity: .55, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }],
          { duration: 180, easing: "ease-out" }
        );
      }
    }
    choices.forEach((choice, index) => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "decision-" + channel;
      radio.checked = index === 0;
      radio.addEventListener("change", () => update(choice, true));
      label.append(radio, document.createTextNode(choice.action));
      options.append(label);
    });
    update(choices[0], false);
    brief.before(demo);
  }
})();
