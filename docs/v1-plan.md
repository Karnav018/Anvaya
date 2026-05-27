# Anvaya → Enterprise SaaS: v1 Plan (1-Month Solo Launch, Django + DRF)

## Context

Anvaya is a working full-stack MVP. The current backend is **FastAPI + asyncpg + raw SQL**, the frontend is **React 19 + ReactFlow + Zustand + Tailwind**. The product lets users design REST APIs visually and generate Express.js code. Today it is single-user, single-language, with no billing, no teams, no observability, and no code preview UI (Monaco is installed but unwired).

The goal is an enterprise-grade SaaS via a **hybrid PLG bottom-up motion**. Solo founder, 1-month v1 launch window.

**Backend stack decision:** Port from FastAPI → **Django 5 + Django REST Framework**. Rationale: Django's batteries-included ecosystem (admin, ORM, migrations, auth, `dj-stripe`, `django-organizations`-style memberships) compresses solo-founder timelines materially. The pure-Python generator pipeline (`parser.py`, `ast_builder.py`, `bundler.py`) is portable verbatim.

**Frontend:** No stack change. All current React code stays. Only the API base URL contract changes slightly.

**CI/CD:** GitLab CI (not Jenkins).

**Deployment platform:** Deferred decision — plan is platform-agnostic, choose before week 4.

---

## Roadmap shape

- **v1 (this plan, month 1):** Django port + foundation + multi-tenancy + billing + code preview UI + launch
- **v2 (months 2-4):** Multi-language generators (FastAPI, NestJS, Go), `django-auditlog` audit logs, advanced node types, real-time collab via Yjs
- **v3 (months 4-9):** SSO/SAML/SCIM via `django-allauth` + `djangosaml2`, audit log UI, enterprise tier, SOC2 Type I
- **v4 (9-12+ months):** On-prem/VPC SKU, SOC2 Type II, custom contracts, SLAs

---

## v1 — Week-by-week (5 phases: Week 0 + Weeks 1-4)

### Week 0 (Days 1-5) — Port FastAPI backend to Django + DRF

**Goal:** Replace `backend/` with a Django project that exposes the same API surface, so the existing frontend keeps working untouched.

**Setup:**
- Rename current `backend/` → `backend-legacy/` (keep as reference until port is verified, then delete in week 4)
- New `backend/` with `django-admin startproject anvaya`, layout:
  ```
  backend/
    manage.py
    pyproject.toml         # use poetry or uv
    anvaya/                # project settings
      settings/{base,dev,prod}.py
      urls.py
      asgi.py
      wsgi.py
    apps/
      accounts/            # User, auth, password reset
      orgs/                # Organizations, memberships, invites (week 2 stub here)
      projects/            # Project, Blueprint, Export models + DRF viewsets
      generator/           # Pure-Python pipeline (copied from backend-legacy verbatim)
      billing/             # dj-stripe wiring (week 3 stub here)
      common/              # base permissions, pagination, exception handler
  ```
- `pyproject.toml` deps: `Django==5.0.*`, `djangorestframework`, `djangorestframework-simplejwt`, `django-cors-headers`, `django-environ`, `psycopg[binary]`, `gunicorn`, `uvicorn` (for ASGI in dev), `structlog`, `sentry-sdk[django]`, `pytest-django`, `factory-boy`

**Models (port from existing schema in `backend-legacy/app/database.py`):**
- `apps/accounts/models.py`: custom `User(AbstractBaseUser, PermissionsMixin)` with `email` as USERNAME_FIELD, `name`, `plan`, `generations_used`, `generations_limit`, `generations_reset_at`. Set `AUTH_USER_MODEL = "accounts.User"` from the start (never retrofit).
- `apps/projects/models.py`: `Project(user=FK, name, description)`, `Blueprint(project=FK, version=int, canvas_json=JSONField)`, `Export(project=FK, user=FK, blueprint=FK nullable, language)`
- Generate `0001_initial` migration; verify schema parity with legacy Postgres via `pg_dump --schema-only` diff

**Auth — replace python-jose with simplejwt:**
- Configure `djangorestframework-simplejwt` with 15-min access, 30-day refresh tokens, rotating refresh tokens enabled, blacklist app enabled
- `apps/accounts/serializers.py`: `SignupSerializer`, `LoginSerializer`, `UserSerializer`
- `apps/accounts/views.py`: `SignupView`, `MeView` (DRF generic views); login/refresh handled by simplejwt's built-in views
- URL parity with legacy:
  - `POST /auth/signup` → returns `{user, access, refresh}`
  - `POST /auth/login` → simplejwt `TokenObtainPairView` (returns same shape)
  - `POST /auth/refresh` → simplejwt `TokenRefreshView` (new, didn't exist)
  - `POST /auth/logout` → simplejwt `TokenBlacklistView` (new)
  - `GET /auth/me` → returns serialized current user

**Projects + blueprints + exports — DRF ViewSets:**
- `apps/projects/views.py`: `ProjectViewSet(ModelViewSet)`, `BlueprintViewSet`, `ExportViewSet`
- Permission: `IsAuthenticated` + a custom `IsOwner` permission filtering `queryset = self.queryset.filter(user=request.user)` in `get_queryset()`
- URL parity:
  - `GET/POST /projects` (list/create)
  - `GET/PUT/DELETE /projects/{id}` (retrieve/update/destroy)
  - `GET/POST /blueprints/{project_id}` → custom action `@action(detail=False, methods=['get','post'], url_path='blueprints/(?P<project_id>[^/.]+)')`
  - Side-effect on `POST /projects`: create empty Blueprint v1 (replicate legacy `routers/projects.py` behavior)

**Code generation endpoint:**
- `apps/projects/views.py`: `GenerateView(APIView)` with `POST /generate/{project_id}`
- `apps/generator/` is a verbatim copy of `backend-legacy/app/services/generator/` — no logic changes
- Quota check: read/decrement `request.user.generations_used` inside a `select_for_update()` transaction
- `GET /generate/quota` returns current usage

**Middleware & infra:**
- CORS: `corsheaders.middleware.CorsMiddleware` (replace FastAPI's CORSMiddleware)
- Security headers: `SECURE_HSTS_SECONDS`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS = "DENY"`, `SECURE_REFERRER_POLICY` in settings (replaces custom `security_headers.py`)
- Rate limiting: `django-ratelimit` decorators on auth views (100/min), 1000/min global via custom throttle class

**Tests:**
- Port `backend-legacy/test_anvaya.py` to `pytest-django` style
- `apps/<name>/tests/test_*.py` per app
- Use `factory-boy` for User/Project/Blueprint factories

**Frontend changes (minimal):**
- `frontend/src/lib/api.ts`: update response interceptor to handle simplejwt's `{detail, code}` 401 shape and call `/auth/refresh` with stored refresh token (currently no refresh logic exists)
- `frontend/src/store/authStore.ts`: persist both `access` and `refresh` tokens, not just one `token`
- No other frontend changes — DRF returns the same JSON shapes if serializers are written carefully

**Verification (end of week 0):**
- `python manage.py runserver` → frontend at `localhost:5173` works against new backend without code changes
- `pytest backend/` passes all ported tests
- Django admin at `/admin/` lets you view/edit Users, Projects, Blueprints
- Generated ZIP from new backend byte-for-byte matches legacy backend output (run on identical blueprint)

---

### Week 1 — Foundation hardening

**Goal:** Observability, password reset, refresh tokens fully wired, CI green.

**Backend:**
- **Sentry**: `sentry-sdk[django]` in `settings/prod.py`, capture exceptions + performance traces
- **structlog**: configure as Django logger, include `request_id`, `user_id`, `org_id` (placeholder for week 2) in every log line; add request-ID middleware
- **Password reset flow**:
  - Use `django.contrib.auth.tokens.PasswordResetTokenGenerator` (built-in, secure)
  - Custom DRF endpoints `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` in `apps/accounts/views.py` (don't use Django's HTML views — DRF gives you the SPA flow)
  - Email via **Resend** (`apps/common/email.py` wrapper around `resend` SDK; Django's email backend swap)
  - Templates: `apps/accounts/templates/email/password_reset.{html,txt}`
- **Account email verification** (optional but recommended): same pattern, `POST /auth/email/verify/request` and `/confirm`
- **Admin polish:** custom `UserAdmin` with `list_display` showing plan, generations_used; `ProjectAdmin` with link to blueprint count

**CI/CD:**
- `.gitlab-ci.yml` at repo root, stages `lint → test → build → deploy`
  - `lint`: `ruff check`, `mypy backend/`, frontend `eslint` + `tsc --noEmit`
  - `test`: backend `pytest --cov` with Postgres service container; frontend `vitest run`
  - `build`: `docker build` for backend (gunicorn + uvicorn workers) and frontend
  - `deploy`: manual gate from `main` branch
- `backend/Dockerfile` (multi-stage, slim Python 3.12)
- `frontend/Dockerfile` (multi-stage, nginx serving Vite build)
- `docker-compose.yml` at root: backend + Postgres + frontend for local dev parity

**Verification (end of week 1):**
- A forced 500 in any view appears in Sentry within 10s with stack, `request_id`, `user_id`
- Password reset email arrives via Resend; clicking the link lets a user set a new password and log in
- Access token expires → frontend silently refreshes → user stays signed in
- GitLab pipeline green on a feature branch

---

### Week 2 — Multi-tenancy, teams, RBAC

**Goal:** Org-scoped data model with role enforcement.

**Why custom Organization model, not `django-organizations`:** the package is fine, but for tight DRF permission integration and predictable migration of existing single-user data, a hand-rolled model (~150 LOC) gives full control. Django ORM makes this trivial.

**New app `apps/orgs/`:**
- Models:
  - `Organization(id, name, slug unique, plan='free', stripe_customer_id nullable, generations_used, generations_limit, generations_reset_at, created_at, updated_at)`
  - `Membership(id, org=FK, user=FK, role choices=['owner','editor','viewer'], created_at, unique_together=(org,user))`
  - `Invitation(id, org=FK, email, role, token_hash, expires_at, accepted_at nullable, invited_by=FK(User))`
- Migration `0001_initial.py` creates these tables
- Data migration `0002_backfill_orgs.py`: for each existing user, create a personal org `"{user.name}'s workspace"` + an owner Membership; then add `org` FK to `Project` and backfill from `project.user.personal_org`
- Migration `0003_drop_user_quota.py`: drop quota columns from `User`, move them to `Organization`

**Permissions (`apps/common/permissions.py`):**
- `IsOrgMember`: checks `Membership.objects.filter(org=view.kwargs['org_slug'], user=request.user).exists()`
- `HasOrgRole(roles=['owner','editor'])`: permission class factory; deny if user's role not in the list
- `OrgScopedViewSetMixin`: overrides `get_queryset()` to filter by `org` from URL; checks membership in `dispatch()`

**Refactor existing viewsets:**
- URLs change shape: `/orgs/{org_slug}/projects/`, `/orgs/{org_slug}/projects/{id}/`, `/orgs/{org_slug}/projects/{id}/blueprints/`, `/orgs/{org_slug}/projects/{id}/generate/`
- `ProjectViewSet`, `BlueprintViewSet`, `ExportViewSet`, `GenerateView` all mix in `OrgScopedViewSetMixin`
- Quota now per-org, not per-user (column moved)

**New endpoints (`apps/orgs/views.py`):**
- `OrganizationViewSet`: list (mine), create, retrieve, partial_update (owner only), members list
- `InvitationView`: `POST /orgs/{slug}/invitations`, `POST /invitations/{token}/accept`, `DELETE /orgs/{slug}/invitations/{id}`
- Member role updates: `PATCH /orgs/{slug}/members/{user_id}` (owner only)

**Email:**
- Invitation email template → invite link `/accept-invite?token=...`
- Reuse Resend wrapper from week 1

**Frontend:**
- New `frontend/src/store/orgStore.ts` (Zustand): `orgs`, `activeOrgSlug`, `memberships`, `setActiveOrg(slug)`
- `frontend/src/store/authStore.ts`: persist `activeOrgSlug` alongside tokens
- New components: `WorkspaceSwitcher` (Navbar dropdown), `MembersTable`, `InviteMemberModal`
- New pages:
  - `pages/Settings/Team.tsx` — list members, invite, change roles
  - `pages/Settings/Organization.tsx` — rename, slug, delete
  - `pages/AcceptInvite.tsx` — token verification + onboard
- Route shape change: `/o/:orgSlug/dashboard`, `/o/:orgSlug/editor/:projectId`
- `frontend/src/components/layout/ProtectedRoute.tsx`: also verify membership before rendering org-scoped routes
- `useRole()` hook reads current membership; hide edit/delete UI when role === 'viewer'

**Verification (end of week 2):**
- Two users in two orgs cannot see each other's projects (direct API curl test)
- Invite email arrives, accept link creates membership, teammate sees same projects
- Owner demotes teammate to `viewer` → teammate's `POST /blueprints/...` returns 403 and UI hides save
- Django admin shows orgs + memberships; backfill migration created one personal org per pre-existing user

---

### Week 3 — Billing (dj-stripe) + Monaco code preview

**Goal:** Take money. Show generated code in the browser.

**Backend — `dj-stripe`:**
- Add `dj-stripe` to deps; run its migrations (creates ~50 Stripe-mirror tables)
- Configure `DJSTRIPE_WEBHOOK_SECRET`, `STRIPE_LIVE_MODE`, `STRIPE_SECRET_KEY` via env
- On `Organization.save()` (first time): create Stripe Customer, save `stripe_customer_id` (signal in `apps/orgs/signals.py`)
- New `apps/billing/` app:
  - `views.py`:
    - `POST /billing/checkout` → creates Stripe Checkout Session for Pro price ID, returns URL
    - `POST /billing/portal` → creates Customer Portal session, returns URL
    - `dj-stripe` auto-handles `POST /stripe/webhook/`
  - Custom webhook handlers via `dj-stripe`'s `@webhooks.handler(...)` decorators:
    - `customer.subscription.updated`: update `Organization.plan` based on subscription status + product
    - `customer.subscription.deleted`: revert org to `free`, lower `generations_limit` to 10
    - `invoice.payment_failed`: send dunning email, log to Sentry
- Plan enforcement: existing quota check in `GenerateView` already reads `org.generations_limit` — just update on plan change

**Backend — code preview API:**
- Refactor `apps/generator/bundler.py`: extract `render_files_dict(ast) -> dict[str, str]` (path → content); keep existing `bundle_zip()` calling it internally
- `GenerateView`: accept `?format=zip|json` query param (default `zip` for back-compat); `json` returns `{language: "express", files: {...}}`

**Frontend — Monaco preview UI:**
- New page `pages/CodePreview.tsx` at `/o/:orgSlug/editor/:projectId/preview`
- Components:
  - `components/codepreview/FileTree.tsx` — hierarchical file list
  - `components/codepreview/CodeViewer.tsx` — `@monaco-editor/react` in read-only mode, language auto-detected by file extension
- Lazy-load Monaco via `React.lazy` (it's ~3MB; only on preview route)
- "Generate" button in `components/canvas/CanvasToolbar.tsx` → POST `/generate/{id}?format=json` → navigate to preview page with files in route state
- "Download .zip" button on preview page → re-hits endpoint with `?format=zip` and triggers download

**Frontend — billing UI:**
- `pages/Pricing.tsx` — Free / Pro plans (linked from landing + nav)
- `pages/Settings/Billing.tsx` — current plan badge, usage bar, "Upgrade" → `/billing/checkout`, "Manage" → `/billing/portal`
- Soft paywall: when `org.plan === 'free' && quota.remaining === 0`, canvas Generate button opens upgrade modal

**Verification (end of week 3):**
- Stripe test card `4242 4242 4242 4242` completes checkout; webhook updates `Organization.plan='pro'` and `generations_limit=500` within 5s
- Customer portal cancellation triggers `subscription.deleted`; plan reverts to `free` at period end
- Code preview page shows the same files that the ZIP contains, syntax-highlighted by language
- Free plan user hits quota → 11th generation returns 429 with upgrade CTA

---

### Week 4 — Polish, marketing, launch

**Goal:** Look like a real product. Ship publicly.

**Onboarding & UX:**
- New `components/onboarding/OnboardingWizard.tsx` — 3-step modal on first dashboard visit: name org → invite teammates (skippable) → create first project from a starter template
- `apps/projects/management/commands/seed_starter_templates.py` — 3 prebuilt blueprints (Todo API, E-commerce cart, Blog API)
- Improve `CanvasEmptyState` with CTAs

**Settings pages:**
- `pages/Settings/Profile.tsx` — name, change password, delete account (soft-delete via `User.is_active=False` and `User.deleted_at`)
- Org settings already done in week 2

**Marketing surface:**
- Rewrite `pages/Landing.tsx`: hero, 3-feature grid, animated canvas→code demo (Lottie or looped MP4), pricing teaser, footer
- Docs in-repo at `frontend/src/pages/docs/*.mdx` via `@mdx-js/rollup`: quickstart, node reference, generated code structure, billing, FAQ (10 pages max)

**Quality & deployment:**
- Playwright E2E at `frontend/e2e/`: happy path (signup → onboarding → create project → 2 nodes → generate → preview), billing path (upgrade → quota raised), invite path (invite → accept → access)
- Error boundaries on all routes (`ErrorBoundary.tsx` already exists)
- Pick hosting (Fly.io / Railway / Render recommended for solo); provision managed Postgres; configure env; deploy
- DNS via Cloudflare; HTTPS via platform; status page on Better Stack free tier

**Cleanup:**
- Delete `backend-legacy/` once production stability confirmed (>72h no rollback signal)

**Launch:**
- Product Hunt, Show HN, X thread

---

## Critical files & where they live

**Backend (new Django `backend/`):**
- New apps: `apps/accounts/`, `apps/orgs/`, `apps/projects/`, `apps/generator/`, `apps/billing/`, `apps/common/`
- Settings: `anvaya/settings/{base,dev,prod}.py`
- `apps/generator/` is a verbatim port of `backend-legacy/app/services/generator/{parser,ast_builder,bundler}.py` + `templates/express/`

**Frontend (`frontend/src/`):**
- New stores: `store/orgStore.ts`
- New pages: `pages/ForgotPassword.tsx`, `ResetPassword.tsx`, `AcceptInvite.tsx`, `Pricing.tsx`, `CodePreview.tsx`, `Settings/{Profile,Team,Organization,Billing}.tsx`, `docs/*.mdx`
- New components: `layout/WorkspaceSwitcher.tsx`, `onboarding/OnboardingWizard.tsx`, `codepreview/{FileTree,CodeViewer}.tsx`, `team/{MembersTable,InviteMemberModal}.tsx`
- Modified: `store/authStore.ts` (refresh token + active org), `lib/api.ts` (refresh interceptor), `components/layout/{Navbar,ProtectedRoute}.tsx`, `components/canvas/CanvasToolbar.tsx` (Generate button), `pages/Landing.tsx` (rewrite)
- Tests: `e2e/*.spec.ts` (Playwright)

**Root:**
- New: `.gitlab-ci.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `backend/pyproject.toml`

---

## Reusing what already exists

- **Generator pipeline** (`backend-legacy/app/services/generator/parser.py`, `ast_builder.py`, `bundler.py`, `templates/express/`) — copy verbatim into `apps/generator/`; this is the actual IP and is framework-independent
- **All Pydantic models** (`backend-legacy/app/models/blueprint.py` etc.) — translate field-for-field into DRF serializers; structure is identical
- **Canvas state, undo/redo, validation** in `frontend/src/store/canvasStore.ts` — untouched
- **All 14 custom node components** `frontend/src/components/blocks/CustomNodes.tsx` — untouched
- **Tailwind tokens & UI primitives** `frontend/src/components/ui/` — reuse for all new pages
- **Existing test_anvaya.py** — translate to `pytest-django` (factories + parametrize, not 200-line single function)
- **Axios interceptors** in `frontend/src/lib/api.ts` — extend with refresh-token retry

---

## End-to-end verification (run before launch)

1. **Fresh signup → paying customer:**
   - Visit landing → Sign up → onboarding (name org "Acme" → skip invite → start from "Todo API" template) → drag route + response nodes → connect → Generate → preview shows files in Monaco → Download ZIP → `npm install && node server.js` runs locally
   - Click Upgrade → Stripe test card → return to billing showing "Pro" plan + 500 quota
2. **Team collaboration:**
   - Owner invites teammate by email → teammate accepts → lands in Acme org → can edit project
   - Owner demotes teammate to `viewer` → save button disabled, direct API call returns 403
3. **Tenant isolation:**
   - User A's project not retrievable by User B (different org) — verify via curl with B's token
4. **Quota enforcement:**
   - Free plan, 10 generations → 11th returns 429 + upgrade message
5. **Auth resilience:**
   - Access token expires → silent refresh → user stays signed in
   - Refresh token blacklisted (via logout) → next API call logs user out cleanly
6. **Migrations:**
   - Fresh DB: `manage.py migrate` clean
   - DB seeded with week-0 data: backfill creates personal org per user, projects scoped correctly
7. **Observability:**
   - Force a 500 → Sentry captures with `request_id`, `user_id`, `org_id` tags
8. **Admin panel:**
   - `/admin/` lets you view + edit users, orgs, memberships, Stripe customers, subscriptions, projects, blueprints — verified during week 1
9. **CI:**
   - Push feature branch → GitLab runs lint + tests + Docker build green
   - Merge to main → auto-deploy to staging; manual approval → production

---

## Risks & mitigations

- **Week 0 port slips past 5 days** — strict scope: only port what legacy already does, no new features in week 0; if behind, drop email verification and ship password reset only
- **Stripe webhook reliability** — `dj-stripe` handles idempotency and replay; test with Stripe CLI; all events stored in `dj-stripe` tables for inspection
- **Data migration (single-user → org-scoped)** — write Django data migration with a no-op `reverse_func` first, test on dump of prod DB locally, take pg_dump before applying in prod
- **Monaco bundle size (~3MB)** — `React.lazy` + only on preview route + Vite code-splitting
- **Scope creep** — anything not in this plan goes to v2; if a week is at risk, cut polish from week 4 before cutting from weeks 0-3 (foundation > marketing)
- **Solo founder burnout** — week 4's "polish" is also the rest week. Don't try to slide v2 features in.
- **Legacy backend deleted too early** — keep `backend-legacy/` in repo through week 4; only delete after 72h stable on production

---

## Out of scope for v1 (do not build now)

SSO/SAML, SCIM, audit log UI (mirroring exists via `django-auditlog` install but no UI), multi-language code generation, real-time collaborative editing, advanced node types (gRPC, WebSocket, GraphQL), on-prem deployment, SOC2 controls, custom enterprise contracts, AI-assisted blueprint generation, marketplace/templates store, public API for the canvas.
