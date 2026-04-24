import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DbFileService } from './db-file.service';
import type { Project } from './domain.model';

type CreateProjectDto = {
  name?: string;
  description?: string;
  author?: string;
};
type PatchProjectDto = Partial<
  Pick<Project, 'name' | 'description' | 'author'>
>;

const normalizeOptionalText = (value?: string): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DbFileService) {}

  async getProjects(): Promise<Project[]> {
    const state = await this.db.readDb();
    return state.projects;
  }

  async getProjectById(id: string): Promise<Project> {
    const state = await this.db.readDb();
    const project = state.projects.find((item) => item.id === id);
    if (!project) {
      throw new NotFoundException({ message: `Project ${id} not found` });
    }
    return project;
  }

  async createProject(dto: CreateProjectDto): Promise<Project> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException({ message: 'name is required' });
    }

    const newProject: Project = {
      id: randomUUID(),
      name,
      description: normalizeOptionalText(dto.description),
      author: normalizeOptionalText(dto.author),
      createdAt: new Date().toISOString(),
    };

    const state = await this.db.readDb();
    state.projects.push(newProject);
    await this.db.writeDb(state);
    return newProject;
  }

  async patchProject(id: string, dto: PatchProjectDto): Promise<Project> {
    const state = await this.db.readDb();
    const index = state.projects.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException({ message: `Project ${id} not found` });
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException({ message: 'name must not be empty' });
      }
    }

    const current = state.projects[index];
    const updatedProject: Project = {
      ...current,
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: normalizeOptionalText(dto.description) }
        : {}),
      ...(dto.author !== undefined
        ? { author: normalizeOptionalText(dto.author) }
        : {}),
    };

    state.projects[index] = updatedProject;
    await this.db.writeDb(state);
    return updatedProject;
  }
}
