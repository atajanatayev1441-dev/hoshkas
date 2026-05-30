import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4173
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:3001'

// Proxy /api and /ws to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}))
app.use('/ws', createProxyMiddleware({
  target: BACKEND_URL.replace('https', 'wss').replace('http', 'ws'),
  changeOrigin: true,
  ws: true
}))

// Serve built frontend
app.use('/waiter', express.static(join(__dirname, 'dist')))
app.get('/waiter/*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))
app.get('*', (req, res) => res.redirect('/waiter/'))

app.listen(PORT, () => console.log(`Waiter app running on port ${PORT}`))
