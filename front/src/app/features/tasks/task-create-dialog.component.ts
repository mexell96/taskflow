import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import type { TaskPriority } from '@app/shared/models/task.model';

export type CreateTaskDialogValue = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
};

function dueDateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  // Strategy choice for stage 6.2:
  // strict "not in the past" applies to NEW task creation only.
  // If task edit flow is added later, this validator should be relaxed there.
  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) {
    return { invalidDate: true };
  }
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today ? { pastDate: true } : null;
}

@Component({
  selector: 'app-task-create-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dialog-backdrop">
      <section class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="add-task-title">
        <h3 id="add-task-title" i18n="@@projectBoardDialogTitle">Add task</h3>
        <form [formGroup]="taskForm" (ngSubmit)="submit()" class="add" (keydown.escape)="cancel.emit()">
          <input
            #taskTitleInput
            formControlName="title"
            placeholder="New task title"
            i18n-placeholder="@@projectBoardTaskTitlePlaceholder"
            [attr.aria-invalid]="titleHasError() ? 'true' : 'false'"
            [attr.aria-describedby]="titleHasError() ? 'task-title-error' : null"
          />
          @if (titleHasError()) {
            <small id="task-title-error" class="field-error" i18n="@@projectBoardTaskTitleMinLengthError"
              >Task title must be at least 3 characters.</small
            >
          }
          <input formControlName="description" placeholder="Description (optional)" />
          <input
            formControlName="dueDate"
            type="date"
            [attr.aria-invalid]="dueDateHasError() ? 'true' : 'false'"
            [attr.aria-describedby]="dueDateHasError() ? 'task-due-date-error' : null"
          />
          @if (dueDateHasError()) {
            <small id="task-due-date-error" class="field-error" i18n="@@projectBoardTaskDueDatePastError"
              >Due date cannot be in the past for new tasks.</small
            >
          }
          <select formControlName="priority">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <input formControlName="tags" placeholder="tags,comma,separated" />
          <div class="dialog-actions">
            <button type="submit" [disabled]="taskForm.invalid" i18n="@@projectBoardAddTaskButton">Add task</button>
            <button type="button" (click)="cancel.emit()" i18n="@@projectBoardCancelButton">Cancel</button>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: `
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.25rem;
      align-items: center;
    }
    .field-error {
      color: #8a1f1f;
      font-size: 0.8rem;
      flex-basis: 100%;
      margin-top: -0.2rem;
    }
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.25);
      display: grid;
      place-items: center;
      padding: 1rem;
    }
    .dialog-panel {
      width: min(32rem, 100%);
      background: #fff;
      border-radius: 8px;
      border: 1px solid #ddd;
      padding: 1rem;
    }
    .dialog-panel h3 {
      margin: 0 0 0.75rem;
    }
    .dialog-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  `,
})
export class TaskCreateDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly taskTitleInput = viewChild<ElementRef<HTMLInputElement>>('taskTitleInput');
  readonly submitTask = output<CreateTaskDialogValue>();
  readonly cancel = output<void>();

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    dueDate: ['', [dueDateNotInPastValidator]],
    priority: this.fb.nonNullable.control<'low' | 'medium' | 'high'>('medium'),
    tags: [''],
  });
  readonly titleHasError = () => {
    const title = this.taskForm.controls.title;
    return title.invalid && (title.dirty || title.touched);
  };
  readonly dueDateHasError = () => {
    const dueDate = this.taskForm.controls.dueDate;
    return !!dueDate.errors?.['pastDate'] && (dueDate.dirty || dueDate.touched);
  };

  ngAfterViewInit() {
    queueMicrotask(() => {
      this.taskTitleInput()?.nativeElement.focus();
    });
  }

  submit() {
    if (this.taskForm.invalid) {
      return;
    }
    const value = this.taskForm.getRawValue();
    this.submitTask.emit({
      title: value.title,
      description: value.description || undefined,
      priority: value.priority,
      dueDate: value.dueDate || undefined,
      tags: value.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean),
    });
    this.taskForm.reset({ title: '', description: '', dueDate: '', priority: 'medium', tags: '' });
  }
}
