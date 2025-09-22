#!/usr/bin/env bash
# Interactive helper: Use Vercel CLI to add environment variables to your Vercel project.
# Prerequisites: npm i -g vercel ; vercel login
# Run this locally where you have access to your Vercel account.

set -euo pipefail

echo "This script will show the commands to add environment variables in Vercel."

echo "1) Add DATABASE_URL (you will be prompted to paste the value):"
echo "   vercel env add DATABASE_URL production"

echo "2) Add VITE_API_BASE_URL (frontend needs this to call backend):"
echo "   vercel env add VITE_API_BASE_URL production"

echo "3) If you want the same values for preview/staging, run:
   vercel env add DATABASE_URL preview
   vercel env add VITE_API_BASE_URL preview"

echo "Notes: When prompted, paste the exact connection string, for example (URL-encoded password):"
echo "  postgresql://postgres:anttechsupport%401313@0.tcp.ngrok.io:12345/my_local_db"

echo "To list existing envs: vercel env ls"

echo "To remove an env: vercel env rm DATABASE_URL production"

echo "\nSecurity: Do not commit secrets to the repo. Run these commands locally to securely store values in Vercel."
