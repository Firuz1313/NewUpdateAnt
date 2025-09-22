# Neon (recommended) + Vercel setup (exact steps)

Neon offers serverless Postgres with an easy connection string and works well with Vercel.

## Create Neon DB
1. Create an account at https://neon.tech and create a new project/branch (free tier available).
2. Create a database and user (Neon UI will provide a connection string like `postgresql://<user>:<pw>@ep-xxx.neon.tech/<db>?sslmode=require`).
3. Copy the connection string. Do NOT paste it into the repo.

## Add connection to Vercel (via web UI)
1. Open your project on Vercel.
2. Go to Settings → Environment Variables.
3. Add a new variable:
   - Name: `DATABASE_URL`
   - Value: the Neon connection string (exact)
   - Environment: `Preview` and `Production` as needed
4. Add `VITE_API_BASE_URL` with `https://<your-backend-domain>/api/v1` if backend is hosted separately.

## Add connection to Vercel (via CLI)
1. Install Vercel CLI: `npm i -g vercel` or `pnpm add -g vercel`.
2. Login: `vercel login`.
3. For production variable:

   vercel env add DATABASE_URL production

   Paste the Neon connection string when prompted.

4. Also add preview/staging variables if needed:

   vercel env add DATABASE_URL preview
   vercel env add DATABASE_URL development

## After adding env vars
1. Re-deploy your Vercel project (trigger a new deploy in the dashboard or `vercel --prod`).
2. Check logs in Vercel Deployments → View Functions/Logs for connection errors.
3. Hit health endpoint: `curl https://<backend-domain>/api/health`.

## Local development using Neon
1. Keep local `.env` with your local DB for dev, do NOT commit secrets.
2. Use `DATABASE_URL` locally to point to local DB or Neon depending on workflow.

## If you want, I can:
- Prepare a `.env.example` (no secrets) and docs (done).
- Add safe checks in code to log masked DB URL (already present in backend/config/database.js).


---

Available MCP integrations that help with DB and deployment: Neon, Netlify, Zapier, Figma, Supabase, Builder.io, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres. Use [Open MCP popover](#open-mcp-popover) to connect them.
