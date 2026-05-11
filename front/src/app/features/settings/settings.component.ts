import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStore } from '@app/core/services/store/auth-store.service';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  readonly authStore = inject(AuthStore);
}

