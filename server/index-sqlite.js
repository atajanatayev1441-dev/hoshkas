import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { all, get, run, saveDb } from './db.js'
const app = express()
const httpServer = createServer(app)

const wss = new WebSocketServer({ server: httpServer })
const clients = new Set()
wss.on('connection', ws => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
})
function broadcast(event, data) {
  const msg = JSON.stringify({ event, data })
  for (const c of clients) if (c.readyState === 1) c.send(msg)
}

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5174', 'http://localhost:4173']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())

// CATEGORIES
app.get('/api/categories', (req, res) => {
  try {
    const cats = all('SELECT * FROM categories ORDER BY id')
    for (const c of cats) c.items = all('SELECT * FROM items WHERE categoryId=? AND active=1', [c.id])
    res.json(cats)
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/categories', (req, res) => {
  try {
    const r = run('INSERT INTO categories (name) VALUES (?)', [req.body.name])
    res.json({ id: r.lastInsertRowid, name: req.body.name })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/categories/:id', (req, res) => {
  try {
    run('DELETE FROM categories WHERE id=?', [Number(req.params.id)])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ITEMS
app.get('/api/items', (req, res) => {
  try {
    const items = all('SELECT i.*, c.name as categoryName FROM items i LEFT JOIN categories c ON c.id=i.categoryId ORDER BY i.id')
    res.json(items.map(i => ({ ...i, active: !!i.active, category: { id: i.categoryId, name: i.categoryName } })))
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/items', (req, res) => {
  try {
    const { name, price, categoryId } = req.body
    const r = run('INSERT INTO items (name,price,categoryId) VALUES (?,?,?)', [name, parseFloat(price), Number(categoryId)])
    res.json({ id: r.lastInsertRowid, name, price, categoryId })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/items/:id', (req, res) => {
  try {
    const { name, price, categoryId, active } = req.body
    run('UPDATE items SET name=?,price=?,categoryId=?,active=? WHERE id=?', [name, parseFloat(price), Number(categoryId), active ? 1 : 0, Number(req.params.id)])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/items/:id', (req, res) => {
  try {
    run('UPDATE items SET active=0 WHERE id=?', [Number(req.params.id)])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// WAITERS
app.get('/api/waiters', (req, res) => {
  try { res.json(all('SELECT * FROM waiters WHERE active=1 ORDER BY name')) }
  catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/waiters', (req, res) => {
  try {
    const r = run('INSERT INTO waiters (name,pin) VALUES (?,?)', [req.body.name, req.body.pin])
    res.json({ id: r.lastInsertRowid, ...req.body })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/waiters/login', (req, res) => {
  try {
    const w = get('SELECT * FROM waiters WHERE pin=? AND active=1', [req.body.pin])
    if (!w) return res.status(401).json({ error: 'Неверный PIN' })
    res.json(w)
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/waiters/:id', (req, res) => {
  try {
    const { name, pin, active } = req.body
    run('UPDATE waiters SET name=?,pin=?,active=? WHERE id=?', [name, pin, active ? 1 : 0, Number(req.params.id)])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/waiters/:id', (req, res) => {
  try {
    run('UPDATE waiters SET active=0 WHERE id=?', [Number(req.params.id)])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ORDERS
function nextNumber() {
  const r = get('SELECT MAX(number) as n FROM orders')
  return (r?.n ?? 0) + 1
}
function orderWithItems(id) {
  const o = get('SELECT * FROM orders WHERE id=?', [id])
  if (!o) return null
  o.items = all('SELECT * FROM order_items WHERE orderId=?', [id])
  o.waiter = o.waiterId ? get('SELECT * FROM waiters WHERE id=?', [o.waiterId]) : null
  return o
}

app.get('/api/orders/pending', (req, res) => {
  try {
    const orders = all("SELECT * FROM orders WHERE status='PENDING' ORDER BY createdAt ASC")
    res.json(orders.map(o => orderWithItems(o.id)))
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.get('/api/orders', (req, res) => {
  try {
    const { status, from, to, limit = 200 } = req.query
    let sql = 'SELECT * FROM orders WHERE 1=1'
    const params = []
    if (status) { sql += ' AND status=?'; params.push(status) }
    if (from) { sql += ' AND createdAt>=?'; params.push(from) }
    if (to) { sql += ' AND createdAt<=?'; params.push(to + 'T23:59:59') }
    sql += ' ORDER BY createdAt DESC LIMIT ?'
    params.push(Number(limit))
    res.json(all(sql, params).map(o => orderWithItems(o.id)))
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/orders', (req, res) => {
  try {
    const { tableNumber, comment, items, waiterId, waiterName } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const r = run('INSERT INTO orders (number,tableNumber,comment,total,status,waiterId,waiterName) VALUES (?,?,?,?,?,?,?)',
      [nextNumber(), tableNumber, comment, total, 'PENDING', waiterId || null, waiterName || null])
    for (const i of items) run('INSERT INTO order_items (orderId,itemId,quantity,price,name) VALUES (?,?,?,?,?)', [r.lastInsertRowid, i.itemId, i.quantity, i.price, i.name])
    const order = orderWithItems(r.lastInsertRowid)
    broadcast('new_order', order)
    res.json(order)
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/orders/direct', (req, res) => {
  try {
    const { tableNumber, comment, items, paymentType } = req.body
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const now = new Date().toISOString()
    const r = run('INSERT INTO orders (number,tableNumber,comment,total,status,paymentType,closedAt) VALUES (?,?,?,?,?,?,?)',
      [nextNumber(), tableNumber, comment, total, 'PAID', paymentType || 'CASH', now])
    for (const i of items) run('INSERT INTO order_items (orderId,itemId,quantity,price,name) VALUES (?,?,?,?,?)', [r.lastInsertRowid, i.itemId, i.quantity, i.price, i.name])
    res.json(orderWithItems(r.lastInsertRowid))
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/orders/:id/accept', (req, res) => {
  try {
    run("UPDATE orders SET status='PAID',paymentType=?,closedAt=? WHERE id=?", [req.body.paymentType || 'CASH', new Date().toISOString(), Number(req.params.id)])
    const order = orderWithItems(Number(req.params.id))
    broadcast('order_accepted', order)
    res.json(order)
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/orders/:id/cancel', (req, res) => {
  try {
    run("UPDATE orders SET status='CANCELLED' WHERE id=?", [Number(req.params.id)])
    const order = orderWithItems(Number(req.params.id))
    broadcast('order_cancelled', order)
    res.json(order)
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ANALYTICS
app.get('/api/analytics/summary', (req, res) => {
  try {
    const { from, to } = req.query
    let sql = "SELECT * FROM orders WHERE status='PAID'"
    const params = []
    if (from) { sql += ' AND createdAt>=?'; params.push(from) }
    if (to) { sql += ' AND createdAt<=?'; params.push(to + 'T23:59:59') }
    const orders = all(sql, params)
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders = orders.length
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const itemMap = {}
    for (const o of orders) {
      for (const i of all('SELECT * FROM order_items WHERE orderId=?', [o.id])) {
        if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
        itemMap[i.name].qty += i.quantity
        itemMap[i.name].revenue += i.price * i.quantity
      }
    }
    const byDay = {}
    for (const o of orders) {
      const day = o.createdAt.slice(0, 10)
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0 }
      byDay[day].revenue += o.total
      byDay[day].orders += 1
    }
    const byCash = orders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + o.total, 0)
    const byCard = orders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + o.total, 0)
    res.json({ totalRevenue, totalOrders, avgCheck, topItems: Object.values(itemMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10), byDay: Object.values(byDay).sort((a,b)=>a.date.localeCompare(b.date)), byCash, byCard })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.get('/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log('================================')
  console.log('   HOS LOUNGE — Сервер запущен!')
  console.log('================================')
  console.log(`Порт: ${PORT}`)
  console.log('================================')
})
