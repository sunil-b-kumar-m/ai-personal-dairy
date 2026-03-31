---
name: doc-check
description: Use when completing a feature, before committing, or when unsure if documentation is in sync with the codebase. Verifies architecture.md, deployment.md, adding-features.md, and README.md against actual code.
---

# Documentation Check

Verify that all project documentation is in sync with the current codebase.

## What It Checks

| Doc File | Verified Against |
|----------|-----------------|
| `docs/architecture.md` | Folder structure, DB schema, API routes, env vars, middleware |
| `docs/deployment.md` | Render/Netlify configs, env vars, post-deploy checklist |
| `docs/adding-features.md` | Patterns match actual code conventions |
| `README.md` | Tech stack, scripts, setup steps |

## Process

1. **Scan code for truth:**
   - Read `server/prisma/schema.prisma` — list all models
   - Read `server/src/app.ts` — list all registered routes
   - Read `server/src/config/env.ts` — list all env vars
   - Glob `server/src/routes/*.ts` — list all route files
   - Glob `server/src/controllers/*.ts` — list all controllers
   - Glob `server/src/middleware/*.ts` — list all middleware
   - Glob `client/src/pages/**/*.tsx` — list all pages
   - Glob `client/src/components/features/**/*.tsx` — list all feature components
   - Read `client/src/App.tsx` — list all frontend routes
   - Read `client/src/components/layout/Header.tsx` — check nav links
   - Read `package.json`, `server/package.json`, `client/package.json` — check scripts and deps

2. **Compare against docs:**
   - Read each doc file
   - Check every code entity appears in the relevant doc section
   - Check no doc references stale/removed code

3. **Report findings:**
   - List what's **missing** from docs (code exists, doc doesn't mention it)
   - List what's **stale** in docs (doc mentions it, code doesn't have it)
   - List what's **outdated** (doc describes it differently than code)

4. **Fix or report:**
   - If invoked with `--fix`: update the docs automatically
   - If invoked without args: report only, don't modify files

## Output Format

```
--- Documentation Check ---

docs/architecture.md:
  MISSING: POST /api/entries route not in API Reference
  MISSING: Entry model not in Database Schema
  STALE: /api/legacy route listed but removed from code
  OK: Environment variables section is current

docs/deployment.md:
  OK: All env vars listed
  MISSING: New REDIS_URL env var not in deployment checklist

docs/adding-features.md:
  OK: Patterns match current conventions

README.md:
  MISSING: redis dependency not in Tech Stack

Summary: 3 issues found (2 missing, 1 stale)
```
