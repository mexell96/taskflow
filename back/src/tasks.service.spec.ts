import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DbSchema } from './domain.model';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const baseDb: DbSchema = {
    projects: [
      { id: 'project-1', name: 'P', createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Existing',
        status: 'backlog',
        priority: 'low',
        tags: [],
        order: 10,
      },
    ],
  };

  let dbState: DbSchema;
  let db: {
    readDb: ReturnType<typeof jest.fn>;
    writeDb: ReturnType<typeof jest.fn>;
  };
  let service: TasksService;

  beforeEach(() => {
    dbState = structuredClone(baseDb);
    db = {
      readDb: jest.fn(() => Promise.resolve(dbState)),
      writeDb: jest.fn((next: DbSchema) => {
        dbState = next;
        return Promise.resolve();
      }),
    };
    service = new TasksService(db as never);
  });

  it('throws when projectId query is missing', async () => {
    await expect(service.getTasks()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns tasks filtered by projectId', async () => {
    const tasks = await service.getTasks('project-1');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-1');
  });

  it('throws when createTask misses projectId or title', async () => {
    await expect(
      service.createTask({ projectId: 'project-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createTask({ title: 'Only title' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws on invalid status or priority', async () => {
    await expect(
      service.createTask({
        projectId: 'project-1',
        title: 'T',
        status: 'invalid' as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createTask({
        projectId: 'project-1',
        title: 'T',
        priority: 'invalid' as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when project does not exist', async () => {
    await expect(
      service.createTask({ projectId: 'missing', title: 'T' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates task with default order after siblings', async () => {
    const created = await service.createTask({
      projectId: 'project-1',
      title: '  New  ',
    });

    expect(created.title).toBe('New');
    expect(created.order).toBe(20);
    expect(dbState.tasks).toHaveLength(2);
  });

  it('throws when patch task id is unknown', async () => {
    await expect(
      service.patchTask('missing', { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when patch sets invalid status', async () => {
    await expect(
      service.patchTask('task-1', { status: 'invalid' as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when patch sets invalid priority', async () => {
    await expect(
      service.patchTask('task-1', { priority: 'invalid' as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when patch moves task to unknown project', async () => {
    await expect(
      service.patchTask('task-1', { projectId: 'no-such-project' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when patch projectId is only spaces', async () => {
    await expect(
      service.patchTask('task-1', { projectId: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates task fields', async () => {
    const updated = await service.patchTask('task-1', {
      title: '  Renamed  ',
      status: 'done',
    });

    expect(updated.title).toBe('Renamed');
    expect(updated.status).toBe('done');
    expect(dbState.tasks[0].title).toBe('Renamed');
  });
});
