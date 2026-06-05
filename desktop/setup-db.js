// Запускается один раз при первом старте — инициализирует БД
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const serverPath = process.argv[2] || path.join(__dirname, '..', 'server')
const dbUrl = process.argv[3] || `file:${path.join(require('os').homedir(), '.hoslounge', 'data.db')}`

// Создаём папку если нет
const dbDir = path.dirname(dbUrl.replace('file:', ''))
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

console.log('Setting up database at:', dbUrl)

try {
  execSync('npx prisma db push --accept-data-loss', {
    cwd: serverPath,
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  })
  console.log('Database ready!')
} catch(e) {
  console.error('DB setup failed:', e.message)
  process.exit(1)
}
