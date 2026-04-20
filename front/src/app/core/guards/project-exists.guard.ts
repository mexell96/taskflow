import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TaskflowStore } from '@app/core/services/taskflow-store.service';

export const projectExistsGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id');
  if (!id) {
    return inject(Router).createUrlTree(['/projects']);
  }

  const store = inject(TaskflowStore);
  const projectExists = store.projects().some((project) => project.id === id);
  return projectExists ? true : inject(Router).createUrlTree(['/projects']);
};
