import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { TaskflowStore } from '@app/core/services/store/taskflow-store.service';
import type { Project } from '@app/shared/models/project.model';
import { PROJECT_LIST_LOAD_TIMEOUT_MS, projectExistsGuard } from './project-exists.guard';

describe('projectExistsGuard', () => {
  const seedProjects: Project[] = [
    {
      id: 'known-id',
      name: 'Existing',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const projectsSignal = signal<Project[]>([...seedProjects]);

  beforeEach(() => {
    projectsSignal.set([...seedProjects]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TaskflowStore,
          useValue: {
            projects: projectsSignal.asReadonly(),
          },
        },
      ],
    });
  });

  it('allows when project id exists in store', async () => {
    const route = { paramMap: convertToParamMap({ id: 'known-id' }) } as Pick<
      ActivatedRouteSnapshot,
      'paramMap'
    > as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toBe(true);
  });

  it('redirects to /projects when id is missing', async () => {
    const route = { paramMap: convertToParamMap({}) } as Pick<ActivatedRouteSnapshot, 'paramMap'> as ActivatedRouteSnapshot;
    const router = TestBed.inject(Router);

    const result = await TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });

  it('redirects to /projects when project is not in store', async () => {
    const route = { paramMap: convertToParamMap({ id: 'missing-id' }) } as Pick<
      ActivatedRouteSnapshot,
      'paramMap'
    > as ActivatedRouteSnapshot;
    const router = TestBed.inject(Router);

    const result = await TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });

  it('redirects to /projects when project list stays empty until timeout', async () => {
    projectsSignal.set([]);
    const route = { paramMap: convertToParamMap({ id: 'known-id' }) } as Pick<
      ActivatedRouteSnapshot,
      'paramMap'
    > as ActivatedRouteSnapshot;
    const router = TestBed.inject(Router);

    vi.useFakeTimers();
    const resultPromise = TestBed.runInInjectionContext(() =>
      projectExistsGuard(route, {} as never),
    );
    await vi.advanceTimersByTimeAsync(PROJECT_LIST_LOAD_TIMEOUT_MS);
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });
});
