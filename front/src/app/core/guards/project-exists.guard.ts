import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { type CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, map, race, take, timer } from 'rxjs';

import { TaskflowStore } from '@app/core/services/store/taskflow-store.service';

export const projectExistsGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const id = route.paramMap.get('id');
  if (!id) {
    return router.createUrlTree(['/projects']);
  }

  const store = inject(TaskflowStore);
  const ready = await firstValueFrom(
    race(
      toObservable(store.projects).pipe(
        filter((projects) => projects.length > 0),
        take(1),
        map(() => true),
      ),
      timer(10_000).pipe(map(() => false)),
    ),
  );

  if (!ready) {
    return router.createUrlTree(['/projects']);
  }

  return store.projects().some((project) => project.id === id)
    ? true
    : router.createUrlTree(['/projects']);
};
