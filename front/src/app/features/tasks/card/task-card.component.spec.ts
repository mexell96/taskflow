import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { AuthStore } from '@app/core/services/store/auth-store.service';
import type { Task } from '@app/shared/models/task.model';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  const defaultPermissions = {
    canViewProject: true,
    canCreateTask: true,
    canEditTask: true,
    canChangeTaskStatus: true,
    canMoveTask: true,
    canEditProject: true,
  };

  const task: Task = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Backlog task',
    status: 'backlog',
    priority: 'low',
    tags: ['demo'],
    order: 0,
  };

  let permissionsSignal = signal(defaultPermissions);

  beforeEach(async () => {
    permissionsSignal = signal(defaultPermissions);

    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: {
            permissions: permissionsSignal,
          },
        },
      ],
    }).compileComponents();
  });

  it('emits statusChange when status select changes', () => {
    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.statusChange, 'emit');
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

    select.value = 'done';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('done');
  });

  it('focuses status select on Enter and Space from card root', () => {
    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(select);

    host.blur();
    host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(select);
  });

  it('shows edit form and emits editTask for editor role', () => {
    permissionsSignal.set({
      canViewProject: true,
      canCreateTask: true,
      canEditTask: true,
      canChangeTaskStatus: true,
      canMoveTask: true,
      canEditProject: false,
    });

    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    expect(select.disabled).toBe(false);

    const editSpy = vi.spyOn(fixture.componentInstance.editTask, 'emit');
    (fixture.nativeElement.querySelector('button.edit-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('.edit-form input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    titleInput.value = 'Updated title here';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('.edit-form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(editSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated title here',
        status: 'backlog',
      }),
    );
  });

  it('hides edit and disables status select for viewer role', () => {
    permissionsSignal.set({
      canViewProject: true,
      canCreateTask: false,
      canEditTask: false,
      canChangeTaskStatus: false,
      canMoveTask: false,
      canEditProject: false,
    });
    expect(permissionsSignal().canChangeTaskStatus).toBe(false);

    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.statusChange, 'emit');
    expect(fixture.componentInstance.canChangeTaskStatus()).toBe(false);
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

    select.value = 'done';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(emitSpy).not.toHaveBeenCalled();

    const editButton = fixture.nativeElement.querySelector('button.edit-btn');
    expect(editButton).toBeNull();

    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(document.activeElement).not.toBe(select);
  });
});
