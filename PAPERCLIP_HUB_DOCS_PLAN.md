# Paperclip Hub — Docs Page Plan

> Branch: `feat/docs-page` · Author: Satoshi (contributor) · Owner: Lacy Morrow
> Status: Decisions resolved by tech owner (Satoshi), 2026-05-26 — see "Decisions" at the end. Build proceeds in focused PRs per `.github/CONTRIBUTING.md`. One item (canonical submission flow) still pending Lacy.

---

## 1. Goal & Objectives

### Goal

Make `/docs` document **Paperclip Hub** — the plugin directory for Paperclip — instead of the inherited ShipKit starter-kit content it currently ships. The docs infrastructure is already built and working; this effort is **content + cleanup**, not new engineering.

### Objectives

1. **Replace ShipKit content with Paperclip Hub content.** Cover what the hub actually does: browsing/searching plugins, plugin detail pages, submitting a plugin to the registry, the manifest format, and the nightly indexer.
2. **Fix stale hardcoded references** so the docs UI has no dead links (notably `POPULAR_DOCS` in `docs-search.tsx`, which points at non-existent pages).
3. **Make docs search work for anonymous visitors.** The current search API always requires a logged-in session (`401`) — broken for a public plugin directory. Remove the auth gate so the existing JSON `DocsSearchService` path serves everyone; optionally drop the unused OpenAI streaming path as cleanup. ✅ **Approved (Satoshi, 2026-05-26).**
4. **Remove or archive irrelevant ShipKit docs** (auth providers, payment providers, CMS, visual builder, etc.) that don't apply to the hub, so the sidebar reflects reality.
5. **Match Lacy's house style** — terse, code-over-prose, link to real file paths, tables over lists, no marketing fluff (his existing `DOCS_OVERHAUL_PLAN.md` style guide is the standard).
6. **Ship in focused PRs** — one logical change per PR, with a filled-in test plan, expecting Gemini + Claude review iteration.

### Non-goals

- Rebuilding the docs route/engine or the MDX rendering — they work (see §2).
- Reworking the sidebar auto-generation — we work _within_ its flat, one-level model (see §2). Two _optional_ tiny tweaks are flagged for Lacy in §3 (section `index.mdx` href, section ordering); anything beyond those is out of scope.
- Documenting the Paperclip CLI/plugin authoring beyond what the hub needs to link out to (`paperclip.ing/docs` owns that).

> Note: search **backend** is in scope (auth/OpenAI removal, objective 3); the search **UI** (dialog, debounce, keyboard nav) is not — it's reused as-is.

---

## 2. Information Gathered

### The docs system is fully built and live

| Piece           | Location                                        | State                                                                                                                                                                                        |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catch-all route | `src/app/(app)/docs/[[...slug]]/page.tsx`       | ✅ MDX-remote rendering, `generateStaticParams`, SEO metadata                                                                                                                                |
| Layout / chrome | `src/app/(app)/docs/layout.tsx`                 | ✅ Sticky header + 3-col grid + scroll area                                                                                                                                                  |
| Content engine  | `src/lib/docs.ts`                               | ✅ Reads `docs/`, parses frontmatter, auto-builds nav (1 level deep), path-traversal/DoS guards. (Note: `DocSchema` exists but isn't applied — frontmatter is sanitized, not Zod-validated.) |
| Sidebar         | `_components/docs-sidebar.tsx`                  | ✅ Accordion, auto-populated, active-path highlight                                                                                                                                          |
| Search dialog   | `_components/docs-search.tsx`                   | ⚠️ Works, but `POPULAR_DOCS` hardcodes dead links                                                                                                                                            |
| Search API      | `src/app/(app)/api/docs/search/route.ts`        | 🔴 Always requires login (401) → broken for anonymous visitors. (OpenAI used only by the optional streaming path, not the JSON path the hook uses.)                                          |
| 404 handling    | `_components/../not-found.tsx`                  | ✅ Redirects to `/docs` home                                                                                                                                                                 |
| Nav entry       | `src/config/navigation.ts:17`, `header.tsx:106` | ✅ `/docs` is live in site nav                                                                                                                                                               |

### Page mechanics & rendering (how the page actually works)

This is the direction a doc author needs — the page's behavior is driven by file/folder conventions, not by any config file.

**Layout** (`layout.tsx`) — three zones in a CSS grid:

- **Left:** sticky sidebar (`DocsSidebar`), auto-built from the `docs/` folder tree.
- **Center:** the rendered MDX article (`page.tsx` → `MDXRemote`), wrapped in `.docs-content`.
- **Right:** a 256px rail reserved in the grid but **currently empty** (no on-page table-of-contents is wired up). Opportunity, not a blocker.

**What renders where / sidebar generation** (`src/lib/docs.ts` `processDirectory`):

- **Folder name → sidebar section heading**, kebab-case auto-converted to Title Case (`getting-started/` → "Getting Started").
- **Root-level `.mdx`/`.md` files → a hardcoded "Core" section** (pinned to the top).
- **A file appears in nav only if it has a frontmatter `title` OR an H1** — no title = silently dropped. Policy for this effort: give every doc a frontmatter `title:` (not a code requirement, but keeps nav predictable).
- 🔴 **Sidebar is only ONE level deep.** `processDirectory("")` builds a section per _immediate_ child folder and lists only the files directly inside it. **Nested subfolders do NOT appear in the sidebar** (the `maxDepth=3` var is set but unused for recursion). A nested page (e.g. `reference/snippets/api.mdx`) still renders via its slug, but is **invisible in nav**. → keep the IA flat: `section/page.mdx`, not `section/subsection/page.mdx`.
- **`index.mdx` behavior is split:** the root `docs/index.mdx` is excluded from nav (it's the landing page). But a **section `index.mdx` (e.g. `getting-started/index.mdx`) IS added to nav** with an ugly href `/docs/getting-started/index`. → either avoid section `index.mdx` files, or treat fixing that href as a small engine tweak (flag for Lacy).
- **Item ordering within a section is alphabetical by title; section (folder) ordering is filesystem order** (`fs.readdirSync`, no explicit sort) — _not_ title-controlled. There is no `meta.json`/manual ordering. (Implication: you can't reliably order sections without an engine change.)
- Limits (DoS guards): ≤20 dirs and ≤50 files per dir.
- Note: `DocSchema` (Zod) exists in `docs.ts` but `readMdxFile` does **not** call `.parse`/`.safeParse` — frontmatter is sanitized/truncated, not schema-validated. Don't rely on Zod to reject bad frontmatter.

> **Direction takeaway:** the IA _is_ the folder structure, but a **flat** one — one level of folders, no nesting in nav, section order is filesystem-dependent. Frontmatter titles control intra-section order only.

**Search behavior** (`use-docs-search.ts` → `POST /api/docs/search`):

- UI is a ⌘K-style command dialog: debounced (300ms), client-side result cache, keyboard nav, recent searches in localStorage, plus hardcoded `POPULAR_DOCS` suggestions (currently dead links).
- 🔴 **The search API always requires an authenticated session** (`401` if no `session.user.id`) and is **rate-limited (10/min)**. On a public docs site with no logged-in user, **search fails for anonymous visitors** — this is the blocker. → addressed by objective 3.
- OpenAI is **not** the blocker: the hook calls with `Accept: application/json`, which takes the plain `DocsSearchService` path (no OpenAI). OpenAI is only used by the non-JSON _streaming_ path, and even that falls back to JSON when unconfigured. So dropping OpenAI is optional cleanup, not required to make search work.

### The content is ShipKit's, not Paperclip Hub's

- `docs/index.mdx` is titled **"Shipkit Documentation"** — "Next.js 15 starter kit. Enable features by setting env vars."
- ~80 `.mdx`/`.md` files under `getting-started/`, `features/`, `integrations/`, `guides/`, `development/`, `reference/`, `internal/` — all about the ShipKit template (auth providers, payment providers, Payload CMS, Builder.io, AI/SmolLM, etc.).
- None of it covers the hub's actual domain: plugin browsing, plugin submission, registry, manifest, indexer.

### Known stale references to fix

- `docs-search.tsx` `POPULAR_DOCS` → `/docs/introduction`, `/docs/quickstart`, `/docs/auth`, `/docs/database`, `/docs/deployment` — most don't exist as files (real docs live under `getting-started/`, `features/`).

### What the hub actually is (from `.github/CONTRIBUTING.md` + the codebase)

- Paperclip Hub = plugin directory for Paperclip. Lives at `cliphub.fyi`. Next.js 16 + React 19, Drizzle/Postgres, Payload v3.
- **Two submission paths exist** — the docs must describe the real one:
  - CONTRIBUTING says plugins are added by **publishing an npm package** that a **nightly indexer** (external — not in this repo) picks up.
  - But there is **also an in-repo `/submit` page** (`src/app/(app)/submit/page.tsx`) that generates a registry entry via a GitHub "new file" flow.
  - ⚠️ **Open question for Phase 0:** which is canonical for the hub? The docs should not document a flow that's being deprecated. Confirm with Lacy.
- **Registry entry schema is concrete** (`registry/schema.json`): required fields `name, npmPackage, description, category, capabilities, author, submittedAt`; `category` enum = `auth, provider, tools, integration, observability, memory, other`; `capabilities` enum = `event, config, tool, auth, chat.message, chat.params, permission.ask, tool.execute.before, tool.execute.after`. Registry docs should mirror this, not invent fields.
- Plugin **manifest** format docs live at `paperclip.ing/docs` — link out, don't duplicate.

### Prior art

- `docs/DOCS_OVERHAUL_PLAN.md` + `DOCS_OVERHAUL_PROGRESS.md` document the previous ShipKit-docs overhaul (PR #132). Useful as a **style/structure reference**, but its goal (polish ShipKit docs) differs from ours (repurpose for the hub). Style guide there is the standard to follow.

### Owner conventions to honor (from memory: `lacy-working-style`)

- Conventional Commits with scopes (`docs:`), descriptive branch names, one logical change per PR, fill the PR test plan, expect Gemini/Claude bot review. Run `bun run lint:fix`, `bun run typecheck`, `bun test` before pushing.

---

## 3. Plan Steps

Sequenced so the docs are never in a broken state; each phase (except Phase 1, an issue artifact) is a candidate PR — one logical change each.

### Phase 0 — Align (before coding)

- ✅ **Resolved by tech owner (Satoshi, 2026-05-26)** — see "Decisions" below. Direction: rewrite-for-hub; delete ShipKit docs + add redirects; make search public; no engine changes. **Still open:** canonical submission flow needs Lacy — draft `submitting/` with placeholder content for now, finalize with Lacy later.

### Phase 1 — Inventory & target structure (part of the Phase 0 issue, not a PR)

- Produce a table classifying every existing doc: **keep / rewrite / delete / archive**.
- Decide the target **flat** sidebar structure for the hub (one folder level — see §2 nesting limit), e.g.:
  - `getting-started/` — what the hub is, how to browse/search plugins
  - `submitting/` — publish an npm package, manifest format, how the indexer picks it up
  - `registry/` — registry schema, categories, slug rules (ref `registry/schema.json`)
  - `reference/` — API routes that still apply
- This is an **issue artifact** (lives in the Phase 0 alignment issue / a progress tracker), not a standalone code PR.

### Phase 2 — Rewrite the index (sets the tone)

- Rewrite `docs/index.mdx` for Paperclip Hub: one-line what-it-is, links to getting-started / submitting / registry. Kill ShipKit feature/integration grids.
- **Smallest, highest-signal PR — do this first after alignment.** (The `POPULAR_DOCS` fix is deliberately deferred to Phase 3b, after the hub pages it points to actually exist — see below.)

### Phase 2b — Make search public (objective 3)

- In `src/app/(app)/api/docs/search/route.ts`: remove the auth gate (`401`) so the existing JSON `DocsSearchService` path serves everyone. Keep (or relax to IP-based) rate limiting. Optionally drop the unused OpenAI streaming path as cleanup.
- No change needed to the search UI/hook — they already request `Accept: application/json`.
- Verify search works while logged out. _Touches a route → its own focused PR._ ✅ **Approved (Satoshi, 2026-05-26).**

### Phase 3 — Core hub docs (the substance)

> Folder names become sidebar sections; keep the IA **flat** (`section/page.mdx`, no nested subfolders — they're invisible in nav). Give every file a frontmatter `title:`. Avoid section `index.mdx` files (they get an ugly `/index` href). See §2 "Page mechanics".

- `getting-started/` — what the hub is; browsing/searching plugins, plugin detail pages, categories/filters (reference the actual browse route + the category enum from the schema).
- `submitting/` — document the **registry-PR flow** (the `/submit` form + `paperclip plugin submit` CLI both open a PR adding `registry/plugins/<slug>.json`) — that's what's live in-repo (no indexer code exists here). Use **placeholder content** for the npm-publish/indexer story pending Lacy. Link out to `paperclip.ing/docs` for the manifest spec; don't duplicate.
- `registry/` — registry entry shape **straight from `registry/schema.json`** (required fields, `category`/`capabilities` enums, slug/filename rules). Keep these docs in sync with the schema so future submissions can't drift.

### Phase 3b — Point search suggestions at real pages

- Now that hub pages exist, update `POPULAR_DOCS` in `docs-search.tsx` to real hub slugs. _Done after Phase 3 so we never point suggestions at 404s — honors the "never broken" principle._

### Phase 4 — Prune ShipKit docs

- **Redirect/SEO checkpoint FIRST (before deleting anything):** the docs `not-found.tsx` silently redirects every missing slug to `/docs`, and `src/config/redirects.ts` only covers `/doc`,`/docs`,`/documentation`. ✅ **Decision (Satoshi):** add an explicit redirect in `src/config/redirects.ts` for each deleted URL (not the silent fallback). Then verify `src/app/sitemap.ts` (it discovers/emits docs routes) produces correct output after deletions, and decide whether to expose the (currently commented-out) sitemap in `src/app/robots.ts` now that docs are the public product face.
- Delete/archive the ShipKit-only docs identified in Phase 1 (auth/payment providers, CMS, visual builder, AI, etc.).
- Verify the sidebar is clean and no internal links 404 (the engine rebuilds nav from the filesystem).
- Decide the fate of the ShipKit planning files `docs/DOCS_OVERHAUL_PLAN.md` and `docs/DOCS_OVERHAUL_PROGRESS.md` — title-less so not in sidebar, but stale. Remove or move out of `docs/`. (This plan, `docs/PAPERCLIP_HUB_DOCS_PLAN.md`, is also title-less and won't appear in nav.)

### Phase 5a — Reference rewrite

- `reference/api.mdx` — trim to API routes that exist in this repo (e.g. `/api/docs/search`, registry-related routes); drop ShipKit-only routes.

### Phase 5b — De-ShipKit sweep & screenshots

- **Fix hardcoded ShipKit copy in the route itself:** `src/app/(app)/docs/[[...slug]]/page.tsx:33-34,51-53` has "Build Better Apps Faster" / "production-ready applications" default metadata — `siteConfig` is already correct, but these literals are not.
- Sweep all `/docs` link _entry points_ for stale text, not just nav/header: `src/app/(app)/submit/page.tsx`, `plugins/[slug]/page.tsx`, `(home)/page.tsx`, `checkout/success/page.tsx`, `api/download/route.ts`, `src/config/routes.ts`. Plus any remaining `shipkit`/ShipKit mentions and broken cross-links.
- **Remove stale ShipKit screenshots** in `docs/images/` (`homepage.jpg`, `sign-in.jpg`, `setup-wizard.jpg`, `404.jpg`, `features-comparison.jpg`) and the `.mdx` embeds referencing them.
- Optional: add hub UI screenshots (browse, plugin detail, submit) only where they save the reader guessing.

### Per-PR checklist (every phase)

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test` passes (if touched)
- [ ] `/docs` and affected pages render locally; no dead sidebar/search links
- [ ] Conventional Commit title (`docs: …`), filled PR template + test plan
- [ ] Address Gemini/Claude review feedback before merge

### Suggested execution order

Phase 0 (incl. Phase 1 inventory) → 2 → 2b → 3 → 3b → 4 → 5a → 5b. Index rewrite first for a fast visible win; search-public early since broken search hurts every page; `POPULAR_DOCS` only after its target pages exist (3b); pruning + the redirect/sitemap checkpoint after replacement content exists, so docs never regress to empty.

### Definition of done

- `/docs` describes Paperclip Hub (browse, submit, registry); no ShipKit content or screenshots remain.
- Sidebar shows only hub sections; no internal link or `POPULAR_DOCS` entry 404s.
- Search returns results while logged out (auth gate removed).
- Every shipped doc has a frontmatter `title:`; `bun run lint`, `typecheck`, and `test` pass.

### Decisions (resolved by Satoshi, tech owner — 2026-05-26)

1. **Submission flow — PENDING LACY.** No indexer code exists in-repo; the real, working flow is the registry-PR path (the `/submit` form + `paperclip plugin submit` CLI both open a PR adding `registry/plugins/<slug>.json`). Draft `submitting/` against that flow with **placeholder content** for the npm-publish/indexer story; finalize with Lacy before that PR merges.
2. ✅ **Make `/docs` search public — YES.** Remove the auth gate (Phase 2b).
3. ✅ **Prune ShipKit docs — DELETE + add explicit redirects** in `src/config/redirects.ts` for old URLs (don't rely on the silent `/docs` fallback).
4. ⏸️ On-page TOC in the right rail — not decided; treat as out of scope unless raised later.
5. ✅ **Engine tweaks — NONE.** Work around in content: keep IA flat, avoid section `index.mdx`, don't rely on section ordering. No `src/lib/docs.ts` changes.
