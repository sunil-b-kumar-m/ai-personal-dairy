# AI Personal Diary

An AI-powered personal diary application built as a fullstack TypeScript monorepo.

## Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | React 19, Vite, Tailwind CSS, react-hot-toast     |
| Backend        | Express, Prisma, Zod, Passport.js                 |
| Authentication | JWT (httpOnly cookies), bcrypt, OAuth 2.0          |
| Database       | PostgreSQL                                        |
| Language       | TypeScript (strict mode)                          |
| Monorepo       | pnpm workspaces, Turborepo                        |
| Deployment     | Netlify (client), Render (server + DB)            |

## Features

- Local authentication (email/password registration & login)
- OAuth login (Google, Microsoft/Outlook)
- JWT session management (access + refresh tokens in httpOnly cookies)
- Fully dynamic RBAC — create/edit/delete roles and permissions from the admin UI
- 4 default roles: Admin, User, Financer, Family
- Admin panel for managing users, roles, and permissions
- Permission-guarded routes (both API and frontend)

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.15 (`corepack enable` to activate)
- **PostgreSQL** running locally (or use the Render free tier)

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-personal-dairy

# 2. Install dependencies
corepack enable
pnpm install

# 3. Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your DB credentials and JWT secret

# 4. Set up the database
cd server
pnpm run db:push        # Push schema to database
pnpm run db:generate    # Generate Prisma client
pnpm run db:seed        # Seed roles, permissions, and admin user
cd ..

# 5. Start development
pnpm dev
```

This starts both the client (http://localhost:5173) and server (http://localhost:4000) concurrently.

### Default Admin Credentials

After seeding, you can log in with:

- **Email**: `admin@diary.app`
- **Password**: `Admin@123456` (configurable via `ADMIN_SEED_PASSWORD` env var)

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start all packages in dev mode           |
| `pnpm build`         | Build all packages                       |
| `pnpm lint`          | Lint all packages                        |
| `pnpm type-check`    | Type-check all packages                  |
| `pnpm clean`         | Remove all build artifacts               |
| `pnpm dev:client`    | Start only the frontend                  |
| `pnpm dev:server`    | Start only the backend                   |
| `pnpm build:client`  | Build only the frontend                  |
| `pnpm build:server`  | Build only the backend                   |

### Server-specific Scripts

| Command                                        | Description                       |
| ---------------------------------------------- | --------------------------------- |
| `pnpm --filter @diary/server run db:push`      | Push Prisma schema to database    |
| `pnpm --filter @diary/server run db:generate`  | Regenerate Prisma client          |
| `pnpm --filter @diary/server run db:migrate`   | Create and run a migration        |
| `pnpm --filter @diary/server run db:seed`      | Seed default roles & admin user   |
| `pnpm --filter @diary/server run db:studio`    | Open Prisma Studio (DB GUI)       |

## Project Structure

See [docs/architecture.md](docs/architecture.md) for the full folder structure, database schema, auth flows, and API reference.

## Deployment

See [docs/deployment.md](docs/deployment.md) for step-by-step Netlify and Render deployment instructions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, conventions, and how to add new features.

## License

MIT
