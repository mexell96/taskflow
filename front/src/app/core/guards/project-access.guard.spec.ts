import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, provideRouter, Router, type RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';

import { AuthStore } from '@app/core/services/store/auth-store.service';
import { projectAccessGuard } from './project-access.guard';

const fullDeny = {
  canViewProject: false,
  canCreateTask: false,
  canEditTask: false,
  canChangeTaskStatus: false,
  canMoveTask: false,
  canEditProject: false,
};

describe('projectAccessGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows activation when canViewProject is true', async () => {
    const authStore = {
      loadMe: vi.fn().mockResolvedValue(undefined),
      permissions: vi.fn().mockReturnValue({ ...fullDeny, canViewProject: true }),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStore }],
    });

    const result = await TestBed.runInInjectionContext(() => projectAccessGuard(route, state));

    expect(authStore.loadMe).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('redirects to /projects when canViewProject is false', async () => {
    const authStore = {
      loadMe: vi.fn().mockResolvedValue(undefined),
      permissions: vi.fn().mockReturnValue(fullDeny),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStore }],
    });
    const router = TestBed.inject(Router);

    const result = await TestBed.runInInjectionContext(() => projectAccessGuard(route, state));

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });
});
