// Упрощённый сервер для десктопа — использует SQLite напрямую без Prisma
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })
const PORT = process.env.PORT || 3721

// БД — в папке данных пользователя
const DB_PATH = process.env.DB_PATH || join(__dirname, 'hoslounge.db')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Инициализация схемы
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CASHIER',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  categoryId INTEGER REFERENCES categories(id),
  active INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  description TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER,
  tableNumber TEXT,
  status TEXT DEFAULT 'PENDING',
  paymentType TEXT DEFAULT 'CASH',
  total REAL DEFAULT 0,
  comment TEXT,
  cashierName TEXT,
  waiterId INTEGER,
  shiftId INTEGER,
  createdAt TEXT DEFAULT (datetime('now')),
  closedAt TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  itemId INTEGER REFERENCES items(id),
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cashierName TEXT,
  status TEXT DEFAULT 'OPEN',
  openCash REAL DEFAULT 0,
  closeCash REAL DEFAULT 0,
  totalCash REAL DEFAULT 0,
  totalCard REAL DEFAULT 0,
  totalOrders INTEGER DEFAULT 0,
  openedAt TEXT DEFAULT (datetime('now')),
  closedAt TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'шт',
  costPrice REAL DEFAULT 0,
  currentStock REAL DEFAULT 0,
  minStock REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientName TEXT NOT NULL,
  phone TEXT,
  amount REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'UNPAID',
  createdAt TEXT DEFAULT (datetime('now')),
  paidAt TEXT
);
`)

// WebSocket broadcast
function broadcast(event, data) {
  const msg = JSON.stringify({ event, data })
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg) })
}

app.use(cors())
app.use(express.json())

// Static files
const publicPath = process.env.PUBLIC_PATH || join(__dirname, '..', 'public')
app.use(express.static(publicPath))

// Health check
app.get('/health', (req, res) => res.json({ ok: true }))

// ─── AUTH ──────────────────────────────────────────────────────
app.get('/api/auth/status', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get()
  res.json({ initialized: count.c > 0 })
})

app.post('/api/auth/init', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get()
  if (count.c > 0) return res.status(403).json({ error: 'Уже инициализировано' })
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Нужен пароль' })
  const user = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?,?,?,?) RETURNING *')
    .get('admin', password, 'Администратор', 'ADMIN')
  res.json({ ok: true, user })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(username)
  if (!user || user.password !== password) return res.status(401).json({ error: 'Неверный логин или пароль' })
  res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})

app.get('/api/auth/users', (req, res) => {
  res.json(db.prepare('SELECT id,username,name,role,active,createdAt FROM users ORDER BY id').all())
})

app.post('/api/auth/users', (req, res) => {
  const { username, password, name, role } = req.body
  if (!username || !password || !name || !role) return res.status(400).json({ error: 'Все поля обязательны' })
  try {
    const u = db.prepare('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?) RETURNING *').get(username, password, name, role)
    res.json({ ok: true, user: u })
  } catch(e) { res.status(400).json({ error: 'Пользователь уже существует' }) }
})

app.put('/api/auth/users/:id', (req, res) => {
  const { password, name, role, active } = req.body
  const fields = []
  const vals = []
  if (name !== undefined) { fields.push('name=?'); vals.push(name) }
  if (role !== undefined) { fields.push('role=?'); vals.push(role) }
  if (active !== undefined) { fields.push('active=?'); vals.push(active ? 1 : 0) }
  if (password) { fields.push('password=?'); vals.push(password) }
  if (!fields.length) return res.json({ ok: true })
  vals.push(Number(req.params.id))
  db.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).run(...vals)
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.params.id))
  res.json({ ok: true, user: u })
})

app.delete('/api/auth/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(Number(req.params.id))
  res.json({ ok: true })
})

// ─── CATEGORIES & MENU ────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  const cats = db.prepare('SELECT * FROM categories WHERE active=1 ORDER BY sortOrder,id').all()
  cats.forEach(c => { c.items = db.prepare('SELECT * FROM items WHERE categoryId=? AND active=1 ORDER BY sortOrder,id').all(c.id) })
  res.json(cats)
})

app.post('/api/categories', (req, res) => {
  const { name } = req.body
  const cat = db.prepare('INSERT INTO categories (name) VALUES (?) RETURNING *').get(name)
  res.json(cat)
})

app.put('/api/categories/:id', (req, res) => {
  const { name, active } = req.body
  db.prepare('UPDATE categories SET name=COALESCE(?,name), active=COALESCE(?,active) WHERE id=?').run(name, active !== undefined ? (active ? 1 : 0) : null, Number(req.params.id))
  res.json(db.prepare('SELECT * FROM categories WHERE id=?').get(Number(req.params.id)))
})

app.get('/api/items', (req, res) => res.json(db.prepare('SELECT * FROM items WHERE active=1').all()))

app.post('/api/items', (req, res) => {
  const { name, price, categoryId } = req.body
  const item = db.prepare('INSERT INTO items (name,price,categoryId) VALUES (?,?,?) RETURNING *').get(name, price, categoryId)
  res.json(item)
})

app.put('/api/items/:id', (req, res) => {
  const { name, price, active } = req.body
  db.prepare('UPDATE items SET name=COALESCE(?,name), price=COALESCE(?,price), active=COALESCE(?,active) WHERE id=?')
    .run(name, price, active !== undefined ? (active ? 1 : 0) : null, Number(req.params.id))
  res.json(db.prepare('SELECT * FROM items WHERE id=?').get(Number(req.params.id)))
})

// ─── ORDERS ───────────────────────────────────────────────────
let orderCounter = null
function getNextOrderNumber() {
  const last = db.prepare('SELECT MAX(number) as n FROM orders').get()
  return (last.n || 0) + 1
}

app.get('/api/orders', (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE status NOT IN ('PAID','CANCELLED') ORDER BY createdAt DESC").all()
  orders.forEach(o => { o.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(o.id) })
  res.json(orders)
})

app.get('/api/orders/recent', (req, res) => {
  const limit = Number(req.query.limit) || 50
  const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC LIMIT ?').all(limit)
  orders.forEach(o => { o.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(o.id) })
  res.json(orders)
})

app.post('/api/orders', (req, res) => {
  const { tableNumber, items, waiterId, comment } = req.body
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const number = getNextOrderNumber()
  const order = db.prepare('INSERT INTO orders (number,tableNumber,total,waiterId,comment) VALUES (?,?,?,?,?) RETURNING *')
    .get(number, tableNumber, total, waiterId, comment)
  items.forEach(i => db.prepare('INSERT INTO order_items (orderId,itemId,name,price,quantity) VALUES (?,?,?,?,?)').run(order.id, i.itemId, i.name, i.price, i.quantity))
  order.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(order.id)
  broadcast('new_order', order)
  res.json(order)
})

app.put('/api/orders/:id/accept', (req, res) => {
  const { paymentType, cashierName } = req.body
  db.prepare("UPDATE orders SET status='PAID', paymentType=?, cashierName=?, closedAt=datetime('now') WHERE id=?")
    .run(paymentType || 'CASH', cashierName || '', Number(req.params.id))
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id))
  order.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(order.id)
  // Обновляем смену
  try {
    const shift = db.prepare("SELECT * FROM shifts WHERE status='OPEN' ORDER BY openedAt DESC LIMIT 1").get()
    if (shift) {
      const shiftOrders = db.prepare("SELECT * FROM orders WHERE status='PAID' AND createdAt>=?").all(shift.openedAt)
      const totalCash = shiftOrders.filter(o=>o.paymentType==='CASH').reduce((s,o)=>s+o.total,0)
      const totalCard = shiftOrders.filter(o=>o.paymentType==='CARD').reduce((s,o)=>s+o.total,0)
      db.prepare('UPDATE shifts SET totalCash=?,totalCard=?,totalOrders=? WHERE id=?').run(totalCash, totalCard, shiftOrders.length, shift.id)
    }
  } catch(e) {}
  broadcast('order_accepted', order)
  res.json(order)
})

app.post('/api/orders/direct', (req, res) => {
  const { tableNumber, comment, items, paymentType, cashierName } = req.body
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const number = getNextOrderNumber()
  const order = db.prepare("INSERT INTO orders (number,tableNumber,total,paymentType,cashierName,status,closedAt) VALUES (?,?,?,?,?,'PAID',datetime('now')) RETURNING *")
    .get(number, tableNumber || '', total, paymentType || 'CASH', cashierName || '')
  items.forEach(i => db.prepare('INSERT INTO order_items (orderId,itemId,name,price,quantity) VALUES (?,?,?,?,?)').run(order.id, i.itemId, i.name, i.price, i.quantity))
  order.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(order.id)
  res.json(order)
})

app.put('/api/orders/:id/cancel', (req, res) => {
  db.prepare("UPDATE orders SET status='CANCELLED' WHERE id=?").run(Number(req.params.id))
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id))
  order.items = db.prepare('SELECT * FROM order_items WHERE orderId=?').all(order.id)
  broadcast('order_cancelled', order)
  res.json(order)
})

// ─── SHIFTS ───────────────────────────────────────────────────
app.get('/api/shifts/current', (req, res) => {
  const shift = db.prepare("SELECT * FROM shifts WHERE status='OPEN' ORDER BY openedAt DESC LIMIT 1").get()
  res.json(shift || null)
})

app.get('/api/shifts', (req, res) => {
  res.json(db.prepare('SELECT * FROM shifts ORDER BY openedAt DESC LIMIT 20').all())
})

app.post('/api/shifts/open', (req, res) => {
  const { cashierName, openCash } = req.body
  const existing = db.prepare("SELECT * FROM shifts WHERE status='OPEN'").get()
  if (existing) return res.status(400).json({ error: 'Смена уже открыта' })
  const shift = db.prepare('INSERT INTO shifts (cashierName,openCash) VALUES (?,?) RETURNING *').get(cashierName || '', openCash || 0)
  res.json(shift)
})

app.post('/api/shifts/:id/close', (req, res) => {
  const { closeCash } = req.body
  db.prepare("UPDATE shifts SET status='CLOSED', closeCash=?, closedAt=datetime('now') WHERE id=?").run(closeCash || 0, Number(req.params.id))
  res.json(db.prepare('SELECT * FROM shifts WHERE id=?').get(Number(req.params.id)))
})

// ─── EXPENSES ─────────────────────────────────────────────────
app.get('/api/expenses', (req, res) => {
  const { from, to } = req.query
  let q = 'SELECT * FROM expenses WHERE 1=1'
  const params = []
  if (from) { q += ' AND date>=?'; params.push(from) }
  if (to) { q += ' AND date<?'; params.push(to + 'T23:59:59') }
  q += ' ORDER BY date DESC'
  res.json(db.prepare(q).all(...params))
})

app.post('/api/expenses', (req, res) => {
  const { amount, category, description, date } = req.body
  const exp = db.prepare('INSERT INTO expenses (amount,category,description,date) VALUES (?,?,?,?) RETURNING *')
    .get(parseFloat(amount), category, description, date || new Date().toISOString())
  res.json(exp)
})

app.delete('/api/expenses/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id=?').run(Number(req.params.id))
  res.json({ ok: true })
})

// ─── STOCK ────────────────────────────────────────────────────
app.get('/api/warehouse/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM stock_products WHERE active=1 ORDER BY name').all())
})

app.post('/api/warehouse/products', (req, res) => {
  const { name, unit, costPrice, currentStock, minStock } = req.body
  const p = db.prepare('INSERT INTO stock_products (name,unit,costPrice,currentStock,minStock) VALUES (?,?,?,?,?) RETURNING *')
    .get(name, unit || 'шт', costPrice || 0, currentStock || 0, minStock || 0)
  res.json(p)
})

app.put('/api/warehouse/products/:id', (req, res) => {
  const { name, unit, costPrice, currentStock, minStock } = req.body
  db.prepare('UPDATE stock_products SET name=COALESCE(?,name),unit=COALESCE(?,unit),costPrice=COALESCE(?,costPrice),currentStock=COALESCE(?,currentStock),minStock=COALESCE(?,minStock) WHERE id=?')
    .run(name, unit, costPrice, currentStock, minStock, Number(req.params.id))
  res.json(db.prepare('SELECT * FROM stock_products WHERE id=?').get(Number(req.params.id)))
})

// ─── DEBTS ────────────────────────────────────────────────────
app.get('/api/debts', (req, res) => res.json(db.prepare('SELECT * FROM debts ORDER BY createdAt DESC').all()))

app.post('/api/debts', (req, res) => {
  const { clientName, phone, amount, description } = req.body
  const d = db.prepare('INSERT INTO debts (clientName,phone,amount,description) VALUES (?,?,?,?) RETURNING *')
    .get(clientName, phone, parseFloat(amount), description)
  res.json(d)
})

app.put('/api/debts/:id', (req, res) => {
  const { status } = req.body
  db.prepare("UPDATE debts SET status=?, paidAt=CASE WHEN ?='PAID' THEN datetime('now') ELSE NULL END WHERE id=?").run(status, status, Number(req.params.id))
  res.json(db.prepare('SELECT * FROM debts WHERE id=?').get(Number(req.params.id)))
})

// ─── ACCOUNTING SUMMARY ───────────────────────────────────────
app.get('/api/accounting/full-summary', (req, res) => {
  const { from, to } = req.query
  let whereOrder = "WHERE status='PAID'"
  let whereExp = 'WHERE 1=1'
  const params = []
  const expParams = []
  if (from) { whereOrder += ' AND closedAt>=?'; params.push(from); whereExp += ' AND date>=?'; expParams.push(from) }
  if (to) { whereOrder += ' AND closedAt<=?'; params.push(to+'T23:59:59'); whereExp += ' AND date<=?'; expParams.push(to+'T23:59:59') }

  const orders = db.prepare(`SELECT * FROM orders ${whereOrder}`).all(...params)
  const expenses = db.prepare(`SELECT * FROM expenses ${whereExp}`).all(...expParams)

  const revenue = orders.reduce((s,o)=>s+o.total,0)
  const byCash = orders.filter(o=>o.paymentType==='CASH').reduce((s,o)=>s+o.total,0)
  const byCard = orders.filter(o=>o.paymentType==='CARD').reduce((s,o)=>s+o.total,0)
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0)

  res.json({ revenue, byCash, byCard, totalOrders: orders.length, totalExpenses, profit: revenue - totalExpenses })
})

// Динамика по месяцам
app.get('/api/analytics/monthly', (req, res) => {
  const year = req.query.year || new Date().getFullYear()
  const rows = db.prepare(`
    SELECT strftime('%m', closedAt) as month, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status='PAID' AND strftime('%Y', closedAt)=?
    GROUP BY month ORDER BY month
  `).all(String(year))
  res.json(rows)
})

// ─── CATCH ALL → index.html ───────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'))
})

// WebSocket
wss.on('connection', ws => {
  ws.on('message', msg => { try { const d = JSON.parse(msg); if (d.type === 'ping') ws.send(JSON.stringify({ type: 'pong' })) } catch {} })
})

httpServer.listen(PORT, () => console.log(`HOS LOUNGE server on port ${PORT}`))
