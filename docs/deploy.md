# Deploy Anvaya — zero-cost split

Two-host split, all free tiers:

- **Frontend** → Vercel Hobby (free) — `frontend/vercel.json`
- **Backend** → Render Free Web Service — `backend/render.yaml` + `backend/Dockerfile`
- **Postgres** → Neon Free (512MB, no expiration)
- **Redis** → Upstash Free (256MB, 10k commands/day)
- **Email** → Resend free tier (100 emails/day, 3k/month)
- **Errors** → Sentry Developer plan (5k events/month)
- **Uptime ping** → UptimeRobot free (50 monitors, 5-min interval)
- **Source control** → GitLab
- **Backend CI/CD** → Jenkins → Render deploy hook
- **Frontend CI** → GitLab CI (lint/test); Vercel auto-deploys on push

**Catch on Render Free:** spins down after 15 min of idle, ~30-60s cold start on the next request. UptimeRobot pinging `/health` every 5 min keeps it warm during the day. When you have paying customers, switch to Render Starter ($7/mo, no spin-down).

## 1. Provision managed services (15 min, one-time, all free)

| Service | Where | What you get |
|---|---|---|
| Postgres | https://neon.tech | `postgresql://...neon.tech/...?sslmode=require` |
| Redis | https://upstash.com | `rediss://default:...@...upstash.io:6379` |
| Stripe (test) | https://dashboard.stripe.com/test/apikeys | `STRIPE_TEST_SECRET_KEY` + `STRIPE_PRO_PRICE_ID` (after creating a product) |
| Stripe webhook | https://dashboard.stripe.com/test/webhooks | Endpoint at `{APP_URL}/stripe/webhook/`, subscribe to `customer.subscription.*` + `invoice.payment_failed`, copy `whsec_...` |
| Resend | https://resend.com/api-keys | `re_...` |
| Sentry | https://sentry.io | Backend DSN |
| Uptime | https://uptimerobot.com | Pinger for `https://api.anvaya.dev/health` every 5 min |

## 2. Deploy backend to Render

```bash
# 1. Sign up at https://render.com (free, no CC needed for Free tier).
# 2. Dashboard → New → Blueprint → connect your GitLab account → select the repo.
# 3. Render reads backend/render.yaml automatically.
# 4. In the dashboard, fill in the `sync: false` env vars from step 1's services:
#    DATABASE_URL, REDIS_URL, FRONTEND_URL, CORS_ALLOWED_ORIGINS, APP_URL,
#    ALLOWED_HOSTS, STRIPE_TEST_SECRET_KEY (optional), STRIPE_PRO_PRICE_ID,
#    DJSTRIPE_WEBHOOK_SECRET, RESEND_API_KEY, SENTRY_DSN.
# 5. Click Deploy. First deploy takes ~3-4 min (Docker build + migrate).
```

Render assigns `https://anvaya-backend.onrender.com`. For a custom domain (e.g. `api.anvaya.dev`): Service → Settings → Custom Domains → add `api.anvaya.dev`; create a CNAME at your registrar pointing to the Render host.

## 3. Deploy frontend to Vercel

```bash
cd frontend
npx vercel link                                # one-time
npx vercel env add VITE_API_URL production     # paste https://api.anvaya.dev
npx vercel env add VITE_SENTRY_DSN production  # optional
npx vercel --prod
```

Or: dashboard.vercel.com → Import → connect GitLab → pick the repo → Vercel auto-detects `frontend/vercel.json` and deploys on every push to `main`.

## 4. UptimeRobot warm-up (kills the cold-start UX problem)

1. Sign up at https://uptimerobot.com
2. Add Monitor → HTTP(s) → URL `https://api.anvaya.dev/health` → interval `5 minutes`
3. Done. Your backend now gets a free HEAD request every 5 minutes, which keeps the Render Free dyno warm during your active hours.

This is a $0 hack — when you outgrow it, upgrade Render to Starter ($7/mo) and delete the monitor.

## 5. Jenkins for backend CI

`backend/Jenkinsfile` runs: lint → test → docker build → trigger Render deploy hook (main only).

**One-time setup:**
1. Stand up a Jenkins controller. Options:
   - CloudBees CI (managed, free trial)
   - Self-host on a $5 DigitalOcean droplet (which contradicts the zero-cost theme — see below)
   - **Alternative if you want to skip Jenkins entirely**: GitLab CI alone can do the same job. The `.gitlab-ci.yml` at repo root already handles lint/test; add a `deploy` job that curls the Render deploy hook. Zero extra infra.
2. Install plugins: Pipeline, Docker, GitLab, AnsiColor, Credentials Binding.
3. Add credentials:
   - `RENDER_DEPLOY_HOOK_URL` (secret text) — from Render dashboard → Service → Settings → Deploy Hook
4. Multibranch Pipeline job pointing at the GitLab repo, Jenkinsfile path `backend/Jenkinsfile`.

> **Pragmatic note**: running Jenkins for a solo-founder SaaS is the most expensive part of "zero cost" (Jenkins host + maintenance). If true zero-cost is the goal, replace Jenkins with the existing `.gitlab-ci.yml` and use Render's auto-deploy on `main`. Jenkinsfile stays in the repo for when you scale.

## 6. GitLab CI for the frontend

The existing `.gitlab-ci.yml` handles frontend lint/test/build. Vercel auto-deploys frontend on push; GitLab CI gates merges with lint + tests.

## 7. Post-deploy verification

```bash
curl https://api.anvaya.dev/health           # { "status": "ok" }
curl https://app.anvaya.dev/                 # landing renders
```

Sign up via the frontend, complete onboarding, generate code, hit `/o/{slug}/settings/billing`. With Stripe keys filled, click Upgrade to test Stripe Checkout. Without keys, expect the graceful 503 toast.

## 8. Migrating origin from GitHub → GitLab

Current `origin` points at `github.com/Karnav018/Anvaya.git`. To switch:

```bash
# Create the project on GitLab first (gitlab.com → New Project → Blank, name "anvaya")
git remote rename origin github
git remote add origin git@gitlab.com:<your-namespace>/anvaya.git
git push -u origin main
git push origin --all
git push origin --tags
```

After this, Render's blueprint repo URL (update `render.yaml`) and Jenkins/GitLab CI webhooks point at GitLab.

## Cost summary at month 1

| Service | Cost |
|---|---|
| Render Free Web Service | $0 |
| Neon Free Postgres | $0 |
| Upstash Free Redis | $0 |
| Vercel Hobby | $0 |
| Resend Free | $0 |
| Sentry Developer | $0 |
| UptimeRobot Free | $0 |
| Stripe (test mode) | $0 |
| GitLab Free | $0 |
| Cloudflare DNS (optional) | $0 |
| Jenkins (if self-hosted) | $5/mo or skip → use GitLab CI free |
| **Total** | **$0 (or $5 if you insist on Jenkins host)** |

When you start charging customers: upgrade Render to Starter ($7/mo) to kill spin-down. Everything else stays free until you outgrow it.
