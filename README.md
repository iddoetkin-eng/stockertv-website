# StockerTV — B2B Marketing Site

Single-page marketing site for StockerTV, aimed at B2B decision-makers at banks
and trading platforms. One goal: **book a demo**.

## Run locally

```
cd C:\Users\iddoe\Desktop\REPOS\stockertv-website
python -m http.server 8080
```

Then open http://localhost:8080

(Any static server works — `npx serve .` too. Opening `index.html` directly
also works, but a server is closer to production.)

## Deploy to GitHub Pages

Push this folder to a repository and enable Pages on the main branch
(root folder). `.nojekyll` is already included. No build step required.

## Stack — and why

Plain HTML + CSS + vanilla JS, no framework, no build step.

- A single-page marketing site with scroll-driven animation gains nothing
  from a framework runtime — no state, no routing, no data fetching.
- Zero dependencies means nothing to install, nothing to break, and a
  trivially fast Lighthouse profile (no hydration, ~15 KB of JS total).
- GitHub Pages serves it as-is.

Everything is progressive enhancement: with JS disabled the page still reads
correctly (static ticker fallback, final-state stats, full copy).

## Structure

```
stockertv-website/
├── index.html          # the whole site (single page)
├── css/main.css        # design system + all sections + responsive
├── js/main.js          # ticker · live desk demo · scrollytelling pipeline ·
│                       # video players · fleet brand switcher · sessions board
├── assets/
│   ├── favicon.svg
│   └── reporters/      # the five AI reporter portraits (optimized JPEGs)
├── .nojekyll
└── README.md
```

## Content rules (binding)

The copy follows the StockerTV brand rules from the vault:

- Never use: *compliance, compliant, leverage, synergy, best-in-class,
  industry-leading, world-class, cutting-edge*.
- Approved framing: **Tier-1 sources · source-verified · content integrity ·
  designed for regulated environments**.
- The Tier-1 source set is closed: Bloomberg, Reuters, The Wall Street
  Journal, Financial Times, SEC EDGAR / official filings. Name no others.
- No claims of regulatory sign-off. Capacity framed as "thousands per day".
- Zero user data collection — stated on the site, and true of the site
  itself (no cookies, no analytics, no trackers).
- B2B voice only: "your platform", "your users" — never retail-trader "you".

Demo videos are real pipeline output streamed from Supabase storage.
Fleet-preview brand names (Meridian, Crescent, Vantage, Aurum) are fictional.

## Contact

Demo requests: iddo@stockertv.com
