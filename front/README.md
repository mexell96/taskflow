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
- `*.component.css` for component-scoped styles

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
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Frontend pages and routes

- Place page components in `src/app/features/<feature-name>/`.
- Home page: `src/app/features/home/home.component.ts`.
- About page: `src/app/features/about/about.component.ts`.
- Root route `''` loads Home with lazy `loadComponent`.
- `'about'` route loads About with lazy `loadComponent`.
- Wildcard route `**` redirects to `''`.
