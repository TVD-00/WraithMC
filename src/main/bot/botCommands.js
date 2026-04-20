import crypto from 'crypto'
import { salt, delay } from '../js/misc/utils'

const commands = {
  disconnect: (bot) => bot.quit(),
  chat: (bot, args, cfg) => {
    const bypass = cfg.boolean.bypassChat ? ' ' + salt(crypto.randomInt(2, 6)) : ''
    bot.chat(
      args.join(' ')
        .replaceAll('{random}', salt(4))
        .replaceAll('{player}', bot._client.username) + bypass
    )
  },
  notify: (bot, args) => {
    const { notify } = require('../js/misc/utils')
    notify(
      'Bot',
      bot._client.username + ': ' +
        args.join(' ')
          .replaceAll('{random}', salt(4))
          .replaceAll('{player}', bot._client.username),
      'success'
    )
  },
  sethotbar: (bot, args) => bot.setQuickBarSlot(parseInt(args[0] || 0)),
  useheld: (bot) => bot.activateItem(),
  winclick: (bot, args) => bot.clickWindow(parseInt(args[0]), parseInt(args[1]), 0),
  drop: (bot, args) => {
    bot.clickWindow(-999, 0, 0)
    bot.clickWindow(parseInt(args[0]), 0, 0)
    bot.clickWindow(-999, 0, 0)
  },
  dropall: async (bot) => {
    const itemCount = bot.inventory.items().length
    for (let i = 0; i < itemCount; i++) {
      if (bot.inventory.items().length === 0) return
      const item = bot.inventory.items()[0]
      bot.tossStack(item)
      await delay(10)
    }
  },
  closewindow: (bot) => bot.closeWindow(bot.currentWindow || ''),
  startmove: (bot, args) => bot.setControlState(args[0], true),
  stopmove: (bot, args) => bot.setControlState(args[0], false),
  resetmove: (bot) => bot.clearControlStates(),
  look: (bot, args) => bot.look(parseFloat(args[0]), 0, true),
  afkon: (bot) => bot.afk.start(),
  afkoff: (bot) => bot.afk.stop(),
  hit: (bot, args) => {
    // Delegated from script, not used directly in current UI
    bot._hitExternal?.(args[0], args[1], args[2], args[3], parseFloat(args[4]), args[5])
  }
}

export function registerBotCommands(bot, botApi, getCfg) {
  botApi.on('botEvent', (target, event, ...options) => {
    if (target !== bot._client.username) return
    const handler = commands[event]
    if (handler) handler(bot, options[0], getCfg())
  })
}
