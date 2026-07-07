# StockerTV — B2B Marketing Site

Single-page marketing site for StockerTV, aimed at B2B decision-makers at banks
and trading platforms. One goal: **book a demo**.

Live: https://iddoetkin-eng.github.io/stockertv-website/

## Run locally

```
cd C:\Users\iddoe\Desktop\REPOS\stockertv-website
python -m http.server 8080
```

Then open http://localhost:8080

(Any static server works — `npx serve .` too.)

## Deploy

Pushed to `iddoetkin-eng/stockertv-website`, served by GitHub Pages from
`main` (root). `git push` redeploys. No build step.

## Design system (v2)

- **Palette — strict monochrome.** Pure black `#000`, pure white `#fff`, and a
  gray scale (`#0b0b0b · #121212 · #181818 · #242424 · #1a1a1a · #4a4a4a ·
  #8f8f8f · #ababab · #d6d6d6`). No accent colors anywhere; CTAs are inverted
  white-on-black. Depth comes from contrast, spacing, and typography.
- **Type.** Display/logo/headlines: `ui-serif, "New York", "Source Serif 4",
  Georgia, serif` — Apple devices render the native New York face, everyone
  else gets self-hosted Source Serif 4 (closest match in proportions).
  Body/UI: Instrument Sans. Data: IBM Plex Mono.
- **Motion.** Scroll reveals, a scroll-driven pipeline, count-ups, typing
  demos — transforms/opacity only, all gated behind `prefers-reduced-motion`.

## Centerpiece — the Experience section

`#experience` renders the client widget inside two CSS-built device frames:
an iPhone (Dynamic Island, status bar with real local time) and a desktop
browser (traffic lights, host-site skeleton). Visitors can:

- **Play real broadcasts** — five real pipeline videos streamed from Supabase
  storage (NVDA EN/ES, IBKR EN, META EN, Baxter FR).
- **Switch reporters** — all five desks; legal and press desks show a clearly
  labeled simulated preview (animated captions + waveform).
- **Switch languages** — EN/ES/FR where real videos exist; others disabled.
- **Toggle devices** — animated segmented control.
- **Switch client branding** — four fictional brands re-theme the widget
  wordmark and host domain (white-label concept, kept monochrome).

## Structure

```
stockertv-website/
├── index.html          # the whole site (single page)
├── css/fonts.css       # self-hosted @font-face (Source Serif 4, Instrument Sans, IBM Plex Mono)
├── css/main.css        # monochrome design system + all sections + responsive
├── js/main.js          # ticker · live desk · scrollytelling pipeline ·
│                       # experience demo (device/reporter/language/brand) · sessions board
├── assets/
│   ├── favicon.svg / og.png
│   ├── fonts/          # woff2, latin + latin-ext subsets
│   └── reporters/      # the five AI reporter portraits (optimized JPEGs)
├── .nojekyll / robots.txt
└── README.md
```

## Content rules (binding)

- Never use: *compliance, compliant, leverage, synergy, best-in-class,
  industry-leading, world-class, cutting-edge*.
- Approved framing: **Tier-1 sources · source-verified · content integrity ·
  designed for regulated environments**.
- Tier-1 source set is closed: Bloomberg, Reuters, The Wall Street Journal,
  Financial Times, SEC EDGAR / official filings. Name no others.
- No claims of regulatory sign-off. Capacity framed as "thousands per day".
- Zero user data collection — stated on the site, and true of the site itself
  (no cookies, no analytics, no trackers).
- B2B voice only: "your platform", "your users" — never retail-trader "you".
- Strict monochrome: any new color value must satisfy r == g == b.

Demo videos are real pipeline output streamed from Supabase storage.
Client brands in the Experience section (Meridian, Crescent, Vantage, Aurum)
are fictional.

## Contact

Demo requests: iddo@stockertv.com
