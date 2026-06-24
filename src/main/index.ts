import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { initDb } from './db'
import { getConfig, saveConfig } from './config'
import { registerIpc } from './ipc'

const RAILWAY_URL =
  'postgresql://postgres:XyRkpEbSTuKBHXvdQGjPVjIEqDgkiUYl@reseau.proxy.rlwy.net:40549/railway'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: 'PIXEL GESTION',
    backgroundColor: '#16202E',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    win?.webContents.send('update:available', { version: info.version })
  })

  autoUpdater.on('update-downloaded', () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    win?.webContents.send('update:ready')
  })

  ipcMain.on('update:install', () => {
    autoUpdater.quitAndInstall()
  })

  // Chequear al iniciar y luego cada 4 horas
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000)
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.pixelgestion.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()

  const config = getConfig()
  const dbUrl = config?.databaseUrl ?? RAILWAY_URL
  try {
    await initDb(dbUrl)
    if (!config) saveConfig({ databaseUrl: dbUrl })
  } catch {
    // El renderer mostrará el error via app:dbStatus
  }

  createWindow()

  if (!is.dev) setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
