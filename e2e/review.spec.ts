import { Page, expect, test } from '@playwright/test';

/**
 * Review-queue tests.
 *
 * Unlike the other E2E specs, these cannot register their own throwaway account: the
 * queue requires the ContentAdmin role, and an account cannot grant itself one. So the
 * credentials come from the environment and are never written into the repository.
 *
 *   SB_ADMIN_EMAIL=you@example.com SB_ADMIN_PASSWORD=... npm run e2e
 *
 * These tests deliberately never approve or reject anything. Judging generated content
 * is a human decision, and a test suite that silently approved drafts would defeat the
 * review gate it exists to check.
 */
const email = process.env['SB_ADMIN_EMAIL'];
const password = process.env['SB_ADMIN_PASSWORD'];

test.skip(
  !email || !password,
  'Set SB_ADMIN_EMAIL and SB_ADMIN_PASSWORD to run the review-queue tests.',
);

async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/skills/);
}

test('admin sees the Review link, and selection drives the action buttons', async ({ page }) => {
  await signInAsAdmin(page);

  await expect(page.getByRole('link', { name: 'Review' })).toBeVisible();
  await page.getByRole('link', { name: 'Review' }).click();
  await expect(page).toHaveURL(/\/review/);

  // Nothing selected → both actions disabled, so a stray click cannot bulk-approve.
  const approve = page.getByRole('button', { name: /approve selected/i });
  const reject = page.getByRole('button', { name: /reject selected/i });
  await expect(approve).toBeDisabled();
  await expect(reject).toBeDisabled();

  await page.getByRole('checkbox', { name: /^select all$/i }).check();
  await expect(page.getByText(/\d+ of \d+ selected/)).toBeVisible();
  await expect(approve).toBeEnabled();
  await expect(reject).toBeEnabled();

  // Reject asks for a reason first. The note is what tells the next prompt version what
  // went wrong, so it must not be skippable by an accidental click.
  await reject.click();
  const confirmReject = page.getByRole('button', { name: /^Reject \d+$/ });
  await expect(confirmReject).toBeVisible();
  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(confirmReject).toBeHidden();

  await page.getByRole('checkbox', { name: /^deselect all$/i }).uncheck();
  await expect(approve).toBeDisabled();
});

test('pending drafts stay invisible in the learner-facing skill tree', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Expand C#' }).click();

  // An approved child is visible; a pending draft under the same parent is not.
  await expect(page.getByRole('link', { name: 'LINQ', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'C# Pattern Matching' })).toBeHidden();
});
