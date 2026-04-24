import { Routes } from '@angular/router';
import { projectExistsGuard } from './core/guards/project-exists.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/list/project-list.component').then(
        (m) => m.ProjectListComponent,
      ),
  },
  {
    path: 'projects/:id',
    canActivate: [projectExistsGuard],
    loadComponent: () =>
      import('./features/projects/board/project-board.component').then(
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
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component').then(
        (m) => m.AboutComponent,
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
