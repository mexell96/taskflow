import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Project } from '@app/shared/models/project.model';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <a [routerLink]="['/projects', project().id]">{{ project().name }}</a>
      @if (project().description) {
        <p class="muted">{{ project().description }}</p>
      }
    </article>
  `,
  styles: `
    article {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
    }
    a {
      font-weight: 600;
      color: #1a1a1a;
    }
    .muted {
      margin: 0.35rem 0 0;
      color: #555;
      font-size: 0.9rem;
    }
  `,
})
export class ProjectCardComponent {
  project = input.required<Project>();
}
