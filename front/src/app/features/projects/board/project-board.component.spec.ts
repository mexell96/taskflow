import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { TaskflowStore } from '@app/core/services/store/taskflow-store.service';
import type { Project } from '@app/shared/models/project.model';
import type { Task } from '@app/shared/models/task.model';
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
  const updateProject = vi.fn();

  beforeEach(async () => {
    addTask.mockReset();
    loadTasks.mockReset();
    setTaskStatus.mockReset();
    updateProject.mockReset();

    await TestBed.configureTestingModule({
      imports: [ProjectBoardComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of<ParamMap>(
              convertToParamMap({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
            ),
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
            updateProject,
          },
        },
      ],
    }).compileComponents();
  });

  it('shows minLength validation message for short task title', () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('.open-add-task')
      ?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    titleInput.value = 'ab';
    titleInput.dispatchEvent(new Event('input'));
    titleInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.field-error'));
    expect(error.nativeElement.textContent).toContain('Task title must be at least 3 characters.');
    expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    expect(titleInput.getAttribute('aria-describedby')).toBe('task-title-error');
    expect(addTask).not.toHaveBeenCalled();
  });

  it('shows past-date validation message for dueDate', () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('.open-add-task')
      ?.dispatchEvent(new Event('click'));
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
    expect(
      errorMessages.some((item: { nativeElement: { textContent: string } }) =>
        item.nativeElement.textContent.includes('Due date cannot be in the past for new tasks.'),
      ),
    ).toBe(true);
    expect(dueDateInput.getAttribute('aria-invalid')).toBe('true');
    expect(dueDateInput.getAttribute('aria-describedby')).toBe('task-due-date-error');
    expect(addTask).not.toHaveBeenCalled();
  });

  it('focuses first field on dialog open and returns focus on close', async () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const openButton = host.querySelector('.open-add-task') as HTMLButtonElement;
    openButton.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const titleInput = host.querySelector('input[formControlName="title"]') as HTMLInputElement;
    expect(document.activeElement).toBe(titleInput);

    const cancelButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Cancel'),
    ) as HTMLButtonElement | undefined;
    cancelButton?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(openButton);
  });

  it('saves project edit with optional author', () => {
    const fixture = TestBed.createComponent(ProjectBoardComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('.edit-project-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const inputs = fixture.debugElement.queryAll(By.css('.project-edit input'));
    const nameInput = inputs[0].nativeElement as HTMLInputElement;
    const descriptionInput = inputs[1].nativeElement as HTMLInputElement;
    const authorInput = inputs[2].nativeElement as HTMLInputElement;
    nameInput.value = 'Updated project';
    nameInput.dispatchEvent(new Event('input'));
    descriptionInput.value = 'Updated description';
    descriptionInput.dispatchEvent(new Event('input'));
    authorInput.value = 'Updated author';
    authorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('.project-edit'))
      .nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(updateProject).toHaveBeenCalledWith(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'Updated project',
      'Updated description',
      'Updated author',
    );
  });
});
