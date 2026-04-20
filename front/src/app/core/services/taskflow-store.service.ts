import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ApiError } from '@app/core/models/api-error.model';
import type { Project } from '@app/shared/models/project.model';
import type { Task, TaskPriority, TaskStatus } from '@app/shared/models/task.model';
import { ProjectApiService } from './project-api.service';
import { TaskApiService } from './task-api.service';

const SEED_PROJECT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const SEED_TASK_BACKLOG = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const SEED_TASK_PROGRESS = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const SEED_TASK_DONE = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

const seedProjects: Project[] = [
  {
    id: SEED_PROJECT_ID,
    name: 'Demo project',
    description: 'Seed data for Taskflow (no API yet)',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const seedTasks: Task[] = [
  {
    id: SEED_TASK_BACKLOG,
    projectId: SEED_PROJECT_ID,
    title: 'Backlog task',
    status: 'backlog',
    priority: 'low',
    tags: ['demo'],
    order: 0,
  },
  {
    id: SEED_TASK_PROGRESS,
    projectId: SEED_PROJECT_ID,
    title: 'In progress',
    description: 'Example description',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-12-31T00:00:00.000Z',
    tags: [],
    order: 10,
  },
  {
    id: SEED_TASK_DONE,
    projectId: SEED_PROJECT_ID,
    title: 'Done',
    status: 'done',
    priority: 'high',
    dueDate: '2020-01-01T00:00:00.000Z',
    tags: ['urgent'],
    order: 20,
  },
];

@Injectable({ providedIn: 'root' })
export class TaskflowStore {
  private readonly projectApi = inject(ProjectApiService);
  private readonly taskApi = inject(TaskApiService);
  private readonly _projects = signal<Project[]>([...seedProjects]);
  private readonly _tasks = signal<Task[]>([...seedTasks]);
  private readonly _apiErrorMessage = signal<string | null>(null);
  private moveRequestQueue: Promise<void> = Promise.resolve();

  readonly projects = this._projects.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  readonly apiErrorMessage = this._apiErrorMessage.asReadonly();

  private clearApiErrorMessage() {
    this._apiErrorMessage.set(null);
  }

  private setApiErrorMessage(message: string) {
    this._apiErrorMessage.set(message);
  }

  private logApiError(context: string, error: unknown) {
    if (this.isApiError(error)) {
      console.log(`${context}: ${error.status} ${error.message}`, error.url);
      this.setApiErrorMessage(error.message);
      return;
    }
    console.log(context, error);
    this.setApiErrorMessage('Unexpected API error');
  }

  constructor() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectApi.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.clearApiErrorMessage();
        this._projects.set(projects);
      },
      error: (error: unknown) => {
        this.logApiError('Failed to load projects', error);
      },
    });
  }

  loadTasks(projectId: string) {
    this.taskApi.getTasks(projectId).subscribe({
      next: (tasks: Task[]) => {
        this.clearApiErrorMessage();
        this._tasks.update((list: Task[]) => [
          ...list.filter((task: Task) => task.projectId !== projectId),
          ...tasks,
        ]);
      },
      error: (error: unknown) => {
        this.logApiError('Failed to load tasks', error);
      },
    });
  }

  addProject(name: string, description?: string) {
    this.projectApi
      .createProject({
        name: name.trim(),
        description: description?.trim() || undefined,
      })
      .subscribe({
        next: (project: Project) => {
          this.clearApiErrorMessage();
          this._projects.update((list: Project[]) => [...list, project]);
        },
        error: (error: unknown) => {
          this.logApiError('Failed to create project', error);
        },
      });
  }

  updateProject(projectId: string, name: string, description?: string) {
    const current = this._projects().find((project: Project) => project.id === projectId);
    if (!current) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description?.trim();
    const optimistic: Project = {
      ...current,
      name: trimmedName,
      description: trimmedDescription || undefined,
    };
    this.clearApiErrorMessage();
    this._projects.update((list: Project[]) => list.map((item: Project) => (item.id === projectId ? optimistic : item)));

    this.projectApi.patchProject(projectId, { name: trimmedName, description: trimmedDescription || undefined }).subscribe({
      next: (project: Project) => {
        this.clearApiErrorMessage();
        this._projects.update((list: Project[]) => list.map((item: Project) => (item.id === project.id ? project : item)));
      },
      error: (error: unknown) => {
        this._projects.update((list: Project[]) => list.map((item: Project) => (item.id === current.id ? current : item)));
        this.logApiError('Failed to update project', error);
      },
    });
  }

  addTask(
    projectId: string,
    title: string,
    priority: TaskPriority = 'medium',
    dueDate?: string,
    description?: string,
    tags: string[] = [],
  ) {
    const siblings = this._tasks().filter((task: Task) => task.projectId === projectId);
    const maxOrder = siblings.reduce((max: number, task: Task) => Math.max(max, task.order), 0);
    const normalizedTags = tags.map((tag: string) => tag.trim()).filter(Boolean);
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      projectId,
      title: title.trim(),
      description: description?.trim() || undefined,
      status: 'backlog',
      priority,
      dueDate: dueDate || undefined,
      tags: normalizedTags,
      order: maxOrder + 10,
    };
    this.clearApiErrorMessage();
    this._tasks.update((list: Task[]) => [...list, optimisticTask]);

    this.taskApi
      .createTask({
        projectId,
        title: optimisticTask.title,
        description: optimisticTask.description,
        priority,
        dueDate,
        status: optimisticTask.status,
        tags: normalizedTags,
        order: optimisticTask.order,
      })
      .subscribe({
        next: (task: Task) => {
          this.clearApiErrorMessage();
          this._tasks.update((list: Task[]) =>
            list.map((item: Task) => (item.id === optimisticTask.id ? task : item)),
          );
        },
        error: (error: unknown) => {
          this._tasks.update((list: Task[]) => list.filter((item: Task) => item.id !== optimisticTask.id));
          this.logApiError('Failed to create task', error);
        },
      });
  }

  setTaskStatus(taskId: string, status: TaskStatus) {
    const current = this._tasks().find((task: Task) => task.id === taskId);
    if (!current) {
      return;
    }
    this.clearApiErrorMessage();
    this._tasks.update((list: Task[]) =>
      list.map((task: Task) => (task.id === taskId ? { ...task, status } : task)),
    );

    this.taskApi.patchTask(taskId, { status }).subscribe({
      next: (updatedTask: Task) => {
        this.clearApiErrorMessage();
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => (task.id === updatedTask.id ? updatedTask : task)),
        );
      },
      error: (error: unknown) => {
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => (task.id === current.id ? current : task)),
        );
        this.logApiError('Failed to update task status', error);
      },
    });
  }

  moveTask(taskId: string, status: TaskStatus, order: number) {
    const current = this._tasks().find((task: Task) => task.id === taskId);
    if (!current) {
      return;
    }
    this.clearApiErrorMessage();
    this._tasks.update((list: Task[]) =>
      list.map((task: Task) => (task.id === taskId ? { ...task, status, order } : task)),
    );

    const runPatch = async () => {
      try {
        const updatedTask = await firstValueFrom(this.taskApi.patchTask(taskId, { status, order }));
        this.clearApiErrorMessage();
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => {
            if (task.id !== updatedTask.id) {
              return task;
            }
            // Do not override a newer optimistic DnD state queued after this request.
            return task.status === status && task.order === order ? updatedTask : task;
          }),
        );
      } catch (error: unknown) {
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => {
            if (task.id !== current.id) {
              return task;
            }
            return task.status === status && task.order === order ? current : task;
          }),
        );
        this.logApiError('Failed to move task', error);
      }
    };

    this.moveRequestQueue = this.moveRequestQueue.then(runPatch, runPatch);
  }

  updateTask(
    taskId: string,
    patch: Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'tags' | 'status'>,
  ) {
    const current = this._tasks().find((task: Task) => task.id === taskId);
    if (!current) {
      return;
    }

    const optimistic: Task = {
      ...current,
      ...patch,
      title: patch.title.trim(),
      description: patch.description?.trim() || undefined,
      dueDate: patch.dueDate || undefined,
      tags: patch.tags.map((tag) => tag.trim()).filter(Boolean),
    };
    this.clearApiErrorMessage();
    this._tasks.update((list: Task[]) => list.map((task: Task) => (task.id === taskId ? optimistic : task)));

    this.taskApi
      .patchTask(taskId, {
        title: optimistic.title,
        description: optimistic.description,
        status: optimistic.status,
        priority: optimistic.priority,
        dueDate: optimistic.dueDate,
        tags: optimistic.tags,
      })
      .subscribe({
      next: (updatedTask: Task) => {
        this.clearApiErrorMessage();
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => (task.id === updatedTask.id ? updatedTask : task)),
        );
      },
      error: (error: unknown) => {
        this._tasks.update((list: Task[]) => list.map((task: Task) => (task.id === current.id ? current : task)));
        this.logApiError('Failed to update task', error);
      },
      });
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'message' in error &&
      typeof (error as { status?: unknown }).status === 'number' &&
      typeof (error as { message?: unknown }).message === 'string'
    );
  }
}
