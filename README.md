# ZEN React Migration

This app converts the exported ZEN website in `../zen web` into a React + Vite project.

## Commands

```bash
npm install
npm run dev
```

`npm run dev` and `npm run build` both run the migration step first.

## What the migration does

- Reads every exported `.html` page from `../zen web` when that folder exists, falling back to the parent folder only for older layouts
- Extracts page metadata and body markup
- Copies required public assets into this app's `public` folder
- Generates a route manifest for React Router

## Current limitation

This rebuild uses the exported HTML as source material. That preserves the rendered site and routes, but interactive features that originally depended on Next.js hydration may need a second pass to become fully native React components.
