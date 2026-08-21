# Handoff — next session

Written 21 Aug 2026, at the end of the design session. The site is **finished and
signed off**. The next phase is shipping it.

## Goal for next session

1. `git init`, first commit, push to GitHub.
2. Deploy on Vercel or Netlify.
3. Use the deploy link as a case study in Ice's portfolio site.

## What you're starting from

```
saep-fire-kitchen/
├── index.html      the entire site — ~520KB, self-contained, no build step
├── README.md       concept, palette, type, technique, photo credits
├── HANDOFF.md      this file
└── tools/          how to see and verify the page (tools/README.md)
```

`index.html` is the whole product. It has no dependencies except Google Fonts
(four families) and needs no bundler, transpiler or framework. Opening the file
in a browser *is* running it — which also means deployment is just "serve this
directory".

## Deploy notes

- **Static, single file.** No build command, no output directory. On Vercel or
  Netlify: framework preset "Other", build command empty, publish directory `.`.
- **Google Fonts is the one external request.** Charm (Thai display), Fraunces
  (Latin display), Instrument Sans (body), Martian Mono (data). If the fonts are
  ever blocked the page still works, but Charm carries a lot of the identity —
  self-hosting the four families is the obvious hardening step, and would also
  kill the only third-party request on the page.
- **Verify before you push:** `node tools/errs.mjs` and again with `390 844`.
  Exits non-zero if the console is dirty, the page scrolls sideways, or
  reduced-motion stops unpinning.
- **`.gitignore` already excludes `tools/.out/`** — screenshots and downloaded
  photo candidates, none of which belong in the repo.

## Two obligations that must survive the move

1. **Saep is fictional.** Invented restaurant, invented chef ("Napat 'Nok'
   Thongchai"), invented address on a real street. The footer says so explicitly.
   Keep that disclosure on any deployed copy and in the case study — a portfolio
   piece that reads as a real business's site is a different thing entirely.
2. **The eight dish photographs are other people's work.** Wikimedia Commons,
   CC0 / CC BY / CC BY-SA. Attribution is in the page footer and README. CC BY-SA
   is share-alike: if you fork the photos into new material, that material
   inherits the licence. Do not strip the credit line to tidy the footer.

## Already published as an Artifact

<https://claude.ai/code/artifact/4476259e-67d7-4657-86ae-c8d79bd1fca1>

To update it from a new session, pass that URL to the Artifact tool as `url`.
Publishing the same file without it creates a *separate* artifact on a new URL.
The artifact body is `index.html` minus the `<!DOCTYPE>/<html>/<head>/<body>`
wrapper and the charset/viewport/description metas — the host supplies those.
Keep the `<title>` and the fonts `<link>`. Favicon: 🌶️

## Open nits, in the order I'd fix them

Nothing here is a defect. These are the things I'd still change:

1. **Menu section whitespace.** The gap between the "The list" header and the
   card row is looser than the rest of the page. Tighten `.menu-head` padding or
   let the viewport centre the track more aggressively.
2. **Self-host the fonts.** See above — removes the last external dependency.
3. **The fixed HUD overlaps flowing sections.** `#room`'s heading passes under
   the top-left wordmark. There's a scrim behind the HUD so it reads as layering
   rather than collision, which is a deliberate compromise, not a fix.
4. **`phat kaphrao` photo crop.** Sits at `--pos:70% 62%` to favour the basil
   stir-fry over the rice. Defensible, slightly arbitrary.
5. **Som tam photo.** On the third pick — "Som tam in Yasothon" (Dragfyre,
   CC BY-SA 3.0), chosen for warmth and street feel over a tighter but cooler
   alternative. Settled; noting it only so the history isn't lost.

## Things worth knowing before you edit

- **The scroll engine writes one number.** A `requestAnimationFrame` loop sets
  `--p` (0→1) per tracked section; every bit of motion is CSS `calc()` off that.
  If you add a pinned section, give it `data-track` and a `.pin` child.
- **`--flavor` is lerped per frame**, not switched. Canvas repaints while the
  accent is still travelling — without that, a chapter's drawing keeps the
  previous chapter's colour when scrolling stops. That bug is easy to reintroduce.
- **Single-theme by choice.** This page is a night kitchen; there is no light
  variant and no `prefers-color-scheme` block. Every colour is painted explicitly
  so it holds on any host background. Don't "add dark mode support" — it's
  already the only mode.
- **Ingredient drawings are procedural**, in the `INGREDIENTS` object. Change one
  and run `node tools/proof.mjs`, then *look at the sheet*.
