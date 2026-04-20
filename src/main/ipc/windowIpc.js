import { ipcMain, dialog, shell } from 'electron'

const CLIENT_VERSION = 1.0

export function registerWindowIpc(mainWindow, store) {
  ipcMain.on('win:invoke', (event, action) => {
    switch (action) {
      case 'min':
        mainWindow.minimize()
        break
      case 'max':
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
        break
      case 'fullscreen':
        mainWindow.setFullScreen(!mainWindow.isFullScreen())
        break
      case 'close':
        mainWindow.close()
        break
    }
  })

  ipcMain.on('loaded', () => {
    store.set('version', { current: CLIENT_VERSION })
    mainWindow.webContents.send('setConfig', store.get('config'), store.get('version'))
    if (!store.get('config')) {
      mainWindow.webContents.send('initConfig')
    }
    if (store.get('config.namefile')) {
      mainWindow.webContents.send('fileSelected', 'nameFileLabel', store.get('config.namefile'))
    }
    mainWindow.show()
  })

  ipcMain.on('open', (event, id, name) => {
    dialog
      .showOpenDialog(mainWindow, {
        title: name,
        filters: [{ name: 'Text File', extensions: ['txt'] }],
        properties: ['openFile', 'multiSelections']
      })
      .then((result) => {
        if (!result.canceled) {
          store.set('config.namefile', result.filePaths[0])
          mainWindow.webContents.send('fileSelected', id, result.filePaths[0])
        }
      })
      .catch((error) => {
        console.log(error)
      })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}
