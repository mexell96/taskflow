import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DbSchema } from './domain.model';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const baseDb: DbSchema = {
    projects: [
      {
        id: 'project-1',
        name: 'Demo project',
        description: 'Demo description',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    tasks: [],
  };

  let dbState: DbSchema;
  let db: {
    readDb: ReturnType<typeof jest.fn>;
    writeDb: ReturnType<typeof jest.fn>;
  };
  let service: ProjectsService;

  beforeEach(() => {
    dbState = structuredClone(baseDb);
    db = {
      readDb: jest.fn(() => Promise.resolve(dbState)),
      writeDb: jest.fn((next: DbSchema) => {
        dbState = next;
        return Promise.resolve();
      }),
    };
    service = new ProjectsService(db as never);
  });

  it('trims optional author on create', async () => {
    const created = await service.createProject({
      name: '  New project  ',
      description: '  Desc  ',
      author: '  John Doe  ',
    });

    expect(created).toEqual(
      expect.objectContaining({
        name: 'New project',
        description: 'Desc',
        author: 'John Doe',
      }),
    );
  });

  it('removes author when patch contains only spaces', async () => {
    dbState.projects[0].author = 'John Doe';

    const patched = await service.patchProject('project-1', { author: '   ' });

    expect(patched.author).toBeUndefined();
    expect(dbState.projects[0].author).toBeUndefined();
  });

  it('returns project by id', async () => {
    const project = await service.getProjectById('project-1');
    expect(project.name).toBe('Demo project');
  });

  it('throws when get project id is not found', async () => {
    await expect(service.getProjectById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when patch project id is not found', async () => {
    await expect(
      service.patchProject('missing-id', { author: 'Jane' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when create has empty name', async () => {
    await expect(
      service.createProject({ name: '   ', author: 'Jane' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns all projects from getProjects', async () => {
    const projects = await service.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('project-1');
  });

  it('throws when patch sets empty name', async () => {
    await expect(
      service.patchProject('project-1', { name: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
