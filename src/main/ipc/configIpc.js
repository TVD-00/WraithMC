import { ipcMain } from 'electron'

export function registerConfigIpc(store) {
  ipcMain.on('setConfig', (event, type, id, value) => {
    store.set(`config.${type}.${id}`, value)
  })

  ipcMain.on('deleteConfig', () => {
    store.delete('config')
  })
}
