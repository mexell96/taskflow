import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '@app/core/services/store/auth-store.service';

export const projectAccessGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  await authStore.loadMe();

  return authStore.permissions().canViewProject ? true : router.createUrlTree(['/projects']);
};

