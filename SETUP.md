# Medipoint — Vercel + Neon + Pusher Setup

Run these commands **in order**. Each section is a discrete step you can verify before moving on.

---

## 1. Install new dependencies

```bash
# In your repo root:

# Switch DB driver from pg → Neon serverless
pnpm --filter @workspace/db remove pg @types/pg
pnpm --filter @workspace/db add @neondatabase/serverless drizzle-orm drizzle-zod

# Add Pusher server SDK
pnpm --filter @workspace/api-server add pusher

# Add Pusher client SDK
pnpm --filter @workspace/api-client-react add pusher-js

# Re-install everything (updates lockfile)
pnpm install
```

---

## 2. Create your .env file

```bash
cp .env.example .env
```

Fill in real values:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | neon.tech → your project → Connection Details |
| `PUSHER_APP_ID` | pusher.com → your app → App Keys |
| `PUSHER_KEY` | pusher.com → your app → App Keys |
| `PUSHER_SECRET` | pusher.com → your app → App Keys |
| `PUSHER_CLUSTER` | pusher.com → your app → App Keys |
| `VITE_PUSHER_KEY` | Same as `PUSHER_KEY` |
| `VITE_PUSHER_CLUSTER` | Same as `PUSHER_CLUSTER` |

---

## 3. Push your schema to Neon

```bash
# This creates all tables in your Neon database
pnpm db:push
```

If you get a conflict: `pnpm --filter @workspace/db run push-force`

---

## 4. Verify locally

```bash
pnpm dev
# → API running at http://localhost:3000
# → Test: curl http://localhost:3000/api/health
```

---

## 5. Deploy to Vercel

### First time
1. Go to https://vercel.com → **Add New Project**
2. Import from GitHub → `mwajonah-arch/Realtime-Data-Syncronization`
3. Vercel picks up `vercel.json` automatically — no framework settings to change

### Add environment variables
Go to **Vercel Dashboard → Project → Settings → Environment Variables**.  
Add every variable from your `.env` file **except** `PORT` and `NODE_ENV` (Vercel sets those).  
Make sure to select **Production + Preview + Development** for each.

### Deploy
```bash
git add .
git commit -m "feat: vercel deployment + neon db + pusher realtime sync"
git push origin main
```

Vercel auto-deploys on every push to `main`.

---

## 6. Add useRealtimeSync to your frontend

In any page component that shows live data:

```tsx
import { useRealtimeSync } from "@workspace/api-client-react/hooks/useRealtimeSync";

export function ProductsPage() {
  // Watches products + sales — auto-refetches when any device changes them
  useRealtimeSync(["products", "sales"]);

  const { data: products } = useGetProducts(); // your existing hook
  // ...
}

// For a dashboard that needs everything live:
export function Dashboard() {
  useRealtimeSync(); // no args = watch all entities
  // ...
}
```

---

## 7. Verify real-time sync works

1. Open your deployed app in **two different browser tabs** (or two devices)
2. Create a product in tab A
3. Tab B's product list should update within ~200ms — no refresh needed

---

## Files changed / added

```
vercel.json                                           ← updated
.env.example                                          ← new
.gitignore                                            ← updated
artifacts/api-server/
  api/index.ts                                        ← new (Vercel entry)
  package.json                                        ← + pusher, pino
  src/
    app.ts                                            ← + CORS origins for Vercel
    index.ts                                          ← unchanged (local dev)
    lib/
      logger.ts                                       ← unchanged
      pusher.ts                                       ← new
    routes/
      index.ts                                        ← unchanged
      health.ts                                       ← unchanged
      auth.ts                                         ← unchanged
      products.ts                                     ← + broadcast()
      sales.ts                                        ← + broadcast()
      stockUpdates.ts                                 ← + broadcast() x2
      transactions.ts                                 ← + broadcast()
      activityLog.ts                                  ← + broadcast()
lib/
  db/
    drizzle.config.ts                                 ← updated for Neon
    package.json                                      ← pg → @neondatabase/serverless
    src/
      index.ts                                        ← Neon driver
      schema/
        index.ts                                      ← + all exports
        products.ts                                   ← table definition
        sales.ts                                      ← table definition
        stockUpdates.ts                               ← table definition
        transactions.ts                               ← table definition
        activityLog.ts                                ← table definition
        settings.ts                                   ← table definition
  api-client-react/
    package.json                                      ← + pusher-js
    tsconfig.json                                     ← new
    src/hooks/
      useRealtimeSync.ts                              ← new
```

---

## Troubleshooting

**Build fails on Vercel with `Cannot find module '@workspace/db'`**
→ Vercel must install from the root. Confirm `installCommand` in `vercel.json` is `pnpm install` (not `pnpm install --filter`).

**Pusher events fire on server but client doesn't receive them**
→ Check browser console for a Pusher connection error. The most common cause is `VITE_PUSHER_KEY` or `VITE_PUSHER_CLUSTER` not being set in Vercel environment variables. Remember: Vite bakes these in at **build time**, so you must redeploy after adding them.

**Neon: `connection timeout` on first request after idle**
→ Expected on Neon's free tier — the DB suspends after 5 min of inactivity. The cold-start takes ~1s. Subsequent requests are instant. Upgrade to Neon Launch ($19/mo) to disable auto-suspend.

**`PUSHER_SECRET` accidentally exposed in the client bundle**
→ Never use `VITE_PUSHER_SECRET`. The `VITE_` prefix embeds values into the JS bundle. `PUSHER_SECRET` (no prefix) stays server-side only.
