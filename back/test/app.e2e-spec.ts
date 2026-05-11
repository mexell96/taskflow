import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import type { Project } from './../src/domain.model';
import { AppModule } from './../src/app.module';
import { DEMO_PROJECT_ID } from '../../e2e-seed';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/projects returns seeded demo project', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/projects')
      .expect(200);

    const projects = response.body as Project[];
    expect(Array.isArray(projects)).toBe(true);
    const demo = projects.find((project) => project.id === DEMO_PROJECT_ID);
    expect(demo?.name).toBe('Demo project');
  });
});
