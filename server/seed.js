import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  // ─── СКЛАДЫ (из ATLANT PLUS) ──────────────────────────────
  console.log('📦 Создаём склады...')
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({ where: { name: 'БАР' },     update: {}, create: { name: 'БАР' } }),
    prisma.warehouse.upsert({ where: { name: 'КУХНЯ' },   update: {}, create: { name: 'КУХНЯ' } }),
    prisma.warehouse.upsert({ where: { name: 'МАНГАЛ' },  update: {}, create: { name: 'МАНГАЛ' } }),
    prisma.warehouse.upsert({ where: { name: 'ПРОЧЕЕ' },  update: {}, create: { name: 'ПРОЧЕЕ' } }),
  ])
  const [wBar, wKitchen, wMangal, wOther] = warehouses
  console.log(`✅ Складов создано: ${warehouses.length}`)

  // ─── ПОДРАЗДЕЛЕНИЯ (из ATLANT PLUS) ───────────────────────
  console.log('🏢 Создаём подразделения...')
  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'БАР' },          update: {}, create: { name: 'БАР',          warehouseId: wBar.id } }),
    prisma.department.upsert({ where: { name: 'ГОРЯЧИЙ ЦЕХ' },  update: {}, create: { name: 'ГОРЯЧИЙ ЦЕХ',  warehouseId: wKitchen.id } }),
    prisma.department.upsert({ where: { name: 'МАНГАЛ' },        update: {}, create: { name: 'МАНГАЛ',        warehouseId: wMangal.id } }),
    prisma.department.upsert({ where: { name: 'МУЧНОЙ ЦЕХ' },   update: {}, create: { name: 'МУЧНОЙ ЦЕХ',   warehouseId: wKitchen.id } }),
    prisma.department.upsert({ where: { name: 'ХОЛОДНЫЙ ЦЕХ' }, update: {}, create: { name: 'ХОЛОДНЫЙ ЦЕХ', warehouseId: wKitchen.id } }),
  ])
  const [dBar, dHot, dMangal, dBread, dCold] = departments
  console.log(`✅ Подразделений создано: ${departments.length}`)

  // ─── КАТЕГОРИИ МЕНЮ (из ATLANT PLUS) ──────────────────────
  // Формат: { name, sortOrder, departmentId }
  console.log('🍽️ Создаём категории меню...')
  const categoryData = [
    // БАР
    { name: 'БЛАГОРОДНЫЙ КОКТЕЙЛЬ',  sortOrder: 1,  deptId: dBar.id },
    { name: 'ДЖОРСЫ',                sortOrder: 2,  deptId: dBar.id },
    { name: 'КОФЕ',                  sortOrder: 3,  deptId: dBar.id },
    { name: 'ЛИМОНАДЫ',              sortOrder: 4,  deptId: dBar.id },
    { name: 'НЕ КОФЕ',               sortOrder: 5,  deptId: dBar.id },
    { name: 'ОХЛАДИТЕЛЬНЫЕ НАПИТКИ', sortOrder: 6,  deptId: dBar.id },
    { name: 'ФРЕШ',                  sortOrder: 7,  deptId: dBar.id },
    { name: 'ХОЛОДНЫЕ НАПИТКИ',      sortOrder: 8,  deptId: dBar.id },
    { name: 'ЧАЙ',                   sortOrder: 9,  deptId: dBar.id },
    { name: 'НАПОЛИТЕЛИ',            sortOrder: 10, deptId: dBar.id },
    // ГОРЯЧИЙ ЦЕХ
    { name: 'ГОРЯЧИЙ ЗАВТРАК',       sortOrder: 11, deptId: dHot.id },
    { name: 'ГОРЯЧИЙ ЗАВОД',         sortOrder: 12, deptId: dHot.id },
    { name: 'ГОРЯЧЕЕ ИЗДЕЛИЕ',       sortOrder: 13, deptId: dHot.id },
    { name: 'ПАСТА',                 sortOrder: 14, deptId: dHot.id },
    { name: 'СУП',                   sortOrder: 15, deptId: dHot.id },
    { name: 'ЯЙЦА',                  sortOrder: 16, deptId: dHot.id },
    // МАНГАЛ
    { name: 'СТЕЙК',                 sortOrder: 17, deptId: dMangal.id },
    { name: 'ГАРНИР',                sortOrder: 18, deptId: dMangal.id },
    // МУЧНОЙ ЦЕХ
    { name: 'БУРГЕРЫ',               sortOrder: 19, deptId: dBread.id },
    { name: 'ДЕСЕРТ',                sortOrder: 20, deptId: dBread.id },
    { name: 'ДЕСЕРТ ФИРМ. ГОТОВНОСТЬ', sortOrder: 21, deptId: dBread.id },
    { name: 'ПИРОЖЕНОЕ',             sortOrder: 22, deptId: dBread.id },
    // ХОЛОДНЫЙ ЦЕХ
    { name: 'ЗАВТРАК',               sortOrder: 23, deptId: dCold.id },
    { name: 'САЛАТ',                 sortOrder: 24, deptId: dCold.id },
    { name: 'СЕТ',                   sortOrder: 25, deptId: dCold.id },
    { name: 'СУШИ',                  sortOrder: 26, deptId: dCold.id },
    { name: 'ХОЛОДНЫЕ ЗАКУСКИ',      sortOrder: 27, deptId: dCold.id },
    { name: 'ГОРЯЧАЯ ЗАКУСКА',       sortOrder: 28, deptId: dCold.id },
    // ДОСТАВКА / ПРОЧЕЕ
    { name: 'ДОСТАВКА',              sortOrder: 29, deptId: null },
  ]

  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } })
    if (!existing) {
      await prisma.category.create({ data: { name: cat.name, sortOrder: cat.sortOrder } })
    }
  }
  console.log(`✅ Категорий создано: ${categoryData.length}`)

  console.log('\n🎉 Структура базы данных готова!')
  console.log('📋 Склады:         БАР, КУХНЯ, МАНГАЛ, ПРОЧЕЕ')
  console.log('🏢 Подразделения:  БАР, ГОРЯЧИЙ ЦЕХ, МАНГАЛ, МУЧНОЙ ЦЕХ, ХОЛОДНЫЙ ЦЕХ')
  console.log('🍽️  Категорий меню: 29')
}

main().catch(console.error).finally(() => prisma.$disconnect())
