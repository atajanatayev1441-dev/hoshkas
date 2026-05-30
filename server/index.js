import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)

// ─── WebSocket ────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer })
const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
})

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data })
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg)
  }
}

// ─── Prisma with retry ────────────────────────────────────────
const prisma = new PrismaClient({ log: ['error'] })

async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
      return
    } catch (err) {
      console.log(`⏳ DB not ready (${i}/${retries}): ${err.message}`)
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

app.use(cors())
app.use(express.json())

const publicPath = join(__dirname, '..', 'public')
app.use(express.static(publicPath))

// ─── WAITERS ──────────────────────────────────────────────────
app.get('/api/waiters', async (req, res) => {
  try {
    const waiters = await prisma.waiter.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    })
    res.json(waiters)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/waiters', async (req, res) => {
  try {
    const { name, pin } = req.body
    const waiter = await prisma.waiter.create({ data: { name, pin } })
    res.json(waiter)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/waiters/:id', async (req, res) => {
  try {
    const { name, pin, active } = req.body
    const waiter = await prisma.waiter.update({
      where: { id: Number(req.params.id) },
      data: { name, pin, active }
    })
    res.json(waiter)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/waiters/:id', async (req, res) => {
  try {
    await prisma.waiter.update({
      where: { id: Number(req.params.id) },
      data: { active: false }
    })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Waiter PIN login
app.post('/api/waiters/login', async (req, res) => {
  try {
    const { pin } = req.body
    const waiter = await prisma.waiter.findFirst({
      where: { pin, active: true }
    })
    if (!waiter) return res.status(401).json({ error: 'Неверный PIN' })
    res.json(waiter)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── CATEGORIES ──────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { items: { where: { active: true } } },
      orderBy: { id: 'asc' }
    })
    res.json(categories)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body
    const category = await prisma.category.create({ data: { name } })
    res.json(category)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── ITEMS ───────────────────────────────────────────────────
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { category: true },
      orderBy: { id: 'asc' }
    })
    res.json(items)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/items', async (req, res) => {
  try {
    const { name, price, categoryId } = req.body
    const item = await prisma.item.create({
      data: { name, price: parseFloat(price), categoryId: Number(categoryId) }
    })
    res.json(item)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, price, categoryId, active } = req.body
    const item = await prisma.item.update({
      where: { id: Number(req.params.id) },
      data: { name, price: parseFloat(price), categoryId: Number(categoryId), active }
    })
    res.json(item)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/items/:id', async (req, res) => {
  try {
    await prisma.item.update({
      where: { id: Number(req.params.id) },
      data: { active: false }
    })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
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
      include: { items: true, waiter: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })
    res.json(orders)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Pending orders for cashier
app.get('/api/orders/pending', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { items: true, waiter: true },
      orderBy: { createdAt: 'asc' }
    })
    res.json(orders)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, waiter: true }
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Waiter creates order → PENDING
app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, comment, items, waiterId, waiterName } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const number = await getNextOrderNumber()
    const order = await prisma.order.create({
      data: {
        number, tableNumber, comment, total,
        status: 'PENDING',
        waiterId: waiterId ? Number(waiterId) : null,
        waiterName: waiterName || null,
        items: {
          create: items.map(i => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
            name: i.name
          }))
        }
      },
      include: { items: true, waiter: true }
    })
    // Notify cashier in real time
    broadcast('new_order', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Cashier accepts order → PAID
app.put('/api/orders/:id/accept', async (req, res) => {
  try {
    const { paymentType } = req.body
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: {
        status: 'PAID',
        paymentType: paymentType || 'CASH',
        closedAt: new Date()
      },
      include: { items: true, waiter: true }
    })
    broadcast('order_accepted', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Cashier creates direct order (no waiter)
app.post('/api/orders/direct', async (req, res) => {
  try {
    const { tableNumber, comment, items, paymentType } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const number = await getNextOrderNumber()
    const order = await prisma.order.create({
      data: {
        number, tableNumber, comment, total,
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
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'CANCELLED' }
    })
    broadcast('order_cancelled', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
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
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── EXCEL EXPORT ─────────────────────────────────────────────
app.get('/api/export/orders/excel', async (req, res) => {
  try {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const XLSX = require('xlsx')
    const { from, to } = req.query
    const where = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }
    const orders = await prisma.order.findMany({
      where, include: { items: true, waiter: true }, orderBy: { createdAt: 'asc' }
    })
    const rows = orders.map(o => ({
      '№ заказа': o.number,
      'Дата': new Date(o.createdAt).toLocaleString('ru-RU'),
      'Официант': o.waiterName || '—',
      'Стол': o.tableNumber || '—',
      'Статус': o.status,
      'Оплата': o.paymentType === 'CASH' ? 'Наличные' : 'Карта',
      'Позиции': o.items.map(i => `${i.name} x${i.quantity}`).join('; '),
      'Сумма (TMT)': o.total
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Заказы')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="orders.xlsx"`)
    res.send(buf)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }))

// ─── Waiter app (separate SPA at /waiter) ─────────────────────
const waiterPath = join(__dirname, '..', 'public-waiter')
app.use('/waiter', express.static(waiterPath))
app.get('/waiter/*', (req, res) => res.sendFile(join(waiterPath, 'index.html')))

// SPA fallback (cashier)
app.get('*', (req, res) => res.sendFile(join(publicPath, 'index.html')))

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

connectWithRetry()
  .then(() => {
    httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message)
    process.exit(1)
  })
