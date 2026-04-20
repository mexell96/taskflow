# Release Guide

Краткий и практичный гайд по релизам через Git-теги для `taskflow`.

## Что такое релиз через тег

- Тег в Git - это фиксированная метка на конкретный коммит.
- Релизный тег обычно имеет формат `vMAJOR.MINOR.PATCH` (например `v1.0.0`).
- По тегу удобно:
  - воспроизводить конкретную версию;
  - запускать CI/CD pipeline;
  - собирать release notes и артефакты.

## Основные правила

- Используй `SemVer`: `MAJOR.MINOR.PATCH`.
- Для релизов используй только `annotated tags`.
- Не переназначай уже опубликованные теги без критической причины.
- Один тег = один проверенный релизный коммит.

## Быстрый релизный чеклист

### 1) Проверить чистоту рабочей директории

```bash
git status
```

Ожидание: `working tree clean`.

### 2) Подтянуть актуальную историю

```bash
git pull --rebase
```

### 3) Прогнать обязательные проверки

Frontend:

```bash
cd front
npm run lint
npm run test
npm run build
```

Backend:

```bash
cd ../back
npm run lint
npm run test
npm run build
```

Опционально (если используете в релизном критерии):

```bash
cd ../front
npm run e2e
```

### 4) Вернуться в корень репозитория

```bash
cd ..
pwd
```

`pwd` должен указывать на каталог `taskflow/`.

### 5) Выбрать номер версии

- `PATCH` (`v1.2.3 -> v1.2.4`) - багфиксы без breaking changes.
- `MINOR` (`v1.2.3 -> v1.3.0`) - новые фичи без ломания совместимости.
- `MAJOR` (`v1.2.3 -> v2.0.0`) - breaking changes.

### 6) Создать annotated tag

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git show v1.0.0
```

### 7) Отправить коммиты и тег

```bash
git push
git push origin v1.0.0
```

### 8) Создать GitHub Release

```bash
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "$(cat <<'EOF'
## Что вошло
- Frontend: ...
- Backend: ...
- Docs/Infra: ...

## Миграции / breaking changes
- Нет

## Проверки
- front: lint/test/build ✅
- back: lint/test/build ✅
- e2e: ✅
EOF
)"
```

## Шаблон release notes

```md
## Что вошло
- Frontend: ...
- Backend: ...
- Docs/Infra: ...

## Миграции / breaking changes
- Нет / список изменений

## Проверки
- front: lint/test/build ✅
- back: lint/test/build ✅
- e2e: ✅ / пропущено (почему)
```

## Hotfix flow

Если нужно срочно исправить уже выпущенную версию:

```bash
git checkout -b hotfix/v1.0.1 v1.0.0
```

Дальше:

- вносим только минимальный фикс;
- прогоняем проверки;
- ставим тег `v1.0.1`;
- вливаем hotfix обратно в `main`.

## Полезные команды

```bash
git tag --sort=-version:refname
git show v1.0.0
git push origin v1.0.0
```

Удаление тега (использовать аккуратно):

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```
