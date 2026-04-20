import { ipcMain } from 'electron'
import { notify } from '../js/misc/utils'

export function registerButtonIpc(store, botManager) {
  function cfg() {
    return store.get('config')
  }

  const actions = {
    btnStart: () => botManager.connectBot(),
    btnStop: () => {
      botManager.stopBot = true
      notify('Info', 'Stopped sending bots.', 'success')
    },
    btnChat: () => botManager.exeAll('chat ' + cfg().value.chatMsg),
    btnDisconnect: () => botManager.exeAll('disconnect'),
    btnSetHotbar: () => botManager.exeAll('sethotbar ' + cfg().value.hotbarSlot),
    btnUseheld: () => botManager.exeAll('useheld'),
    btnWinClickRight: () => botManager.exeAll('winclick ' + cfg().value.invSlot + ' 1'),
    btnWinClickLeft: () => botManager.exeAll('winclick ' + cfg().value.invSlot + ' 0'),
    btnDropSlot: () => botManager.exeAll('drop ' + cfg().value.invSlot),
    btnDropAll: () => botManager.exeAll('dropall'),
    btnCloseWindow: () => botManager.exeAll('closewindow'),
    btnStartMove: () => botManager.exeAll('startmove ' + cfg().value.moveType),
    btnStopMove: () => botManager.exeAll('stopmove ' + cfg().value.moveType),
    btnResetMove: () => botManager.exeAll('resetmove'),
    btnLook: () => botManager.exeAll('look ' + cfg().value.lookDirection),
    btnAfkOn: () => botManager.exeAll('afkon'),
    btnAfkOff: () => botManager.exeAll('afkoff'),
    runScript: () => {
      botManager.playerList.forEach((username) => {
        botManager.startScript(username)
      })
    },
    stopScript: () => {
      botManager.stopScript = true
    },
    proxyTestStart: () => botManager.testProxy(cfg().value.proxyList),
    proxyTestStop: () => {
      botManager.stopProxyTest = true
      botManager.emitProxyStop()
    },
    proxyScrape: () => {
      if (cfg().value.proxyType === 'none') return notify('Error', 'Select proxy type', 'error')
      notify('Info', 'Scraping proxies...', 'success')
      botManager.scrapeProxies()
    }
  }

  ipcMain.on('btnClick', (event, btn) => {
    const action = actions[btn]
    if (action) action()
  })
}
