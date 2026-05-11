import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { AuthRole } from '@app/shared/models/auth.model';
import { environment } from '@env/environment';

type AuthMeResponse = {
  role: AuthRole;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  getMe(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.baseUrl}/me`);
  }
}

