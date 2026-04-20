import { expect, test } from '@playwright/test';

const demoProjectId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

test('direct URL for existing project opens board', async ({ page }) => {
  await page.goto(`/projects/${demoProjectId}`);
  await expect(page).toHaveURL(new RegExp(`/projects/${demoProjectId}$`));
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
  await expect(page).toHaveURL(new RegExp(`/projects/${demoProjectId}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/projects/${demoProjectId}$`));
});

test('refresh on project details keeps user on project route', async ({ page }) => {
  await page.goto(`/projects/${demoProjectId}`);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/projects/${demoProjectId}$`));
  await expect(page.getByRole('heading', { name: 'Demo project' })).toBeVisible();
});
