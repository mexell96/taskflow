import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
    req.flush({ message: 'Projects unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    expect(receivedError).toEqual({
      status: 503,
      message: 'Projects unavailable',
      url: '/api/projects',
    });
  });
});
