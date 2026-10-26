// Saep: the booking form, smooth scroll, and one scroll-scrubbed moment
// (Balance, five tastes landing in the mortar). Motion is an enhancement:
// without JS, or with reduced motion, every page reads as plain content.

// ---------- Booking (runs with or without motion) ----------
(() => {
  const form = document.querySelector(".booking-form");
  if (!form) return;

  const MENU = 1450;
  const date = form.querySelector("#date");
  const seatsHint = form.querySelector("[data-seats]");
  const guests = form.querySelectorAll('input[name="guests"]');
  const summary = document.querySelector("[data-summary]");
  const total = document.querySelector("[data-total]");
  const error = form.querySelector("[data-error]");
  const kr = new Intl.NumberFormat("en-GB");
  const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  // Bookable: from today (local, so late evening still means today) to the end of next month.
  const now = new Date();
  date.min = iso(now);
  date.max = iso(new Date(now.getFullYear(), now.getMonth() + 2, 0));

  const chosen = (name) => form.querySelector(`input[name="${name}"]:checked`);

  // Seats left on a night. There is no backend, so it is made up but stable:
  // the same date always gives the same answer. Closed Sunday to Tuesday.
  function seatsLeft(value) {
    if (!value) return null;
    const day = new Date(`${value}T12:00`).getDay();
    if (day < 3) return -1;
    const hash = [...value].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 997, 7);
    return [6, 4, 2, 6, 3, 0, 5][hash % 7];
  }

  function syncSeats() {
    const seats = seatsLeft(date.value);
    const outOfRange = date.value && (date.value < date.min || date.value > date.max);
    seatsHint.classList.toggle("is-full", seats === -1 || seats === 0 || Boolean(outOfRange));
    if (!date.value) seatsHint.textContent = "Wednesday to Saturday, up to the end of next month.";
    else if (outOfRange) seatsHint.textContent = "We take bookings from today until the end of next month.";
    else if (seats === -1) seatsHint.textContent = "We cook Wednesday to Saturday. Pick another night.";
    else if (seats === 0) seatsHint.textContent = "That night is full. Try another.";
    else seatsHint.textContent = `${seats} of 6 seats left that night.`;

    // Only as many guests as there are seats; step down if the choice no longer fits.
    const limit = seats > 0 && !outOfRange ? seats : 6;
    guests.forEach((input) => {
      input.disabled = Number(input.value) > limit;
    });
    if (chosen("guests")?.disabled) guests[limit - 1].checked = true;
  }

  function update() {
    const count = Number(chosen("guests").value);
    const pairing = chosen("pairing");
    total.textContent = kr.format((MENU + Number(pairing.dataset.price)) * count);

    const parts = [];
    if (date.value) parts.push(dayFormat.format(new Date(`${date.value}T12:00`)), "19:00");
    parts.push(`${count} ${count === 1 ? "guest" : "guests"}`);
    if (pairing.value !== "none") parts.push(pairing.closest("label").querySelector(".choice-name").textContent.toLowerCase());
    summary.textContent = parts.join(" · ");
  }

  form.addEventListener("change", (event) => {
    if (event.target === date) syncSeats();
    event.target.removeAttribute("aria-invalid");
    error.hidden = true;
    update();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const missing = [];
    const seats = seatsLeft(date.value);
    const dateOk = date.value && date.value >= date.min && date.value <= date.max && seats > 0;
    if (!dateOk) missing.push("a night we have seats");
    date.setAttribute("aria-invalid", String(!dateOk));
    for (const field of form.querySelectorAll("#name, #email")) {
      const ok = field.checkValidity() && field.value.trim();
      field.setAttribute("aria-invalid", String(!ok));
      if (!ok) missing.push(field.id === "email" ? "a valid email" : "your name");
    }

    if (missing.length) {
      error.textContent = `Almost there. Please add ${missing.join(", ")}.`;
      error.hidden = false;
      return;
    }

    const confirmation = document.querySelector("[data-confirmation]");
    const name = form.querySelector("#name").value.trim().split(" ")[0];
    confirmation.querySelector("[data-confirmation-title]").textContent = `Thank you, ${name}.`;
    confirmation.querySelector("[data-confirmation-text]").textContent =
      `${summary.textContent}. ${total.textContent} kr, paid on the night. We would email you to confirm within a day.`;
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector("[data-confirmation-title]").focus();
  });

  syncSeats();
  update();
})();

// ---------- Motion ----------
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");
  const has = (selector) => document.querySelector(selector) !== null;

  // Lenis owns the scroll; ScrollTrigger reads the same position on every frame.
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Same-page links glide too. The skip link keeps the native jump, so focus moves with it.
    document.querySelectorAll('a[href^="#"]:not(.skip)').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      });
    });
  }

  // Hero: the photo drifts a little slower than the page.
  if (has(".hero-media img")) {
    gsap.to(".hero-media img", {
      yPercent: 8,
      scale: 1.06,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  // Headings settle into place as they arrive.
  gsap.utils.toArray(".intro-title, [data-reveal]").forEach((heading) => {
    gsap.from(heading, {
      opacity: 0,
      y: 30,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: heading, start: "top 85%", once: true },
    });
  });

  // Big photos settle into their frames.
  gsap.utils.toArray(".chef-media img, .room-media img, .band img").forEach((image) => {
    gsap.fromTo(
      image,
      { scale: 1.15 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: image.closest("figure"), start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  // Webfonts change line heights, so measure again once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (!has(".balance")) return;

  // Balance. Timeline positions are fractions of the scroll track:
  // a short hold, then one taste every 0.13 (line lands, its photo wipes up
  // from below). At 0.72 the plate wipes into the frame, at 0.82 it grows to
  // fill the whole stage, and the closing line comes up over it. The last
  // stretch holds the plate.
  const stage = document.querySelector(".balance-stage");
  const frame = document.querySelector(".balance-frame");
  const plate = document.querySelector(".balance-plate");
  const tastes = gsap.utils.toArray(".taste");
  const shots = gsap.utils.toArray(".balance-shot");
  // Which photo each taste brings in. Salty and sweet share the mortar.
  const shotFor = [0, 1, 2, null, 3];

  // Where the frame sits inside the stage, so the plate can start exactly on top of it.
  const slot = () => {
    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    return { left: f.left - s.left, top: f.top - s.top, width: f.width, height: f.height };
  };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".balance",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  tl.set(tastes, { opacity: 0.18 }, 0)
    .set(".taste-step", { opacity: 0 }, 0)
    .set(shots.slice(1), { clipPath: "inset(100% 0% 0% 0%)" }, 0)
    .set(".balance-finale", { opacity: 0, y: 30 }, 0)
    .set(
      plate,
      {
        left: () => slot().left,
        top: () => slot().top,
        width: () => slot().width,
        height: () => slot().height,
        clipPath: "inset(100% 0% 0% 0%)",
        "--scrim": 0,
      },
      0,
    )
    .fromTo(shots[0].querySelector("img"), { scale: 1.15 }, { scale: 1, duration: 0.2 }, 0);

  tastes.forEach((taste, i) => {
    const at = 0.06 + i * 0.13;
    tl.to(taste, { opacity: 1, duration: 0.05 }, at)
      .fromTo(taste.querySelector(".taste-th"), { y: 24 }, { y: 0, duration: 0.07, ease: "power2.out" }, at)
      .to(taste.querySelector(".taste-step"), { opacity: 1, duration: 0.06 }, at + 0.02)
      .fromTo(taste, { "--drawn": 0 }, { "--drawn": 1, duration: 0.08 }, at);

    const shot = shotFor[i] === null ? null : shots[shotFor[i]];
    if (shot && i > 0) {
      tl.to(shot, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08, ease: "power2.inOut" }, at)
        .fromTo(shot.querySelector("img"), { scale: 1.2 }, { scale: 1, duration: 0.16 }, at);
    }
  });

  // The plate lands in the frame, then takes over the whole stage.
  tl.to(plate, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.08, ease: "power2.inOut" }, 0.72)
    .fromTo(plate.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 0.2 }, 0.72)
    .to(
      plate,
      {
        left: 0,
        top: 0,
        width: () => stage.clientWidth,
        height: () => stage.clientHeight,
        duration: 0.1,
        ease: "power2.inOut",
      },
      0.82,
    )
    .to(plate, { "--scrim": 1, duration: 0.06 }, 0.86)
    .to(".balance-finale", { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.88)
    .to({}, { duration: 0.06 }, 0.94);
})();
