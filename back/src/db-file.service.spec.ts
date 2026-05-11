import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
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

  it('resolves relative TASKFLOW_DB_PATH against cwd', async () => {
    const relativeName = 'from-cwd-db.json';
    const absoluteExpected = join(tempDir, relativeName);
    if (existsSync(absoluteExpected)) {
      unlinkSync(absoluteExpected);
    }
    process.env.TASKFLOW_DB_PATH = relativeName;
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    try {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [DbFileService],
      }).compile();
      const service = moduleRef.get(DbFileService);
      await service.readDb();
      expect(existsSync(absoluteExpected)).toBe(true);
    } finally {
      cwdSpy.mockRestore();
      process.env.TASKFLOW_DB_PATH = dbPath;
      if (existsSync(absoluteExpected)) {
        unlinkSync(absoluteExpected);
      }
    }
  });
});

describe('DbFileService monorepo db path', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'taskflow-monorepo-'));
  const previousEnv = process.env.TASKFLOW_DB_PATH;
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>;

  beforeAll(() => {
    mkdirSync(join(repoRoot, 'back'), { recursive: true });
    delete process.env.TASKFLOW_DB_PATH;
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(repoRoot);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    if (previousEnv === undefined) {
      delete process.env.TASKFLOW_DB_PATH;
    } else {
      process.env.TASKFLOW_DB_PATH = previousEnv;
    }
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it('writes seed to cwd/back/db.json when cwd is not the back folder', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DbFileService],
    }).compile();
    const service = moduleRef.get(DbFileService);

    await service.readDb();

    expect(existsSync(join(repoRoot, 'back', 'db.json'))).toBe(true);
  });
});

describe('DbFileService cwd is back package root', () => {
  const parent = mkdtempSync(join(tmpdir(), 'taskflow-back-only-'));
  const backFolder = join(parent, 'back');
  const previousEnv = process.env.TASKFLOW_DB_PATH;
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>;

  beforeAll(() => {
    mkdirSync(backFolder, { recursive: true });
    delete process.env.TASKFLOW_DB_PATH;
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(backFolder);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    if (previousEnv === undefined) {
      delete process.env.TASKFLOW_DB_PATH;
    } else {
      process.env.TASKFLOW_DB_PATH = previousEnv;
    }
    rmSync(parent, { recursive: true, force: true });
  });

  it('writes seed to cwd/db.json when cwd ends with back', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DbFileService],
    }).compile();
    const service = moduleRef.get(DbFileService);

    await service.readDb();

    expect(existsSync(join(backFolder, 'db.json'))).toBe(true);
  });
});
