import { Routes } from '@angular/router';
import { projectExistsGuard } from './core/guards/project-exists.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/project-list.component').then(
        (m) => m.ProjectListComponent,
      ),
  },
  {
    path: 'projects/:id',
    canActivate: [projectExistsGuard],
    loadComponent: () =>
      import('./features/projects/project-board.component').then(
        (m) => m.ProjectBoardComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
  },
];
