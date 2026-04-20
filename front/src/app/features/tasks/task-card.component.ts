import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
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
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    '(keydown.enter)': 'focusStatusSelect($event)',
    '(keydown.space)': 'focusStatusSelect($event)',
  },
  template: `
    <div class="card">
      <div class="head">
        <strong>{{ task().title }}</strong>
        <span class="pr">{{ task().priority }}</span>
      </div>
      @if (task().description) {
        <p class="description">{{ task().description }}</p>
      }
      @if (task().tags.length) {
        <p class="tags">{{ task().tags.join(', ') }}</p>
      }
      <label>
        <span i18n="@@taskCardStatusLabel">Status</span>
        <select
          #statusSelect
          [ngModel]="task().status"
          (ngModelChange)="onStatus($event)"
        >
          <option value="backlog">backlog</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>
      </label>
      <button type="button" class="edit-btn" (click)="startEdit()">{{ isEditOpen() ? 'Cancel' : 'Edit' }}</button>

      @if (isEditOpen()) {
        <form class="edit-form" [formGroup]="editForm" (ngSubmit)="saveEdit()">
          <input formControlName="title" placeholder="Title" />
          <input formControlName="description" placeholder="Description (optional)" />
          <select formControlName="priority">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <input formControlName="dueDate" type="date" />
          <input formControlName="tags" placeholder="tags,comma,separated" />
          <div class="edit-actions">
            <button type="submit" [disabled]="editForm.invalid || editForm.pristine">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      }
    </div>
  `,
  styles: `
    .card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.5rem 0.65rem;
      margin-bottom: 0.4rem;
      background: #fafafa;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .description {
      margin: 0 0 0.4rem;
      color: #555;
      font-size: 0.9rem;
      white-space: pre-wrap;
    }
    .tags {
      margin: 0 0 0.45rem;
      color: #666;
      font-size: 0.8rem;
    }
    .pr {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #666;
    }
    label {
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    select {
      max-width: 100%;
    }
    .edit-btn {
      margin-top: 0.4rem;
    }
    .edit-form {
      display: grid;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }
    .edit-actions {
      display: flex;
      gap: 0.4rem;
    }
  `,
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
