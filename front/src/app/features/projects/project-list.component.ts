import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { ProjectCardComponent } from './project-card.component';

@Component({
  selector: 'app-project-list',
  imports: [ReactiveFormsModule, ProjectCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Projects</h1>

    @if (store.apiErrorMessage(); as errorMessage) {
      <p class="error-banner" role="alert">{{ errorMessage }}</p>
    }

    <form [formGroup]="form" (ngSubmit)="create()" class="create">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="description" placeholder="Description (optional)" />
      <button type="submit" [disabled]="form.invalid">Create project</button>
    </form>

    <section class="list">
      @for (p of store.projects(); track p.id) {
        <app-project-card [project]="p" />
      }
    </section>
  `,
  styles: `
    h1 {
      margin-top: 0;
    }
    .create {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      align-items: center;
    }
    .error-banner {
      margin: 0 0 0.75rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #f3b4b4;
      background: #fdecec;
      color: #8a1f1f;
      border-radius: 6px;
      max-width: 40rem;
    }
    .list {
      max-width: 40rem;
    }
  `,
})
export class ProjectListComponent {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(TaskflowStore);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  create() {
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.store.addProject(v.name, v.description || undefined);
    this.form.reset();
  }
}
