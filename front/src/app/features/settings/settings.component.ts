import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 i18n="@@settingsTitle">Settings</h1>
    <p i18n="@@settingsPlaceholder">Settings page placeholder.</p>
    <a routerLink="/projects" i18n="@@settingsBackToProjects">Back to projects</a>
  `,
})
export class SettingsComponent {}
