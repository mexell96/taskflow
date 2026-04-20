import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { TaskBoardComponent } from './task-board.component';

@Component({
  selector: 'app-project-board',
  imports: [RouterLink, TaskBoardComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (project(); as p) {
      <p><a routerLink="/projects">← Projects</a></p>
      <h2>{{ p.name }}</h2>
      @if (p.description) {
        <p class="muted">{{ p.description }}</p>
      }

      <app-task-board [projectId]="p.id" />

      <form [formGroup]="taskForm" (ngSubmit)="addTask()" class="add">
        <input formControlName="title" placeholder="New task title" />
        <select formControlName="priority">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button type="submit" [disabled]="taskForm.invalid">Add task</button>
      </form>
    } @else {
      <p>Project not found.</p>
      <a routerLink="/projects">Back to list</a>
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
  `,
})
export class ProjectBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
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
  }

  readonly project = computed(() => {
    const id = this.paramId();
    if (!id) {
      return null;
    }
    return this.store.projects().find((project: { id: string }) => project.id === id) ?? null;
  });

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    priority: this.fb.nonNullable.control<'low' | 'medium' | 'high'>('medium'),
  });

  addTask() {
    const p = this.project();
    if (!p || this.taskForm.invalid) {
      return;
    }
    const v = this.taskForm.getRawValue();
    this.store.addTask(p.id, v.title, v.priority);
    this.taskForm.reset({ title: '', priority: 'medium' });
  }
}
