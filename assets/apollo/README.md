# Apollo Racket Club case-study media

Every media slot on `apollo.html` shows a labeled placeholder until the matching
file exists, then `apollo.js` auto-reveals it (no markup changes needed).

## In use

| File | Where it appears |
|------|------------------|
| `v1/logo.png`, `v1/website.png`, `v1/ideas1-3-web.jpg` | Section 01, V1 tab of the identity toggle. |
| `v2/idea1-web.jpg`, `v2/idea2-web.jpg` | Section 01, V2 tab of the identity toggle. |
| `v2/concept-sheet-web.jpg` | Section 01, the brand board (replaced the hand-built token sheet). |
| `apollo-logo.svg` | Page hero. The mark lifted from the live site's inline SVG, gradient id renamed to `apollo-gold`. The wordmark beside it is live text set in Marcellus, the site's display face. |
| `site-scroll.mp4` + `poster-site-scroll.jpg` | Section 01. 15s scroll-through of the whole page, 1440px wide. |
| `survey.png` | Section 03. Page one of the live Tally survey: home ZIP plus the sports screener. |
| `survey-results.png` | Section 03. The Tally insights dashboard, responses reading back per question. |

**Why the full-page scroll is a video, not a still.** The hero is a 3200px
pinned scroll sequence that draws the badminton court as you move down it. It
only renders inside the viewport, so a full-page screenshot comes back with a
~2200px dead black band where the animation should be. The recording is the
only honest way to show it.

To re-capture: drive Chrome with `--remote-debugging-port`, scroll the whole
page once to fire every reveal, return to the top, then step `window.scrollTo`
in 10px increments capturing a frame each step, and encode with ffmpeg at 30fps.

## Captured but not currently placed

`site-hero.jpg`, `site-mobile.jpg`, `site-waitlist.jpg`. The hero screenshot was
replaced by the logo lockup, and the mobile and waitlist figures were cut. Kept
because they are current and re-capturing costs a browser session. Safe to
delete if the page is not going back to them.

## Placeholder figures currently hidden

All three placeholder slots are commented out in `apollo.html`, so nothing on
the page renders a "capture needed" frame right now. Uncomment the figure to
bring a slot back once its asset exists.

## Still open

| File | What to capture |
|------|-----------------|
| `brand-brief.png` | The original logo brief: business context, brand personality, mascot description, four style directions. Screenshot or a clean typeset version of the document. |
| `brand-concepts.png` | Redundant now. The identity toggle shows `v1/ideas1-3` and `v2/idea1-2`, so this placeholder figure can probably just be deleted from the page. |
| `competitive-table.png` | One of the six comparison tables, with operator-verified rates. |

- The final response count and the headline findings go into the "Fielding in
  progress" block in the Research section once fielding closes. Do not report
  results before there is enough data to support them.
- Court count is deliberately absent from the page until 7 vs 8 is settled.

## Image optimisation

The `-web.jpg` files are derived from the PNGs you dropped in `v1/` and `v2/`.
The originals are untouched. As PNGs those eight images totalled 6.5MB, which
is too heavy for one page; as JPEGs at q4 they total 1.3MB with no visible
loss. `v1/logo.png` and `v1/website.png` stayed PNG because they are flat
colour and PNG beats JPEG on both (JPEG made them larger).

Regenerate with:

```
ffmpeg -y -i IN.png -vf "scale=1600:-2:flags=lanczos" -q:v 4 OUT-web.jpg
```

## Discrepancies worth resolving

The brand board, the build brief, and the live site do not fully agree:

- **Gold and onyx.** The board labels `APOLLO GOLD #C8A96A` and `ONYX #080F10`.
  The brief specifies `#C6A15B` and `#050F0E`. The live site's stylesheet ships
  `--color-gold: #c6a15b`. This page uses the brief + live values, since those
  two agree and are what is actually implemented.
- **Extra colours.** The board adds `FOREST #18231E`, `STONE #E7E4DC` and
  `PEWTER #6E7275`, which the brief does not mention. FOREST is probably the
  "muted jade for live and status cues" the brief refers to.
- **Name of record, now three variants.** The domain and live wordmark say
  *Apollo Racket Club*. The V2 exploration lockups say *Apollo Badminton Club*.
  The board's photography mockup says *Apollo Racquet Club*. The page uses
  Apollo Racket Club throughout.

## Brand tokens

The V2 palette is built into `apollo.css` `:root` and rendered live in the
token sheet in section 01, so the swatches are the real values rather than a
picture of them. Onyx `#050F0E`, gold gradient `#EBD3AB` / `#C6A15B` /
`#9C7C4C`, ivory `#F4EEE3`. Type is Manrope with a 0.32em tracked uppercase
label and tabular figures.

The muted jade for live and status cues has no hex specified yet, so the token
sheet shows it as an open slot rather than a guessed value. Fill it in
`apollo.css` and in the swatch when it is settled.

## Frame ratios
- `sk-video--desktop` frames are 16:10. `ap-shot--3x2` overrides that to
  3026:2082 for the survey captures so they are not cropped.
- Do not add `sk-embed` to a figure: `.sk-embed .sk-video-frame` forces 16:9 and
  overrides the desktop and phone ratios by source order.
- JPEG for dark gradient screenshots: the hero went from 1.6MB as PNG to 96KB as
  JPEG with no visible loss.
