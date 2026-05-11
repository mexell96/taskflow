import { expect, test } from '@playwright/test';

import { DEMO_PROJECT_ID } from '../../e2e-seed';

test('direct URL for existing project opens board', async ({ page }) => {
  await page.goto(`/projects/${DEMO_PROJECT_ID}`);
  await expect(page).toHaveURL(new RegExp(`/projects/${DEMO_PROJECT_ID}$`));
  await expect(page.getByRole('heading', { name: 'Demo project' })).toBeVisible();
});

test('invalid project id redirects to projects list', async ({ page }) => {
  await page.goto('/projects/not-existing-id');
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});

test('back and forward between list and project detail works', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('link', { name: 'Demo project' }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${DEMO_PROJECT_ID}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/projects/${DEMO_PROJECT_ID}$`));
});

test('refresh on project details keeps user on project route', async ({ page }) => {
  await page.goto(`/projects/${DEMO_PROJECT_ID}`);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/projects/${DEMO_PROJECT_ID}$`));
  await expect(page.getByRole('heading', { name: 'Demo project' })).toBeVisible();
});
