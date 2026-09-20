# Internet Archaeology Museum

[English](README.md) · [简体中文](README.zh-CN.md)

> Explore the history of the internet as if it were a museum.

Internet Archaeology Museum is an open-source, static-first web experience for wandering through the internet from 1990 to 2026. It is designed as an exhibition rather than a database: drag the timeline, open field notes, and follow the connections between browsers, platforms, hardware, software, and internet culture.

## Features

- A keyboard-friendly timeline from 1990 to 2026 with play, pause, and speed controls
- Era chapters: Early Web, Browser Wars, Web 2.0, Mobile Internet, Platform Era, Pandemic Internet, and AI Internet
- 155 museum artifacts with concise historical context and “Why it mattered” notes
- Search the archive and open related artifacts
- Surprise Me discovery flow and a static “On This Day” logbook
- English / Simplified Chinese interface toggle with persisted language preference
- Full catalog filtering by category with batched loading for long lists
- Shareable year and exhibit links (for example, `?year=2005&exhibit=youtube`)
- Museum rooms for each era, category browsing, major-event cards, Internet Graph, Internet Stack, and Then vs Now comparison
- Dark and light themes with system-aware default
- Entity field notes with relationship links, entity timelines, source links, and Wayback Machine shortcuts
- Responsive layout for desktop, tablet, and mobile
- Reduced-motion support, visible focus states, semantic controls, and accessible labels
- No historical website screenshots are fabricated; exhibit cards are clearly labeled visual reconstructions

## Screenshots

The first viewport is the exhibition floor: the year, timeline, current era, and a snapshot of the web are visible together. Run the local preview to explore the timeline and open an artifact field note.

## Tech stack

- React + TypeScript
- Vite
- CSS custom properties and responsive CSS (no UI framework required)
- Lucide icons

## Project structure

```text
src/
  App.tsx       # Exhibition shell and interactions
  data.ts       # Eras, timeline slices, and exhibit records
  i18n.ts       # English / Simplified Chinese UI and exhibit copy
  extraEntities.ts # Expanded global artifact catalog
  types.ts      # Shared data types
  styles.css    # Visual system, responsive layout, and motion rules
public/
  favicon.svg
```

## Run locally

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run verify:data
npm run verify:runtime
npm run verify:dist
```

`dist/` is a deployable static artifact. The Vite base is relative, so the build works at a domain root and at a project sub-path such as GitHub Pages. Upload the contents of `dist/` to any static host (GitHub Pages, Vercel, Netlify, or Cloudflare Pages); no server process is needed. This repository has not been deployed by the maintainers, so it does not have a live demo URL. If a host does not serve `index.html` for the root request, configure its normal static index behavior. The experience uses hash navigation and does not require an SPA rewrite rule.

## Data sources

The first edition keeps historical records in `src/data.ts` and `src/extraEntities.ts` so the site works without an API. Exhibit links point to official sites or Wikipedia reference pages for further reading. User counts are intentionally approximate and labeled as estimates. The visual language is a reconstruction and does not represent an official historical screenshot of any product. Source links are outbound references and can change independently.

Contributions that improve dates, sourcing, regional context, accessibility, or the writing are welcome. Please keep additions concise and include a source link for important factual claims.

## Architecture

The museum is static-first. Timeline slices, eras, events, relationships, and 155 exhibits live in typed data modules; React components provide the exhibition surface and interaction model. No database, login, API key, or runtime service is required. The catalog includes regional ecosystems from North America, Europe, China, Japan, South Korea, India, and global internet culture without pretending every ecosystem followed the same path.

## Demo flow

Enter the museum, drag the timeline to a milestone, open an artifact, follow a related exhibit, then compare two years or inspect the Internet Graph. The URL is intentionally a single-page static experience so it can be deployed to GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

## Roadmap

The current edition focuses on a complete, explorable archive. Future contributions can deepen regional source notes, add more verified event citations, and add optional map-based rooms without changing the static-first core.

## License

MIT. See [LICENSE](LICENSE).
