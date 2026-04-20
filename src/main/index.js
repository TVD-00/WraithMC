import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
const Store = require('electron-store')

import { registerWindowIpc } from './ipc/windowIpc'
import { registerConfigIpc } from './ipc/configIpc'
import { registerButtonIpc } from './ipc/buttonIpc'
import { createBotManager } from './bot/botManager'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const store = new Store()
const botManager = createBotManager(store)

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 500,
    minWidth: 900,
    minHeight: 450,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    resizable: true,
    maximizable: true,
    webPreferences: {
      devTools: is.dev,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  registerWindowIpc(mainWindow, store)
  registerConfigIpc(store)
  registerButtonIpc(store, botManager)

  ipcMain.on('playerList', (event, list) => {
    botManager.playerList = list
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.wraithdev.wraithmc')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()
})

process.on('uncaughtException', (err) => {
  console.log(err)
})
process.on('UnhandledPromiseRejectionWarning', (err) => {
  console.log(err)
})
