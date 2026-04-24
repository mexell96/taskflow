import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import type { Task } from '@app/shared/models/task.model';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  const task: Task = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Backlog task',
    status: 'backlog',
    priority: 'low',
    tags: ['demo'],
    order: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
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
});
