# TaskflowFront

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Component structure

Angular components in `src/app` use separate files for logic, template, and styles:

- `*.component.ts` for the component class and metadata
- `*.component.html` for the template
- `*.component.css` or `*.component.scss` for component-scoped styles

Feature folders can also contain component subfolders when a screen grows. Current examples:

- `src/app/features/projects/list`, `src/app/features/projects/board`, `src/app/features/projects/card`
- `src/app/features/tasks/board`, `src/app/features/tasks/card`, `src/app/features/tasks/create-dialog`

When adding or updating a component, keep `templateUrl` and `styleUrl` relative to the component TypeScript file so the structure stays consistent across the app.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
npm run e2e
```

This project uses Playwright via the `e2e` script in `package.json`.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Import sorting

Imports are sorted by ESLint (`eslint-plugin-simple-import-sort`) with this order:

1. External libraries (`@angular/*`, `rxjs`, other packages)
2. Empty line
3. Internal aliases (`@app/*`, `@env/*`) and file imports (`./` and `../`)

Use autofix to apply sorting:

```bash
npm run lint:fix
```

## Frontend pages and routes

- Place page components in `src/app/features/<feature-name>/`.
- Home page: `src/app/features/home/home.component.ts`.
- Projects list page: `src/app/features/projects/list/project-list.component.ts`.
- Project board page: `src/app/features/projects/board/project-board.component.ts`.
- Settings page: `src/app/features/settings/settings.component.ts`.
- About page: `src/app/features/about/about.component.ts`.
- Root route `''` loads Home with lazy `loadComponent`.
- `'projects'` route loads Projects list with lazy `loadComponent`.
- `'projects/:id'` route loads Project board with lazy `loadComponent` (with project guard).
- `'settings'` route loads Settings with lazy `loadComponent`.
- `'about'` route loads About with lazy `loadComponent`.
- Wildcard route `**` redirects to `''`.

## Service structure

Keep services grouped by responsibility in `src/app/core/services`:

- API clients in `src/app/core/services/api/project` and `src/app/core/services/api/task`
- application state/orchestration in `src/app/core/services/store` (`taskflow-store.service.ts`)

When creating a new service, place it in the matching folder from the start to avoid a flat `services` directory.

## Current docs roadmap note

- Frontend checklist is maintained in `front/TODO.md`.
- Sticky top menu (**Stage 14**) is implemented in `src/app/app.html` and `src/app/app.scss` with global route navigation.
