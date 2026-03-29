# Community Registry

An interactive, SvelteKit-based registry for the Power Platform Open-Source Hub. Browse, search, and explore open-source Power Platform repositories with real-time filtering and a dual-theme experience.

## Features

- **Interactive Card View** — Browse 216+ Power Platform repositories in a responsive card grid
- **Client-Side Search** — Fuzzy search powered by [Fuse.js](https://www.fusejs.io/) across names, descriptions, topics, and languages
- **Filter by Focus Area** — Copilot Studio, Power Apps, Power Automate, or Dataverse
- **Dual Themes** — "Power" (green, light) and "Copilot" (blue/purple, dark) with persistent toggle
- **Guidance Pages** — Markdown-rendered documentation via [mdsvex](https://mdsvex.pngwn.io/)
- **Static Deployment** — Zero-cost hosting on GitHub Pages via `@sveltejs/adapter-static`

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) — Full-stack framework
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS
- [DaisyUI v5](https://daisyui.com/) — Component library and theme engine
- [Fuse.js](https://www.fusejs.io/) — Client-side fuzzy search
- [mdsvex](https://mdsvex.pngwn.io/) — Markdown preprocessing for Svelte

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview   # preview the production build locally
```

## Type Checking

```sh
npm run check
```
