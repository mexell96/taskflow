import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbFileService } from './db-file.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [],
  controllers: [AppController, ProjectsController, TasksController],
  providers: [AppService, DbFileService, ProjectsService, TasksService],
})
export class AppModule {}
