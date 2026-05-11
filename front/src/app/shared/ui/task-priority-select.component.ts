import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import type { TaskPriority } from '@app/shared/models/task.model';

@Component({
  selector: 'app-task-priority-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <select
      [disabled]="disabled"
      [value]="value"
      (change)="onSelect($event)"
      (blur)="markTouched()"
    >
      @if (showAllOption()) {
        <option value="" i18n="@@projectBoardAllPriorities">All priorities</option>
      }
      <option value="low" i18n="@@taskPriorityLow">low</option>
      <option value="medium" i18n="@@taskPriorityMedium">medium</option>
      <option value="high" i18n="@@taskPriorityHigh">high</option>
    </select>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TaskPrioritySelectComponent),
      multi: true,
    },
  ],
})
export class TaskPrioritySelectComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  /** When true, empty value means “all priorities” (filter mode). */
  readonly showAllOption = input(false);

  value: TaskPriority | '' = 'medium';
  disabled = false;
  private onChange: (value: TaskPriority | '') => void = () => {};
  private onTouchedCb: () => void = () => {};

  writeValue(obj: TaskPriority | '' | null | undefined): void {
    if (obj === null || obj === undefined) {
      this.value = this.showAllOption() ? '' : 'medium';
    } else {
      this.value = obj;
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: TaskPriority | '') => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCb = fn;
  }

  markTouched(): void {
    this.onTouchedCb();
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const raw = select.value;
    const next: TaskPriority | '' = raw === '' ? '' : (raw as TaskPriority);
    this.value = next;
    this.onChange(next);
  }
}
