# Saep — Fire Kitchen

A scroll-driven site for **Saep**, a (fictional) Thai fire kitchen on Jægersborggade in
Nørrebro, Copenhagen. Built as a portfolio piece.

The brief was an award-site-calibre restaurant page where scrolling *is* the content —
not decoration on top of it.

## The idea

Thai cooking balances five tastes, and no dish tastes of one thing. So the page is a
**descent through the five tastes**, one chapter at a time:

| | Taste | Ingredient drawn | Accent |
|---|---|---|---|
| 01 | เผ็ด · *phet* — spicy | bird's eye chilli | `#FF3D17` chilli |
| 02 | เปรี้ยว · *priao* — sour | makrut lime leaf | `#C8E85A` young lime |
| 03 | เค็ม · *khem* — salty | the anchovies behind nam pla | `#86AEBE` brine |
| 04 | หวาน · *waan* — sweet | sugar-palm frond | `#E0913F` palm sugar |
| 05 | หอม · *hom* — aromatic | lemongrass + galangal | `#8877E6` dusk |

Each chapter pins for a full viewport while its ingredient **draws itself** in that
taste's colour, then all five converge into a balance wheel — the bowl you have just
walked through. After that: the 220°C wok, the menu, a heat control, the room, the table.

The page's accent colour is a single live variable that lerps between chapters, so the
whole room changes temperature as you descend — cool brine in the middle, violet at
dusk, back to ember for the booking.

## How it's built

One HTML file, **no frameworks and no libraries.** The eight dish photographs are
embedded as WebP data URIs; every other mark on the page is drawn in code.

- **Scroll engine** — one `requestAnimationFrame` loop writes a `0→1` progress value per
  section as a CSS custom property (`--p`). All layout motion is then plain CSS `calc()`
  off that one number: no per-element JS style writes, no scroll listeners.
- **Ingredients** — drawn procedurally on canvas from sampled bézier polylines. Progress
  controls how much of the stroke set is drawn, which is what produces the
  drawing-itself effect. Glow is layered strokes, not `shadowBlur` (which drops frames).
- **Colour** — five taste accents as RGB triples, lerped per frame into `--flavor`.
  Canvas repaints when the accent is still travelling, so a drawing never keeps the
  previous chapter's colour.
- **Menu** — vertical scroll drives horizontal travel; collapses to a stack under 860px.
  Each plate is the dish itself: a photograph sunk into the room behind a vignette,
  with the kitchen's heat rating drawn around the rim as a gauge arc — one fifth of
  the circle per chilli. It brightens and pushes in on hover.
- **Ornament** — a *lai krajang* border, the lotus-bud row that runs along temple
  eaves and the rim of an enamel som tam tray, drawn procedurally as the one divider
  on the page.
- **Accessibility** — `prefers-reduced-motion` unpins every section, disables the
  ambient canvas, and renders each chapter in its finished state. Visible focus rings,
  skip link, labelled fields, no keyboard traps.

## Type

- **Charm** — Thai display. Looped, calligraphic; the reason the Thai words carry the page.
- **Fraunces** — Latin display, used at extremes of size.
- **Instrument Sans** — body.
- **Martian Mono** — labels, prices, data.

Deliberately single-theme: this page is a night kitchen, so there is no light variant.
Every colour is painted explicitly rather than inherited.

## Run it

```
open index.html
```

No build step, no dependencies.

## Photo credits

Dish photographs via Wikimedia Commons, under their own licences — tom yam kung:
Vee Satayamas (CC BY 2.0) · som tam, Yasothon: Dragfyre (CC BY-SA 3.0) ·
larb ped, khao soi kai, kaeng khiao wan, pla thot: Takeaway (CC BY-SA) · phat kaphrao: PattayaPatrol
(CC BY-SA 4.0) · khao niao mamuang: Arthur Taksin (CC BY 4.0). Each is resized and
re-encoded as WebP; attribution also appears in the page footer.

## Note

Saep is invented. The chef, the address, the suppliers and the prices are written to feel
real, but no such restaurant exists — it's a design showcase. The reservation form
confirms in-page and sends nothing.
