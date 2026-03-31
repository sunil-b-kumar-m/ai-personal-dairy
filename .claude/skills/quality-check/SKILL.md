---
name: quality-check
description: Pre-push quality checklist. Runs lint, spell check, type checking, build, and tests across the entire monorepo. Use before pushing code, before creating PRs, or to verify the project is in a clean state.
---

# Quality Check

Run the full quality checklist for the monorepo before pushing.

## Checklist

Run each step in order. Stop at the first failure and fix it before continuing.

### Step 1: Lint (all workspaces)

```bash
pnpm run lint
```

All workspaces must pass with zero errors. Warnings are acceptable but should be reviewed.

### Step 2: Spell Check

```bash
pnpm run spell-check
```

If unknown words appear, add legitimate project terms to `cspell.json` `words` array. Fix actual typos.

### Step 3: Type Check (all workspaces)

```bash
pnpm run type-check
```

Zero TypeScript errors allowed.

### Step 4: Build (all workspaces)

```bash
pnpm run build
```

Both client and server must build cleanly.

### Step 5: Tests (all workspaces)

```bash
pnpm run test
```

All tests must pass. No skipped tests without a tracking issue.

## Summary

After all steps pass, report:
- Lint: PASS/FAIL (error count)
- Spell Check: PASS/FAIL (unknown words)
- Type Check: PASS/FAIL (error count)
- Build: PASS/FAIL
- Tests: PASS/FAIL (pass/fail/skip counts)

If any step fails, list the specific failures and suggest fixes.
