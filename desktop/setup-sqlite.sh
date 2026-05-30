#!/bin/bash
# Скрипт для настройки десктоп-версии с SQLite
echo "📦 Настройка SQLite для десктопной версии..."
cd ../server
cp prisma/schema.prisma prisma/schema.postgres.prisma
cp prisma/schema.sqlite.prisma prisma/schema.prisma
echo "DATABASE_URL=file:./dev.db" > .env
npx prisma db push
node seed.js
echo "✅ База данных настроена!"
echo ""
echo "Теперь запустите: cd ../desktop && npm run dev"
