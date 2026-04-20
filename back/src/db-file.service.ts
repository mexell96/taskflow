import { Injectable } from '@nestjs/common';
import { access, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import type { DbSchema } from './domain.model';

const seedDb: DbSchema = {
  projects: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Demo project',
      description: 'Seed data for Taskflow',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  tasks: [
    {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Backlog task',
      status: 'backlog',
      priority: 'low',
      tags: ['demo'],
      order: 0,
    },
    {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'In progress',
      description: 'Example description',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-12-31T00:00:00.000Z',
      tags: [],
      order: 10,
    },
    {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Done',
      status: 'done',
      priority: 'high',
      dueDate: '2020-01-01T00:00:00.000Z',
      tags: ['urgent'],
      order: 20,
    },
  ],
};

@Injectable()
export class DbFileService {
  private readonly dbPath = this.resolveDbPath();
  private writeQueue: Promise<void> = Promise.resolve();

  async readDb(): Promise<DbSchema> {
    await this.ensureDbFile();
    const raw = await readFile(this.dbPath, 'utf-8');
    return JSON.parse(raw) as DbSchema;
  }

  async writeDb(db: DbSchema): Promise<void> {
    const writeTask = this.writeQueue.then(() =>
      writeFile(this.dbPath, JSON.stringify(db, null, 2), 'utf-8'),
    );
    this.writeQueue = writeTask.catch(() => undefined);
    await writeTask;
  }

  private resolveDbPath(): string {
    const envPath = process.env.TASKFLOW_DB_PATH?.trim();
    if (envPath) {
      return isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
    }
    const localPath = resolve(process.cwd(), 'db.json');
    const monorepoPath = resolve(process.cwd(), 'back', 'db.json');
    return process.cwd().endsWith('/back') ? localPath : monorepoPath;
  }

  private async ensureDbFile(): Promise<void> {
    try {
      await access(this.dbPath);
    } catch {
      await this.writeDb(seedDb);
    }
  }
}
