# tools

Throwaway-looking scripts that are actually load-bearing. The site is one static
HTML file with no build step, so none of this ships — it exists to *see* the page,
because a scroll-driven canvas page cannot be reviewed by reading its source.

Requires Node 22+ (for the global `WebSocket`) and Google Chrome. `photos.py`
additionally uses `sips` (built into macOS) and `cwebp` (`brew install webp`).
Run everything **from the project root**. Output goes to `tools/.out/`.

## Seeing the page

```bash
node tools/shots.mjs                      # sweep every section
node tools/shots.mjs "#menu" 0.1          # one section, one scroll position
node tools/shots.mjs "#wok" 0.85 390 844 2  # phone viewport at 2x
```

The second argument is how far through a section's **pinned scroll span** to sit:
`0` is its first frame, `1` its last, `0.5` the middle. That matters because most
sections fade their content in and out across the span — screenshot a chapter at
`0` or `1` and you correctly get a nearly black frame. The five tastes are
`.chapter:nth-of-type(3)` through `(7)`; `nth-of-type` counts every `<section>`,
not just chapters.

## Checking the drawings

```bash
node tools/proof.mjs
```

Renders every motif in `INGREDIENTS` at 760px on one sheet, using the same three
stroke passes the page uses, with a centre cross for judging placement. It slices
the geometry straight out of `index.html`, so the sheet cannot drift from reality.

**Run this after touching any drawing, and actually look at the result.** At the
size these appear on the page, a wrong drawing still reads as "some glowing line
art". Blown up, the mistakes are instant: the first chilli cluster read
unmistakably as a cannabis leaf, and the makrut lime leaf read as a fish
skeleton. Neither was visible in a page screenshot.

## Before shipping

```bash
node tools/errs.mjs           # desktop
node tools/errs.mjs 390 844   # phone
```

Scrolls the whole page in steps and checks console errors, uncaught exceptions,
horizontal overflow, and that `prefers-reduced-motion` still unpins everything.
Exits non-zero on failure, so it can gate a deploy.

## Replacing a dish photo

```bash
python3 tools/photos.py search "som tam papaya salad"
python3 tools/photos.py fetch "Som tam in Yasothon.jpg"
python3 tools/photos.py sheet     # then screenshot or open the sheet and choose
python3 tools/photos.py encode tools/.out/photos/som-tam-in-yasothon.jpg
```

`fetch` prints the credit string to put in the footer and records it in
`tools/.out/photos/credits.json`. `encode` writes a `.datauri.txt` to paste into
the matching `.dish-plate img` `src` in `index.html`.

Two rules learned the hard way:

1. **Look at every candidate before choosing.** Titles lie. Several
   plausible-sounding files were the wrong dish, or 60% tablecloth. A photo that
   fills the frame with food survives the circular crop; one of a plate on a
   table does not.
2. **Carry the licence.** Wikimedia Commons files are CC0/CC BY/CC BY-SA, which
   is why they're usable here at all — but BY and BY-SA oblige us to attribute.
   Update the footer credit line *and* the README in the same commit.
