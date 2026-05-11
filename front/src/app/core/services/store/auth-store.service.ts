import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { AuthRole } from '@app/shared/models/auth.model';
import { AuthApiService } from '../api/auth/auth-api.service';

type Permissions = {
  canViewProject: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canChangeTaskStatus: boolean;
  canMoveTask: boolean;
  canEditProject: boolean;
};

function permissionsForRole(role: AuthRole | null): Permissions {
  if (role === 'admin') {
    return {
      canViewProject: true,
      canCreateTask: true,
      canEditTask: true,
      canChangeTaskStatus: true,
      canMoveTask: true,
      canEditProject: true,
    };
  }

  if (role === 'editor') {
    return {
      canViewProject: true,
      canCreateTask: true,
      canEditTask: true,
      canChangeTaskStatus: true,
      canMoveTask: true,
      canEditProject: false,
    };
  }

  if (role === 'viewer') {
    return {
      canViewProject: true,
      canCreateTask: false,
      canEditTask: false,
      canChangeTaskStatus: false,
      canMoveTask: false,
      canEditProject: false,
    };
  }

  return {
    canViewProject: false,
    canCreateTask: false,
    canEditTask: false,
    canChangeTaskStatus: false,
    canMoveTask: false,
    canEditProject: false,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly _role = signal<AuthRole | null>(null);
  private _loadPromise: Promise<void> | null = null;

  readonly role = this._role.asReadonly();
  readonly permissions = computed(() => permissionsForRole(this._role()));

  constructor() {
    void this.loadMe();
  }

  loadMe(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = firstValueFrom(this.authApi.getMe())
      .then((response) => {
        this._role.set(response.role);
      })
      .catch(() => {
        // Safe default for the учебный проект: allow read-only UI.
        this._role.set('viewer');
      });
    return this._loadPromise;
  }
}

