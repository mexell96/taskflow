import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DbFileService } from './db-file.service';
import type { Project } from './domain.model';

type CreateProjectDto = {
  name?: string;
  description?: string;
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
      description: dto.description?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const state = await this.db.readDb();
    state.projects.push(newProject);
    await this.db.writeDb(state);
    return newProject;
  }
}
