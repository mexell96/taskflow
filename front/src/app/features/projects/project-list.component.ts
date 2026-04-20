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
