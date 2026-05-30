# ☕ ЛаунжКасса — POS система для кафе

## Структура проекта

```
cafe-pos/
├── client/          # React фронтенд (Vite)
├── server/          # Express + Prisma бэкенд
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL (для Railway)
│   │   └── schema.sqlite.prisma   # SQLite (для десктопа)
│   ├── index.js
│   └── seed.js
├── desktop/         # Electron десктоп-обёртка
├── railway.toml     # Конфиг Railway деплоя
└── .nixpacks.toml   # Конфиг сборки
```

---

## 🚀 Деплой на Railway

### 1. Настройка Postgres
1. В Railway → Add Service → Database → **PostgreSQL**
2. После создания → вкладка **Connect** → скопировать **Internal Database URL**

### 2. Настройка переменной окружения
1. Открыть сервис приложения → вкладка **Variables**
2. Добавить переменную:
   ```
   DATABASE_URL = <Internal Database URL из шага 1>
   ```
   ⚠️ Используй именно **Internal URL** (начинается с `postgresql://postgres:...@postgres-XXXX.railway.internal:5432/railway`)

### 3. Деплой
Push в репозиторий — Railway сам запустит сборку.

### Почему были ошибки P1000/P1001?
- **P1001** — Railway поднимает Postgres позже чем приложение. Исправлено retry-логикой в сервере.
- **P1000** — Неверные credentials в `DATABASE_URL`. Нужно скопировать свежий Internal URL.
- **Нехватка openssl** — Prisma требует openssl. Добавлен в `.nixpacks.toml`.

---

## 💻 Десктоп-версия (Electron)

### Быстрый старт (разработка)
```bash
# Настройка SQLite + начальные данные
cd desktop && bash setup-sqlite.sh

# Собрать фронтенд
cd ../client && npm install && npm run build

# Запустить
cd ../desktop && npm install && npm run dev
```

### Сборка установщика
```bash
cd desktop
npm install
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux .AppImage
```

Готовый файл будет в `desktop/dist/`.

---

## 🛠 Локальная разработка с Postgres

```bash
# Поднять Postgres локально (Docker)
docker run -d -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres

# server/.env
DATABASE_URL="postgresql://postgres:pass@localhost:5432/cafepos"

cd server && npm install && npx prisma db push && node seed.js
cd ../client && npm install && npm run dev
```
