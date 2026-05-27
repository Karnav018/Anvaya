import { test, expect } from '@playwright/test';
import {
  cleanupE2eUsers,
  completeOnboardingIfNeeded,
  signUp,
} from './helpers';

/**
 * Happy path: sign up -> onboard (empty canvas) -> apply Todo template via
 * the in-editor CTA -> save -> generate -> verify file tree -> download zip.
 *
 * Drag-and-drop strategy: we use the **CanvasEmptyState's "Start from a
 * template" CTA** to populate the canvas with the Todo API blueprint. This
 * is a deterministic, no-flake replacement for ReactFlow HTML5
 * drag-and-drop (notoriously unreliable in Playwright/Chromium headless
 * mode).
 *
 * Note: the OnboardingWizard's template picker SENDS a `template` field to
 * POST /o/<slug>/projects, but the current backend ProjectCreateSerializer
 * ignores it and always seeds an EMPTY_CANVAS blueprint. So we pick "Empty
 * canvas" in onboarding, then drive the in-editor template CTA which calls
 * POST /o/<slug>/blueprints/<projectId> with the full template blueprint
 * — that's the path that actually populates the canvas server-side.
 */
test.describe('signup -> generate', () => {
  test.afterAll(() => {
    cleanupE2eUsers();
  });

  test('end-to-end: signup, template, generate, download', async ({ page }) => {
    // 1-3. Sign up. The signup page auto-logs in and redirects through
    //      /dashboard -> /onboarding (for fresh users).
    const { email } = await signUp(page);
    expect(email).toMatch(/^e2e-/);

    // 4-6. Complete onboarding with the Empty canvas option. The wizard
    //      creates the project and routes straight to the editor.
    const orgSlug = await completeOnboardingIfNeeded(page, { template: 'empty' });
    expect(orgSlug).toBeTruthy();

    // We should now be on the editor with an empty canvas.
    await page.waitForURL(new RegExp(`/o/${orgSlug}/editor/[a-f0-9-]+$`), {
      timeout: 20_000,
    });

    // 7. Populate the canvas via the in-editor "Start from a template" CTA.
    //    The CanvasEmptyState component only renders when nodes.length === 0,
    //    so this is what a real user would see on first visit.
    const startBtn = page.getByRole('button', { name: /start from a template/i });
    await expect(startBtn).toBeVisible({ timeout: 15_000 });
    await startBtn.click();
    await page.getByRole('button', { name: /todo api/i }).click();

    // The Generate button becomes enabled once nodes.length > 0.
    const generateBtn = page.getByRole('button', { name: /generate|building/i });
    await expect(generateBtn).toBeEnabled({ timeout: 15_000 });

    // 8. Save via the Save button. The auto-save runs every 30s but we
    //    want to confirm the explicit save flow.
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 10_000 });

    // 9-10. Generate. The toolbar saves implicitly first, then navigates
    //       to the preview route.
    await generateBtn.click();
    await page.waitForURL(
      new RegExp(`/o/${orgSlug}/editor/[a-f0-9-]+/preview$`),
      { timeout: 45_000 }
    );

    // 11. File tree should show at least 5 files including package.json
    //     and server.js (the codegen emits a full Express scaffold).
    await expect(page.getByText('package.json').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('server.js').first()).toBeVisible();

    // FileTree renders each file as a clickable row. Count entries with a
    // recognizable extension (rough heuristic that doesn't tie us to the
    // exact codegen output).
    const fileRows = page.locator('text=/\\.(js|json|md|env|gitignore|yml|yaml|ts)$/');
    await expect
      .poll(async () => fileRows.count(), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(5);

    // 12. Download .zip — verify the browser fires a download event.
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /download \.zip|building/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });
});
