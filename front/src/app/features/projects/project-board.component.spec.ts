import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { convertToParamMap, type ParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { Project } from '@app/shared/models/project.model';
import type { Task } from '@app/shared/models/task.model';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { ProjectBoardComponent } from './project-board.component';

describe('ProjectBoardComponent', () => {
  const projectsSignal = signal<Project[]>([
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Demo project',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);
  const tasksSignal = signal<Task[]>([]);
  const addTask = vi.fn();
  const loadTasks = vi.fn();
  const setTaskStatus = vi.fn();

  beforeEach(async () => {
    addTask.mockReset();
    loadTasks.mockReset();
    setTaskStatus.mockReset();

    await TestBed.configureTestingModule({
      imports: [ProjectBoardComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of<ParamMap>(convertToParamMap({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })),
          },
        },
        {
          provide: TaskflowStore,
          useValue: {
            projects: projectsSignal.asReadonly(),
            tasks: tasksSignal.asReadonly(),
            addTask,
            loadTasks,
            setTaskStatus,
          },
        },
      ],
    }).compileComponents();
  });

  it('shows minLength validation message for short task title', () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    titleInput.value = 'ab';
    titleInput.dispatchEvent(new Event('input'));
    titleInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.field-error'));
    expect(error.nativeElement.textContent).toContain('Task title must be at least 3 characters.');
    expect(addTask).not.toHaveBeenCalled();
  });

  it('shows past-date validation message for dueDate', () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayValue = yesterday.toISOString().slice(0, 10);

    const dueDateInput = fixture.debugElement.query(By.css('input[formControlName="dueDate"]'))
      .nativeElement as HTMLInputElement;
    dueDateInput.value = yesterdayValue;
    dueDateInput.dispatchEvent(new Event('input'));
    dueDateInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const errorMessages = fixture.debugElement.queryAll(By.css('.field-error'));
    expect(errorMessages.some((item) =>
      item.nativeElement.textContent.includes('Due date cannot be in the past for new tasks.'),
    )).toBe(true);
    expect(addTask).not.toHaveBeenCalled();
  });
});
