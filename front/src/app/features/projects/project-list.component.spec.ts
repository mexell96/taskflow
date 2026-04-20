import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import type { Project } from '@app/shared/models/project.model';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { ProjectListComponent } from './project-list.component';

describe('ProjectListComponent', () => {
  const projectsSignal = signal<Project[]>([]);
  const apiErrorMessageSignal = signal<string | null>(null);
  const addProject = vi.fn();

  beforeEach(async () => {
    addProject.mockReset();
    projectsSignal.set([]);
    apiErrorMessageSignal.set(null);

    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        {
          provide: TaskflowStore,
          useValue: {
            projects: projectsSignal.asReadonly(),
            apiErrorMessage: apiErrorMessageSignal.asReadonly(),
            addProject,
          },
        },
      ],
    }).compileComponents();
  });

  it('creates project from form submit', () => {
    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.detectChanges();

    const inputs = fixture.debugElement.queryAll(By.css('input'));
    const nameInput = inputs[0].nativeElement as HTMLInputElement;
    const descriptionInput = inputs[1].nativeElement as HTMLInputElement;

    nameInput.value = '  New Project  ';
    nameInput.dispatchEvent(new Event('input'));
    descriptionInput.value = '  Description  ';
    descriptionInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(addProject).toHaveBeenCalledWith('  New Project  ', '  Description  ');
    expect(nameInput.value).toBe('');
    expect(descriptionInput.value).toBe('');
  });

  it('does not create project when form is invalid', () => {
    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(addProject).not.toHaveBeenCalled();
  });

  it('shows minLength validation message for short project name', () => {
    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.detectChanges();

    const nameInput = fixture.debugElement.queryAll(By.css('input'))[0].nativeElement as HTMLInputElement;
    nameInput.value = 'ab';
    nameInput.dispatchEvent(new Event('input'));
    nameInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.field-error'));
    expect(error.nativeElement.textContent).toContain('Project name must be at least 3 characters.');
    expect(addProject).not.toHaveBeenCalled();
  });

  it('shows API error banner for user', () => {
    const fixture = TestBed.createComponent(ProjectListComponent);
    apiErrorMessageSignal.set('Projects unavailable');
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(banner.nativeElement.textContent).toContain('Projects unavailable');
  });
});
