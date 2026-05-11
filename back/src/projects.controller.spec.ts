import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let app: INestApplication;
  let httpServer: Server;
  const projectsService = {
    getProjects: jest.fn(),
    getProjectById: jest.fn(),
    createProject: jest.fn(),
    patchProject: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: projectsService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/projects returns list from service', async () => {
    projectsService.getProjects.mockResolvedValue([
      { id: 'p1', name: 'A', createdAt: '2026-01-01' },
    ]);

    const response = await request(httpServer).get('/api/projects').expect(200);

    expect(response.body).toEqual([
      { id: 'p1', name: 'A', createdAt: '2026-01-01' },
    ]);
    expect(projectsService.getProjects).toHaveBeenCalled();
  });

  it('GET /api/projects/:id returns one project', async () => {
    projectsService.getProjectById.mockResolvedValue({
      id: 'p1',
      name: 'A',
      createdAt: '2026-01-01',
    });

    const response = await request(httpServer)
      .get('/api/projects/p1')
      .expect(200);

    expect(response.body).toEqual({
      id: 'p1',
      name: 'A',
      createdAt: '2026-01-01',
    });
    expect(projectsService.getProjectById).toHaveBeenCalledWith('p1');
  });

  it('POST /api/projects forwards body to service', async () => {
    const created = { id: 'new', name: 'N', createdAt: '2026-02-01' };
    projectsService.createProject.mockResolvedValue(created);

    const response = await request(httpServer)
      .post('/api/projects')
      .send({ name: 'N', description: 'D' })
      .expect(201);

    expect(response.body).toEqual(created);
    expect(projectsService.createProject).toHaveBeenCalledWith({
      name: 'N',
      description: 'D',
    });
  });

  it('PATCH /api/projects/:id forwards body to service', async () => {
    const patched = { id: 'p1', name: 'Updated', createdAt: '2026-01-01' };
    projectsService.patchProject.mockResolvedValue(patched);

    const response = await request(httpServer)
      .patch('/api/projects/p1')
      .send({ name: 'Updated' })
      .expect(200);

    expect(response.body).toEqual(patched);
    expect(projectsService.patchProject).toHaveBeenCalledWith('p1', {
      name: 'Updated',
    });
  });
});
