import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

import type { Task } from '@app/shared/models/task.model';
import { environment } from '@env/environment';

type CreateTaskDto = {
  projectId: string;
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  tags?: string[];
  order?: number;
};

type UpdateTaskDto = Partial<
  Pick<
    Task,
    'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'tags' | 'order' | 'projectId'
  >
>;

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  getTasks(projectId: string): Observable<Task[]> {
    const stateKey = makeStateKey<Task[]>(`api-tasks-${projectId}`);
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(stateKey)) {
      const cached = this.transferState.get(stateKey, []);
      this.transferState.remove(stateKey);
      return of(cached);
    }

    return this.http
      .get<Task[]>(this.baseUrl, {
        params: { projectId },
      })
      .pipe(
        tap((tasks) => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(stateKey, tasks);
          }
        }),
      );
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, dto);
  }

  patchTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, dto);
  }
}
