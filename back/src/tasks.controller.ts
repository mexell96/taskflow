import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { Task, TaskPriority, TaskStatus } from './domain.model';

type CreateTaskBody = {
  projectId?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  order?: number;
};

type PatchTaskBody = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'dueDate'
    | 'tags'
    | 'order'
    | 'projectId'
  >
>;

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks(@Query('projectId') projectId?: string) {
    return this.tasksService.getTasks(projectId);
  }

  @Post()
  createTask(@Body() body: CreateTaskBody) {
    return this.tasksService.createTask(body);
  }

  @Patch(':id')
  patchTask(@Param('id') id: string, @Body() body: PatchTaskBody) {
    return this.tasksService.patchTask(id, body);
  }
}
