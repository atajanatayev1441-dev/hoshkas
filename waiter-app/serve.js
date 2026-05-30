import express from 'express'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4173
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:3001'

const backendUrl = new URL(BACKEND_URL)
const isHttps = backendUrl.protocol === 'https:'

// Proxy /api to backend
app.use('/api', (req, res) => {
  const options = {
    hostname: backendUrl.hostname,
    port: backendUrl.port || (isHttps ? 443 : 80),
    path: '/api' + req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: backendUrl.hostname
    }
  }

  const proxyReq = (isHttps ? httpsRequest : httpRequest)(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err)
    res.status(502).json({ error: 'Backend unavailable' })
  })

  req.pipe(proxyReq)
})

// Serve built frontend
app.use('/waiter', express.static(join(__dirname, 'dist')))
app.get('/waiter/*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))
app.get('*', (req, res) => res.redirect('/waiter/'))

app.listen(PORT, () => console.log(`Waiter app running on port ${PORT}, proxying API to ${BACKEND_URL}`))
