# Power Platform Open Source Hub — Website

Built with [Astro](https://astro.build/) 4.x, [Tailwind CSS](https://tailwindcss.com/), and TypeScript.

## Architecture

- **Static Site Generation (SSG)** — All pages are pre-rendered at build time for maximum performance and SEO.
- **Data-driven** — Repository data lives in `src/data/repositories.json`, refreshed by GitHub Actions.
- **Themeable** — Two themes available via CSS Variables and `data-theme` attribute:
  - **Power Platform** (default): Emerald green (#00A248) with a clean Fluent-inspired look.
  - **Copilot Studio**: Indigo/Violet (#4B32C3) with a modern, vibrant look.

## Project Structure

```
src/
├── components/       # Reusable UI components (< 100 lines each)
├── content/          # Markdown content for guidance docs
│   └── guidance/     # Getting started, contributing guides
├── data/             # Static JSON data (repositories.json)
├── layouts/          # Base page layouts
├── pages/            # Astro page routes
│   ├── index.astro           # Home — Discovery grid
│   ├── maintainers.astro     # Maintainer Home
│   └── guidance/[slug].astro # Guidance detail pages
├── styles/           # Global CSS with theme variables
└── types/            # TypeScript type definitions
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck
```

## Themes

Toggle between themes using the button in the header. The selected theme persists in `localStorage`.

| Theme | Primary Color | Style |
|---|---|---|
| Power Platform | `#00A248` (Emerald) | Clean, Fluent-inspired |
| Copilot Studio | `#4B32C3` (Indigo) | Modern, vibrant |

