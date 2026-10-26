# Saep

A website for a Thai chef's table in Nørrebro that does not exist. Six seats at the counter, one seating a
night, twelve courses. It is a design concept, built to show what an editorial site with one strong scroll
moment can do for a small restaurant.

**Live:** <https://saep-fire-kitchen.netlify.app>

## What it is

Four pages:

- **Home.** The hero, the kitchen in one sentence, and the signature moment: **Balance**. A sticky stage
  shows how a som tam is made. As you scroll, the five Thai tastes land one at a time (spicy, sour, salty,
  sweet, fragrant) while the photo moves from chilli to lime to the mortar to the herbs. Then the plate
  lands in the frame, grows to fill the screen, and the closing line comes up over it. After that: four
  courses from tonight's menu, the chef, the counter, and a way to book.
- **Menu** (`menu.html`). The twelve courses, the pairings and the notes on allergies and heat.
- **Visit** (`visit.html`). Address, getting there, the seating, access and house rules.
- **Book** (`book.html`). A working booking form. It knows the kitchen cooks Wednesday to Saturday, that
  bookings run to the end of next month, and how many seats are left on a night (made up, but the same
  date always gives the same answer). A summary totals the price as you choose. It sends nothing and says so.

## Stack

- Plain HTML, CSS and JavaScript. No framework, no bundler, no `npm install`.
- **GSAP 3.12.5** with **ScrollTrigger** for the scrubbed timeline, and **Lenis 1.1.13** for smooth scroll,
  both from a CDN.
- **Fraunces**, **Instrument Sans** and the Thai glyphs of **Charm**, self-hosted in `assets/fonts`.
- Photos in `assets/img` as AVIF and WebP at 640, 1280 and 1920 px wide.

Each page's own code (HTML, CSS and JS together) is 12 to 14 KB gzipped.

## Running it

Any static server works; there is nothing to compile.

```sh
python3 -m http.server 3000
```

Then open <http://127.0.0.1:3000>.

## Adding a photo

```sh
sh tools/images.sh ~/Downloads/photo.jpg name
```

This writes `assets/img/name-{640,1280,1920}.{avif,webp}`. It needs `ffmpeg` with SVT-AV1 and `cwebp` (both
from Homebrew). Commit the output, so the site stays build-free.

## Notes

- **Motion is an extra.** Without JavaScript, or with reduced motion turned on, nothing pins or scrubs.
  Balance reads as a plain recipe with the finished plate, and the booking form still works.
- **The hero entrance is pure CSS**, so it never waits on the CDN. There is no loader.
- **Pages change with a native cross-document view transition.** Browsers without support just load the
  next page.
- **One palette, light paper.** Rice paper, char, chilli and a rare lime. The counter section and the footer
  are the only dark parts.

## Credits

Photos from Unsplash: Derek Lee (kitchen), Ratchanon Phalamkon (chilli), Sri Widosari (makrut lime),
Katherine Hanlon (mortar), Chandan Chaurasia (basil), Sirasit Gullasu (som tam), Alfonso Betancourt (plating),
Meg von Haartman (counter), Madeline Liu (prawn, the pass), Nick Karvounis (broth), Alexandra Tran (larb),
Antonio Araujo (scallop), emy (curry), Markus Winkler (mango), Iuliia Dutchak (street).

The restaurant, the chef and the menu are invented. The first version of Saep, a single-file canvas piece
with five scroll chapters, lives in the history at commit `87afad6`.
