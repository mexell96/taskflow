import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';
import type { Task, TaskPriority, TaskStatus } from '@app/shared/models/task.model';
import { TaskCardComponent, type TaskEditValue } from '../card/task-card.component';

@Component({
  selector: 'app-task-board',
  imports: [TaskCardComponent, CdkDropList, CdkDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.css',
})
export class TaskBoardComponent {
  readonly store = inject(TaskflowStore);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  projectId = input.required<string>();
  searchTerm = input('');
  priorityFilter = input<'' | TaskPriority>('');
  tagFilter = input('');
  overdueOnly = input(false);

  readonly columns: { status: TaskStatus; label: string }[] = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'in_progress', label: 'In progress' },
    { status: 'review', label: 'Review' },
    { status: 'done', label: 'Done' },
  ];

  readonly columnTasks = computed(() => {
    const id = this.projectId();
    const term = this.searchTerm().trim().toLowerCase();
    const priority = this.priorityFilter();
    const tag = this.tagFilter().trim().toLowerCase();
    const overdueOnly = this.overdueOnly();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byStatus = (s: TaskStatus) =>
      this.store
        .tasks()
        .filter((t) => {
          if (t.projectId !== id || t.status !== s) {
            return false;
          }
          if (term && !t.title.toLowerCase().includes(term)) {
            return false;
          }
          if (priority && t.priority !== priority) {
            return false;
          }
          if (tag && !t.tags.some((item) => item.toLowerCase() === tag)) {
            return false;
          }
          if (!overdueOnly) {
            return true;
          }
          if (!t.dueDate) {
            return false;
          }
          const due = new Date(t.dueDate);
          if (Number.isNaN(due.getTime())) {
            return false;
          }
          due.setHours(0, 0, 0, 0);
          return due < today;
        })
        .sort((a, b) => a.order - b.order);

    return {
      backlog: byStatus('backlog'),
      in_progress: byStatus('in_progress'),
      review: byStatus('review'),
      done: byStatus('done'),
    };
  });

  dropListId(status: TaskStatus): string {
    return `task-board-${this.projectId()}-${status}`;
  }

  connectedDropListIds(currentStatus: TaskStatus): string[] {
    return this.columns.filter((column) => column.status !== currentStatus).map((column) => this.dropListId(column.status));
  }

  onDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus) {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const source = [...event.previousContainer.data];
    const target = event.previousContainer === event.container ? source : [...event.container.data];

    if (event.previousContainer === event.container) {
      moveItemInArray(target, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(source, target, event.previousIndex, event.currentIndex);
    }

    const moved = target[event.currentIndex];
    if (!moved) {
      return;
    }

    const order = this.calculateOrder(target, event.currentIndex, moved.id);
    this.store.moveTask(moved.id, targetStatus, order);
    this.liveAnnouncer.announce(`Task ${moved.title} moved to ${this.labelForStatus(targetStatus)}.`, 'polite');
  }

  private calculateOrder(tasks: Task[], index: number, movedId: string): number {
    const previous = tasks[index - 1];
    const next = tasks[index + 1];

    if (!previous && !next) {
      return 10;
    }
    if (!previous && next) {
      return next.id === movedId ? next.order : next.order - 10;
    }
    if (previous && !next) {
      return previous.id === movedId ? previous.order : previous.order + 10;
    }

    if (!previous || !next) {
      return 10;
    }
    return (previous.order + next.order) / 2;
  }

  private labelForStatus(status: TaskStatus): string {
    return this.columns.find((column) => column.status === status)?.label ?? status;
  }

  onEditTask(taskId: string, value: TaskEditValue) {
    this.store.updateTask(taskId, value);
  }
}
