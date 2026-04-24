import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import { ProjectCardComponent } from '../card/project-card.component';

@Component({
  selector: 'app-project-list',
  imports: [ReactiveFormsModule, ProjectCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly store = inject(TaskflowStore);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    author: [''],
  });

  readonly nameHasError = () =>
    this.form.controls.name.invalid &&
    (this.form.controls.name.dirty || this.form.controls.name.touched);

  constructor() {
    this.title.setTitle('Projects | Taskflow');
    this.meta.updateTag({
      name: 'description',
      content: 'Taskflow project list: create and manage your projects.',
    });
  }

  create() {
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.store.addProject(v.name, v.description || undefined, v.author || undefined);
    this.form.reset();
  }
}
