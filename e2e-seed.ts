/** Shared seed identifiers for Playwright (front/e2e) and Nest e2e (back/test). */

export const DEMO_PROJECT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' as const;

export type SeedProjectRow = {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
};

export const SEED_DEMO_PROJECT_ROW: SeedProjectRow = {
  id: DEMO_PROJECT_ID,
  name: 'Demo project',
  description: 'Seed data for Taskflow',
  author: 'John Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
};
