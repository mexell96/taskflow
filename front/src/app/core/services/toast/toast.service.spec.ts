import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  const snackBarOpen = vi.fn();

  beforeEach(() => {
    snackBarOpen.mockReset();
    TestBed.resetTestingModule();
  });

  it('opens snack bar on browser when MatSnackBar is available', () => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const toast = TestBed.inject(ToastService);

    toast.showSuccess('Saved');
    expect(snackBarOpen).toHaveBeenCalledWith('Saved', undefined, { duration: 3000 });

    toast.showError('Failed');
    expect(snackBarOpen).toHaveBeenCalledWith('Failed', undefined, { duration: 5000 });
  });

  it('does not open snack bar on server', () => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const toast = TestBed.inject(ToastService);

    toast.showSuccess('Saved');
    toast.showError('Failed');
    expect(snackBarOpen).not.toHaveBeenCalled();
  });

  it('does not open snack bar when MatSnackBar is unavailable on browser', () => {
    TestBed.configureTestingModule({
      providers: [ToastService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const toast = TestBed.inject(ToastService);

    toast.showSuccess('Saved');
    toast.showError('Failed');
    expect(snackBarOpen).not.toHaveBeenCalled();
  });
});
