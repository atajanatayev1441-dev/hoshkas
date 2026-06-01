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

const wss = new WebSocketServer({ server: httpServer })
const clients = new Set()
wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
})
function broadcast(event, data) {
  const msg = JSON.stringify({ event, data })
  for (const client of clients) if (client.readyState === 1) client.send(msg)
}

const prisma = new PrismaClient({ log: ['error'] })
async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try { await prisma.$connect(); console.log('✅ Database connected'); return }
    catch (err) {
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

// ─── WAITERS ─────────────────────────────────────────────────
app.get('/api/waiters', async (req, res) => {
  try { res.json(await prisma.waiter.findMany({ where: { active: true }, orderBy: { name: 'asc' } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/waiters', async (req, res) => {
  try { res.json(await prisma.waiter.create({ data: { name: req.body.name, pin: req.body.pin } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/waiters/:id', async (req, res) => {
  try {
    const { name, pin, active } = req.body
    res.json(await prisma.waiter.update({ where: { id: Number(req.params.id) }, data: { name, pin, active } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/waiters/:id', async (req, res) => {
  try { await prisma.waiter.update({ where: { id: Number(req.params.id) }, data: { active: false } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/waiters/login', async (req, res) => {
  try {
    const waiter = await prisma.waiter.findFirst({ where: { pin: req.body.pin, active: true } })
    if (!waiter) return res.status(401).json({ error: 'Неверный PIN' })
    res.json(waiter)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── CATEGORIES ──────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try { res.json(await prisma.category.findMany({ include: { items: { where: { active: true } } }, orderBy: { id: 'asc' } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/categories', async (req, res) => {
  try { res.json(await prisma.category.create({ data: { name: req.body.name } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/categories/:id', async (req, res) => {
  try { await prisma.category.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── ITEMS ───────────────────────────────────────────────────
app.get('/api/items', async (req, res) => {
  try { res.json(await prisma.item.findMany({ include: { category: true }, orderBy: { id: 'asc' } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/items', async (req, res) => {
  try {
    const { name, price, categoryId } = req.body
    res.json(await prisma.item.create({ data: { name, price: parseFloat(price), categoryId: Number(categoryId) } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, price, categoryId, active } = req.body
    res.json(await prisma.item.update({ where: { id: Number(req.params.id) }, data: { name, price: parseFloat(price), categoryId: Number(categoryId), active } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/items/:id', async (req, res) => {
  try { await prisma.item.update({ where: { id: Number(req.params.id) }, data: { active: false } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
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
    res.json(await prisma.order.findMany({ where, include: { items: true, waiter: true }, orderBy: { createdAt: 'desc' }, take: Number(limit) }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders/pending', async (req, res) => {
  try {
    res.json(await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { items: true, waiter: true },
      orderBy: { createdAt: 'asc' }
    }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Открытые чеки официанта (OPEN)
app.get('/api/orders/open', async (req, res) => {
  try {
    const { waiterId } = req.query
    const where = { status: 'OPEN' }
    if (waiterId) where.waiterId = Number(waiterId)
    res.json(await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'asc' } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/orders/:id', async (req, res) => {
  try { res.json(await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: true, waiter: true } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// Официант открывает новый чек (OPEN)
app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, comment, items, waiterId, waiterName } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const number = await getNextOrderNumber()
    const order = await prisma.order.create({
      data: {
        number, tableNumber, comment, total,
        status: 'OPEN',
        waiterId: waiterId ? Number(waiterId) : null,
        waiterName: waiterName || null,
        items: { create: items.map(i => ({ itemId: i.itemId, quantity: i.quantity, price: i.price, name: i.name })) }
      },
      include: { items: true, waiter: true }
    })
    broadcast('order_opened', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Официант добавляет позиции в открытый чек
app.post('/api/orders/:id/add-items', async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const { items } = req.body
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order || order.status !== 'OPEN') return res.status(400).json({ error: 'Чек не открыт' })

    // Merge items
    for (const newItem of items) {
      const existing = order.items.find(i => i.itemId === newItem.itemId)
      if (existing) {
        await prisma.orderItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + newItem.quantity } })
      } else {
        await prisma.orderItem.create({ data: { orderId, itemId: newItem.itemId, quantity: newItem.quantity, price: newItem.price, name: newItem.name } })
      }
    }

    const updatedItems = await prisma.orderItem.findMany({ where: { orderId } })
    const newTotal = updatedItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const updated = await prisma.order.update({ where: { id: orderId }, data: { total: newTotal }, include: { items: true, waiter: true } })
    broadcast('order_updated', updated)
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Официант закрывает чек (OPEN → PENDING, отправляет на кассу)
app.put('/api/orders/:id/close', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'PENDING' },
      include: { items: true, waiter: true }
    })
    broadcast('new_order', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Касса принимает оплату (PENDING → PAID)
app.put('/api/orders/:id/accept', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'PAID', paymentType: req.body.paymentType || 'CASH', closedAt: new Date() },
      include: { items: true, waiter: true }
    })
    broadcast('order_accepted', order)
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Касса создаёт прямой заказ (без официанта, сразу PAID)
app.post('/api/orders/direct', async (req, res) => {
  try {
    const { tableNumber, comment, items, paymentType } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const number = await getNextOrderNumber()
    const order = await prisma.order.create({
      data: {
        number, tableNumber, comment, total,
        paymentType: paymentType || 'CASH', status: 'PAID', closedAt: new Date(),
        items: { create: items.map(i => ({ itemId: i.itemId, quantity: i.quantity, price: i.price, name: i.name })) }
      },
      include: { items: true }
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.update({ where: { id: Number(req.params.id) }, data: { status: 'CANCELLED' }, include: { items: true, waiter: true } })
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
    for (const o of orders) for (const i of o.items) {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
      itemMap[i.name].qty += i.quantity
      itemMap[i.name].revenue += i.price * i.quantity
    }
    const byDay = {}
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0 }
      byDay[day].revenue += o.total
      byDay[day].orders += 1
    }
    res.json({
      totalRevenue, totalOrders, avgCheck,
      topItems: Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      byCash: orders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + o.total, 0),
      byCard: orders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + o.total, 0)
    })
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
    if (from || to) { where.createdAt = {}; if (from) where.createdAt.gte = new Date(from); if (to) where.createdAt.lte = new Date(to + 'T23:59:59') }
    const orders = await prisma.order.findMany({ where, include: { items: true, waiter: true }, orderBy: { createdAt: 'asc' } })
    const rows = orders.map(o => ({
      '№ заказа': o.number, 'Дата': new Date(o.createdAt).toLocaleString('ru-RU'),
      'Официант': o.waiterName || '—', 'Стол': o.tableNumber || '—',
      'Статус': o.status, 'Оплата': o.paymentType === 'CASH' ? 'Наличные' : 'Карта',
      'Позиции': o.items.map(i => `${i.name} x${i.quantity}`).join('; '), 'Сумма (TMT)': o.total
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

app.get('/health', (req, res) => res.json({ ok: true }))

// ─── ACCOUNTING AUTH ──────────────────────────────────────────
app.post('/api/accounting/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await prisma.accountingUser.findFirst({ where: { username } })
    if (!user || user.password !== password) return res.status(401).json({ error: 'Неверный логин или пароль' })
    res.json({ ok: true, username: user.username })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/accounting/setup', async (req, res) => {
  try {
    const { username, password, setupKey } = req.body
    if (setupKey !== (process.env.SETUP_KEY || 'hoslounge2024')) return res.status(403).json({ error: 'Неверный ключ' })
    const existing = await prisma.accountingUser.findFirst({ where: { username } })
    if (existing) {
      await prisma.accountingUser.update({ where: { id: existing.id }, data: { password } })
    } else {
      await prisma.accountingUser.create({ data: { username, password } })
    }
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── EXPENSES ─────────────────────────────────────────────────
app.get('/api/expenses', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = {}
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to + 'T23:59:59')
    }
    res.json(await prisma.expense.findMany({ where, orderBy: { date: 'desc' } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body
    res.json(await prisma.expense.create({ data: { amount: parseFloat(amount), category, description, date: date ? new Date(date) : new Date() } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try { await prisma.expense.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── DEBTS ────────────────────────────────────────────────────
app.get('/api/debts', async (req, res) => {
  try { res.json(await prisma.debt.findMany({ orderBy: { createdAt: 'desc' } })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/debts', async (req, res) => {
  try {
    const { clientName, phone, amount, description } = req.body
    res.json(await prisma.debt.create({ data: { clientName, phone, amount: parseFloat(amount), description } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/debts/:id/pay', async (req, res) => {
  try {
    res.json(await prisma.debt.update({ where: { id: Number(req.params.id) }, data: { status: 'PAID', paidAt: new Date() } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/debts/:id', async (req, res) => {
  try { await prisma.debt.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── REVISIONS ────────────────────────────────────────────────
app.get('/api/revisions', async (req, res) => {
  try { res.json(await prisma.revision.findMany({ orderBy: { date: 'desc' }, take: 50 })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/revisions', async (req, res) => {
  try {
    const { cashIn, cashOut, cardTotal, expenses, notes, createdBy, date } = req.body
    res.json(await prisma.revision.create({ data: { cashIn: parseFloat(cashIn||0), cashOut: parseFloat(cashOut||0), cardTotal: parseFloat(cardTotal||0), expenses: parseFloat(expenses||0), notes, createdBy, date: date ? new Date(date) : new Date() } }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/revisions/:id', async (req, res) => {
  try { await prisma.revision.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── ACCOUNTING SUMMARY ───────────────────────────────────────
app.get('/api/accounting/full-summary', async (req, res) => {
  try {
    const { from, to } = req.query
    const dateFilter = {}
    if (from || to) {
      dateFilter.gte = from ? new Date(from) : undefined
      dateFilter.lte = to ? new Date(to + 'T23:59:59') : undefined
    }

    const [orders, expenses, debts] = await Promise.all([
      prisma.order.findMany({ where: { status: 'PAID', ...(from||to ? { createdAt: dateFilter } : {}) }, include: { items: true } }),
      prisma.expense.findMany({ where: from||to ? { date: dateFilter } : {} }),
      prisma.debt.findMany({ where: { status: 'UNPAID' } })
    ])

    const revenue = orders.reduce((s, o) => s + o.total, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const totalDebts = debts.reduce((s, d) => s + d.amount, 0)
    const profit = revenue - totalExpenses
    const byCash = orders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + o.total, 0)
    const byCard = orders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + o.total, 0)

    const expenseByCategory = {}
    for (const e of expenses) {
      if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0
      expenseByCategory[e.category] += e.amount
    }

    const byDay = {}
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0, cash: 0, card: 0 }
      byDay[day].revenue += o.total
      byDay[day].orders += 1
      if (o.paymentType === 'CASH') byDay[day].cash += o.total
      else byDay[day].card += o.total
    }

    res.json({
      revenue, totalExpenses, profit, byCash, byCard,
      totalOrders: orders.length,
      avgCheck: orders.length > 0 ? revenue / orders.length : 0,
      totalDebts, debtCount: debts.length,
      expenseByCategory,
      byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

const waiterPath = join(__dirname, '..', 'public-waiter')
app.use('/waiter', express.static(waiterPath))
app.get('/waiter/*', (req, res) => res.sendFile(join(waiterPath, 'index.html')))
app.get('*', (req, res) => res.sendFile(join(publicPath, 'index.html')))

const PORT = process.env.PORT || 3001

// ─── MANAGER ──────────────────────────────────────────────────

// Авторизация управляющего
app.post('/api/manager/login', async (req, res) => {
  try {
    const { password } = req.body
    const managerPass = process.env.MANAGER_PASSWORD || 'manager2024'
    if (password !== managerPass) return res.status(401).json({ error: 'Неверный пароль' })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Дашборд управляющего — всё в одном запросе
app.get('/api/manager/dashboard', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayOrders, openOrders, waiters, allTodayOrders] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'PAID', createdAt: { gte: today } },
        include: { items: true, waiter: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { status: { in: ['OPEN', 'PENDING'] } },
        include: { items: true, waiter: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.waiter.findMany({ where: { active: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: today } },
        include: { items: true, waiter: true }
      })
    ])

    // Выручка сегодня
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0)
    const orderCount = todayOrders.length
    const avgCheck = orderCount > 0 ? revenue / orderCount : 0
    const byCash = todayOrders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + o.total, 0)
    const byCard = todayOrders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + o.total, 0)

    // Рейтинг официантов за сегодня
    const waiterStats = {}
    for (const o of todayOrders) {
      if (!o.waiterId) continue
      const id = o.waiterId
      if (!waiterStats[id]) waiterStats[id] = { id, name: o.waiterName || 'Неизвестно', revenue: 0, orders: 0, items: {} }
      waiterStats[id].revenue += o.total
      waiterStats[id].orders += 1
      for (const item of o.items) {
        waiterStats[id].items[item.name] = (waiterStats[id].items[item.name] || 0) + item.quantity
      }
    }
    const waiterRating = Object.values(waiterStats).map(w => ({
      ...w,
      avgCheck: w.orders > 0 ? w.revenue / w.orders : 0,
      topItem: Object.entries(w.items).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    })).sort((a, b) => b.revenue - a.revenue)

    // Аналитика по часам (сегодня)
    const byHour = {}
    for (let h = 0; h < 24; h++) byHour[h] = { hour: h, orders: 0, revenue: 0 }
    for (const o of allTodayOrders.filter(o => o.status === 'PAID')) {
      const h = new Date(o.createdAt).getHours()
      byHour[h].orders += 1
      byHour[h].revenue += o.total
    }

    // Активные столы
    const activeTables = openOrders.map(o => ({
      ...o,
      minutesOpen: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
    }))

    // Предупреждения
    const alerts = []
    for (const t of activeTables) {
      if (t.minutesOpen > 120) alerts.push({ type: 'long_table', message: `Стол ${t.tableNumber} открыт уже ${Math.floor(t.minutesOpen / 60)}ч ${t.minutesOpen % 60}м`, orderId: t.id })
    }
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayRevenue = (await prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: yesterday, lt: today } } })).reduce((s, o) => s + o.total, 0)
    if (yesterdayRevenue > 0 && revenue < yesterdayRevenue * 0.7) {
      alerts.push({ type: 'low_revenue', message: `Выручка на ${Math.round((1 - revenue / yesterdayRevenue) * 100)}% ниже вчерашней` })
    }

    // Топ позиций сегодня
    const itemMap = {}
    for (const o of todayOrders) for (const i of o.items) {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
      itemMap[i.name].qty += i.quantity
      itemMap[i.name].revenue += i.price * i.quantity
    }
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    res.json({
      revenue, orderCount, avgCheck, byCash, byCard,
      openCount: openOrders.filter(o => o.status === 'OPEN').length,
      pendingCount: openOrders.filter(o => o.status === 'PENDING').length,
      waiterRating,
      byHour: Object.values(byHour).filter(h => h.hour >= 8 && h.hour <= 23),
      activeTables,
      recentOrders: todayOrders.slice(0, 20),
      alerts,
      topItems,
      totalWaiters: waiters.length
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// История чеков для управляющего с фильтрами
app.get('/api/manager/orders', async (req, res) => {
  try {
    const { from, to, waiterId, limit = 100 } = req.query
    const where = { status: 'PAID' }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }
    if (waiterId) where.waiterId = Number(waiterId)
    res.json(await prisma.order.findMany({ where, include: { items: true, waiter: true }, orderBy: { createdAt: 'desc' }, take: Number(limit) }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Рейтинг официантов за период
app.get('/api/manager/waiter-stats', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = { status: 'PAID' }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59')
    }
    const orders = await prisma.order.findMany({ where, include: { items: true } })
    const stats = {}
    for (const o of orders) {
      if (!o.waiterId) continue
      const id = o.waiterId
      if (!stats[id]) stats[id] = { id, name: o.waiterName || '—', revenue: 0, orders: 0, items: {} }
      stats[id].revenue += o.total
      stats[id].orders += 1
      for (const item of o.items) stats[id].items[item.name] = (stats[id].items[item.name] || 0) + item.quantity
    }
    res.json(Object.values(stats).map(w => ({
      ...w,
      avgCheck: w.orders > 0 ? w.revenue / w.orders : 0,
      topItem: Object.entries(w.items).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
      items: undefined
    })).sort((a, b) => b.revenue - a.revenue))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── STATIC & CATCH-ALL (must be last) ───────────────────────
const waiterPath = join(__dirname, '..', 'public-waiter')
app.use('/waiter', express.static(waiterPath))
app.get('/waiter/*', (req, res) => res.sendFile(join(waiterPath, 'index.html')))
app.get('*', (req, res) => res.sendFile(join(publicPath, 'index.html')))

const PORT = process.env.PORT || 3001
connectWithRetry()
  .then(() => httpServer.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`)))
  .catch(err => { console.error('❌ DB failed:', err.message); process.exit(1) })
