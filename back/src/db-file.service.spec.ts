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

function restoreTaskflowDbPath(previous: string | undefined) {
  if (previous === undefined) {
    delete process.env.TASKFLOW_DB_PATH;
  } else {
    process.env.TASKFLOW_DB_PATH = previous;
  }
}

function describeSeedWhenDbPathUnsetAndCwdMocked(
  suiteTitle: string,
  caseTitle: string,
  prepare: () => {
    mockCwd: string;
    expectedDbPath: string;
    teardown: () => void;
  },
) {
  describe(suiteTitle, () => {
    const previousEnv = process.env.TASKFLOW_DB_PATH;
    let cwdSpy: jest.SpiedFunction<typeof process.cwd>;
    let expectedDbPath = '';
    let teardown: () => void = () => {};

    beforeAll(() => {
      const ctx = prepare();
      expectedDbPath = ctx.expectedDbPath;
      teardown = ctx.teardown;
      delete process.env.TASKFLOW_DB_PATH;
      cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(ctx.mockCwd);
    });

    afterAll(() => {
      cwdSpy.mockRestore();
      restoreTaskflowDbPath(previousEnv);
      teardown();
    });

    it(caseTitle, async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [DbFileService],
      }).compile();
      await moduleRef.get(DbFileService).readDb();
      expect(existsSync(expectedDbPath)).toBe(true);
    });
  });
}

describe('DbFileService', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'taskflow-db-spec-'));
  const dbPath = join(tempDir, 'db.json');
  let previousEnv: string | undefined;

  beforeAll(() => {
    previousEnv = process.env.TASKFLOW_DB_PATH;
    process.env.TASKFLOW_DB_PATH = dbPath;
  });

  afterAll(() => {
    restoreTaskflowDbPath(previousEnv);
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

describeSeedWhenDbPathUnsetAndCwdMocked(
  'DbFileService monorepo db path',
  'writes seed to cwd/back/db.json when cwd is not the back folder',
  () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'taskflow-monorepo-'));
    mkdirSync(join(repoRoot, 'back'), { recursive: true });
    return {
      mockCwd: repoRoot,
      expectedDbPath: join(repoRoot, 'back', 'db.json'),
      teardown: () => rmSync(repoRoot, { recursive: true, force: true }),
    };
  },
);

describeSeedWhenDbPathUnsetAndCwdMocked(
  'DbFileService cwd is back package root',
  'writes seed to cwd/db.json when cwd ends with back',
  () => {
    const parent = mkdtempSync(join(tmpdir(), 'taskflow-back-only-'));
    const backFolder = join(parent, 'back');
    mkdirSync(backFolder, { recursive: true });
    return {
      mockCwd: backFolder,
      expectedDbPath: join(backFolder, 'db.json'),
      teardown: () => rmSync(parent, { recursive: true, force: true }),
    };
  },
);
