# Frontend Agents Guide

## Scope

This folder is the production Next.js frontend. Treat `uiux/` in the repo root as design reference only, not source of truth.

## What Lives Here

- `app/` - App Router pages and route structure
- `modules/` - feature modules
- `components/` - shared UI and layout
- `hooks/` - reusable hooks
- `lib/` - utilities and websocket helpers
- `configs/` - app and route config

## Working Rules

- Prefer feature work inside `modules/`
- Keep shared primitives in `components/ui/` or `components/shared/`
- Update matching types when backend payloads change
- Preserve server/client component boundaries
- Follow existing shadcn, Tailwind, and TanStack Query patterns

## Commands

```bash
npm install
npm run dev
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run build
```

## Verify Before Finish

```bash
npm run lint
npm run build
```
