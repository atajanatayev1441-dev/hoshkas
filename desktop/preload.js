// Preload script — runs in renderer with nodeIntegration off
// Expose safe APIs to the renderer here if needed
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0'
})
