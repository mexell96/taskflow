import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { apiErrorInterceptor } from '@app/core/interceptors/api-error.interceptor';
import type { ApiError } from '@app/core/models/api-error.model';
import { ProjectApiService } from './project-api.service';

describe('ProjectApiService', () => {
  let service: ProjectApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        ProjectApiService,
      ],
    });
    service = TestBed.inject(ProjectApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets projects list', () => {
    const response = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Demo project',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    service.getProjects().subscribe((projects) => {
      expect(projects).toEqual(response);
    });

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('maps HTTP errors to ApiError via interceptor', () => {
    let receivedError: ApiError | undefined;

    service.getProjects().subscribe({
      next: () => {
        throw new Error('Expected request to fail');
      },
      error: (error: ApiError) => {
        receivedError = error;
      },
    });

    const req = httpMock.expectOne('/api/projects');
    req.flush(
      { message: 'Projects unavailable' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    expect(receivedError).toEqual({
      status: 503,
      message: 'Projects unavailable',
      url: '/api/projects',
    });
  });

  it('maps HTTP errors with string[] message to ApiError via interceptor', () => {
    let receivedError: ApiError | undefined;

    service.getProjects().subscribe({
      next: () => {
        throw new Error('Expected request to fail');
      },
      error: (error: ApiError) => {
        receivedError = error;
      },
    });

    const req = httpMock.expectOne('/api/projects');
    req.flush(
      { message: ['Validation failed', 'Second message'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(receivedError).toEqual({
      status: 400,
      message: 'Validation failed, Second message',
      url: '/api/projects',
    });
  });

  it('reads projects from TransferState cache on browser', () => {
    const transferState = TestBed.inject(TransferState);
    const stateKey =
      makeStateKey<Array<{ id: string; name: string; createdAt: string }>>('api-projects-list');
    const cached = [
      {
        id: 'cached-project',
        name: 'Cached project',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    transferState.set(stateKey, cached);

    service.getProjects().subscribe((projects) => {
      expect(projects).toEqual(cached);
    });

    httpMock.expectNone('/api/projects');
    expect(transferState.hasKey(stateKey)).toBe(false);
  });

  it('sends optional author on createProject', () => {
    service
      .createProject({ name: 'Demo', description: 'Description', author: 'John Doe' })
      .subscribe();

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Demo',
      description: 'Description',
      author: 'John Doe',
    });
    req.flush({
      id: 'created-project',
      name: 'Demo',
      description: 'Description',
      author: 'John Doe',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('sends optional author on patchProject', () => {
    service.patchProject('project-1', { author: 'Jane Doe' }).subscribe();

    const req = httpMock.expectOne('/api/projects/project-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ author: 'Jane Doe' });
    req.flush({
      id: 'project-1',
      name: 'Demo',
      author: 'Jane Doe',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
