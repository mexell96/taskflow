# Frontend Release Notes

## v1.0.0 (2026-04-20)

Первый стабильный релиз frontend части `taskflow`.

### Что вошло

- SSR-ready конфигурация Angular frontend.
- HTTP-клиент для SSR с `withFetch()` и корректной прокладкой API через `/api`.
- Исправлен SSR proxy body typing для `fetch` в `front/src/server.ts`.
- Завершены этапы: i18n, PWA, базовая доступность.
- Завершён этап 14: глобальный sticky header с навигацией по основным маршрутам (`/`, `/projects`, `/settings`, `/about`).
- Обновлена русскоязычная документация запуска и архитектуры проекта.

### Ключевые изменения по коммитам

- `aef3a38` - SSR API proxy passthrough.
- `52bb120` - fetch-based HttpClient for SSR.
- `a084940` - fix body typing in SSR proxy.
- `52627d5` / `1c7fec2` - реорганизация task UI структуры.
- `1752b7c` / `a92a406` - PWA и accessibility доработки.

### Проверки перед релизом

- `npm run lint` (front) - пройдено.
- `npm run build` (front) - запуск подтвержден, в текущем окружении команда завершилась досрочно с кодом `134`, требуется повторный прогон локально перед публикацией во внешний remote.
