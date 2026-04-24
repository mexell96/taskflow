import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DbFileService } from './db-file.service';
import type { Task, TaskPriority, TaskStatus } from './domain.model';

type CreateTaskDto = {
  projectId?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  order?: number;
};

type PatchTaskDto = Partial<
  Pick<
    Task,
    'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'tags' | 'order' | 'projectId'
  >
>;

const allowedStatuses: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];
const allowedPriorities: TaskPriority[] = ['low', 'medium', 'high'];

@Injectable()
export class TasksService {
  constructor(private readonly db: DbFileService) {}

  async getTasks(projectId?: string): Promise<Task[]> {
    if (!projectId) {
      throw new BadRequestException({ message: 'projectId query is required' });
    }
    const state = await this.db.readDb();
    return state.tasks.filter((task) => task.projectId === projectId);
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const projectId = dto.projectId?.trim();
    const title = dto.title?.trim();
    if (!projectId || !title) {
      throw new BadRequestException({ message: 'projectId and title are required' });
    }

    const status = dto.status ?? 'backlog';
    const priority = dto.priority ?? 'medium';
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException({ message: 'invalid status value' });
    }
    if (!allowedPriorities.includes(priority)) {
      throw new BadRequestException({ message: 'invalid priority value' });
    }

    const state = await this.db.readDb();
    const projectExists = state.projects.some((project) => project.id === projectId);
    if (!projectExists) {
      throw new NotFoundException({ message: `Project ${projectId} not found` });
    }

    const taskSiblings = state.tasks.filter((task) => task.projectId === projectId);
    const maxOrder = taskSiblings.reduce((max, task) => Math.max(max, task.order), 0);

    const newTask: Task = {
      id: randomUUID(),
      projectId,
      title,
      description: dto.description?.trim() || undefined,
      status,
      priority,
      dueDate: dto.dueDate || undefined,
      tags: dto.tags ?? [],
      order: dto.order ?? maxOrder + 10,
    };

    state.tasks.push(newTask);
    await this.db.writeDb(state);
    return newTask;
  }

  async patchTask(id: string, dto: PatchTaskDto): Promise<Task> {
    const state = await this.db.readDb();
    const index = state.tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      throw new NotFoundException({ message: `Task ${id} not found` });
    }

    if (dto.status && !allowedStatuses.includes(dto.status)) {
      throw new BadRequestException({ message: 'invalid status value' });
    }
    if (dto.priority && !allowedPriorities.includes(dto.priority)) {
      throw new BadRequestException({ message: 'invalid priority value' });
    }
    if (dto.projectId) {
      const projectId = dto.projectId.trim();
      if (!projectId) {
        throw new BadRequestException({ message: 'projectId must not be empty' });
      }
      const projectExists = state.projects.some((project) => project.id === projectId);
      if (!projectExists) {
        throw new NotFoundException({ message: `Project ${projectId} not found` });
      }
    }

    const current = state.tasks[index];
    const updatedTask: Task = {
      ...current,
      ...dto,
      projectId: dto.projectId?.trim() ?? current.projectId,
      title: dto.title?.trim() ?? current.title,
      description: dto.description?.trim() || current.description,
    };

    state.tasks[index] = updatedTask;
    await this.db.writeDb(state);
    return updatedTask;
  }
}
