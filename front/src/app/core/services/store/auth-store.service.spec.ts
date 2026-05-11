import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../api/auth/auth-api.service';
import { AuthStore } from './auth-store.service';

describe('AuthStore', () => {
  let getMe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    getMe = vi.fn();
  });

  it('maps editor role to permissions without project edit', async () => {
    getMe.mockReturnValue(of({ role: 'editor' as const }));
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: { getMe } },
      ],
    });
    const store = TestBed.inject(AuthStore);
    await store.loadMe();

    expect(store.role()).toBe('editor');
    expect(store.permissions()).toEqual({
      canViewProject: true,
      canCreateTask: true,
      canEditTask: true,
      canChangeTaskStatus: true,
      canMoveTask: true,
      canEditProject: false,
    });
  });

  it('maps viewer role to read-only permissions', async () => {
    getMe.mockReturnValue(of({ role: 'viewer' as const }));
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: { getMe } },
      ],
    });
    const store = TestBed.inject(AuthStore);
    await store.loadMe();

    expect(store.role()).toBe('viewer');
    expect(store.permissions()).toEqual({
      canViewProject: true,
      canCreateTask: false,
      canEditTask: false,
      canChangeTaskStatus: false,
      canMoveTask: false,
      canEditProject: false,
    });
  });

  it('maps admin role to full permissions', async () => {
    getMe.mockReturnValue(of({ role: 'admin' as const }));
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: { getMe } },
      ],
    });
    const store = TestBed.inject(AuthStore);
    await store.loadMe();

    expect(store.permissions().canEditProject).toBe(true);
    expect(store.permissions().canMoveTask).toBe(true);
  });

  it('defaults to viewer when getMe fails', async () => {
    getMe.mockReturnValue(throwError(() => new Error('network')));
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: { getMe } },
      ],
    });
    const store = TestBed.inject(AuthStore);
    await store.loadMe();

    expect(store.role()).toBe('viewer');
    expect(store.permissions().canCreateTask).toBe(false);
  });
});
