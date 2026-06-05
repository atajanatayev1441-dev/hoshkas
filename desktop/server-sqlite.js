import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const initSqlJs = require('sql.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })
const PORT = process.env.PORT || 3721

const DB_PATH = process.env.DB_PATH || join(__dirname, 'hoslounge.db')
const PUBLIC_PATH = process.env.PUBLIC_PATH || join(__dirname, '..', 'public')

// Убедимся что папка БД существует
const dbDir = dirname(DB_PATH)
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

let db
let SQL

async function initDB() {
  SQL = await initSqlJs()
  
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`PRAGMA foreign_keys = ON`)

  db.run(`
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
      shiftId INTEGER,
      createdAt TEXT DEFAULT (datetime('now')),
      closedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      itemId INTEGER,
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
  saveDB()
}

// Сохраняем БД на диск после каждой записи
function saveDB() {
  try {
    const data = db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  } catch(e) { console.error('DB save error:', e.message) }
}

// Хелперы
function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  } catch(e) { console.error('SQL error:', sql, e.message); return [] }
}

function get(sql, params = []) {
  const rows = all(sql, params)
  return rows[0] || null
}

function run(sql, params = []) {
  try {
    db.run(sql, params)
    saveDB()
    return { lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] }
  } catch(e) { console.error('SQL run error:', sql, e.message); throw e }
}

function insert(sql, params = []) {
  db.run(sql, params)
  const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0]
  saveDB()
  return id
}

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data })
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg) })
}

function getNextOrderNumber() {
  const row = get('SELECT MAX(number) as n FROM orders')
  return (row?.n || 0) + 1
}

app.use(cors())
app.use(express.json())
app.use(express.static(PUBLIC_PATH))
app.get('/health', (req, res) => res.json({ ok: true }))

// ─── AUTH ──────────────────────────────────────────────────────
app.get('/api/auth/status', (req, res) => {
  const row = get('SELECT COUNT(*) as c FROM users')
  res.json({ initialized: row.c > 0 })
})

app.post('/api/auth/init', (req, res) => {
  const row = get('SELECT COUNT(*) as c FROM users')
  if (row.c > 0) return res.status(403).json({ error: 'Уже инициализировано' })
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Нужен пароль' })
  const id = insert('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)', ['admin', password, 'Администратор', 'ADMIN'])
  res.json({ ok: true, user: { id, username: 'admin', name: 'Администратор', role: 'ADMIN' } })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const user = get('SELECT * FROM users WHERE username=? AND active=1', [username])
  if (!user || user.password !== password) return res.status(401).json({ error: 'Неверный логин или пароль' })
  res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})

app.get('/api/auth/users', (req, res) => {
  res.json(all('SELECT id,username,name,role,active,createdAt FROM users ORDER BY id'))
})

app.post('/api/auth/users', (req, res) => {
  const { username, password, name, role } = req.body
  if (!username || !password || !name || !role) return res.status(400).json({ error: 'Все поля обязательны' })
  try {
    const id = insert('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)', [username, password, name, role])
    res.json({ ok: true, user: { id, username, name, role } })
  } catch(e) { res.status(400).json({ error: 'Пользователь уже существует' }) }
})

app.put('/api/auth/users/:id', (req, res) => {
  const { password, name, role, active } = req.body
  if (name !== undefined) run('UPDATE users SET name=? WHERE id=?', [name, Number(req.params.id)])
  if (role !== undefined) run('UPDATE users SET role=? WHERE id=?', [role, Number(req.params.id)])
  if (active !== undefined) run('UPDATE users SET active=? WHERE id=?', [active ? 1 : 0, Number(req.params.id)])
  if (password) run('UPDATE users SET password=? WHERE id=?', [password, Number(req.params.id)])
  res.json({ ok: true, user: get('SELECT * FROM users WHERE id=?', [Number(req.params.id)]) })
})

app.delete('/api/auth/users/:id', (req, res) => {
  run('DELETE FROM users WHERE id=?', [Number(req.params.id)])
  res.json({ ok: true })
})

// ─── CATEGORIES & MENU ────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  const cats = all('SELECT * FROM categories WHERE active=1 ORDER BY sortOrder,id')
  cats.forEach(c => { c.items = all('SELECT * FROM items WHERE categoryId=? AND active=1 ORDER BY sortOrder,id', [c.id]) })
  res.json(cats)
})

app.post('/api/categories', (req, res) => {
  const { name } = req.body
  const id = insert('INSERT INTO categories (name) VALUES (?)', [name])
  res.json(get('SELECT * FROM categories WHERE id=?', [id]))
})

app.put('/api/categories/:id', (req, res) => {
  const { name, active } = req.body
  if (name) run('UPDATE categories SET name=? WHERE id=?', [name, Number(req.params.id)])
  if (active !== undefined) run('UPDATE categories SET active=? WHERE id=?', [active ? 1 : 0, Number(req.params.id)])
  res.json(get('SELECT * FROM categories WHERE id=?', [Number(req.params.id)]))
})

app.delete('/api/categories/:id', (req, res) => {
  run('UPDATE categories SET active=0 WHERE id=?', [Number(req.params.id)])
  res.json({ ok: true })
})

app.get('/api/items', (req, res) => res.json(all('SELECT * FROM items WHERE active=1')))

app.post('/api/items', (req, res) => {
  const { name, price, categoryId } = req.body
  const id = insert('INSERT INTO items (name,price,categoryId) VALUES (?,?,?)', [name, price, categoryId])
  res.json(get('SELECT * FROM items WHERE id=?', [id]))
})

app.put('/api/items/:id', (req, res) => {
  const { name, price, active } = req.body
  if (name) run('UPDATE items SET name=? WHERE id=?', [name, Number(req.params.id)])
  if (price !== undefined) run('UPDATE items SET price=? WHERE id=?', [price, Number(req.params.id)])
  if (active !== undefined) run('UPDATE items SET active=? WHERE id=?', [active ? 1 : 0, Number(req.params.id)])
  res.json(get('SELECT * FROM items WHERE id=?', [Number(req.params.id)]))
})

app.delete('/api/items/:id', (req, res) => {
  run('UPDATE items SET active=0 WHERE id=?', [Number(req.params.id)])
  res.json({ ok: true })
})

// ─── ORDERS ───────────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  const orders = all("SELECT * FROM orders WHERE status NOT IN ('PAID','CANCELLED') ORDER BY createdAt DESC")
  orders.forEach(o => { o.items = all('SELECT * FROM order_items WHERE orderId=?', [o.id]) })
  res.json(orders)
})

app.get('/api/orders/recent', (req, res) => {
  const limit = Number(req.query.limit) || 50
  const orders = all('SELECT * FROM orders ORDER BY createdAt DESC LIMIT ?', [limit])
  orders.forEach(o => { o.items = all('SELECT * FROM order_items WHERE orderId=?', [o.id]) })
  res.json(orders)
})

app.post('/api/orders', (req, res) => {
  const { tableNumber, items, comment } = req.body
  const total = (items || []).reduce((s, i) => s + i.price * i.quantity, 0)
  const number = getNextOrderNumber()
  const id = insert('INSERT INTO orders (number,tableNumber,total,comment) VALUES (?,?,?,?)', [number, tableNumber, total, comment])
  ;(items || []).forEach(i => insert('INSERT INTO order_items (orderId,itemId,name,price,quantity) VALUES (?,?,?,?,?)', [id, i.itemId, i.name, i.price, i.quantity]))
  const order = get('SELECT * FROM orders WHERE id=?', [id])
  order.items = all('SELECT * FROM order_items WHERE orderId=?', [id])
  broadcast('new_order', order)
  res.json(order)
})

app.put('/api/orders/:id/accept', (req, res) => {
  const { paymentType, cashierName } = req.body
  run("UPDATE orders SET status='PAID',paymentType=?,cashierName=?,closedAt=datetime('now') WHERE id=?", [paymentType || 'CASH', cashierName || '', Number(req.params.id)])
  const order = get('SELECT * FROM orders WHERE id=?', [Number(req.params.id)])
  order.items = all('SELECT * FROM order_items WHERE orderId=?', [order.id])
  // Обновляем смену
  const shift = get("SELECT * FROM shifts WHERE status='OPEN' ORDER BY openedAt DESC LIMIT 1")
  if (shift) {
    const shiftOrders = all("SELECT * FROM orders WHERE status='PAID' AND createdAt>=?", [shift.openedAt])
    const totalCash = shiftOrders.filter(o=>o.paymentType==='CASH').reduce((s,o)=>s+o.total,0)
    const totalCard = shiftOrders.filter(o=>o.paymentType==='CARD').reduce((s,o)=>s+o.total,0)
    run('UPDATE shifts SET totalCash=?,totalCard=?,totalOrders=? WHERE id=?', [totalCash, totalCard, shiftOrders.length, shift.id])
  }
  broadcast('order_accepted', order)
  res.json(order)
})

app.post('/api/orders/direct', (req, res) => {
  const { tableNumber, comment, items, paymentType, cashierName } = req.body
  const total = (items || []).reduce((s, i) => s + i.price * i.quantity, 0)
  const number = getNextOrderNumber()
  const id = insert("INSERT INTO orders (number,tableNumber,total,paymentType,cashierName,status,closedAt) VALUES (?,?,?,?,?,'PAID',datetime('now'))", [number, tableNumber || '', total, paymentType || 'CASH', cashierName || ''])
  ;(items || []).forEach(i => insert('INSERT INTO order_items (orderId,itemId,name,price,quantity) VALUES (?,?,?,?,?)', [id, i.itemId, i.name, i.price, i.quantity]))
  const order = get('SELECT * FROM orders WHERE id=?', [id])
  order.items = all('SELECT * FROM order_items WHERE orderId=?', [id])
  res.json(order)
})

app.put('/api/orders/:id/cancel', (req, res) => {
  run("UPDATE orders SET status='CANCELLED' WHERE id=?", [Number(req.params.id)])
  const order = get('SELECT * FROM orders WHERE id=?', [Number(req.params.id)])
  order.items = all('SELECT * FROM order_items WHERE orderId=?', [order.id])
  broadcast('order_cancelled', order)
  res.json(order)
})

app.put('/api/orders/:id/add-items', (req, res) => {
  const { items } = req.body
  let total = get('SELECT total FROM orders WHERE id=?', [Number(req.params.id)])?.total || 0
  ;(items || []).forEach(i => {
    insert('INSERT INTO order_items (orderId,itemId,name,price,quantity) VALUES (?,?,?,?,?)', [Number(req.params.id), i.itemId, i.name, i.price, i.quantity])
    total += i.price * i.quantity
  })
  run('UPDATE orders SET total=? WHERE id=?', [total, Number(req.params.id)])
  const order = get('SELECT * FROM orders WHERE id=?', [Number(req.params.id)])
  order.items = all('SELECT * FROM order_items WHERE orderId=?', [order.id])
  broadcast('order_updated', order)
  res.json(order)
})

// ─── SHIFTS ───────────────────────────────────────────────────
app.get('/api/shifts/current', (req, res) => {
  res.json(get("SELECT * FROM shifts WHERE status='OPEN' ORDER BY openedAt DESC LIMIT 1") || null)
})

app.get('/api/shifts', (req, res) => {
  res.json(all('SELECT * FROM shifts ORDER BY openedAt DESC LIMIT 20'))
})

app.post('/api/shifts/open', (req, res) => {
  const existing = get("SELECT * FROM shifts WHERE status='OPEN'")
  if (existing) return res.status(400).json({ error: 'Смена уже открыта' })
  const { cashierName, openCash } = req.body
  const id = insert('INSERT INTO shifts (cashierName,openCash) VALUES (?,?)', [cashierName || '', openCash || 0])
  res.json(get('SELECT * FROM shifts WHERE id=?', [id]))
})

app.post('/api/shifts/:id/close', (req, res) => {
  const { closeCash } = req.body
  run("UPDATE shifts SET status='CLOSED',closeCash=?,closedAt=datetime('now') WHERE id=?", [closeCash || 0, Number(req.params.id)])
  res.json(get('SELECT * FROM shifts WHERE id=?', [Number(req.params.id)]))
})

// ─── EXPENSES ─────────────────────────────────────────────────
app.get('/api/expenses', (req, res) => {
  const { from, to } = req.query
  let q = 'SELECT * FROM expenses WHERE 1=1'
  const params = []
  if (from) { q += ' AND date>=?'; params.push(from) }
  if (to) { q += ' AND date<=?'; params.push(to + 'T23:59:59') }
  q += ' ORDER BY date DESC'
  res.json(all(q, params))
})

app.post('/api/expenses', (req, res) => {
  const { amount, category, description, date } = req.body
  const id = insert('INSERT INTO expenses (amount,category,description,date) VALUES (?,?,?,?)', [parseFloat(amount), category, description || '', date || new Date().toISOString()])
  res.json(get('SELECT * FROM expenses WHERE id=?', [id]))
})

app.delete('/api/expenses/:id', (req, res) => {
  run('DELETE FROM expenses WHERE id=?', [Number(req.params.id)])
  res.json({ ok: true })
})

// ─── STOCK ────────────────────────────────────────────────────
app.get('/api/warehouse/products', (req, res) => {
  res.json(all('SELECT * FROM stock_products WHERE active=1 ORDER BY name'))
})

app.post('/api/warehouse/products', (req, res) => {
  const { name, unit, costPrice, currentStock, minStock } = req.body
  const id = insert('INSERT INTO stock_products (name,unit,costPrice,currentStock,minStock) VALUES (?,?,?,?,?)', [name, unit || 'шт', costPrice || 0, currentStock || 0, minStock || 0])
  res.json(get('SELECT * FROM stock_products WHERE id=?', [id]))
})

app.put('/api/warehouse/products/:id', (req, res) => {
  const { name, unit, costPrice, currentStock, minStock } = req.body
  if (name) run('UPDATE stock_products SET name=? WHERE id=?', [name, Number(req.params.id)])
  if (unit) run('UPDATE stock_products SET unit=? WHERE id=?', [unit, Number(req.params.id)])
  if (costPrice !== undefined) run('UPDATE stock_products SET costPrice=? WHERE id=?', [costPrice, Number(req.params.id)])
  if (currentStock !== undefined) run('UPDATE stock_products SET currentStock=? WHERE id=?', [currentStock, Number(req.params.id)])
  if (minStock !== undefined) run('UPDATE stock_products SET minStock=? WHERE id=?', [minStock, Number(req.params.id)])
  res.json(get('SELECT * FROM stock_products WHERE id=?', [Number(req.params.id)]))
})

// ─── DEBTS ────────────────────────────────────────────────────
app.get('/api/debts', (req, res) => res.json(all('SELECT * FROM debts ORDER BY createdAt DESC')))

app.post('/api/debts', (req, res) => {
  const { clientName, phone, amount, description } = req.body
  const id = insert('INSERT INTO debts (clientName,phone,amount,description) VALUES (?,?,?,?)', [clientName, phone || '', parseFloat(amount), description || ''])
  res.json(get('SELECT * FROM debts WHERE id=?', [id]))
})

app.put('/api/debts/:id', (req, res) => {
  const { status } = req.body
  if (status === 'PAID') {
    run("UPDATE debts SET status='PAID',paidAt=datetime('now') WHERE id=?", [Number(req.params.id)])
  } else {
    run('UPDATE debts SET status=? WHERE id=?', [status, Number(req.params.id)])
  }
  res.json(get('SELECT * FROM debts WHERE id=?', [Number(req.params.id)]))
})

// ─── ACCOUNTING ───────────────────────────────────────────────
app.get('/api/accounting/full-summary', (req, res) => {
  const { from, to } = req.query
  let wO = "WHERE status='PAID'", wE = 'WHERE 1=1'
  const pO = [], pE = []
  if (from) { wO += ' AND closedAt>=?'; pO.push(from); wE += ' AND date>=?'; pE.push(from) }
  if (to) { wO += ' AND closedAt<=?'; pO.push(to+'T23:59:59'); wE += ' AND date<=?'; pE.push(to+'T23:59:59') }
  const orders = all(`SELECT * FROM orders ${wO}`, pO)
  const expenses = all(`SELECT * FROM expenses ${wE}`, pE)
  const revenue = orders.reduce((s,o)=>s+o.total,0)
  const byCash = orders.filter(o=>o.paymentType==='CASH').reduce((s,o)=>s+o.total,0)
  const byCard = orders.filter(o=>o.paymentType==='CARD').reduce((s,o)=>s+o.total,0)
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0)
  res.json({ revenue, byCash, byCard, totalOrders: orders.length, totalExpenses, profit: revenue-totalExpenses })
})

app.get('/api/orders/by-date', (req, res) => {
  const { from, to } = req.query
  let q = "SELECT * FROM orders WHERE status='PAID'"
  const params = []
  if (from) { q += ' AND closedAt>=?'; params.push(from) }
  if (to) { q += ' AND closedAt<=?'; params.push(to+'T23:59:59') }
  q += ' ORDER BY closedAt DESC'
  const orders = all(q, params)
  orders.forEach(o => { o.items = all('SELECT * FROM order_items WHERE orderId=?', [o.id]) })
  res.json(orders)
})

// ─── CATCH ALL ────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(PUBLIC_PATH, 'index.html'))
})

wss.on('connection', ws => {
  ws.on('message', msg => {
    try { const d = JSON.parse(msg); if (d.type === 'ping') ws.send(JSON.stringify({ type: 'pong' })) } catch {}
  })
})

initDB().then(() => {
  httpServer.listen(PORT, () => console.log(`HOS LOUNGE server on port ${PORT}`))
}).catch(err => {
  console.error('Failed to init DB:', err)
  process.exit(1)
})
