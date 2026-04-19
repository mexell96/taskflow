import { Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@app/shared/models/project.model';
import type { Task, TaskPriority, TaskStatus } from '@app/shared/models/task.model';

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
  private readonly _projects = signal<Project[]>([...seedProjects]);
  private readonly _tasks = signal<Task[]>([...seedTasks]);

  readonly projects = this._projects.asReadonly();
  readonly tasks = this._tasks.asReadonly();

  addProject(name: string, description?: string): Project {
    const project: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this._projects.update((list) => [...list, project]);
    return project;
  }

  addTask(
    projectId: string,
    title: string,
    priority: TaskPriority = 'medium',
  ): Task {
    const siblings = this._tasks().filter((t) => t.projectId === projectId);
    const maxOrder = siblings.reduce((m, t) => Math.max(m, t.order), 0);
    const task: Task = {
      id: uuidv4(),
      projectId,
      title: title.trim(),
      status: 'backlog',
      priority,
      tags: [],
      order: maxOrder + 10,
    };
    this._tasks.update((list) => [...list, task]);
    return task;
  }

  setTaskStatus(taskId: string, status: TaskStatus) {
    this._tasks.update((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
  }
}
