# WC26 Dashboard

Public dashboard for a player-based prediction model of the 2026 FIFA World Cup.
It visualizes per-match win/draw/loss probabilities, most-likely scorelines, and
the model's tournament outlook.

**Live site:** https://wc26-dashboard-nu.vercel.app

## What it shows

- **Match predictions** — win / draw / loss probabilities for each fixture
- **Score matrix** — the model's probability distribution over exact scorelines
- **Charts** — probability and outlook visualizations via Recharts

The model itself (lineup-conditioned, player-based) lives in a separate
repository; this app is the read-only presentation layer that consumes its
published output.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** for charts
- Deployed on **Vercel**

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Layout

```
src/app/         routes, layout, OG image, client components
src/lib/         data fetching, types, formatting, score matrix
src/styles/      design tokens
```
