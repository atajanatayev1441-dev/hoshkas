import { app, BrowserWindow, shell, Menu, dialog, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { createServer } from 'net'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.argv.includes('--dev')

let mainWindow = null
let serverProcess = null
let serverPort = 3001

// ─── Find free port ───────────────────────────────────────────
function findFreePort(start = 3001) {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(start, () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', () => resolve(findFreePort(start + 1)))
  })
}

// ─── Start embedded Express server ───────────────────────────
async function startServer() {
  serverPort = await findFreePort(3001)

  // Resolve server paths
  const serverDir = isDev
    ? join(__dirname, '..', 'server')
    : join(process.resourcesPath, 'server')

  const serverEntry = join(serverDir, 'index.js')
  const dbPath = join(app.getPath('userData'), 'cafe-pos.db')

  // For SQLite in desktop mode, override DATABASE_URL
  const env = {
    ...process.env,
    PORT: String(serverPort),
    NODE_ENV: 'production',
    ELECTRON_RUN: '1',
    DATABASE_URL: process.env.DATABASE_URL || `file:${dbPath}`
  }

  console.log(`Starting server on port ${serverPort}...`)
  console.log(`Server dir: ${serverDir}`)
  console.log(`DB: ${env.DATABASE_URL}`)

  serverProcess = spawn('node', [serverEntry], {
    cwd: serverDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  serverProcess.stdout.on('data', (d) => console.log('[server]', d.toString().trim()))
  serverProcess.stderr.on('data', (d) => console.error('[server err]', d.toString().trim()))

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`)
  })

  // Wait for server to be ready
  await waitForServer(`http://localhost:${serverPort}/health`)
}

function waitForServer(url, attempts = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let tries = 0
    const check = async () => {
      tries++
      try {
        const res = await fetch(url)
        if (res.ok) return resolve()
      } catch {}
      if (tries >= attempts) return reject(new Error('Server did not start'))
      setTimeout(check, delay)
    }
    check()
  })
}

// ─── Create window ────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ЛаунжКасса',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools()
  })

  mainWindow.loadURL(`http://localhost:${serverPort}`)
}

// ─── App menu ─────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'Касса',
      submenu: [
        { label: 'Касса', click: () => mainWindow?.loadURL(`http://localhost:${serverPort}/`) },
        { label: 'Бухгалтерия', click: () => mainWindow?.loadURL(`http://localhost:${serverPort}/accounting`) },
        { label: 'Меню', click: () => mainWindow?.loadURL(`http://localhost:${serverPort}/menu`) },
        { type: 'separator' },
        { label: 'Обновить', role: 'reload' },
        { type: 'separator' },
        { label: 'Выйти', role: 'quit' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Полный экран', role: 'togglefullscreen' },
        { label: 'Увеличить', role: 'zoomin' },
        { label: 'Уменьшить', role: 'zoomout' },
        { label: 'Обычный размер', role: 'resetzoom' },
      ]
    }
  ]

  if (isDev) {
    template.push({
      label: 'Dev',
      submenu: [
        { label: 'DevTools', role: 'toggleDevTools' },
        { label: 'Reload', role: 'forceReload' }
      ]
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Lifecycle ────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Show loading window while server starts
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    backgroundColor: '#1a1a2e',
    webPreferences: { nodeIntegration: false }
  })

  mainWindow.loadURL('data:text/html,<html><body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column"><h2>☕ ЛаунжКасса</h2><p style="color:#aaa">Запускаем сервер...</p></body></html>')

  try {
    await startServer()
  } catch (err) {
    dialog.showErrorBox('Ошибка запуска', `Не удалось запустить сервер: ${err.message}`)
    app.quit()
    return
  }

  mainWindow.close()
  buildMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
