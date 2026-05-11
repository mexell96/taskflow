import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthStore } from '@app/core/services/store/auth-store.service';
import type { Task, TaskStatus } from '@app/shared/models/task.model';
import type { TaskPriority } from '@app/shared/models/task.model';

export type TaskEditValue = {
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  title: string;
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
  private readonly authStore = inject(AuthStore);
  task = input.required<Task>();
  statusChange = output<TaskStatus>();
  editTask = output<TaskEditValue>();
  private readonly statusSelect = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  readonly isEditOpen = signal(false);
  readonly canChangeTaskStatus = computed(() => this.authStore.permissions().canChangeTaskStatus);
  readonly canEditTask = computed(() => this.authStore.permissions().canEditTask);
  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    priority: this.fb.nonNullable.control<TaskPriority>('medium'),
    dueDate: [''],
    tags: [''],
  });

  onStatus(value: string) {
    if (!this.canChangeTaskStatus()) {
      return;
    }
    this.statusChange.emit(value as TaskStatus);
  }

  focusStatusSelect(event: Event) {
    if (!this.canChangeTaskStatus()) {
      return;
    }
    event.preventDefault();
    this.statusSelect()?.nativeElement.focus();
  }

  startEdit() {
    if (!this.canEditTask()) {
      return;
    }
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
    if (!this.canEditTask()) {
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
