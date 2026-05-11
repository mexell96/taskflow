import { existsSync, mkdtempSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { DbFileService } from './db-file.service';

describe('DbFileService', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'taskflow-db-spec-'));
  const dbPath = join(tempDir, 'db.json');
  let previousEnv: string | undefined;

  beforeAll(() => {
    previousEnv = process.env.TASKFLOW_DB_PATH;
    process.env.TASKFLOW_DB_PATH = dbPath;
  });

  afterAll(() => {
    if (previousEnv === undefined) {
      delete process.env.TASKFLOW_DB_PATH;
    } else {
      process.env.TASKFLOW_DB_PATH = previousEnv;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  it('creates seed file on first read and returns schema', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DbFileService],
    }).compile();
    const service = moduleRef.get(DbFileService);

    const data = await service.readDb();

    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(existsSync(dbPath)).toBe(true);
  });

  it('persists writes readable on next read', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DbFileService],
    }).compile();
    const service = moduleRef.get(DbFileService);

    const first = await service.readDb();
    first.projects.push({
      id: 'extra-project',
      name: 'Extra',
      createdAt: '2026-03-01T00:00:00.000Z',
    });
    await service.writeDb(first);

    const moduleRef2: TestingModule = await Test.createTestingModule({
      providers: [DbFileService],
    }).compile();
    const service2 = moduleRef2.get(DbFileService);
    const second = await service2.readDb();

    expect(
      second.projects.some((project) => project.id === 'extra-project'),
    ).toBe(true);
  });
});
