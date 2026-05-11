import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let app: INestApplication;
  let httpServer: Server;
  const tasksService = {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    patchTask: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/tasks passes projectId query to service', async () => {
    tasksService.getTasks.mockResolvedValue([]);

    await request(httpServer)
      .get('/api/tasks')
      .query({ projectId: 'proj-1' })
      .expect(200);

    expect(tasksService.getTasks).toHaveBeenCalledWith('proj-1');
  });

  it('POST /api/tasks forwards body', async () => {
    const created = {
      id: 't1',
      projectId: 'p1',
      title: 'Task',
      status: 'backlog' as const,
      priority: 'medium' as const,
      tags: [],
      order: 0,
    };
    tasksService.createTask.mockResolvedValue(created);

    const response = await request(httpServer)
      .post('/api/tasks')
      .send({ projectId: 'p1', title: 'Task' })
      .expect(201);

    expect(response.body).toEqual(created);
    expect(tasksService.createTask).toHaveBeenCalledWith({
      projectId: 'p1',
      title: 'Task',
    });
  });

  it('PATCH /api/tasks/:id forwards body', async () => {
    const patched = {
      id: 't1',
      projectId: 'p1',
      title: 'Task',
      status: 'done' as const,
      priority: 'high' as const,
      tags: [],
      order: 5,
    };
    tasksService.patchTask.mockResolvedValue(patched);

    const response = await request(httpServer)
      .patch('/api/tasks/t1')
      .send({ status: 'done' })
      .expect(200);

    expect(response.body).toEqual(patched);
    expect(tasksService.patchTask).toHaveBeenCalledWith('t1', {
      status: 'done',
    });
  });
});
