# Friends Included finance system

This repository is the staged implementation of the Day 4 Wedding Guests for Hire assignment. Supabase is the source of truth; the Vercel website and Telegram bot share server-side transaction rules; Google Sheets is a synchronized read-only copy for review.

The repository currently contains the Stage 1 foundation. External integrations are not yet configured or verified.

## Start locally

1. Copy `.env.example` to `.env.local` and fill it locally.
2. Run `pnpm install` (or `npm install`).
3. Run `pnpm dev` (or `npm run dev`).

## Validation

- TypeScript type-check: passed in Stage 1.
- ESLint: passed in Stage 1.
- Next.js production compilation: passed; this workspace blocked Next.js's final worker with `spawn EPERM`.
- Vitest: configured, but this workspace blocked its worker with `spawn EPERM`. Run `pnpm test` in a normal local terminal before treating the tests as passed.

See `docs/SETUP.md` for account setup, `docs/ARCHITECTURE.md` for the design, and `PROGRESS.md` for the requirement checklist.
