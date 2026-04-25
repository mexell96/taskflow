import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TaskflowStore } from '@app/core/services/store/taskflow-store.service';
import type { Project } from '@app/shared/models/project.model';
import type { Task } from '@app/shared/models/task.model';
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
      dueDate: '2000-01-01T00:00:00.000Z',
      tags: ['urgent'],
      order: 20,
    },
  ]);
  const setTaskStatus = vi.fn();
  const moveTask = vi.fn();
  const announce = vi.fn();

  beforeEach(async () => {
    setTaskStatus.mockReset();
    moveTask.mockReset();
    announce.mockReset();

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
        {
          provide: LiveAnnouncer,
          useValue: {
            announce,
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
    expect(announce).toHaveBeenCalledWith('Task First moved to Done.', 'polite');
  });

  it('does not announce for noop drop in same position', () => {
    const fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('projectId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const backlogTasks = component.columnTasks().backlog;
    const sameContainer = { data: backlogTasks };
    const event = {
      previousContainer: sameContainer,
      container: sameContainer,
      previousIndex: 0,
      currentIndex: 0,
    } as CdkDragDrop<Task[]>;

    component.onDrop(event, 'backlog');

    expect(moveTask).not.toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
  });

  it('filters tasks by searchTerm', () => {
    const fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('projectId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    fixture.componentRef.setInput('searchTerm', 'sec');
    fixture.detectChanges();

    expect(fixture.componentInstance.columnTasks().backlog.map((task: Task) => task.id)).toEqual([
      'task-2',
    ]);
  });

  it('filters tasks by priority, tag and overdue options', () => {
    const fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('projectId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    fixture.componentRef.setInput('priorityFilter', 'medium');
    fixture.componentRef.setInput('tagFilter', 'urgent');
    fixture.componentRef.setInput('overdueOnly', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.columnTasks().backlog.map((task: Task) => task.id)).toEqual([
      'task-2',
    ]);
  });
});
