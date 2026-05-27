import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

/**
 * Absolute path to the backend repo, resolved relative to this helpers
 * file so the location doesn't depend on Playwright's cwd.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'backend');

/** Generate a unique e2e email so concurrent runs / leftover users don't collide. */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@anvaya.test`;
}

/** Default password used by every E2E test user. */
export const DEFAULT_PASSWORD = 'E2eTest123!';

/**
 * Sign up a brand-new user and auto-login.
 *
 * The Signup page POSTs /auth/signup, then logs in and lands on /dashboard.
 * /dashboard is a redirect that bounces to /onboarding if the user has no
 * organizations yet.
 */
export async function signUp(
  page: Page,
  opts: { name?: string; email?: string; password?: string } = {}
): Promise<{ name: string; email: string; password: string }> {
  const name = opts.name ?? 'E2E User';
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? DEFAULT_PASSWORD;

  await page.goto('/signup');
  await page.getByPlaceholder('John Doe').fill(name);
  await page.getByPlaceholder('you@domain.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();

  // After signup the app auto-logs-in and pushes to /dashboard, which
  // bounces to /onboarding for users with no orgs yet.
  await page.waitForURL(/\/(onboarding|o\/[^/]+\/dashboard)/, { timeout: 15_000 });

  return { name, email, password };
}

/**
 * If the page is on /onboarding, walk through the 3-step OnboardingWizard:
 *   step 1 — name workspace
 *   step 2 — skip invites
 *   step 3 — pick a template (default: Empty canvas)
 *
 * The wizard creates the project on step 3 and navigates straight to the
 * editor at /o/{slug}/editor/{projectId}.
 *
 * Returns the org slug parsed from the final URL. The caller may be left
 * on either /editor/... (fresh signup) or /dashboard (existing org).
 */
export async function completeOnboardingIfNeeded(
  page: Page,
  opts: {
    workspaceName?: string;
    template?: 'empty' | 'todo' | 'cart' | 'blog';
  } = {}
): Promise<string> {
  const workspaceName = opts.workspaceName ?? `E2E WS ${Date.now()}`;
  const template = opts.template ?? 'empty';

  if (/\/onboarding/.test(page.url())) {
    // --- Step 1: workspace name ---
    await page.getByPlaceholder(/Acme Inc\./i).fill(workspaceName);
    await page.getByRole('button', { name: /create workspace/i }).click();

    // --- Step 2: invites (skip) ---
    await page.getByRole('button', { name: /^skip$/i }).click();

    // --- Step 3: template picker ---
    // Empty canvas / Todo API / E-commerce cart / Blog API
    const templateLabels: Record<typeof template, RegExp> = {
      empty: /empty canvas/i,
      todo: /todo api/i,
      cart: /e-commerce cart/i,
      blog: /blog api/i,
    };
    await page.getByRole('button', { name: templateLabels[template] }).click();

    // Wizard navigates straight to the editor.
    await page.waitForURL(/\/o\/[^/]+\/editor\/[a-f0-9-]+/, { timeout: 20_000 });
  } else {
    // Already in an org — wait for the dashboard to settle.
    await page.waitForURL(/\/o\/[^/]+\/(dashboard|editor)/, { timeout: 15_000 });
  }
  const match = page.url().match(/\/o\/([^/]+)\//);
  expect(match, 'expected to land in an org-scoped route').not.toBeNull();
  return match![1];
}

/**
 * Login an already-existing user. Mirrors the Login.tsx form layout.
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('you@domain.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(onboarding|o\/[^/]+\/|accept-invite)/, { timeout: 15_000 });
}

/**
 * Run a one-off Django shell snippet against the dev DB.
 * Returns the stdout from `manage.py shell -c`.
 */
export function runDjangoShell(pythonCode: string): string {
  // -c expects a single expression/statement. We wrap with quotes carefully.
  // Use stdin-less invocation: pass via -c.
  const escaped = pythonCode.replace(/"/g, '\\"');
  const cmd = `.venv/bin/python manage.py shell -c "${escaped}"`;
  const out = execSync(cmd, {
    cwd: BACKEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  return out;
}

/**
 * Mint a raw invitation token directly in the DB, bypassing the email loop.
 * Returns the raw token string (already URL-safe).
 */
export function mintInvitationToken(
  orgSlug: string,
  inviteeEmail: string,
  role: 'editor' | 'viewer' = 'editor'
): string {
  const py = [
    'import secrets, hashlib',
    'from datetime import timedelta',
    'from django.utils import timezone',
    'from apps.orgs.models import Invitation, Organization',
    `org = Organization.objects.get(slug='${orgSlug}')`,
    'tok = secrets.token_urlsafe(32)',
    'h = hashlib.sha256(tok.encode()).hexdigest()',
    'Invitation.objects.create(',
    `  organization=org, email='${inviteeEmail}', role='${role}',`,
    '  token_hash=h, expires_at=timezone.now() + timedelta(days=7),',
    ')',
    "print('TOKEN=' + tok)",
  ].join('; ');
  const out = runDjangoShell(py);
  const m = out.match(/TOKEN=([A-Za-z0-9_-]+)/);
  if (!m) {
    throw new Error(`Could not extract invitation token from shell output: ${out}`);
  }
  return m[1];
}

/**
 * Wipe every e2e-* user (and their orgs via cascade) from the DB.
 * Safe to call even when there are no leftover rows.
 */
export function cleanupE2eUsers(): void {
  const py = [
    'from django.contrib.auth import get_user_model',
    'from apps.orgs.models import Invitation',
    'U = get_user_model()',
    "Invitation.objects.filter(email__startswith='e2e-').delete()",
    "U.objects.filter(email__startswith='e2e-').delete()",
  ].join('; ');
  try {
    runDjangoShell(py);
  } catch (err) {
    // Cleanup is best-effort; never fail a test on teardown.
    console.warn('[e2e cleanup] failed:', (err as Error).message);
  }
}

/**
 * Programmatically populate the canvas store with a minimal valid blueprint
 * (one Route -> one Response). ReactFlow's HTML5 drag-and-drop is famously
 * flaky in headless browsers; this is an escape hatch for any test that
 * needs a deterministic non-template canvas state. The active spec uses
 * the in-editor "Start from a template" CTA instead — keep this around
 * in case that CTA goes away or you need an arbitrary node layout.
 *
 * The store is attached to `window.__canvasStore__` via a small dev-only
 * shim in src/store/canvasStore.ts (added for testability).
 */
export async function populateCanvasViaStore(page: Page): Promise<void> {
  await page.evaluate(() => {
    type AnyStore = {
      getState: () => {
        addNode: (n: unknown) => void;
        onConnect: (c: unknown) => void;
      };
    };
    const w = window as unknown as { __canvasStore__?: AnyStore };
    if (!w.__canvasStore__) {
      throw new Error('canvasStore not exposed on window — testability shim missing');
    }
    const s = w.__canvasStore__.getState();
    const routeId = `node-${Date.now()}-route`;
    const responseId = `node-${Date.now()}-response`;
    s.addNode({
      id: routeId,
      type: 'route',
      position: { x: 100, y: 100 },
      data: { method: 'GET', path: '/api/hello', description: 'E2E Route' },
    });
    s.addNode({
      id: responseId,
      type: 'response',
      position: { x: 500, y: 100 },
      data: { status_code: 200, body: '{ message: "hello" }' },
    });
    s.onConnect({
      source: routeId,
      target: responseId,
      sourceHandle: null,
      targetHandle: null,
    });
  });
}
