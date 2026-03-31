# Architecture

## Overview

The project is a **pnpm monorepo** with **Turborepo** for build orchestration. It consists of three packages that share types through the `@diary/shared` package.

```
┌──────────────────────────────────────────────────────┐
│                     Monorepo Root                     │
│  turbo.json · pnpm-workspace.yaml · package.json     │
├──────────┬──────────────┬────────────────────────────┤
│  client  │    server    │          shared             │
│  (React) │  (Express)   │   (Types & Interfaces)     │
│          │              │                             │
│ Netlify  │   Render     │  Used by both client        │
│          │   + PostgreSQL│  and server                │
└──────────┴──────────────┴────────────────────────────┘
```

## Folder Structure

```
ai-personal-dairy/
│
├── client/                          # @diary/client — React frontend
│   ├── public/                      # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── assets/                  # Images, fonts, SVGs
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI (Button, Input, Modal)
│   │   │   ├── features/            # Feature components (DiaryEditor, etc.)
│   │   │   └── layout/              # App shell (Header, Layout, Sidebar)
│   │   ├── hooks/                   # Custom React hooks (useAuth, useDiary)
│   │   ├── pages/                   # Route-level components (HomePage, etc.)
│   │   ├── services/                # API client layer
│   │   │   └── api.ts               # Typed fetch wrapper
│   │   ├── store/                   # State management
│   │   ├── styles/                  # Global CSS (Tailwind entry point)
│   │   │   └── index.css
│   │   ├── types/                   # Client-only type definitions
│   │   ├── utils/                   # Helper functions
│   │   ├── App.tsx                  # Root component with route definitions
│   │   ├── main.tsx                 # Entry point (React DOM render)
│   │   └── vite-env.d.ts           # Vite type declarations
│   ├── index.html                   # HTML template
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts               # Vite config (aliases, proxy, build)
│   └── .env.example
│
├── server/                          # @diary/server — Express backend
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Zod-validated environment variables
│   │   ├── controllers/            # Request handlers (parse → delegate → respond)
│   │   ├── middleware/
│   │   │   └── errorHandler.ts     # Global error handler
│   │   ├── models/                 # Data access layer (Prisma queries)
│   │   ├── routes/
│   │   │   └── health.ts          # Health check endpoint
│   │   ├── services/              # Business logic layer
│   │   ├── types/                 # Server-only type definitions
│   │   ├── utils/                 # Helper functions
│   │   ├── app.ts                 # Express app setup (middleware, routes)
│   │   └── index.ts               # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── shared/                         # @diary/shared — Shared types
│   ├── src/
│   │   ├── types/
│   │   │   └── api.ts             # ApiResponse, PaginatedResponse
│   │   └── index.ts               # Barrel export
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                           # Documentation
│   ├── architecture.md            # This file
│   ├── deployment.md              # Deployment guide
│   └── adding-features.md        # How to add new features
│
├── .gitignore
├── .nvmrc                         # Node.js version (20)
├── package.json                   # Root workspace scripts
├── pnpm-workspace.yaml           # Workspace package locations
├── pnpm-lock.yaml                # Lockfile
├── turbo.json                    # Turborepo task pipeline config
├── netlify.toml                  # Netlify deployment config
├── render.yaml                   # Render deployment config (server + DB)
├── README.md
└── CONTRIBUTING.md
```

## Data Flow

### Request Lifecycle (Backend)

```
Client Request
  → Express Middleware (helmet, cors, morgan, json parser)
    → Router (routes/*.ts)
      → Controller (parse & validate input with Zod)
        → Service (business logic)
          → Model (Prisma database query)
        ← Service returns result
      ← Controller sends ApiResponse
    ← Router
  ← Express error handler (if error thrown)
Client Response
```

### Frontend Architecture

```
main.tsx
  → BrowserRouter
    → App.tsx (route definitions)
      → Layout (Header + Outlet)
        → Page Component
          → Feature Components
            → services/api.ts (API calls)
            → hooks/ (shared logic)
            → store/ (state)
```

## Package Dependencies

```
@diary/client  ──depends on──→  @diary/shared
@diary/server  ──depends on──→  @diary/shared
```

Turborepo ensures `@diary/shared` is built before the dependent packages.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| pnpm workspaces + Turborepo | Fast installs, strict deps, cached parallel builds |
| Zod for env validation | Fail fast on missing config, type-safe env access |
| Prisma for ORM | Type-safe DB access, auto-generated client, easy migrations |
| Vite dev proxy | Avoids CORS issues in development, proxies `/api` to server |
| Shared types package | Single source of truth for API contracts |
| Helmet + CORS | Security headers and origin restriction out of the box |

## API Conventions

- All routes are prefixed with `/api/`
- Responses follow the `ApiResponse<T>` shape from `@diary/shared`:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

- Paginated responses extend this with `total`, `page`, `limit` fields

## Environment Variables

### Server (`server/.env`)

| Variable       | Default                    | Description               |
| -------------- | -------------------------- | ------------------------- |
| `PORT`         | `4000`                     | Server port               |
| `NODE_ENV`     | `development`              | Environment mode          |
| `CLIENT_URL`   | `http://localhost:5173`    | Allowed CORS origin       |
| `DATABASE_URL` | `file:./dev.db`            | PostgreSQL connection URL |

### Client (`client/.env`)

| Variable       | Default                    | Description               |
| -------------- | -------------------------- | ------------------------- |
| `VITE_API_URL` | `http://localhost:4000/api` | Backend API base URL     |
