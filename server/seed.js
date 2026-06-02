import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  // ─── СКЛАДЫ ───────────────────────────────────────────────
  console.log('📦 Склады...')
  const [wBar, wKitchen, wMangal, wOther] = await Promise.all([
    prisma.warehouse.upsert({ where: { name: 'БАР' },    update: {}, create: { name: 'БАР' } }),
    prisma.warehouse.upsert({ where: { name: 'КУХНЯ' },  update: {}, create: { name: 'КУХНЯ' } }),
    prisma.warehouse.upsert({ where: { name: 'МАНГАЛ' }, update: {}, create: { name: 'МАНГАЛ' } }),
    prisma.warehouse.upsert({ where: { name: 'ПРОЧЕЕ' }, update: {}, create: { name: 'ПРОЧЕЕ' } }),
  ])

  // ─── ПОДРАЗДЕЛЕНИЯ ────────────────────────────────────────
  console.log('🏢 Подразделения...')
  const [dBar, dHot, dMangal, dBread, dCold] = await Promise.all([
    prisma.department.upsert({ where: { name: 'БАР' },          update: {}, create: { name: 'БАР',          warehouseId: wBar.id } }),
    prisma.department.upsert({ where: { name: 'ГОРЯЧИЙ ЦЕХ' },  update: {}, create: { name: 'ГОРЯЧИЙ ЦЕХ',  warehouseId: wKitchen.id } }),
    prisma.department.upsert({ where: { name: 'МАНГАЛ' },        update: {}, create: { name: 'МАНГАЛ',        warehouseId: wMangal.id } }),
    prisma.department.upsert({ where: { name: 'МУЧНОЙ ЦЕХ' },   update: {}, create: { name: 'МУЧНОЙ ЦЕХ',   warehouseId: wKitchen.id } }),
    prisma.department.upsert({ where: { name: 'ХОЛОДНЫЙ ЦЕХ' }, update: {}, create: { name: 'ХОЛОДНЫЙ ЦЕХ', warehouseId: wKitchen.id } }),
  ])

  const deptByName = {
    'БАР': dBar, 'ГОРЯЧИЙ ЦЕХ': dHot, 'МАНГАЛ': dMangal,
    'МУЧНОЙ ЦЕХ': dBread, 'ХОЛОДНЫЙ ЦЕХ': dCold,
  }

  // ─── КАТЕГОРИИ + БЛЮДА (из ATLANT PLUS) ──────────────────
  console.log('🍽️ Меню из ATLANT PLUS...')

  // category name → { sortOrder, dept }
  const categoryMeta = {
    'БУРГЕРЫ':                  { sortOrder: 1,  dept: 'МУЧНОЙ ЦЕХ' },
    'ГАРНИР':                   { sortOrder: 2,  dept: 'ГОРЯЧИЙ ЦЕХ' },
    'ГОРЯЧИЙ БЛЮДО':            { sortOrder: 3,  dept: 'ГОРЯЧИЙ ЦЕХ' },
    'ГОРЯЧИЙ ЗАКУСКА':          { sortOrder: 4,  dept: 'ГОРЯЧИЙ ЦЕХ' },
    'ДЕСЕРТ МИНУТНАЯ ГОТОВНОСТЬ':{ sortOrder: 5, dept: 'МУЧНОЙ ЦЕХ' },
    'ЗАВТРАК':                  { sortOrder: 6,  dept: 'ХОЛОДНЫЙ ЦЕХ' },
    'МУЧНЫЕ ИЗДЕЛИЕ':           { sortOrder: 7,  dept: 'МУЧНОЙ ЦЕХ' },
    'ПАСТА':                    { sortOrder: 8,  dept: 'ГОРЯЧИЙ ЦЕХ' },
    'СТЕЙК':                    { sortOrder: 9,  dept: 'МАНГАЛ' },
    'СУП':                      { sortOrder: 10, dept: 'ГОРЯЧИЙ ЦЕХ' },
  }

  // All items from ATLANT PLUS
  const menuData = [
    // БУРГЕРЫ — МУЧНОЙ ЦЕХ
    { category: 'БУРГЕРЫ', name: 'БУРГЕР КЛАССИЧЕСКИЙ',  price: 90,  costPrice: 0 },
    { category: 'БУРГЕРЫ', name: 'БУРГЕР С ЯЙЦОМ',        price: 70,  costPrice: 0 },
    { category: 'БУРГЕРЫ', name: 'ЧИКЕН БУРГЕР',           price: 70,  costPrice: 0 },
    // ГАРНИР — ГОРЯЧИЙ ЦЕХ
    { category: 'ГАРНИР', name: 'ПЮРЕ КАРТОФЕЛЬНЫЙ',      price: 30,  costPrice: 0 },
    { category: 'ГАРНИР', name: 'РИС ОВОЩОЙ',             price: 30,  costPrice: 0 },
    { category: 'ГАРНИР', name: 'РИС ОТВАРНОЙ',           price: 25,  costPrice: 0 },
    { category: 'ГАРНИР', name: 'ФРИ КАРТОФЕЛЬНЫЙ',       price: 30,  costPrice: 0 },
    { category: 'ГАРНИР', name: 'ФРИ С СЫРОМ',            price: 40,  costPrice: 0 },
    // ГОРЯЧИЙ БЛЮДО — ГОРЯЧИЙ ЦЕХ
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'БЕФСТРОГОНОВ',                    price: 120, costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'КОРЕЙКА ЯГНЕНКА С ЧЕРНОСЛИВОМ',   price: 130, costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'КУРИННЫЙ ГРУДКА НА ГРИЛЕ',        price: 80,  costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'КУРИНЫЙ ГРУДКА ДИЕТИЧЕСКИЙ',      price: 75,  costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'МЯСО ПО ТАЙСКИЙ',                 price: 140, costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'РАМЕН С КУРИЦЕЙ',                  price: 65,  costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'РЫБА ПО ДОМАШНЕМУ',               price: 165, costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'СЕМГА НА ГРИЛЕ',                   price: 190, costPrice: 0 },
    { category: 'ГОРЯЧИЙ БЛЮДО', name: 'ФРИКАСЕ',                          price: 80,  costPrice: 0 },
    // ГОРЯЧИЙ ЗАКУСКА — ГОРЯЧИЙ ЦЕХ
    { category: 'ГОРЯЧИЙ ЗАКУСКА', name: 'ЖАРЕНЫЕ ПЕЛЬМЕНИ',  price: 70, costPrice: 0 },
    { category: 'ГОРЯЧИЙ ЗАКУСКА', name: 'КРОКЕТЫ С СЫРОМ',   price: 60, costPrice: 0 },
    { category: 'ГОРЯЧИЙ ЗАКУСКА', name: 'СИГАРА БОРЕК',       price: 40, costPrice: 0 },
    { category: 'ГОРЯЧИЙ ЗАКУСКА', name: 'ТОРТИЛЬЯ С МЯСОМ',  price: 40, costPrice: 0 },
    // ДЕСЕРТ МИНУТНАЯ ГОТОВНОСТЬ — МУЧНОЙ ЦЕХ
    { category: 'ДЕСЕРТ МИНУТНАЯ ГОТОВНОСТЬ', name: 'ПИШМЕ ДЕСЕРТ МИНДАЛЬ',   price: 50, costPrice: 0 },
    { category: 'ДЕСЕРТ МИНУТНАЯ ГОТОВНОСТЬ', name: 'ПИШМЕ ДЕСЕРТ ФИСТАШКА',  price: 55, costPrice: 0 },
    // ЗАВТРАК — ХОЛОДНЫЙ ЦЕХ
    { category: 'ЗАВТРАК', name: 'ГЛАЗУНЬЯ',                          price: 35,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'ГЛАЗУНЬЯ С КОВУРМОЙ',               price: 65,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'ГОРЯЧИЙ СЕТ ЗАВТРАК',               price: 130, costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'КАША МАННАЯ',                       price: 40,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'КАША РИСОВАЯ',                      price: 40,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'КОРАЛЕВСКИЙ ЗАВТРАК',               price: 265, costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'МЕНЕМЕН',                           price: 40,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'ОМЛЕТ С ВЕТЧИНОЙ',                  price: 35,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'ОМЛЕТ С СЫРОМ',                     price: 35,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'СЕНДВИЧ С КУРИЦЕЙ',                 price: 45,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'СЕНДВИЧ ТВОРОЖНЫЙ',                 price: 60,  costPrice: 0 },
    { category: 'ЗАВТРАК', name: 'ТОСТ С ЛАСОСЕМ И ЯЙЦОМ ПАШОТ',     price: 70,  costPrice: 0 },
    // МУЧНЫЕ ИЗДЕЛИЕ — МУЧНОЙ ЦЕХ
    { category: 'МУЧНЫЕ ИЗДЕЛИЕ', name: 'ПИДЕ ЧУРЕК', price: 15, costPrice: 0 },
    // ПАСТА — ГОРЯЧИЙ ЦЕХ (с себестоимостью)
    { category: 'ПАСТА', name: 'БОЛОНЬЕЗЕ',           price: 80,  costPrice: 25.5 },
    { category: 'ПАСТА', name: 'ПАСТА С КРЕВЕТКАМИ',  price: 115, costPrice: 36.2 },
    { category: 'ПАСТА', name: 'ФЕТУЧИНИ АЛЬФРЕДО',   price: 95,  costPrice: 35.68 },
    // СТЕЙК — МАНГАЛ
    { category: 'СТЕЙК', name: 'БОН ФИЛЕ',      price: 190, costPrice: 0 },
    { category: 'СТЕЙК', name: 'ДАЛЛАС СТЕЙК',  price: 240, costPrice: 0 },
    { category: 'СТЕЙК', name: 'ТИБОН СТЕЙК',   price: 260, costPrice: 0 },
    // СУП — ГОРЯЧИЙ ЦЕХ
    { category: 'СУП', name: 'КУРИННЫЙ СУП',  price: 40, costPrice: 0 },
    { category: 'СУП', name: 'МЕРДЖИМЕК',      price: 30, costPrice: 0 },
    { category: 'СУП', name: 'СУП КРЕМОВЫЙ',  price: 45, costPrice: 0 },
    { category: 'СУП', name: 'СУП ПЕЛЬМЕННЫЙ',price: 40, costPrice: 0 },
    { category: 'СУП', name: 'СЫРНЫЙ СУП',    price: 45, costPrice: 0 },
    { category: 'СУП', name: 'ТОМАТНЫЙ СУП',  price: 35, costPrice: 0 },
    { category: 'СУП', name: 'ТЫКВЕННЫЙ СУП', price: 40, costPrice: 0 },
  ]

  // Create categories and items
  const categoryCache = {}

  for (const item of menuData) {
    const meta = categoryMeta[item.category]
    const dept = deptByName[meta.dept]

    // Get or create category
    if (!categoryCache[item.category]) {
      const existing = await prisma.category.findFirst({ where: { name: item.category } })
      if (existing) {
        categoryCache[item.category] = existing
      } else {
        categoryCache[item.category] = await prisma.category.create({
          data: { name: item.category, sortOrder: meta.sortOrder }
        })
      }
    }
    const category = categoryCache[item.category]

    // Check if item exists
    const existingItem = await prisma.item.findFirst({ where: { name: item.name, categoryId: category.id } })
    if (!existingItem) {
      const created = await prisma.item.create({
        data: {
          name: item.name,
          price: item.price,
          categoryId: category.id,
          departmentId: dept?.id || null,
        }
      })
      // Add cost if exists
      if (item.costPrice > 0) {
        await prisma.itemCost.create({ data: { itemId: created.id, costPrice: item.costPrice } })
      }
    }
  }

  console.log(`✅ Создано ${menuData.length} блюд в ${Object.keys(categoryCache).length} категориях`)
  console.log('\n🎉 База данных заполнена данными из ATLANT PLUS!')
  console.log('📦 Склады: БАР, КУХНЯ, МАНГАЛ, ПРОЧЕЕ')
  console.log('🏢 Подразделения: БАР, ГОРЯЧИЙ ЦЕХ, МАНГАЛ, МУЧНОЙ ЦЕХ, ХОЛОДНЫЙ ЦЕХ')
  console.log(`🍽️  Категорий: ${Object.keys(categoryCache).length}`)
  console.log(`🍴 Блюд: ${menuData.length}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
