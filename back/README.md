# Taskflow backend (`back`)

NestJS API для проектов и задач.

- Base URL: `http://localhost:3001`
- API prefix: `/api`
- Полезный smoke endpoint: `GET /api/health`

## Запуск

```bash
npm install
npm run start:dev
```

## Основные команды

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Unit tests (`npm run test`, Jest in `src/**/*.spec.ts`): `AppController` (`/api/health`), `ProjectsController` / `TasksController` (HTTP wiring with mocked services), `ProjectsService`, `TasksService`, `DbFileService` (temp `TASKFLOW_DB_PATH`).

Примечание: `npm run lint` запускает ESLint с `--fix` и может менять файлы.

## Структура API (актуальные файлы)

- `GET /api/projects` -> `src/projects.controller.ts`
- `GET /api/projects/:id` -> `src/projects.controller.ts`
- `POST /api/projects` -> `src/projects.controller.ts`
- `PATCH /api/projects/:id` -> `src/projects.controller.ts`
- `GET /api/tasks?projectId=<id>` -> `src/tasks.controller.ts`
- `POST /api/tasks` -> `src/tasks.controller.ts`
- `PATCH /api/tasks/:id` -> `src/tasks.controller.ts`

## Быстрые curl smoke-тесты

```bash
curl -s http://localhost:3001/api/health
curl -s http://localhost:3001/api/projects
curl -s "http://localhost:3001/api/tasks?projectId=<project-id>"
curl -s -X POST http://localhost:3001/api/projects -H "Content-Type: application/json" -d '{"name":"Demo"}'
```

## Notes по контракту

- `POST /api/projects`: `name` обязателен, `description`/`author` опциональны.
- `PATCH /api/projects/:id`: частичное обновление `name`/`description`/`author`.
- `GET /api/tasks` требует query `projectId`; без него backend возвращает `400`.

Чеклист реализации и post-MVP шаги — в `back/TODO.md` (§5.1 — следующий рекомендуемый подэтап: DTO + `class-validator`).
