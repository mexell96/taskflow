import { Routes } from '@angular/router';

import { projectAccessGuard } from './core/guards/project-access.guard';
import { projectExistsGuard } from './core/guards/project-exists.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(
        (module) => module.HomeComponent,
      ),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/list/project-list.component').then(
        (module) => module.ProjectListComponent,
      ),
  },
  {
    path: 'projects/:id',
    canActivate: [projectExistsGuard, projectAccessGuard],
    loadComponent: () =>
      import('./features/projects/board/project-board.component').then(
        (module) => module.ProjectBoardComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (module) => module.SettingsComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component').then(
        (module) => module.AboutComponent,
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
