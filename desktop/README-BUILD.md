# Сборка HOS LOUNGE Desktop

## Требования
- Node.js 18+
- npm 9+
- Windows 10/11 x64 (для .exe)

## Быстрая сборка (Windows .exe)

```bash
# 1. Установить зависимости сервера
cd server
npm install
npx prisma generate

# 2. Собрать фронтенд
cd ../client
npm install
npm run build

# 3. Собрать десктоп
cd ../desktop
npm install
npm run build:win
```

Готовый установщик будет в `desktop/dist/HOS LOUNGE Setup 1.0.0.exe`

## Структура после установки
- База данных: `%APPDATA%/hos-lounge-pos/hoslounge.db`
- Логи: `%APPDATA%/hos-lounge-pos/logs/`
- При первом запуске БД создаётся автоматически

## Обновление
Просто запустить новый установщик — данные сохраняются.
