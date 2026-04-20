import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import type { TaskPriority } from '@app/shared/models/task.model';
import { TaskBoardComponent } from './task-board.component';

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
  selector: 'app-project-board',
  imports: [RouterLink, TaskBoardComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (project(); as p) {
      <p><a routerLink="/projects" i18n="@@projectBoardBackToProjects">← Projects</a></p>
      <h2>{{ p.name }}</h2>
      @if (p.description) {
        <p class="muted">{{ p.description }}</p>
      }

      <input
        [formControl]="searchControl"
        placeholder="Search tasks by title"
        i18n-placeholder="@@projectBoardSearchPlaceholder"
        class="search"
      />
      <div class="filters">
        <select [formControl]="priorityFilterControl">
          <option value="" i18n="@@projectBoardAllPriorities">All priorities</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <select [formControl]="tagFilterControl">
          <option value="" i18n="@@projectBoardAllTags">All tags</option>
          @for (tag of availableTags(); track tag) {
            <option [value]="tag">{{ tag }}</option>
          }
        </select>
        <label class="overdue">
          <input type="checkbox" [formControl]="overdueOnlyControl" />
          <span i18n="@@projectBoardOverdueOnly">overdue only</span>
        </label>
      </div>

      <app-task-board
        [projectId]="p.id"
        [searchTerm]="searchTerm()"
        [priorityFilter]="priorityFilter()"
        [tagFilter]="tagFilter()"
        [overdueOnly]="overdueOnly()"
      />

      <form [formGroup]="taskForm" (ngSubmit)="addTask()" class="add">
        <input
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
        <button type="submit" [disabled]="taskForm.invalid" i18n="@@projectBoardAddTaskButton">Add task</button>
      </form>
    } @else {
      <p i18n="@@projectBoardNotFound">Project not found.</p>
      <a routerLink="/projects" i18n="@@projectBoardBackToList">Back to list</a>
    }
  `,
  styles: `
    h2 {
      margin-bottom: 0.25rem;
    }
    .muted {
      color: #555;
      margin-top: 0;
    }
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.25rem;
      align-items: center;
    }
    .search {
      width: min(32rem, 100%);
      margin-top: 0.75rem;
    }
    .filters {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .overdue {
      display: inline-flex;
      gap: 0.35rem;
      align-items: center;
    }
    .field-error {
      color: #8a1f1f;
      font-size: 0.8rem;
      flex-basis: 100%;
      margin-top: -0.2rem;
    }
  `,
})
export class ProjectBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly store = inject(TaskflowStore);

  private readonly paramId = toSignal(this.route.paramMap.pipe(map((p: ParamMap) => p.get('id'))), {
    initialValue: null,
  });

  constructor() {
    effect(() => {
      const id = this.paramId();
      if (!id) {
        return;
      }
      this.store.loadTasks(id);
    });

    effect(() => {
      const project = this.project();
      if (!project) {
        this.title.setTitle('Project not found | Taskflow');
        this.meta.updateTag({
          name: 'description',
          content: 'Requested Taskflow project was not found.',
        });
        return;
      }

      this.title.setTitle(`${project.name} | Taskflow`);
      this.meta.updateTag({
        name: 'description',
        content: project.description?.trim() || `Task board for project ${project.name}.`,
      });
    });
  }

  readonly project = computed(() => {
    const id = this.paramId();
    if (!id) {
      return null;
    }
    return this.store.projects().find((project: { id: string }) => project.id === id) ?? null;
  });

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    dueDate: ['', [dueDateNotInPastValidator]],
    priority: this.fb.nonNullable.control<'low' | 'medium' | 'high'>('medium'),
  });
  readonly searchControl = this.fb.nonNullable.control('');
  readonly priorityFilterControl = this.fb.nonNullable.control<'' | TaskPriority>('');
  readonly tagFilterControl = this.fb.nonNullable.control('');
  readonly overdueOnlyControl = this.fb.nonNullable.control(false);
  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map((value: string) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );
  readonly priorityFilter = toSignal(this.priorityFilterControl.valueChanges, { initialValue: '' as '' | TaskPriority });
  readonly tagFilter = toSignal(
    this.tagFilterControl.valueChanges.pipe(map((value: string) => value.trim().toLowerCase())),
    { initialValue: '' },
  );
  readonly overdueOnly = toSignal(this.overdueOnlyControl.valueChanges, { initialValue: false });
  readonly availableTags = computed(() => {
    const id = this.paramId();
    if (!id) {
      return [] as string[];
    }
    return Array.from(
      new Set(
        this.store
          .tasks()
          .filter((task: { projectId: string }) => task.projectId === id)
          .flatMap((task: { tags: string[] }) => task.tags)
          .filter((tag: string) => !!tag),
      ),
    ).sort();
  });

  readonly titleHasError = () =>
    this.taskForm.controls.title.invalid &&
    (this.taskForm.controls.title.dirty || this.taskForm.controls.title.touched);

  readonly dueDateHasError = () =>
    !!this.taskForm.controls.dueDate.errors?.['pastDate'] &&
    (this.taskForm.controls.dueDate.dirty || this.taskForm.controls.dueDate.touched);

  addTask() {
    const p = this.project();
    if (!p || this.taskForm.invalid) {
      return;
    }
    const v = this.taskForm.getRawValue();
    this.store.addTask(p.id, v.title, v.priority, v.dueDate || undefined);
    this.taskForm.reset({ title: '', dueDate: '', priority: 'medium' });
  }
}
