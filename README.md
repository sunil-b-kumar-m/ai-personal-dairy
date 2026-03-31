# AI Personal Diary

An AI-powered personal diary application built as a fullstack TypeScript monorepo.

## Tech Stack

| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Frontend    | React 19, Vite, Tailwind CSS            |
| Backend     | Express, Prisma, Zod                    |
| Language    | TypeScript (strict mode)                |
| Database    | PostgreSQL                              |
| Monorepo    | pnpm workspaces, Turborepo             |
| Deployment  | Netlify (client), Render (server + DB)  |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.15 (`corepack enable` to activate)
- **PostgreSQL** (local dev) or use the Render free tier

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

# 4. Set up the database
cd server
pnpm run db:push      # Push schema to database
pnpm run db:generate   # Generate Prisma client
cd ..

# 5. Start development
pnpm dev
```

This starts both the client (http://localhost:5173) and server (http://localhost:4000) concurrently.

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

## Project Structure

See [docs/architecture.md](docs/architecture.md) for the full folder structure and architecture details.

## Deployment

See [docs/deployment.md](docs/deployment.md) for step-by-step Netlify and Render deployment instructions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, conventions, and how to add new features.

## License

MIT
