# Arabian Drops — website

A complete, ready-to-deploy website for **Arabian Drops**, a pure attar counter at
63 UB Jawahar Nagar, Kamla Nagar, Delhi 110007.

Onair Studio's flat editorial visual language, Yashel's choreographed motion, the
Arabian Drops brand and photography. No framework, no build step, no backend.

```
arabian-drops/
├── index.html            home — intro, hero, catalogue, categories, store, subscribe
├── collection.html       all nine attars, working filters and sort
├── product.html          product detail: gallery, 6ml/12ml picker, add to cart
├── about.html            brand story + store photography
├── contact.html          address, hours, map, WhatsApp enquiry form
├── assets/
│   ├── css/site.css      the whole design system
│   └── js/app.js         catalogue, cart, intro, reveals, renderers
├── img/
│   ├── logo-mark-128.png / -256.png    AD monogram at real display sizes
│   ├── store-1.jpg / store-2.jpg       the actual shop, from the store's site
│   └── products/*.webp                 18 product photographs (2 angles × 9)
├── tests/site.test.html  25-assertion browser suite
├── tools/
│   ├── prepare-assets.mjs  dependency-free PNG decode/crop/downscale/encode
│   └── serve.mjs           tiny static server
└── raw/                    unprocessed sources (git-ignored)
```

## Run it

```bash
node tools/serve.mjs 8092        # → http://127.0.0.1:8092/
```

Needs a server because the pages reference sibling assets. `serve.mjs` is a plain
static host with no dependencies — any static host works in production.

**URL flags:** `?intro=1` always plays the intro, `?intro=0` never does. With no
flag it plays once per session. `collection.html?cat=Men` deep-links a filter.

## The catalogue is real

Every product, price, category and scent note is read from the store's own API —
nothing is invented. Nine attars, two bottle sizes each:

| Attar | Category | 6ml | 12ml | Notes |
|---|---|---|---|---|
| Bad Girl Attar | Women | ₹300 | ₹500 | Oudh · Sweet · Fresh · Woody · Citrus |
| Diamond Touch Attar | Unisex | ₹330 | ₹550 | Sweet · Smokey · Musky |
| Emir Attar | Men | ₹300 | ₹550 | Oudh · Spices · Fresh · Woody · Citrus |
| Grace Noir Attar | Unisex | ₹300 | ₹550 | Oudh · Kashmiri Qahwa · Fresh · Woody |
| Roasted Cherry Attar | Unisex | ₹300 | ₹550 | Cherry · Fruity · Fresh · Woody |
| S_X with Ex Attar | Unisex | ₹300 | ₹500 | Sweet · Creamy · Fresh · Citrus |
| Wrapped in You Attar | Men | ₹300 | ₹500 | Sweet · Fresh · Seductive |
| Zoraiz Attar | Unisex | ₹300 | ₹550 | Oudh · Aqua · Fresh · Woody |
| Secret Affair | Unisex | ₹300 | ₹550 | Citrus · Fresh · Aqua |

**Two things to confirm with the store before going live:**

1. **`Wrapped in You Attar` is categorised `Men` but its own product copy says it
   was "created for the woman who owns her femininity".** One of the two is wrong.
   I used the category the store's API returns rather than silently changing it.
2. **Every product carries `bestseller: true` and `latest: true`,** so neither flag
   can order anything. The homepage shows the first eight instead. Real flags (or a
   manual order) would be better.

## Checkout

There is no payment gateway, and this site does not pretend to have one. Checkout
composes the order and hands it to WhatsApp, which is how a shop this size actually
takes orders; cash on delivery is the default, with UPI offered on confirmation.
The cart persists in `localStorage`, and delivery is free above ₹999, ₹60 below.

To take card or UPI payments automatically, the next step is a Razorpay checkout
against the store's existing backend — the order data is already structured for it.

## Motion

The intro is Yashel's timeline, note for note:

| t | Event |
|---|---|
| 0.30s | monogram springs in — `markIn .6s cubic-bezier(.34,1.56,.64,1)` |
| 0.82–1.27s | 32 mist particles, 18–64px, angled −90°±65°, thrown 35–165px |
| 0.90s | wordmark — `brandIn`, letter-spacing collapsing `.55em` → `.28em` |
| 1.55s | tagline rises |
| 1.65s | hairline expands to 220px |
| 2.00s | skip and sound controls appear |
| 3.30s | auto-dismiss |

Plus the announcement marquee, `[data-reveal]` scroll reveals, and a hover
second-angle swap on cards.

**Three deliberate departures from the reference build,** each because the original
does something a real visitor would not thank it for:

1. **Sound is off by default.** Yashel fires a Web Audio synth (white noise →
   highpass 3kHz → bandpass 6kHz, with a 200Hz→55Hz pump) on every load. Browsers
   block audio before a gesture anyway, so the identical synth sits behind an
   opt-in toggle and only ever starts inside the click handler.
2. **Once per session.** A 3.3s curtain on every navigation is hostile.
3. **`prefers-reduced-motion` skips it entirely.** The reference has no
   reduced-motion handling at all.

## Defects from the live-site audit, all fixed here

| Defect on thearabiandrops.com | Here |
|---|---|
| **No price displayed anywhere** on the homepage | Price on every card, the hero and each PDP size |
| **Footer has zero links** — nav items are plain text | 10 real links: `tel:`, `mailto:`, Maps, WhatsApp |
| `/delivery` and `/privacy` have no route | Not linked, since they don't exist yet — see below |
| **Every deep link 404s on hard load** | Real static pages; every URL works on refresh |
| Favicon is Vite's default | AD monogram |
| 1.4 MB of PNGs downloaded but never shown on mobile | Deleted; nothing is fetched that isn't drawn |
| Logo 1024×1024 / **1.42 MB** for a 112px slot | 128px and 256px variants, 16 KB |
| Hero is a **2.32 MB** PNG | Product photographs at ~24 KB WebP |
| White-on-amber CTA at ~1.4:1; invisible newsletter tagline | Every text style measured ≥ 4.5:1 |
| Copy typos ("tep into", "The Arabian Drop", "2025@") | Clean, and all copy rewritten |
| **~8.4 MB** first-load transfer | **370 KB**, largest single resource 130 KB |
| No per-page title or description | Unique title and description per page |

## Test results

`tests/site.test.html` drives the real pages in an iframe — external tooling can't,
because the round trip to the browser outlives the intro's 3.3s life.

```
25/25 passed
```

Intro: full-viewport + scroll lock · exactly 32 particles · particle distance,
delay and duration within spec · all five keyframes defined · monogram resolves via
srcset · sound off by default · Escape dismisses and unlocks · dismissal recorded
for the session · second view skips · `?intro=0` suppresses · auto-dismisses without
interaction · reduced motion honoured in CSS and boot guard.

Storefront: every card priced (9/9) · prices match the live catalogue · category
filter works (9 → 2 for Men) · PDP shows both sizes at real prices · add to cart
persists and updates the badge · delivery ₹60 under ₹999 and free above · footer
links real · all five pages styled with unique titles.

Regressions from the audit: no Vite favicon · hover images not fetched until hovered
(0 fetched, was a 2× payload) · homepage under 500 KB · all text ≥ 4.5:1 ·
mobile tap targets ≥ 44px.

Two caveats worth stating plainly: the reduced-motion assertion checks the CSS and
the boot guard **in source**, not by emulating the OS setting, which needs
browser-level emulation or a real device. And the preview compositor in this
workspace drops frames intermittently, so some verification was done against the
DOM (`getComputedStyle`, `elementFromPoint`) rather than pixels.

## Not built yet

- **Real payment** — Razorpay against the existing backend, replacing the WhatsApp handoff.
- **Delivery and privacy pages** — deliberately not linked, because writing policy
  pages with invented terms would be worse than leaving them out. They need the
  store's actual terms.
- **Reviews** — the catalogue has none. Fabricating testimonials was not an option.
- **A proper dependency** — the pages duplicate their header and footer markup. At
  five pages that is fine; at fifteen it should become a build step.
