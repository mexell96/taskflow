import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TaskApiService } from './task-api.service';

describe('TaskApiService', () => {
  let service: TaskApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TaskApiService],
    });
    service = TestBed.inject(TaskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets tasks by projectId', () => {
    const response = [
      {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Backlog task',
        status: 'backlog',
        priority: 'low',
        tags: ['demo'],
        order: 0,
      },
    ];

    service.getTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11').subscribe((tasks) => {
      expect(tasks).toEqual(response);
    });

    const req = httpMock.expectOne('/api/tasks?projectId=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('posts createTask payload', () => {
    const payload = {
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'New task',
      status: 'backlog' as const,
      priority: 'medium' as const,
      tags: [],
      order: 40,
    };
    const response = { id: 'new-id', ...payload };

    service.createTask(payload).subscribe((task) => {
      expect(task).toEqual(response);
    });

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it('reads tasks from TransferState cache on browser', () => {
    const transferState = TestBed.inject(TransferState);
    const projectId = 'cached-project-id';
    const stateKey = makeStateKey<
      Array<{
        id: string;
        projectId: string;
        title: string;
        status: 'backlog';
        priority: 'low';
        tags: string[];
        order: number;
      }>
    >(`api-tasks-${projectId}`);
    const cached = [
      {
        id: 'cached-task',
        projectId,
        title: 'Cached task',
        status: 'backlog' as const,
        priority: 'low' as const,
        tags: [],
        order: 0,
      },
    ];
    transferState.set(stateKey, cached);

    service.getTasks(projectId).subscribe((tasks) => {
      expect(tasks).toEqual(cached);
    });

    httpMock.expectNone(`/api/tasks?projectId=${projectId}`);
    expect(transferState.hasKey(stateKey)).toBe(false);
  });
});
