# Deployment Guide

## Overview

| Component | Hosting  | Free Tier                         |
| --------- | -------- | --------------------------------- |
| Frontend  | Netlify  | 100 GB bandwidth, 300 build min   |
| Backend   | Render   | 750 hours/month, auto-sleep       |
| Database  | Render   | Free PostgreSQL (90-day retention) |

## Frontend — Netlify

### Initial Setup

1. Push the repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) and click "Add new site" > "Import an existing project"
3. Connect your GitHub repo
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `client/dist`
   - **Node version**: Set `NODE_VERSION=20` in environment variables
5. Add environment variable:
   - `VITE_API_URL` = `https://your-render-app.onrender.com/api`
6. Deploy

The `netlify.toml` at the repo root pre-configures these settings, so Netlify should auto-detect them.

### How It Works

- Netlify builds the React app into static files
- The `[[redirects]]` rule in `netlify.toml` sends all routes to `index.html` (required for client-side routing)
- Environment variables prefixed with `VITE_` are embedded at build time

## Backend — Render

### Option A: Blueprint (Recommended)

1. Push the repo to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) and click "New" > "Blueprint"
3. Connect your GitHub repo
4. Render reads `render.yaml` and auto-creates:
   - A **Web Service** for the server
   - A **PostgreSQL database**
5. Set the `CLIENT_URL` environment variable to your Netlify URL (e.g., `https://your-app.netlify.app`)
6. Deploy

### Option B: Manual Setup

1. **Create a PostgreSQL database**:
   - Go to Render dashboard > "New" > "PostgreSQL"
   - Name: `ai-diary-db`
   - Plan: Free
   - Copy the **Internal Database URL**

2. **Create a Web Service**:
   - Go to "New" > "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: `ai-diary-server`
     - **Root Directory**: `server`
     - **Build Command**: `pnpm install && pnpm run db:generate && pnpm run build`
     - **Start Command**: `pnpm run start`
     - **Plan**: Free
   - Add environment variables:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = (paste the Internal Database URL)
     - `CLIENT_URL` = `https://your-app.netlify.app`

### Database Migrations

After deploying, run migrations via Render Shell or a deploy hook:

```bash
cd server && pnpm run db:push
```

## Post-Deployment Checklist

- [ ] Backend health check works: `GET https://your-server.onrender.com/api/health`
- [ ] Frontend loads at your Netlify URL
- [ ] Frontend can reach the backend API (check browser console for CORS errors)
- [ ] `CLIENT_URL` on Render matches your exact Netlify URL (no trailing slash)
- [ ] `VITE_API_URL` on Netlify matches your exact Render URL + `/api`

## Free Tier Limitations

### Netlify
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited static sites

### Render
- Web services spin down after 15 minutes of inactivity (first request after sleep takes ~30 seconds)
- Free PostgreSQL databases expire after 90 days (you can recreate and re-migrate)
- 750 free instance hours/month

## Custom Domain (Optional)

### Netlify
1. Go to Site settings > Domain management > Add custom domain
2. Update DNS records as instructed
3. Netlify auto-provisions HTTPS via Let's Encrypt

### Render
1. Go to your Web Service > Settings > Custom Domains
2. Add your domain and update DNS
3. Render auto-provisions HTTPS
