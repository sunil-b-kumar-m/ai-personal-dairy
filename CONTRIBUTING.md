# Contributing

## Development Setup

1. Follow the [Getting Started](README.md#getting-started) steps
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes, ensuring `pnpm type-check` and `pnpm build` pass
4. Commit and open a pull request

## Adding a New Feature

Follow the step-by-step guide in [docs/adding-features.md](docs/adding-features.md). It covers:

- Adding a new API route (controller, service, route)
- Adding a new page/component on the frontend
- Adding shared types
- Adding a new database model

## Code Conventions

### General

- **TypeScript strict mode** is enforced across all packages
- Use **named exports** (not default exports) for utilities, types, and services
- Use **default exports** only for React page components and the Express app

### Client (`client/`)

- Components go in `src/components/` organized by:
  - `common/` — Reusable UI components (buttons, inputs, modals)
  - `features/` — Feature-specific components (diary editor, mood tracker)
  - `layout/` — Structural components (Header, Layout, Sidebar)
- Pages go in `src/pages/` — one file per route
- Custom hooks go in `src/hooks/` — prefix with `use` (e.g., `useAuth.ts`)
- API calls go through `src/services/api.ts` — never call `fetch` directly from components
- State management lives in `src/store/`
- Path alias `@/` maps to `src/` (e.g., `import { api } from "@/services/api"`)

### Server (`server/`)

- Follow the **Controller → Service → Model** pattern:
  - `controllers/` — Parse request, call service, send response
  - `services/` — Business logic, orchestrate models
  - `models/` — Prisma queries and data access
- Routes go in `routes/` — one file per resource
- Validate all request input with **Zod** schemas
- Environment variables are defined and validated in `config/env.ts`
- All routes are prefixed with `/api/`

### Shared (`shared/`)

- Only put types/interfaces that are used by **both** client and server
- Export everything through `src/index.ts`

## Database Changes

1. Edit `server/prisma/schema.prisma`
2. Run `pnpm --filter @diary/server run db:migrate` to create a migration
3. Run `pnpm --filter @diary/server run db:generate` to regenerate the Prisma client
4. Document new models in [docs/architecture.md](docs/architecture.md)

## Git Conventions

- Branch names: `feature/`, `fix/`, `docs/`, `refactor/`
- Commit messages: Use imperative mood (e.g., "Add diary entry endpoint")
- Keep PRs focused — one feature or fix per PR
