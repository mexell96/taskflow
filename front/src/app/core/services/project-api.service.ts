import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Project } from '@app/shared/models/project.model';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

export type CreateProjectDto = {
  name: string;
  description?: string;
};

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}/projects`;
  private readonly projectsStateKey = makeStateKey<Project[]>('api-projects-list');

  getProjects(): Observable<Project[]> {
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(this.projectsStateKey)) {
      const cached = this.transferState.get(this.projectsStateKey, []);
      this.transferState.remove(this.projectsStateKey);
      return of(cached);
    }

    return this.http.get<Project[]>(this.baseUrl).pipe(
      tap((projects) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(this.projectsStateKey, projects);
        }
      }),
    );
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, dto);
  }
}
