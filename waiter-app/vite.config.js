import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  base: '/waiter/',
  build: {
    outDir: 'dist'
  },
  preview: {
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    host: true
  },
  server: {
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
      '/ws':  { target: BACKEND_URL.replace('https', 'wss').replace('http', 'ws'), ws: true, changeOrigin: true }
    }
  }
})
