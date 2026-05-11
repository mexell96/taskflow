import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { ApiError } from '@app/core/models/api-error.model';
import type { Project } from '@app/shared/models/project.model';
import type { Task } from '@app/shared/models/task.model';
import { ProjectApiService } from '../api/project/project-api.service';
import { TaskApiService } from '../api/task/task-api.service';
import { ToastService } from '../toast/toast.service';
import { TaskflowStore } from './taskflow-store.service';

describe('TaskflowStore', () => {
  let projectApi: {
    getProjects: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
    getProject: ReturnType<typeof vi.fn>;
    patchProject: ReturnType<typeof vi.fn>;
  };
  let taskApi: {
    getTasks: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    patchTask: ReturnType<typeof vi.fn>;
  };
  const loadedProjects: Project[] = [
    {
      id: 'f2f8f1a2-72c5-45f3-8493-7e30cbf140f3',
      name: 'API project',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  ];

  const toast = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    toast.showError.mockReset();
    toast.showSuccess.mockReset();

    projectApi = {
      getProjects: vi.fn(),
      createProject: vi.fn(),
      getProject: vi.fn(),
      patchProject: vi.fn(),
    };
    taskApi = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
    };

    projectApi.getProjects.mockReturnValue(of(loadedProjects));
    projectApi.createProject.mockReturnValue(
      of({
        id: '87a4fcf3-bf67-4f1b-ae14-6baf6f3d0d56',
        name: 'New project',
        description: 'created',
        author: 'John Doe',
        createdAt: new Date().toISOString(),
      }),
    );
    taskApi.getTasks.mockReturnValue(of([]));
    taskApi.createTask.mockReturnValue(
      of({
        id: '1ea5f976-e1b0-45ee-a965-b4e95f730d82',
        projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Created task',
        status: 'backlog',
        priority: 'medium',
        tags: [],
        order: 30,
      }),
    );
    taskApi.patchTask.mockReturnValue(
      of({
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Backlog task',
        status: 'in_progress',
        priority: 'low',
        tags: ['demo'],
        order: 0,
      }),
    );
    projectApi.patchProject.mockReturnValue(
      of({
        id: 'f2f8f1a2-72c5-45f3-8493-7e30cbf140f3',
        name: 'API project updated',
        description: 'updated',
        author: 'Jane Doe',
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        TaskflowStore,
        { provide: ToastService, useValue: toast },
        { provide: ProjectApiService, useValue: projectApi as unknown as ProjectApiService },
        { provide: TaskApiService, useValue: taskApi as unknown as TaskApiService },
      ],
    });
  });

  it('loads projects on initialization', () => {
    const store = TestBed.inject(TaskflowStore);

    expect(projectApi.getProjects).toHaveBeenCalled();
    expect(store.projects()).toEqual(loadedProjects);
  });

  it('loads tasks for a project and replaces stale tasks for same project', () => {
    const store = TestBed.inject(TaskflowStore);
    const apiTasks: Task[] = [
      {
        id: 'f4d996f5-f70f-41ee-8d40-f0861e6c624e',
        projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Fresh from API',
        status: 'done',
        priority: 'high',
        tags: [],
        order: 999,
      },
    ];
    taskApi.getTasks.mockReturnValue(of(apiTasks));

    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    expect(taskApi.getTasks).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(
      store
        .tasks()
        .filter((task: Task) => task.projectId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ).toEqual(apiTasks);
  });

  it('creates project with trimmed values and appends response', () => {
    const store = TestBed.inject(TaskflowStore);

    store.addProject('  New project  ', '  created  ', '  John Doe  ');

    expect(projectApi.createProject).toHaveBeenCalledWith({
      name: 'New project',
      description: 'created',
      author: 'John Doe',
    });
    expect(store.projects().at(-1)).toEqual(expect.objectContaining({ name: 'New project' }));
  });

  it('updates project with trimmed optional author', () => {
    const store = TestBed.inject(TaskflowStore);

    store.updateProject(
      'f2f8f1a2-72c5-45f3-8493-7e30cbf140f3',
      '  API project updated  ',
      '  updated  ',
      '  Jane Doe  ',
    );

    expect(projectApi.patchProject).toHaveBeenCalledWith('f2f8f1a2-72c5-45f3-8493-7e30cbf140f3', {
      name: 'API project updated',
      description: 'updated',
      author: 'Jane Doe',
    });
    expect(store.projects()[0]).toEqual(
      expect.objectContaining({
        name: 'API project updated',
        description: 'updated',
        author: 'Jane Doe',
      }),
    );
  });

  it('creates task with computed order and updates store on success', () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'existing-task',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Existing task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 20,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    store.addTask('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '  New task  ', 'high');

    expect(taskApi.createTask).toHaveBeenCalledWith({
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'New task',
      priority: 'high',
      dueDate: undefined,
      status: 'backlog',
      tags: [],
      description: undefined,
      order: 30,
    });
    expect(store.tasks().at(-1)).toEqual(
      expect.objectContaining({ id: '1ea5f976-e1b0-45ee-a965-b4e95f730d82' }),
    );
  });

  it('updates task status using patch endpoint response', () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    store.setTaskStatus('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'in_progress');

    expect(taskApi.patchTask).toHaveBeenCalledWith('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', {
      status: 'in_progress',
    });
    const updated = store
      .tasks()
      .find((task: Task) => task.id === 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');
    expect(updated?.status).toBe('in_progress');
  });

  it('moves task with status and order via patch endpoint', async () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    store.moveTask('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'done', 55);
    await Promise.resolve();

    expect(taskApi.patchTask).toHaveBeenCalledWith('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', {
      status: 'done',
      order: 55,
    });
  });

  it('queues moveTask patch requests sequentially', async () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
        {
          id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Second backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    store.moveTask('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'done', 30);
    store.moveTask('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'backlog', 5);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(taskApi.patchTask).toHaveBeenNthCalledWith(1, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', {
      status: 'done',
      order: 30,
    });
    expect(taskApi.patchTask).toHaveBeenNthCalledWith(2, 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', {
      status: 'backlog',
      order: 5,
    });
  });

  it('shows toast on setTaskStatus API failure and rolls back optimistic status', () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    const apiError: ApiError = {
      status: 422,
      message: 'Invalid transition',
      url: '/api/tasks/x',
    };
    taskApi.patchTask.mockReturnValue(throwError(() => apiError));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    store.setTaskStatus('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'done');

    expect(toast.showError).toHaveBeenCalledWith('Invalid transition');
    expect(
      store.tasks().find((t: Task) => t.id === 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')?.status,
    ).toBe('backlog');
    logSpy.mockRestore();
  });

  it('shows toast on moveTask API failure and rolls back optimistic move', async () => {
    const store = TestBed.inject(TaskflowStore);

    taskApi.getTasks.mockReturnValue(
      of([
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          title: 'Backlog task',
          status: 'backlog',
          priority: 'medium',
          tags: [],
          order: 0,
        },
      ]),
    );
    store.loadTasks('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    const apiError: ApiError = {
      status: 409,
      message: 'Conflict move',
      url: '/api/tasks/m',
    };
    taskApi.patchTask.mockReturnValue(throwError(() => apiError));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    store.moveTask('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'done', 99);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toast.showError).toHaveBeenCalledWith('Conflict move');
    const taskAfter = store
      .tasks()
      .find((task: Task) => task.id === 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');
    expect(taskAfter?.status).toBe('backlog');
    expect(taskAfter?.order).toBe(0);
    logSpy.mockRestore();
  });

  it('shows toast on updateProject API failure and rolls back optimistic project', () => {
    const store = TestBed.inject(TaskflowStore);
    const apiError: ApiError = {
      status: 500,
      message: 'Patch failed',
      url: '/api/projects/x',
    };
    projectApi.patchProject.mockReturnValue(throwError(() => apiError));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    store.updateProject(
      'f2f8f1a2-72c5-45f3-8493-7e30cbf140f3',
      'Broken optimistic name',
      'desc',
      'auth',
    );

    expect(toast.showError).toHaveBeenCalledWith('Patch failed');
    expect(store.projects()[0].name).toBe('API project');
    logSpy.mockRestore();
  });

  it('logs typed API errors without throwing from addTask', () => {
    const store = TestBed.inject(TaskflowStore);
    const apiError: ApiError = {
      status: 400,
      message: 'Validation failed',
      url: '/api/tasks',
    };
    taskApi.createTask.mockReturnValue(throwError(() => apiError));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    store.addTask('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'broken');

    expect(logSpy).toHaveBeenCalledWith(
      'Failed to create task: 400 Validation failed',
      '/api/tasks',
    );
    expect(toast.showError).toHaveBeenCalledWith('Validation failed');
    logSpy.mockRestore();
  });
});
