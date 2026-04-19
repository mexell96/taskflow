import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import type { TaskStatus } from '@app/shared/models/task.model';
import { TaskCardComponent } from './task-card.component';

@Component({
  selector: 'app-task-board',
  imports: [TaskCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board">
      @for (col of columns; track col.status) {
        <section class="col">
          <h3>{{ col.label }}</h3>
          @for (task of columnTasks()[col.status]; track task.id) {
            <app-task-card
              [task]="task"
              (statusChange)="store.setTaskStatus(task.id, $event)"
            />
          }
        </section>
      }
    </div>
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    .col {
      min-height: 120px;
      border: 1px dashed #bbb;
      border-radius: 8px;
      padding: 0.5rem;
    }
    h3 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
    }
    @media (max-width: 720px) {
      .board {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TaskBoardComponent {
  readonly store = inject(TaskflowStore);
  projectId = input.required<string>();

  readonly columns: { status: TaskStatus; label: string }[] = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'in_progress', label: 'In progress' },
    { status: 'done', label: 'Done' },
  ];

  readonly columnTasks = computed(() => {
    const id = this.projectId();
    const byStatus = (s: TaskStatus) =>
      this.store
        .tasks()
        .filter((t) => t.projectId === id && t.status === s)
        .sort((a, b) => a.order - b.order);

    return {
      backlog: byStatus('backlog'),
      in_progress: byStatus('in_progress'),
      done: byStatus('done'),
    };
  });
}
