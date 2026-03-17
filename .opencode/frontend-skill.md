# Frontend Skill

## Overview
Next.js 15 frontend for blockchain transaction explorer.

## Tech Stack
- Next.js 15 with App Router
- TypeScript
- React 19
- Tailwind CSS 4
- shadcn/ui components
- TanStack Query v5
- ESLint + Prettier

## Directory Structure
```
frontend/
├── app/           # Next.js App Router pages
├── modules/       # Feature modules (block, transaction, wallet, p2p, lucky-money, etc.)
├── components/    # UI components (ui/, shared/, layout/)
├── hooks/         # Custom React hooks
├── lib/           # Utilities (utils.ts, websocket/)
├── configs/       # App configuration
├── constant/      # Constants
└── assets/        # Icons, images
```

## Commands
```bash
cd frontend

# Install dependencies
npm install  # or yarn

# Development
npm run dev

# Build
npm run build

# Lint & Format
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Code Style
- Use ESLint and Prettier
- Follow existing component patterns
- Use TypeScript types for all data structures
- Use shadcn/ui components from `components/ui/`
- Follow App Router conventions in `app/` directory
- Use modules in `modules/` for features
- Use `cn()` utility for class merging

## Key Features Modules
- `block/` - Block listing and details
- `transaction/` - Transaction listing and details
- `wallet/` - Wallet details
- `p2p/` - P2P trading
- `lucky-money/` - Red envelope feature
- `donation-campaign/` - Donation campaigns
- `swap/` - Token swap
- `transfer/` - Token transfers
- `auth/` - Authentication
- `dashboard/` - Dashboard
- `global-search/` - Global search
- `developer/` - Developer tools
- `profile/` - User profiles

## Configuration Files
- ESLint: `eslint.config.mjs`
- Prettier: `.prettierrc`
- TypeScript: `tsconfig.json`
- Next.js: `next.config.ts`
- shadcn/ui: `components.json`

## Patterns
- Use TanStack Query for data fetching
- Use React Hook Form + Zod for forms
- Use URL query params for pagination (see `hooks/usePaginationQueryParam.tsx`)
- Use path aliases `@/*` for imports
