import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { TaskCreateDialogComponent } from './task-create-dialog.component';

describe('TaskCreateDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCreateDialogComponent],
    }).compileComponents();
  });

  it('shows title validation and blocks submit when title too short', () => {
    const fixture = TestBed.createComponent(TaskCreateDialogComponent);
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    titleInput.value = 'ab';
    titleInput.dispatchEvent(new Event('input'));
    titleInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.field-error'));
    expect(error.nativeElement.textContent).toContain('at least 3 characters');
    expect(titleInput.getAttribute('aria-invalid')).toBe('true');

    const submitSpy = vi.spyOn(fixture.componentInstance.submitTask, 'emit');
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('shows past-date validation for dueDate', () => {
    const fixture = TestBed.createComponent(TaskCreateDialogComponent);
    fixture.detectChanges();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayValue = yesterday.toISOString().slice(0, 10);

    const dueInput = fixture.debugElement.query(By.css('input[formControlName="dueDate"]'))
      .nativeElement as HTMLInputElement;
    dueInput.value = yesterdayValue;
    dueInput.dispatchEvent(new Event('input'));
    dueInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const errors = fixture.debugElement.queryAll(By.css('.field-error'));
    expect(
      errors.some((element) =>
        element.nativeElement.textContent.includes('cannot be in the past'),
      ),
    ).toBe(true);
  });

  it('emits submitTask with parsed tags and omits empty optional fields', () => {
    const fixture = TestBed.createComponent(TaskCreateDialogComponent);
    fixture.detectChanges();

    const titleInput = fixture.debugElement.query(By.css('input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    titleInput.value = 'Valid title';
    titleInput.dispatchEvent(new Event('input'));

    const tagsInput = fixture.debugElement.query(By.css('input[formControlName="tags"]'))
      .nativeElement as HTMLInputElement;
    tagsInput.value = ' a , b ';
    tagsInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.submitTask, 'emit');
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith({
      title: 'Valid title',
      description: undefined,
      priority: 'medium',
      dueDate: undefined,
      tags: ['a', 'b'],
    });
  });

  it('emits cancel on Escape from form', () => {
    const fixture = TestBed.createComponent(TaskCreateDialogComponent);
    fixture.detectChanges();

    const cancelSpy = vi.spyOn(fixture.componentInstance.cancel, 'emit');
    const form = fixture.debugElement.query(By.css('form')).nativeElement as HTMLElement;
    form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('focuses title input after view init', async () => {
    const fixture = TestBed.createComponent(TaskCreateDialogComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    const titleInput = fixture.debugElement.query(By.css('input[formControlName="title"]'))
      .nativeElement as HTMLInputElement;
    expect(document.activeElement).toBe(titleInput);
  });
});
