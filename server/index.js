import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// ─── Prisma with retry on startup ────────────────────────────
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})

async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
      return
    } catch (err) {
      console.log(`⏳ DB not ready (attempt ${i}/${retries}): ${err.message}`)
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

app.use(cors())
app.use(express.json())

// Serve built frontend
const publicPath = join(__dirname, '..', 'public')
app.use(express.static(publicPath))

// ─── CATEGORIES ──────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { items: { where: { active: true } } },
      orderBy: { id: 'asc' }
    })
    res.json(categories)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body
    const category = await prisma.category.create({ data: { name } })
    res.json(category)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── ITEMS ───────────────────────────────────────────────────
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { category: true },
      orderBy: { id: 'asc' }
    })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/items', async (req, res) => {
  try {
    const { name, price, categoryId } = req.body
    const item = await prisma.item.create({
      data: { name, price: parseFloat(price), categoryId: Number(categoryId) }
    })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, price, categoryId, active } = req.body
    const item = await prisma.item.update({
      where: { id: Number(req.params.id) },
      data: { name, price: parseFloat(price), categoryId: Number(categoryId), active }
    })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/items/:id', async (req, res) => {
  try {
    await prisma.item.update({
      where: { id: Number(req.params.id) },
      data: { active: false }
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── ORDERS ──────────────────────────────────────────────────
async function getNextOrderNumber() {
  const last = await prisma.order.findFirst({ orderBy: { number: 'desc' } })
  return (last?.number ?? 0) + 1
}

app.get('/api/orders', async (req, res) => {
  try {
    const { status, from, to, limit = 200 } = req.query
    const where = {}
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })
    res.json(orders)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true }
    })
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, comment, items, paymentType } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const number = await getNextOrderNumber()
    const order = await prisma.order.create({
      data: {
        number,
        tableNumber,
        comment,
        total,
        paymentType: paymentType || 'CASH',
        status: 'PAID',
        closedAt: new Date(),
        items: {
          create: items.map(i => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
            name: i.name
          }))
        }
      },
      include: { items: true }
    })
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'CANCELLED' }
    })
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── ANALYTICS ───────────────────────────────────────────────
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = { status: 'PAID' }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }

    const orders = await prisma.order.findMany({ where, include: { items: true } })
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders = orders.length
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const itemMap = {}
    for (const o of orders) {
      for (const i of o.items) {
        if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
        itemMap[i.name].qty += i.quantity
        itemMap[i.name].revenue += i.price * i.quantity
      }
    }
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    const byDay = {}
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0 }
      byDay[day].revenue += o.total
      byDay[day].orders += 1
    }
    const byDayArr = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

    const byCash = orders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + o.total, 0)
    const byCard = orders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + o.total, 0)

    res.json({ totalRevenue, totalOrders, avgCheck, topItems, byDay: byDayArr, byCash, byCard })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── CSV EXPORT ──────────────────────────────────────────────
app.get('/api/export/orders', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    })

    const rows = [['№ заказа', 'Дата', 'Стол', 'Статус', 'Оплата', 'Позиции', 'Сумма']]
    for (const o of orders) {
      const itemsStr = o.items.map(i => `${i.name} x${i.quantity}`).join('; ')
      rows.push([
        o.number,
        new Date(o.createdAt).toLocaleString('ru-RU'),
        o.tableNumber || '—',
        o.status,
        o.paymentType,
        itemsStr,
        o.total.toFixed(2)
      ])
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"')
    res.send('\uFEFF' + csv)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message)
    process.exit(1)
  })
