import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Task, TaskStatus } from '@app/shared/models/task.model';
import type { TaskPriority } from '@app/shared/models/task.model';

export type TaskEditValue = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  status: TaskStatus;
};

@Component({
  selector: 'app-task-card',
  imports: [FormsModule, ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    '(keydown.enter)': 'focusStatusSelect($event)',
    '(keydown.space)': 'focusStatusSelect($event)',
  },
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css',
})
export class TaskCardComponent {
  private readonly fb = new FormBuilder();
  task = input.required<Task>();
  statusChange = output<TaskStatus>();
  editTask = output<TaskEditValue>();
  private readonly statusSelect = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  readonly isEditOpen = signal(false);
  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    priority: this.fb.nonNullable.control<TaskPriority>('medium'),
    dueDate: [''],
    tags: [''],
  });

  onStatus(value: string) {
    this.statusChange.emit(value as TaskStatus);
  }

  focusStatusSelect(event: Event) {
    event.preventDefault();
    this.statusSelect()?.nativeElement.focus();
  }

  startEdit() {
    if (this.isEditOpen()) {
      this.cancelEdit();
      return;
    }
    const task = this.task();
    this.editForm.reset({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      tags: task.tags.join(', '),
    });
    this.isEditOpen.set(true);
  }

  cancelEdit() {
    this.isEditOpen.set(false);
    this.editForm.reset(this.editForm.getRawValue());
  }

  saveEdit() {
    if (this.editForm.invalid) {
      return;
    }
    const value = this.editForm.getRawValue();
    this.editTask.emit({
      title: value.title,
      description: value.description || undefined,
      priority: value.priority,
      dueDate: value.dueDate || undefined,
      tags: value.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      status: this.task().status,
    });
    this.isEditOpen.set(false);
  }
}
