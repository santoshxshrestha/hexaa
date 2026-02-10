# Agent Guide (hexaa)

Next.js (App Router) + TypeScript (`strict`) + Tailwind v4. Package manager is `pnpm`.

## Tooling Snapshot

- Lint: ESLint v9 flat config in `eslint.config.mjs`.
- Types: TypeScript `noEmit: true` in `tsconfig.json`.
- CSS: Tailwind via PostCSS (`postcss.config.mjs`, `app/globals.css`).
- Auth: NextAuth in `app/api/auth/[...nextauth]/route.ts`.
- DB: Prisma schema in `schema.prisma` (Prisma client not currently wired).
- Cursor / Copilot rules: none found (`.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`).

## Repo Layout

- `app/`: App Router pages/layout, route handlers, global CSS.
- `lib/`: shared server-side utilities.
- `public/`: static assets.

Notes:

- `next-env.d.ts` is generated; do not edit.
- There is an `app/lib/prisma.ts` file, but `lib/prisma.ts` is the active Prisma singleton; prefer `lib/prisma.ts` for imports.

`README.md` is still the default Next.js template; prefer `AGENTS.md` as the source of truth for repo-specific commands and conventions.

## Commands

Install / dev / build:

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

Lint / typecheck:

```bash
pnpm lint
pnpm exec tsc -p tsconfig.json --noEmit
```

Passing extra args to the lint script:

```bash
# Pass-through to eslint
pnpm lint -- --max-warnings=0
pnpm lint -- --cache
```

Single-target lint (fast feedback):

```bash
pnpm lint app/page.tsx
pnpm lint app/api/auth/[...nextauth]/route.ts
pnpm lint --fix app/page.tsx
```

## Tests (Single Test Emphasis)

No test runner is configured yet (no `pnpm test` script; no `*.test.*` files found).

If you add tests, include a “run one test” command. Recommended options:

```bash
# Node built-in runner
node --test
node --test path/to/some.test.ts
```

If you add Vitest later, expose scripts like `pnpm test` and `pnpm test path/to/file.test.ts`.

## Environment Variables / Secrets

- Never commit secrets; `.env*` is gitignored in `.gitignore`.
- NextAuth currently reads:
  - `GITHUB_ID`, `GITHUB_SECRET`
  - `GOOGLE_ID`, `GOOGLE_SECRET`
- Prisma datasource expects:
  - `POSTGRES_PRISMA_URL` (pooled)
  - `POSTGRES_URL_NON_POOLING` (direct)

If you introduce new env vars, prefer a single validation module (e.g., `lib/env.ts`) that fails fast with clear messages.

## Code Style

Formatting:

- 2-space indentation; keep semicolons.
- Prefer double quotes in TS/JS.
- Avoid reformat-only diffs; keep changes scoped.

Imports:

- Order groups with blank lines: Node built-ins, external packages, `@/…` absolute, relative, styles.
- Use type-only imports: `import type { X } from "..."`.
- Prefer `@/*` path alias (from `tsconfig.json`).

React / JSX:

- Server Components first; keep Client Components small and leaf-level.
- Avoid importing server-only modules (DB, env secrets) into Client Components.
- Prefer semantic HTML; keep interactive elements accessible (labels, button types, keyboard/focus).

TypeScript:

- Keep `strict` clean; avoid `any`.
- Use `unknown` for untrusted inputs, narrow via runtime checks.
- Avoid `as` casts unless invariant is clear (document it).
- Add explicit return types for exported helpers.
- Prefer `import type` for types and `satisfies` for object shape checks when useful.

Naming:

- Components: `PascalCase`; hooks: `useThing`; functions/vars: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only when truly module-constant.
- Follow Next.js file conventions: `page.tsx`, `layout.tsx`, `route.ts`.

Error handling:

- Validate at boundaries (route handlers, env, external API responses).
- Don’t swallow errors; return an appropriate HTTP response for API routes.
- Prefer early returns and small helpers.
- Log server errors with enough context to debug, but never log secrets or tokens.

## Next.js / App Router Notes

- Components in `app/` are Server Components by default; add `"use client"` only when needed.
- Keep server-only modules (DB, secrets) out of Client Components.
- For non-NextAuth route handlers, prefer explicit `export async function GET/POST` and `NextResponse`.

Route handlers:

- Validate request bodies (don’t trust `req.json()` output).
- Return correct status codes (`400` bad input, `401/403` auth, `404` missing, `500` unexpected).
- Keep handlers thin; move logic into `lib/` helpers to reuse and test.

## Tailwind / CSS

- Keep globals in `app/globals.css`; prefer utilities for layout/spacing.
- Add new global selectors only when truly necessary.
- Prefer CSS variables for design tokens; the template already defines `--background`/`--foreground`.

## Prisma

- Prisma schema exists at `schema.prisma`.
- Prisma client is not currently installed/generated in this repo; if you decide to use Prisma at runtime, add `@prisma/client` + `prisma` and ensure engines work in your environment (Nix often needs extra setup).

## Before Shipping

```bash
pnpm lint
pnpm exec tsc -p tsconfig.json --noEmit
pnpm build
```

Optional: `nix develop` uses `flake.nix` to provide Node/pnpm tooling.
