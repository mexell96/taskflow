import { expect, test } from '@playwright/test';

test('user can create project from list page', async ({ page }) => {
  const projects = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Demo project',
      description: 'Seed data for Taskflow',
      author: 'John Doe',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  await page.route('**/api/projects', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({ json: projects });
      return;
    }

    if (request.method() === 'POST') {
      const body = request.postDataJSON() as {
        name: string;
        description?: string;
        author?: string;
      };
      const created = {
        id: 'f2f8f1a2-72c5-45f3-8493-7e30cbf140f3',
        name: body.name,
        description: body.description?.trim() ?? undefined,
        author: body.author?.trim() ?? undefined,
        createdAt: new Date().toISOString(),
      };
      projects.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    await route.fallback();
  });

  await page.goto('/projects');
  await expect(page.getByRole('link', { name: 'Demo project' })).toBeVisible();

  await page.getByPlaceholder('Name').fill('New E2E Project');
  await page.getByPlaceholder('Description (optional)').fill('Created in Playwright');
  await page.getByPlaceholder('Author (optional)').fill('John Doe');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByRole('link', { name: 'New E2E Project' })).toBeVisible();
  await expect(page.getByText('Created in Playwright')).toBeVisible();
  await expect(
    page.getByRole('article').filter({ hasText: 'New E2E Project' }).getByText('John Doe'),
  ).toBeVisible();
});
