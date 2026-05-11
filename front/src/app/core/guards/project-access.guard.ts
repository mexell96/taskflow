import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '@app/core/services/store/auth-store.service';

export const projectAccessGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  // Ensures role is resolved before canViewProject; dedupes with AuthStore constructor via loadMe().
  await authStore.loadMe();

  return authStore.permissions().canViewProject ? true : router.createUrlTree(['/projects']);
};

