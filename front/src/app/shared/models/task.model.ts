export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  description?: string;
  dueDate?: string;
  id: string;
  order: number;
  priority: TaskPriority;
  projectId: string;
  status: TaskStatus;
  tags: string[];
  title: string;
}
