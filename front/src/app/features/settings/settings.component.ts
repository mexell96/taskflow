import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Settings</h1>
    <p>Settings page placeholder.</p>
    <a routerLink="/projects">Back to projects</a>
  `,
})
export class SettingsComponent {}
