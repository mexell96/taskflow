import { routes } from './app.routes';
import { projectAccessGuard } from './core/guards/project-access.guard';
import { projectExistsGuard } from './core/guards/project-exists.guard';

describe('routes', () => {
  it('protects project board with exists then access guards', () => {
    const boardRoute = routes.find((route) => route.path === 'projects/:id');
    expect(boardRoute?.canActivate).toEqual([projectExistsGuard, projectAccessGuard]);
  });

  it('registers wildcard fallback to home', () => {
    const fallback = routes.find((route) => route.path === '**');
    expect(fallback?.redirectTo).toBe('');
  });
});
