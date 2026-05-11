import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router } from '@angular/router';

import { TaskflowStore } from '@app/core/services/store/taskflow-store.service';
import type { Project } from '@app/shared/models/project.model';
import { projectExistsGuard } from './project-exists.guard';

describe('projectExistsGuard', () => {
  const projectsSignal = signal<Project[]>([
    {
      id: 'known-id',
      name: 'Existing',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  beforeEach(() => {
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

  it('allows when project id exists in store', () => {
    const route = { paramMap: convertToParamMap({ id: 'known-id' }) } as Pick<
      ActivatedRouteSnapshot,
      'paramMap'
    > as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toBe(true);
  });

  it('redirects to /projects when id is missing', () => {
    const route = { paramMap: convertToParamMap({}) } as Pick<ActivatedRouteSnapshot, 'paramMap'> as ActivatedRouteSnapshot;
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });

  it('redirects to /projects when project is not in store', () => {
    const route = { paramMap: convertToParamMap({ id: 'missing-id' }) } as Pick<
      ActivatedRouteSnapshot,
      'paramMap'
    > as ActivatedRouteSnapshot;
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() => projectExistsGuard(route, {} as never));

    expect(result).toEqual(router.createUrlTree(['/projects']));
  });
});
