import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Task, TaskStatus } from '@app/shared/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    '(keydown.enter)': 'focusStatusSelect($event)',
    '(keydown.space)': 'focusStatusSelect($event)',
  },
  template: `
    <div class="card">
      <div class="head">
        <strong>{{ task().title }}</strong>
        <span class="pr">{{ task().priority }}</span>
      </div>
      <label>
        <span i18n="@@taskCardStatusLabel">Status</span>
        <select
          #statusSelect
          [ngModel]="task().status"
          (ngModelChange)="onStatus($event)"
        >
          <option value="backlog">backlog</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>
      </label>
    </div>
  `,
  styles: `
    .card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.5rem 0.65rem;
      margin-bottom: 0.4rem;
      background: #fafafa;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .pr {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #666;
    }
    label {
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    select {
      max-width: 100%;
    }
  `,
})
export class TaskCardComponent {
  task = input.required<Task>();
  statusChange = output<TaskStatus>();
  private readonly statusSelect = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');

  onStatus(value: string) {
    this.statusChange.emit(value as TaskStatus);
  }

  focusStatusSelect(event: Event) {
    event.preventDefault();
    this.statusSelect()?.nativeElement.focus();
  }
}
