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

const NO_PROJECT_ACCESS: Permissions = {
  canViewProject: false,
  canCreateTask: false,
  canEditTask: false,
  canChangeTaskStatus: false,
  canMoveTask: false,
  canEditProject: false,
};

const VIEWER_PERMISSIONS: Permissions = {
  ...NO_PROJECT_ACCESS,
  canViewProject: true,
};

const EDITOR_PERMISSIONS: Permissions = {
  ...VIEWER_PERMISSIONS,
  canCreateTask: true,
  canEditTask: true,
  canChangeTaskStatus: true,
  canMoveTask: true,
};

const ADMIN_PERMISSIONS: Permissions = {
  ...EDITOR_PERMISSIONS,
  canEditProject: true,
};

function permissionsForRole(role: AuthRole | null): Permissions {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }
  if (role === 'editor') {
    return EDITOR_PERMISSIONS;
  }
  if (role === 'viewer') {
    return VIEWER_PERMISSIONS;
  }
  return NO_PROJECT_ACCESS;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly _role = signal<AuthRole | null>(null);
  private _loadPromise: Promise<void> | null = null;

  readonly role = this._role.asReadonly();
  readonly permissions = computed(() => permissionsForRole(this._role()));

  constructor() {
    // Warm /auth/me early so most routes have role before first paint; duplicate loadMe() is a no-op (see _loadPromise).
    void this.loadMe();
  }

  /** Single in-flight request; safe to call from guards and the constructor. */
  loadMe(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = firstValueFrom(this.authApi.getMe())
      .then((response) => {
        this._role.set(response.role);
      })
      .catch(() => {
        // Learning app default: if /auth/me fails, keep read-only viewer UI.
        this._role.set('viewer');
      });
    return this._loadPromise;
  }
}

