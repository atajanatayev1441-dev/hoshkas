import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || join(__dirname, 'cafe.db')

const initSqlJs = require('sql.js')
const SQL = await initSqlJs()

// Load existing DB or create new
let db
if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath)
  db = new SQL.Database(fileBuffer)
} else {
  db = new SQL.Database()
}

// Save to disk helper
export function saveDb() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000)

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    categoryId INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS waiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER UNIQUE NOT NULL,
    status TEXT DEFAULT 'PENDING',
    tableNumber TEXT,
    comment TEXT,
    total REAL NOT NULL,
    paymentType TEXT DEFAULT 'CASH',
    waiterId INTEGER,
    waiterName TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    closedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    itemId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    name TEXT NOT NULL
  );
`)
saveDb()

// Query helpers
export function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  } catch(e) { console.error('DB all error:', e.message, sql); return [] }
}

export function get(sql, params = []) {
  return all(sql, params)[0] || null
}

export function run(sql, params = []) {
  try {
    db.run(sql, params)
    saveDb()
    return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] }
  } catch(e) { console.error('DB run error:', e.message, sql); throw e }
}

console.log('✅ Database ready:', dbPath)
