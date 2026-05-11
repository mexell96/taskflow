import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly snackBar = inject(MatSnackBar, { optional: true });

  private shouldShowToasts() {
    return !!this.snackBar && isPlatformBrowser(this.platformId);
  }

  showSuccess(message: string) {
    if (!this.shouldShowToasts()) {
return;
}
    this.snackBar!.open(message, undefined, { duration: 3000 });
  }

  showError(message: string) {
    if (!this.shouldShowToasts()) {
return;
}
    this.snackBar!.open(message, undefined, { duration: 5000 });
  }
}

