import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import type { TaskPriority } from '@app/shared/models/task.model';
import { TaskBoardComponent } from '../tasks/task-board.component';
import { TaskCreateDialogComponent, type CreateTaskDialogValue } from '../tasks/task-create-dialog.component';

@Component({
  selector: 'app-project-board',
  imports: [RouterLink, TaskBoardComponent, TaskCreateDialogComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      @if (project(); as p) {
        <p><a routerLink="/projects" i18n="@@projectBoardBackToProjects">← Projects</a></p>
        <h2>{{ p.name }}</h2>
        @if (p.description) {
          <p class="muted">{{ p.description }}</p>
        }
        <button type="button" class="edit-project-btn" (click)="toggleProjectEdit()">
          {{ isProjectEditOpen() ? 'Cancel edit' : 'Edit project' }}
        </button>
        @if (isProjectEditOpen()) {
          <form class="project-edit" [formGroup]="projectEditForm" (ngSubmit)="saveProjectEdit()">
            <input formControlName="name" placeholder="Project name" />
            <input formControlName="description" placeholder="Description (optional)" />
            <button type="submit" [disabled]="projectEditForm.invalid || projectEditForm.pristine">Save project</button>
          </form>
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

        <button #openTaskDialogButton type="button" class="open-add-task" (click)="openTaskDialog(openTaskDialogButton)">
          <span i18n="@@projectBoardOpenAddTaskButton">Add task</span>
        </button>

        @if (isTaskDialogOpen()) {
          <app-task-create-dialog (submitTask)="createTask($event)" (cancel)="closeTaskDialog()" />
        }
      } @else {
        <p i18n="@@projectBoardNotFound">Project not found.</p>
        <a routerLink="/projects" i18n="@@projectBoardBackToList">Back to list</a>
      }
    </main>
  `,
  styles: `
    h2 {
      margin-bottom: 0.25rem;
    }
    .muted {
      color: #555;
      margin-top: 0;
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
    .open-add-task {
      margin-top: 1.25rem;
    }
    .edit-project-btn {
      margin: 0.25rem 0 0.4rem;
    }
    .project-edit {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
      max-width: 40rem;
    }
  `,
})
export class ProjectBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private restoreFocusElement: HTMLElement | null = null;
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

  private readonly fb = inject(FormBuilder);
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

  readonly isTaskDialogOpen = signal(false);
  readonly isProjectEditOpen = signal(false);
  readonly projectEditForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  openTaskDialog(trigger: HTMLElement) {
    this.restoreFocusElement = trigger;
    this.isTaskDialogOpen.set(true);
  }

  closeTaskDialog() {
    this.isTaskDialogOpen.set(false);
    const target = this.restoreFocusElement;
    this.restoreFocusElement = null;
    queueMicrotask(() => {
      target?.focus();
    });
  }

  createTask(value: CreateTaskDialogValue) {
    const p = this.project();
    if (!p) {
      return;
    }
    this.store.addTask(p.id, value.title, value.priority, value.dueDate, value.description, value.tags);
    this.closeTaskDialog();
  }

  toggleProjectEdit() {
    if (this.isProjectEditOpen()) {
      this.isProjectEditOpen.set(false);
      return;
    }
    const project = this.project();
    if (!project) {
      return;
    }
    this.projectEditForm.reset({
      name: project.name,
      description: project.description ?? '',
    });
    this.isProjectEditOpen.set(true);
  }

  saveProjectEdit() {
    if (this.projectEditForm.invalid) {
      return;
    }
    const project = this.project();
    if (!project) {
      return;
    }
    const value = this.projectEditForm.getRawValue();
    this.store.updateProject(project.id, value.name, value.description || undefined);
    this.isProjectEditOpen.set(false);
  }
}
