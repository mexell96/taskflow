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
  templateUrl: './task-create-dialog.component.html',
  styleUrl: './task-create-dialog.component.css',
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
