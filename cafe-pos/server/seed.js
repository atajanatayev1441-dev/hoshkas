import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: 'Кофе', items: [
      { name: 'Эспрессо', price: 180 },
      { name: 'Капучино', price: 280 },
      { name: 'Латте', price: 320 },
      { name: 'Флэт уайт', price: 300 },
      { name: 'Раф', price: 350 },
    ]},
    { name: 'Чай', items: [
      { name: 'Зелёный чай', price: 220 },
      { name: 'Чёрный чай', price: 200 },
      { name: 'Каркаде', price: 220 },
      { name: 'Чайник травяной', price: 380 },
    ]},
    { name: 'Коктейли', items: [
      { name: 'Мохито б/а', price: 420 },
      { name: 'Лимонад домашний', price: 350 },
      { name: 'Смузи манго', price: 390 },
    ]},
    { name: 'Кальян', items: [
      { name: 'Кальян стандарт', price: 1200 },
      { name: 'Кальян премиум', price: 1800 },
      { name: 'Подача кальяна', price: 300 },
    ]},
    { name: 'Еда', items: [
      { name: 'Брускетта', price: 350 },
      { name: 'Фруктовая тарелка', price: 480 },
      { name: 'Сырная тарелка', price: 650 },
      { name: 'Десерт дня', price: 280 },
    ]},
  ]

  for (const cat of categories) {
    const category = await prisma.category.create({ data: { name: cat.name } })
    for (const item of cat.items) {
      await prisma.item.create({ data: { ...item, categoryId: category.id } })
    }
  }

  console.log('✅ База данных заполнена')
}

main().catch(console.error).finally(() => prisma.$disconnect())
