// Saep: smooth scroll and one scroll-scrubbed moment (Balance, five tastes
// landing in the mortar). Motion is an enhancement: without JS, or with reduced
// motion, every page reads as plain content.

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
  gsap.utils.toArray(".intro-title, .after-title, [data-reveal]").forEach((heading) => {
    gsap.from(heading, {
      opacity: 0,
      y: 30,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: heading, start: "top 85%", once: true },
    });
  });

  // Webfonts change line heights, so measure again once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (!has(".balance")) return;

  // Balance. Timeline positions are fractions of the scroll track:
  // a short hold, then one taste every 0.14 (line lands, its photo wipes up
  // from below), then at 0.8 the plate arrives and the heading turns into the
  // closing line. The last stretch holds the plate.
  const tastes = gsap.utils.toArray(".taste");
  const shots = gsap.utils.toArray(".balance-shot");
  // Which photo each taste brings in. Salty and sweet share the mortar.
  const shotFor = [0, 1, 2, null, 3];
  const plate = shots[shots.length - 1];

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".balance", start: "top top", end: "bottom bottom", scrub: 0.6 },
  });

  tl.set(tastes, { opacity: 0.18 }, 0)
    .set(".taste-step", { opacity: 0 }, 0)
    .set(shots.slice(1), { clipPath: "inset(100% 0% 0% 0%)" }, 0)
    .set(".balance-finale", { opacity: 0, y: 30 }, 0)
    .fromTo(shots[0].querySelector("img"), { scale: 1.15 }, { scale: 1, duration: 0.2 }, 0);

  tastes.forEach((taste, i) => {
    const at = 0.06 + i * 0.14;
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

  // The plate, and the line the whole section has been walking towards.
  tl.to(plate, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.1, ease: "power2.inOut" }, 0.8)
    .fromTo(plate.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 0.2 }, 0.8)
    .to(tastes, { opacity: 0.45, duration: 0.06 }, 0.84)
    .to(".balance-title", { opacity: 0, y: -30, duration: 0.05 }, 0.82)
    .to(".balance-finale", { opacity: 1, y: 0, duration: 0.07, ease: "power2.out" }, 0.86)
    .to({}, { duration: 0.06 }, 0.94);
})();
