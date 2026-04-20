import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Task } from '@app/shared/models/task.model';

export type CreateTaskDto = {
  projectId: string;
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  tags?: string[];
  order?: number;
};

export type UpdateTaskDto = Partial<
  Pick<
    Task,
    'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'tags' | 'order' | 'projectId'
  >
>;

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  getTasks(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl, {
      params: { projectId },
    });
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, dto);
  }

  patchTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, dto);
  }
}
