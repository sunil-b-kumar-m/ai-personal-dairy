---
name: add-api
description: Use when adding a new API endpoint to the server. Scaffolds route, controller, service, Zod validation, and test file following project conventions. Optionally adds Prisma model and auth middleware.
---

# Add API Endpoint

Scaffold a complete API endpoint following the project's Controller-Service-Model pattern.

## Usage

```
/add-api <resource-name> [--protected] [--permission <name>] [--model]
```

**Examples:**
- `/add-api entries` — Public CRUD for entries
- `/add-api entries --protected --permission diary` — Protected with `diary.read`, `diary.create`, etc.
- `/add-api entries --model` — Also create Prisma model

## What Gets Created

| File | Content |
|------|---------|
| `server/src/routes/<resource>.ts` | Route definitions with optional auth middleware |
| `server/src/controllers/<resource>.ts` | Request handlers with Zod validation |
| `server/src/services/<resource>.ts` | Business logic with Prisma queries |
| `server/src/__tests__/<resource>.test.ts` | Vitest + supertest integration tests |
| `server/src/app.ts` | **Modified**: register new route |

If `--model` is specified:
| `server/prisma/schema.prisma` | **Modified**: add new model |

If `--protected` is specified:
| `server/src/routes/<resource>.ts` | Includes `authenticate` + `authorize` middleware |

## Process

### Step 1: Gather Information

Ask the user (if not provided via args):
- Resource name (singular, e.g. "entry")
- Fields for the model (if `--model`)
- Which CRUD operations to include (GET list, GET by id, POST, PUT, DELETE)
- Whether routes need authentication/authorization
- Permission module name (e.g. "diary" creates `diary.read`, `diary.create`, etc.)

### Step 2: Create Files

Follow this exact order:

1. **Prisma model** (if `--model`): Add to `schema.prisma`, run `db:push` and `db:generate`
2. **Service**: Create with Prisma queries for each CRUD operation
3. **Controller**: Create with Zod schemas for request validation, calls service
4. **Route**: Create with Express Router, apply middleware if `--protected`
5. **Register route**: Add import and `app.use()` line to `server/src/app.ts`
6. **Test file**: Create with supertest tests for each endpoint

### Step 3: Code Conventions (MUST follow)

**Route file:**
```typescript
import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const entriesRouter: RouterType = Router();
entriesRouter.use(authenticate);  // if protected
entriesRouter.get("/", authorize("diary.read"), getEntries);
```

**Controller functions:**
```typescript
import { getParam } from "../utils/params.js";  // for req.params.id

export async function getEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParam(req.params.id);  // REQUIRED: handles string | string[]
    // ... Zod validation, service call
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}
```

**Service functions:**
```typescript
import { prisma } from "../models/prisma.js";
```

**Test file:**
- Use `supertest` with `import app from "../app.js"`
- Test auth (401 without token, 403 without permission)
- Test validation (400 for bad input)
- Test CRUD operations (200/201/404)
- Clean up test data in `afterAll`

### Step 4: Update Documentation

**MANDATORY** — update these docs:
- `docs/architecture.md`: Add endpoints to API Reference, add model to Database Schema (if new)
- `docs/adding-features.md`: Only if a new pattern was introduced

### Step 5: Verify

```bash
pnpm --filter @diary/server run type-check
pnpm --filter @diary/server run test
```

## Common Mistakes

- Forgetting `getParam(req.params.id)` — Express v5 params are `string | string[]`
- Forgetting `.js` extension in imports (ESM requires it)
- Not adding `type RouterType` annotation (causes TS2742 errors)
- Not updating `app.ts` to register the route
- Not updating docs
