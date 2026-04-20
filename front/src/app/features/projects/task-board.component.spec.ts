import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { Project } from '@app/shared/models/project.model';
import type { Task } from '@app/shared/models/task.model';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { TaskBoardComponent } from './task-board.component';

describe('TaskBoardComponent', () => {
  const projectsSignal = signal<Project[]>([
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Demo project',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);
  const tasksSignal = signal<Task[]>([
    {
      id: 'task-1',
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'First',
      status: 'backlog',
      priority: 'low',
      tags: [],
      order: 10,
    },
    {
      id: 'task-2',
      projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Second',
      status: 'backlog',
      priority: 'medium',
      tags: [],
      order: 20,
    },
  ]);
  const setTaskStatus = vi.fn();
  const moveTask = vi.fn();

  beforeEach(async () => {
    setTaskStatus.mockReset();
    moveTask.mockReset();

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [
        {
          provide: TaskflowStore,
          useValue: {
            projects: projectsSignal.asReadonly(),
            tasks: tasksSignal.asReadonly(),
            setTaskStatus,
            moveTask,
          },
        },
      ],
    }).compileComponents();
  });

  it('moves task between columns and sends status/order patch', () => {
    const fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('projectId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const backlogTasks = component.columnTasks().backlog;
    const targetDoneTasks = component.columnTasks().done;
    const event = {
      previousContainer: { data: backlogTasks },
      container: { data: targetDoneTasks },
      previousIndex: 0,
      currentIndex: 0,
    } as CdkDragDrop<Task[]>;

    component.onDrop(event, 'done');

    expect(moveTask).toHaveBeenCalledWith('task-1', 'done', 10);
  });
});
