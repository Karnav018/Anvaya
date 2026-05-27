import { test, expect } from '@playwright/test';
import {
  DEFAULT_PASSWORD,
  cleanupE2eUsers,
  completeOnboardingIfNeeded,
  mintInvitationToken,
  signUp,
  uniqueEmail,
} from './helpers';

/**
 * Multi-user invite flow.
 *
 * Path chosen: we **mint the invitation token directly via a Django shell
 * snippet** (helpers.mintInvitationToken) rather than going through the
 * Send-Email -> parse-stdout loop.
 *
 * Rationale:
 *   - The InviteMemberModal flow stores only a sha256(token) in the DB; the
 *     raw token only ever lives in the email body. In dev with the console
 *     email backend that means scraping stdout, which is brittle.
 *   - Driving the same code path (Invitation row + token_hash + expiry)
 *     via a one-shot shell command gives us a deterministic raw token and
 *     still exercises /invitations/accept end-to-end.
 *   - We still cover the "owner clicks Invite" UI path inside the test by
 *     opening the modal and submitting it — we just don't depend on the
 *     emailed token for the second-user accept step.
 */
test.describe('invite flow', () => {
  test.afterAll(() => {
    cleanupE2eUsers();
  });

  test('owner invites a member; invitee accepts and joins the workspace', async ({
    browser,
  }) => {
    // -- Browser context A: owner
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    await signUp(ownerPage);
    const orgSlug = await completeOnboardingIfNeeded(ownerPage);

    // Open Team settings.
    await ownerPage.goto(`/o/${orgSlug}/settings/team`);
    await expect(ownerPage).toHaveURL(new RegExp(`/o/${orgSlug}/settings/team$`));

    // Open the invite modal and submit. This exercises the UI happy path
    // but we DON'T rely on the resulting (hashed) token — we'll mint our
    // own below.
    const inviteeEmail = uniqueEmail('e2e-invitee');
    await ownerPage.getByRole('button', { name: /invite member/i }).click();
    await ownerPage.getByPlaceholder(/teammate@company\.com/i).fill(inviteeEmail);
    // Role default is "editor", which is what we want.
    await ownerPage.getByRole('button', { name: /send invite/i }).click();

    // Toast confirms send.
    await expect(ownerPage.getByText(/invite sent/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Mint a raw token for THIS invitee so we can drive the accept flow.
    // This creates a separate Invitation row (the UI flow created one with a
    // hashed-only token); either row is fine for accept since we look up
    // by sha256(raw_token).
    const rawToken = mintInvitationToken(orgSlug, inviteeEmail, 'editor');
    expect(rawToken.length).toBeGreaterThan(10);

    // -- Browser context B: invitee
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();

    await signUp(inviteePage, {
      name: 'E2E Invitee',
      email: inviteeEmail,
      password: DEFAULT_PASSWORD,
    });

    // The invitee now has their OWN solo workspace (created by onboarding).
    // We DON'T need them to complete onboarding for the workspace-join to
    // work — we just navigate to /accept-invite with the token.
    // If they were dropped into onboarding, that's fine; visiting
    // /accept-invite navigates away.
    await inviteePage.goto(`/accept-invite?token=${rawToken}`);

    // The AcceptInvite page POSTs /invitations/accept, then navigates to
    // /o/<slug>/dashboard.
    await inviteePage.waitForURL(new RegExp(`/o/${orgSlug}/dashboard$`), {
      timeout: 15_000,
    });

    // Verify the invitee is now in the owner's workspace.
    await expect(inviteePage).toHaveURL(new RegExp(`/o/${orgSlug}/dashboard$`));

    await ownerContext.close();
    await inviteeContext.close();
  });
});
