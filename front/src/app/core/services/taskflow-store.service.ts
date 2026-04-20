import { inject, Injectable, signal } from '@angular/core';
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

  readonly projects = this._projects.asReadonly();
  readonly tasks = this._tasks.asReadonly();

  private logApiError(context: string, error: unknown) {
    if (this.isApiError(error)) {
      console.log(`${context}: ${error.status} ${error.message}`, error.url);
      return;
    }
    console.log(context, error);
  }

  constructor() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectApi.getProjects().subscribe({
      next: (projects: Project[]) => {
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
          this._projects.update((list: Project[]) => [...list, project]);
        },
        error: (error: unknown) => {
          this.logApiError('Failed to create project', error);
        },
      });
  }

  addTask(projectId: string, title: string, priority: TaskPriority = 'medium') {
    const siblings = this._tasks().filter((task: Task) => task.projectId === projectId);
    const maxOrder = siblings.reduce((max: number, task: Task) => Math.max(max, task.order), 0);
    this.taskApi
      .createTask({
        projectId,
        title: title.trim(),
        priority,
        status: 'backlog',
        tags: [],
        order: maxOrder + 10,
      })
      .subscribe({
        next: (task: Task) => {
          this._tasks.update((list: Task[]) => [...list, task]);
        },
        error: (error: unknown) => {
          this.logApiError('Failed to create task', error);
        },
      });
  }

  setTaskStatus(taskId: string, status: TaskStatus) {
    this.taskApi.patchTask(taskId, { status }).subscribe({
      next: (updatedTask: Task) => {
        this._tasks.update((list: Task[]) =>
          list.map((task: Task) => (task.id === updatedTask.id ? updatedTask : task)),
        );
      },
      error: (error: unknown) => {
        this.logApiError('Failed to update task status', error);
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
