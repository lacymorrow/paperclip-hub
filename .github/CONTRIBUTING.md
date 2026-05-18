# Contributing to Paperclip Hub

Thanks for your interest. Paperclip Hub is the plugin directory for [Paperclip](https://paperclip.ing) — a Next.js 15 app (App Router + TypeScript + Tailwind + Shadcn/UI), backed by Drizzle ORM on PostgreSQL with Payload CMS v3. The hub itself lives at [cliphub.fyi](https://cliphub.fyi).

## Quick start

Prerequisites: **Bun**, **PostgreSQL** (or a hosted Postgres URL), Node 20+.

```bash
git clone https://github.com/lacymorrow/paperclip-hub.git
cd paperclip-hub
bun install
cp .env.example .env   # fill in DATABASE_URL + auth providers you need

bun dev                # Next dev server
bun run db:migrate     # apply migrations (after editing .env)
```

See [`CLAUDE.md`](../CLAUDE.md) for the architecture deep-dive: route groups, feature-flag system, Payload integration, plugin indexer.

## Reporting bugs

Open an issue using the **Bug Report** template. Include the affected URL or page, exact reproduction steps, what you expected, what you saw, and (if the issue is registry-related) the plugin slug + version. Browser/OS only when the bug is visual or device-specific.

## Proposing changes

For non-trivial work — new routes, schema changes, auth/permission changes, indexer changes — open an issue first to align on the approach. Small fixes (typos, dead links, single-file bugs) can go straight to a PR.

## Pull requests

1. Branch from `main`. Use a descriptive name (`fix/plugin-detail-404`, `feat/category-filter`).
2. One logical change per PR. Don't bundle refactors with feature work.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`).
4. Fill in the PR template — especially the test plan.

## Code style

- **Server Components first.** Reach for `'use client'` only when you need browser-only APIs or interactivity.
- **Server Actions for mutations**, Server Components for data fetching. Never use server actions to fetch.
- **Services layer.** Business logic lives in `src/server/services/`; mutation actions in `src/server/actions/` call services. **Server Components call services directly for data fetching.** **Client Components call actions for mutations** — never reach into services from the client.
- **Drizzle + Postgres.** Schema in `src/server/db/schema.ts`. After edits: `bun run db:generate` → `bun run db:migrate`. Prefer timestamps over booleans (`activeAt`, not `isActive`).
- **TypeScript.** Strict; no `any` without an explanatory comment. Interfaces over types; no enums (use objects/maps).
- **Naming.** kebab-case files, PascalCase components, camelCase variables. Named exports only — no default exports.
- **File size.** Keep files under 500 lines.
- **Feature flags.** Toggle features via `NEXT_PUBLIC_FEATURE_*_ENABLED` env vars. Features must degrade cleanly when disabled.

Run before pushing:

```bash
bun run lint:fix       # Biome + ESLint + Prettier auto-fix
bun run typecheck      # tsc --noEmit
bun test               # Vitest
```

## Submitting a plugin to the registry

Plugins are **not** added by editing files in this repo. Publish an npm package with a valid Paperclip manifest — the nightly indexer picks it up automatically. See [Paperclip plugin docs](https://paperclip.ing/docs) for the manifest format.

## Security

Please **do not open public issues for security vulnerabilities**. See [SECURITY.md](SECURITY.md) for private disclosure.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](../LICENSE).
