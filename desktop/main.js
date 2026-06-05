const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')

let mainWindow = null
let serverProcess = null
const SERVER_PORT = 3721

// Путь к серверу
function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server')
  }
  return __dirname
}

// Путь к node
function getNodePath() {
  if (app.isPackaged) {
    // Внутри пакета — node рядом
    const ext = process.platform === 'win32' ? '.exe' : ''
    return path.join(process.resourcesPath, 'node' + ext)
  }
  return process.execPath.includes('electron') ? 'node' : process.execPath
}

// Ждём пока сервер запустится
function waitForServer(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      attempts++
      const req = http.get(`http://localhost:${SERVER_PORT}/health`, res => {
        if (res.statusCode === 200) resolve()
        else if (attempts < maxAttempts) setTimeout(check, 500)
        else reject(new Error('Server timeout'))
      })
      req.on('error', () => {
        if (attempts < maxAttempts) setTimeout(check, 500)
        else reject(new Error('Server not responding'))
      })
      req.end()
    }
    check()
  })
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath()
    const dbPath = path.join(app.getPath('userData'), 'hoslounge.db')
    const publicPath = app.isPackaged
      ? path.join(process.resourcesPath, 'public')
      : path.join(__dirname, '..', 'public')
    const env = {
      ...process.env,
      PORT: SERVER_PORT,
      NODE_ENV: 'production',
      DB_PATH: dbPath,
      PUBLIC_PATH: publicPath,
    }

    console.log('Starting server at:', serverPath)

    // Запускаем сервер
    serverProcess = spawn('node', ['server-sqlite.js'], {
      cwd: serverPath,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })

    serverProcess.stdout.on('data', d => console.log('[server]', d.toString().trim()))
    serverProcess.stderr.on('data', d => console.error('[server err]', d.toString().trim()))

    serverProcess.on('error', err => {
      console.error('Failed to start server:', err)
      reject(err)
    })

    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code)
    })

    // Ждём запуска
    waitForServer().then(resolve).catch(reject)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HOS LOUNGE',
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Убираем стандартный тайтлбар — используем кастомный если нужно
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
  })

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`)

  // Открываем ссылки в браузере, а не в Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

async function main() {
  // Показываем сплэш если нужно
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
    backgroundColor: '#0d0d1a',
  })

  splash.loadURL(`data:text/html,
    <html>
    <body style="margin:0;background:#0d0d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#fff">
      <div style="font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;margin-bottom:8px">HOS LOUNGE</div>
      <div style="font-size:22px;font-weight:900;margin-bottom:24px">Запуск системы...</div>
      <div style="width:200px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden">
        <div id="bar" style="width:0%;height:100%;background:#c9a96e;border-radius:2px;transition:width 0.3s"></div>
      </div>
      <div id="status" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:12px">Инициализация...</div>
      <script>
        let w=0
        const t=setInterval(()=>{ w=Math.min(w+2,90); document.getElementById('bar').style.width=w+'%' },100)
      </script>
    </body></html>
  `)

  try {
    await startServer()
    splash.close()
    createWindow()
  } catch (err) {
    splash.close()
    dialog.showErrorBox('Ошибка запуска', `Не удалось запустить сервер:\n${err.message}\n\nПопробуйте перезапустить приложение.`)
    app.quit()
  }
}

app.whenReady().then(main)

app.on('window-all-closed', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null }
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('before-quit', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null }
})

// IPC для диалога сохранения файлов (Excel)
ipcMain.handle('save-file', async (event, { buffer, filename }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return { ok: true, path: filePath }
  }
  return { ok: false }
})
