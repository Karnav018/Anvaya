import { test, expect } from '@playwright/test';
import { cleanupE2eUsers, completeOnboardingIfNeeded, signUp } from './helpers';

/**
 * Stripe-not-configured path: when STRIPE_TEST_SECRET_KEY is empty (as in
 * local dev / CI), the /billing/checkout endpoint returns 503. The UI
 * surfaces this as a toast and must NOT redirect to a broken URL.
 */
test.describe('upgrade flow (Stripe not configured)', () => {
  test.afterAll(() => {
    cleanupE2eUsers();
  });

  test('owner sees Free badge, clicks Upgrade, gets toast, stays on page', async ({ page }) => {
    await signUp(page);
    const orgSlug = await completeOnboardingIfNeeded(page);

    // Navigate to billing settings.
    await page.goto(`/o/${orgSlug}/settings/billing`);
    await expect(page).toHaveURL(new RegExp(`/o/${orgSlug}/settings/billing$`));

    // Free badge must be visible. The PlanBadge renders the plan name
    // uppercase ("FREE") in a small pill.
    const freeBadge = page.locator('text=/^free$/i').first();
    await expect(freeBadge).toBeVisible({ timeout: 10_000 });

    // Click Upgrade to Pro.
    const upgradeBtn = page.getByRole('button', { name: /upgrade to pro/i });
    await expect(upgradeBtn).toBeVisible();

    const urlBefore = page.url();
    await upgradeBtn.click();

    // Backend returns 503 because STRIPE_TEST_SECRET_KEY is empty in dev.
    // The api interceptor + Billing.tsx's catch block surface this as a
    // toast. react-hot-toast renders text into the DOM.
    const toast = page
      .locator('text=/billing is not configured|server error\\. please try again later/i')
      .first();
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // Critical: the user must NOT have been redirected to Stripe (which
    // would happen if the response had a `url` field). Confirm we're still
    // on the billing page.
    await expect(page).toHaveURL(urlBefore);
  });
});
