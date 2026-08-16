import { expect, test } from '@playwright/test';

/**
 * The critical path: register → see the skill tree → stay signed in across a reload.
 *
 * This single flow is the product in miniature. If it works, the shell works.
 */

// Unique per run so the suite can be re-run without cleaning the database.
const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const PASSWORD = 'an-e2e-test-passphrase';

test('unauthenticated visitors are sent to the sign-in page', async ({ page }) => {
  await page.goto('/skills');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});

test('register, browse the skill graph, and survive a reload', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();

  // Registration lands on the skill tree.
  await expect(page).toHaveURL(/\/skills/);
  await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();

  // The seeded root renders, expanded, so its areas are visible immediately.
  await expect(page.getByRole('link', { name: '.NET Backend Development' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'C#', exact: true })).toBeVisible();

  // Deeper levels start collapsed, so the structure stays legible as the graph grows.
  await expect(page.getByRole('link', { name: 'LINQ', exact: true })).toBeHidden();

  await page.getByRole('button', { name: 'Expand C#' }).click();
  await expect(page.getByRole('link', { name: 'LINQ', exact: true })).toBeVisible();

  // And collapsing hides them again.
  await page.getByRole('button', { name: 'Collapse C#' }).click();
  await expect(page.getByRole('link', { name: 'LINQ', exact: true })).toBeHidden();

  // A reload must keep the session — this is what the stored token is for.
  await page.reload();
  await expect(page).toHaveURL(/\/skills/);
  await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
  await expect(page.getByText('E2E Tester')).toBeVisible();
});

test('skill detail shows prerequisites that cross tree branches', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/skills/);

  await page.goto('/skills/aspnetcore-performance');

  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();

  // These live under C# and Data respectively — a pure tree could not express them,
  // which is the whole reason typed relationship edges exist (ADR-0004).
  const learnFirst = page.locator('.sb-card', { hasText: 'Learn first' });
  await expect(learnFirst.getByRole('link', { name: 'Async and Await' })).toBeVisible();
  await expect(learnFirst.getByRole('link', { name: 'Indexing' })).toBeVisible();
});

test('signing out clears the session', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/skills/);

  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  // And the guard still holds afterwards.
  await page.goto('/skills');
  await expect(page).toHaveURL(/\/login/);
});
