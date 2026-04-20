import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { Project } from './domain.model';

type PatchProjectBody = Partial<Pick<Project, 'name' | 'description'>>;

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjects() {
    return this.projectsService.getProjects();
  }

  @Get(':id')
  getProject(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Post()
  createProject(@Body() body: { name?: string; description?: string }) {
    return this.projectsService.createProject(body);
  }

  @Patch(':id')
  patchProject(@Param('id') id: string, @Body() body: PatchProjectBody) {
    return this.projectsService.patchProject(id, body);
  }
}
