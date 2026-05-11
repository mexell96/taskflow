import { expect, test } from '@playwright/test';

import { DEMO_PROJECT_ID } from '../../e2e-seed';

/**
 * Needs Taskflow API on :3001 (see `npm run e2e:stack` in Playwright webServer).
 * Without `/api/auth/me`, the app falls back to viewer — status select and drag are disabled.
 */
test('viewer sees seed tasks on board with read-only controls', async ({ page }) => {
  await page.goto(`/projects/${DEMO_PROJECT_ID}`);
  await expect(page).toHaveURL(new RegExp(`/projects/${DEMO_PROJECT_ID}$`));
  await expect(page.getByRole('heading', { name: 'Demo project' })).toBeVisible();
  await expect(page.getByText('Backlog task')).toBeVisible();

  const taskCard = page.locator('app-task-card').filter({ hasText: 'Backlog task' });
  await expect(taskCard.getByLabel('Status')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add task' })).toHaveCount(0);
});
