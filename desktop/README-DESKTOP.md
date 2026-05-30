# Сборка десктопного приложения

## Требования
- Node.js 18+
- npm

## Установка и запуск в режиме разработки

```bash
# 1. Собери фронтенд
cd ../client && npm install && npm run build && cd ../desktop

# 2. Установи зависимости десктопа
npm install

# 3. Запусти в dev-режиме (используется DATABASE_URL из .env или Postgres)
npm run dev
```

## Сборка установщика

### Windows (.exe)
```bash
npm run build:win
```

### macOS (.dmg)
```bash
npm run build:mac
```

### Linux (.AppImage)
```bash
npm run build:linux
```

Готовый установщик будет в папке `desktop/dist/`.

## Примечание про базу данных

**В режиме десктопа** приложение использует **SQLite** (локальный файл на компьютере).
Файл базы данных хранится в:
- Windows: `%APPDATA%\cafe-pos-desktop\cafe-pos.db`
- macOS: `~/Library/Application Support/cafe-pos-desktop/cafe-pos.db`
- Linux: `~/.config/cafe-pos-desktop/cafe-pos.db`

Данные сохраняются между запусками автоматически.

**В режиме Railway** (деплой) используется Postgres через переменную `DATABASE_URL`.
