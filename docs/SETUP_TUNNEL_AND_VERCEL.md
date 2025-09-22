# Tunnel + Vercel setup (safe, exact commands)

DO NOT commit secrets into the repository. Use the commands below locally and paste secrets into Vercel UI or Vercel CLI when prompted.

## Option A — Expose your local Postgres with ngrok (quick)
1. Install ngrok: https://ngrok.com/download
2. Start TCP tunnel for Postgres (run locally where Postgres listens):

   ngrok tcp 5432

3. ngrok will print a forwarding address like `0.tcp.ngrok.io:12345`.
4. Build a DATABASE_URL using the forwarded host/port. If your DB password contains `@`, URL-encode it (`@` → `%40`). Example (do NOT store in repo):

   DATABASE_URL="postgresql://postgres:REPLACE_WITH_URLENCODED_PASSWORD@0.tcp.ngrok.io:12345/my_local_db"

5. In Vercel (web UI): Project → Settings → Environment Variables → Add `DATABASE_URL` (choose `Preview`/`Production`), paste the value and save.

   Or use Vercel CLI to add (you will be prompted for the value):

   vercel env add DATABASE_URL production

6. Also set frontend API base URL so client calls backend correctly:

   VITE_API_BASE_URL=https://<your-backend-domain>/api/v1

   Add this as `VITE_API_BASE_URL` in Vercel envs.

7. Deploy and check health endpoints:

   curl https://<your-backend-domain>/api/health
   curl https://<your-frontend-domain>/api/v1/health

Notes: ngrok tunnels are ephemeral; for a stable public endpoint use a cloud DB.

---

## Option B — Create SSH tunnel (if you have a public server)
1. From your local machine run (keeps port 5432 locally forwarded through remote):

   ssh -N -L 5432:localhost:5432 your-user@public-host.example.com

2. On the public host, run a small proxy (e.g., socat) to expose the local forwarded port to a public port OR use the public host IP in DATABASE_URL:

   DATABASE_URL="postgresql://postgres:REPLACE_WITH_URLENCODED_PASSWORD@public-host.example.com:5432/my_local_db"

3. Add to Vercel as `DATABASE_URL` via UI or CLI (see above).

---

## Security and practical notes
- Do not commit credentials to git. Use Vercel UI or `vercel env` to store secrets.
- For production, prefer a managed DB (Neon, Supabase, AWS RDS) with proper networking.
- If you need a persistent public DB quickly, consider Neon (next doc) or Supabase.

---

## I already set the dev-server DATABASE_URL (dev environment only)
I have set the dev server environment variable for the running preview environment; that does not change Vercel project variables or repository files.
