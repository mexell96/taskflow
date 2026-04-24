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
      readDb: jest.fn(async () => dbState),
      writeDb: jest.fn(async (next: DbSchema) => {
        dbState = next;
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

  it('throws when patch project id is not found', async () => {
    await expect(service.patchProject('missing-id', { author: 'Jane' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when create has empty name', async () => {
    await expect(service.createProject({ name: '   ', author: 'Jane' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
