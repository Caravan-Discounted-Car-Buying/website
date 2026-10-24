# Design decisions

## Reference analysis

**Ref 1: festival site (Feastie).** Resolution is fine to judge.
- *Layout:* a centred single column with a huge wordmark up top, then two photo arches over a big pink curve, then a 3-up colour-block card row and a 2-column vendor grid. Generous outer margins.
- *Type:* an ultra-heavy display face with an outline-plus-extrusion "3D" effect for the wordmark; small, plain grotesque body text in caps for labels.
- *Palette:* deep purple as the dominant, with saturated orange and red against pastel pink, lime and sky blue on an off-white background.
- *Spacing:* airy around the hero, tight inside cards.
- *Motion:* a ticker strip along the top (the only motion visible in a static capture).
- *Components:* arch-shaped image masks, tilted sticker labels in colour blocks, rounded cards with images bleeding off the corner, pill buttons.

**Ref 2: food brand (Happi).** Resolution is fine for the overall layout, but too low to judge the ink texture closely.
- *Layout:* full-bleed illustrated hero, then alternating text/illustration rows, a 4-up icon row and a newsletter block.
- *Type:* hand-lettered, uneven display statements and heavy wide caps for subheads.
- *Palette:* one dominant flat yellow, black ink, with teal, orange and pink accents.
- *Spacing:* a lot of empty yellow; each block stands alone.
- *Motion:* none visible.
- *Components:* character illustrations with grainy shading, wavy section edges, round black-and-white badge icons, hand-lettered statements as the main visual.

## Primary direction: Ref 1

**Why:** Ref 1's personality comes from type, colour blocks, arches and stickers. All of that is buildable in CSS and small SVG, and it costs almost nothing in page weight. Ref 2's personality comes from skilled hand-drawn character art and hand lettering. Hand-coded SVG can't match that, and an imitation would look like weak clip art. Its grain texture is also expensive to render on mid-range Android phones.

The two references don't really conflict in palette or energy, so I didn't need to choose between them on those grounds. The choice is about what can be executed well.

**Taken from Ref 1 (primary):** chunky 3D-outline display type, an arch mask (holding an illustration instead of a photo, since photos are out), sticker tags, the ticker strip, and rounded colour-block cards.

**Borrowed from Ref 2 (three devices):**
1. Wavy section dividers.
2. Round badge icons (for the three "what's different" points; used as plain icons, not certification-style seals).
3. A "group of friendly characters" moment above the waitlist form. These are deliberately simple geometric shapes with dot eyes, not an attempt at Ref 2's illustration style.

**Not used:** the grain texture (performance), hand lettering (can't be done well as code), and any text, characters, layouts or imagery from either reference.

## Indian translation of the look

- **Truck-art and signboard:** the zig-zag-and-dot strips (pure CSS gradients), the dotted trim on the car, and the hard offset "printed" shadows instead of soft blurs.
- **Festival-banner energy:** a bunting strip of plain geometric pennants across the hero arch. No religious symbols.
- **Taxi and rickshaw palette:** turmeric yellow with indigo-black, plus a signal red car.
- **Hinglish:** only in headlines, labels and microcopy ("Akele kyun?", "Paanch steps. Bas.", "Ek group, ek sealed bid.", "Kya alag hai?", "Sawaal-jawaab", "List mein naam likhwao."). Every one sits next to an English line saying the same thing, so non-Hindi readers miss nothing. Romanised Hindi is tagged `lang="hi-Latn"`.
- **Devanagari:** one decorative accent, "साथ में · together", on a sticker in the hero, tagged `lang="hi"` with the English right beside it.

## Fonts

All three are SIL Open Font License 1.1. I verified this from the licence files shipped in the Fontsource packages, and the OFL texts are bundled in `assets/fonts/`.

| Role | Font | Weights | Why |
|---|---|---|---|
| Display | **Baloo 2** | 800 | Rounded and friendly, readable at heading sizes, designed by an Indian foundry (Ek Type), has a ₹ glyph. |
| Body | **Mukta** | 400, 700 | Clear at small sizes on phones, designed with Indian scripts in mind, has a ₹ glyph. Chosen over Poppins for being lighter and less generic. |
| Accent | **Modak** | 400 | Only for the hero headline, step numerals and the Devanagari accent. Too heavy for anything longer, and it has **no ₹ glyph**, so it never carries prices or ₹ symbols. |

Yatra One wasn't used, to stay within one display, one body and one accent font.

**Subsetting:** each font is cut to basic Latin plus the punctuation used, at about 9–14 KB each. The ₹ sign lives in separate ~0.7 KB files that only download when ₹ appears on screen (via `unicode-range`). The Devanagari accent is subset to just the glyphs in "साथ में" with OpenType layout features kept, so the matra and anusvara render correctly (2 KB). All files use `font-display: swap`.

**Trade-off:** I removed the `<link rel="preload">` hints for the fonts. Chrome blocks preloaded fonts when the page is opened from `file://` and fills the console with errors. That's only cosmetic, but confusing when testing locally. The cost is a slightly later headline font swap on first visit. If you only ever test on a local server, you can add the preloads back (they need the `crossorigin` attribute).

## Palette

One dominant colour (indigo ink), one accent (turmeric), and cream paper everywhere else. Supporting colours appear only on cards, stickers and illustrations.

| Token | Hex | Use |
|---|---|---|
| `--c-paper` | #fff5e1 | page background |
| `--c-paper-deep` | #fbe7bf | alternate section |
| `--c-ink` | #1f1650 | text, big blocks (dominant) |
| `--c-turmeric` | #f4b400 | accent, buttons |
| `--c-red` | #b81f35 | stickers, car (darkened from a brighter red so white text passes AA) |
| `--c-teal` | #0b6363 | one card, one badge |
| `--c-marigold` | #f07a1a | one card, focus ring |
| `--c-pink` / `--c-mint` | #f6b9c9 / #cdebc2 | calendar-art pastels |

### Contrast (WCAG 2.1, computed)

| Text on background | Ratio | Result |
|---|---|---|
| Ink on paper | 15.0 | AAA |
| Ink-soft on paper / white / pink | 8.4 / 9.1 / 5.5 | AA+ |
| Ink on turmeric | 8.8 | AAA |
| Ink on marigold | 5.8 | AA |
| White on red | 6.4 | AA |
| White on teal | 7.1 | AAA |
| Ink on pink / mint | 9.9 / 12.6 | AAA |
| Paper / turmeric / pink on ink | 15.0 / 8.8 / 9.9 | AAA |
| Red error text on error background | 5.7 | AA |

**Known exception:** the hero headline "Akele kyun?" has a turmeric fill on cream (1.7:1). It's legible because of its 3 px indigo outline and indigo extrusion, which give the letter edges about 15:1 against the background. The meaning is repeated in plain indigo text right below it ("Why buy a car alone?"). The turmeric step numeral on teal (3.8:1) is decorative, `aria-hidden`, large and outlined. If you want strict compliance for the headline, set its fill to `--c-ink` in `.outline-3d`. It still looks bold, just less festive.

## Motion and accessibility

- **Motion:** the ticker (pauses on hover/focus), scroll fade-ins, and small hover wiggles on devices that hover. Under `prefers-reduced-motion: reduce`, all animation stops, the ticker becomes a static wrapped line with its duplicate removed, and fade-ins are skipped.
- **Scripts:** content is never hidden unless JS runs. A one-line inline script adds the `js` class before first paint. Scripts are classic `defer` scripts, not ES modules, because modules are blocked on `file://`.
- **Accessibility:** native `<details>` for the FAQ (keyboard and screen-reader friendly with no JS), a skip link, visible focus rings, 48 px tap targets, and form errors linked via `aria-describedby` with `aria-invalid`. Status messages use `role="status"` and receive focus after submit.

## Copy decisions that differ from the original brief

- **"Refund if the minimum isn't met"** became "your booking amount is refunded; whether a small fee is kept is still being decided." The PRD's settled rule keeps ₹100–200 on a failed auction, so a plain "refund" would overpromise.
- **The buyer payment step** mentions the platform fee and says it's undecided.
- **"Highest discount wins"** became "best overall discount that meets the group's minimum". That wording stays true whichever way the per-model bid question (PRD flag F1) is settled.
- **Dealer payouts** are described as "still being worked out, with dealer input" (PRD item T5).
- **The problem section** is labelled as a hypothesis twice.
- **Threshold-not-met behaviour** (PRD item T4) isn't mentioned at all, because it's undecided.
