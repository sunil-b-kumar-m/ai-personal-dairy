---
name: deploy-check
description: Use before deploying to production, after completing a major feature, or when verifying the project is in a deployable state. Checks build, types, tests, env config, Prisma schema, deploy configs, and security.
---

# Deployment Readiness Check

Comprehensive verification that the project is ready for deployment to Netlify + Render.

## Process

Run all checks in order. Stop and report on first failure category.

### Check 1: Build & Types

```bash
pnpm turbo run build type-check
```

**Pass criteria:** Exit code 0, no errors.

### Check 2: Tests

```bash
pnpm test
```

**Pass criteria:** All tests pass across shared, server, and client.

### Check 3: Environment Variables

Compare `server/src/config/env.ts` Zod schema against:
- `server/.env.example` — every required var must have an example
- `render.yaml` — every required var must be listed in envVars
- `docs/deployment.md` — every var must be documented

Compare `client/.env.example` against:
- `docs/deployment.md` — `VITE_API_URL` must be documented

**Pass criteria:** No missing env vars in any config.

### Check 4: Prisma Schema

```bash
cd server && pnpm run db:generate
```

Verify schema is valid and client can be generated.

**Pass criteria:** Exit code 0.

### Check 5: Deploy Configs

Read and verify:

**`netlify.toml`:**
- `base` = `client`
- `command` = `pnpm run build`
- `publish` = `dist`
- `[[redirects]]` rule exists for SPA routing

**`render.yaml`:**
- `buildCommand` includes `db:generate` and `build`
- `startCommand` uses `pnpm run start`
- `DATABASE_URL` comes from `fromDatabase`
- `CLIENT_URL` is listed

**Pass criteria:** All config values present and correct.

### Check 6: Security Scan

Check for common issues:
- No `.env` files committed (check `git ls-files` for `.env`)
- No hardcoded secrets in source (grep for `password`, `secret`, `apikey` in non-test ts files)
- `helmet` middleware is active in `server/src/app.ts`
- CORS is configured (not `origin: "*"` in production)
- `httpOnly: true` on auth cookies
- Password hashing uses bcrypt with salt rounds >= 10

**Pass criteria:** No security issues found.

### Check 7: Git Status

```bash
git status
git log --oneline -5
```

Verify:
- Working tree is clean (all changes committed)
- No untracked files that should be committed
- Recent commits have meaningful messages

**Pass criteria:** Clean working tree.

## Output Format

```
=== Deployment Readiness Check ===

[PASS] Build & Types — all 3 packages build clean
[PASS] Tests — 74 tests passing (9 shared, 35 server, 30 client)
[PASS] Environment Variables — all vars documented
[PASS] Prisma Schema — client generated successfully
[PASS] Deploy Configs — netlify.toml and render.yaml valid
[PASS] Security — no issues found
[PASS] Git Status — working tree clean

Result: READY TO DEPLOY
```

Or if issues found:

```
=== Deployment Readiness Check ===

[PASS] Build & Types — all 3 packages build clean
[FAIL] Tests — 2 failing in server
  - src/__tests__/auth.test.ts: should reject wrong password
  - src/__tests__/rbac.test.ts: should deny regular user
[SKIP] Remaining checks skipped due to failure

Result: NOT READY — fix 2 failing tests
```

## After All Checks Pass

Remind the user:
1. Push to GitHub: `git push origin main`
2. Netlify will auto-deploy the client
3. Render will auto-deploy the server (if Blueprint is set up)
4. Run `db:push` and `db:seed` on Render after first deploy
5. Verify with the post-deployment checklist in `docs/deployment.md`
