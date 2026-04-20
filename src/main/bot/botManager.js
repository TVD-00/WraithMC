import { BrowserWindow } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import EventEmitter from 'node:events'
import { salt, delay, genName, botMode, sendEvent, proxyEvent, notify, cleanText } from '../js/misc/utils'
import { easyMcAuth } from '../js/misc/customAuth'
import { connection } from '../js/proxy/proxyhandler'
import { checkProxy } from '../js/proxy/proxycheck'
import { scrapeProxy } from '../js/proxy/proxyscrape'
import { antiafk } from '../js/misc/antiafk'
import { registerBotCommands } from './botCommands'

const mineflayer = require('mineflayer')

export function createBotManager(store) {
  const botApi = new EventEmitter()
  botApi.setMaxListeners(0)

  function cfg() {
    return store.get('config')
  }

  const manager = {
    playerList: [],
    stopBot: false,
    stopScript: false,
    stopProxyTest: false,
    _currentProxy: 0,
    _proxyUsed: 0,

    emitProxyStop() {
      proxyEvent('', 'stop', '', '')
    },

    scrapeProxies() {
      scrapeProxy(cfg().value.proxyType)
        .then((result) => proxyEvent('', 'scraped', result, ''))
        .catch((err) => {
          console.log(err)
          notify('Error', 'Failed to scrape proxies', 'error')
        })
    },

    async testProxy(list) {
      manager.stopProxyTest = false
      const server = cfg().value.server
      const [serverHost, serverPort] = server.split(':')
      if (!serverHost) return notify('Error', 'Invalid server address', 'error')
      if (!list) return notify('Error', 'Please enter proxy list', 'error')
      if (cfg().value.proxyType === 'none') return notify('Error', 'Select proxy type', 'error')
      notify('Info', 'Testing proxies...', 'success')
      proxyEvent('', 'start', '', '')
      const lines = list.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (manager.stopProxyTest) break
        const count = `${i + 1}/${lines.length}`
        const [host, port, username, password] = lines[i].split(':')
        checkProxy(
          cfg().value.proxyType, host, port, username, password,
          serverHost, serverPort || 25565, cfg().value.proxyCheckTimeout || 5000
        )
          .then((result) => proxyEvent(result.proxy, 'success', '', count))
          .catch((error) => proxyEvent(error.proxy, 'fail', error.reason, count))
        if (lines.length == i + 1) proxyEvent('', 'stop', '', '')
        await delay(cfg().value.proxyCheckDelay || 100)
      }
    },

    async startScript(username) {
      manager.stopScript = false
      if (!cfg().value.scriptText) return
      const scriptLines = cfg().value.scriptText.split(/\r?\n/)
      for (let i = 0; i < scriptLines.length; i++) {
        if (manager.stopScript) break
        const args = scriptLines[i].split(' ')
        const command = args.shift().toLowerCase()
        if (command === 'delay') {
          await delay(parseInt(args[0]))
        } else {
          botApi.emit('botEvent', username, command, args.slice(0))
        }
      }
    },

    async exeAll(command) {
      if (!command) return
      const list = manager.playerList
      const cmd = command.split(' ')
      if (list.length == 0) return notify('Error', 'No bots selected', 'error')
      for (let i = 0; i < list.length; i++) {
        botApi.emit('botEvent', list[i], cmd[0], cmd.slice(1))
        if (cfg().boolean.isLinear) {
          await delay(cfg().value.linearDelay || 100)
        }
      }
      sendEvent('Executed', 'chat', 'Script: ' + command)
    },

    async connectBot() {
      manager.stopBot = false
      manager._currentProxy = 0
      manager._proxyUsed = 0
      const count = cfg().value.botMax || 1

      if (cfg().value.nameType === 'file' && cfg().namefile) {
        showBottab()
      } else if (cfg().value.nameType !== 'file' && cfg().value.nameType !== 'default') {
        showBottab()
      }

      for (let i = 0; i < count; i++) {
        if (manager.stopBot) break
        let botInfo

        switch (cfg().value.nameType) {
          case 'random':
            botInfo = getBotInfo(salt(10))
            break
          case 'legit':
            botInfo = getBotInfo(genName())
            break
          case 'file':
            if (!cfg().namefile) {
              notify('Error', 'Please select name file', 'error')
            } else {
              startFile()
            }
            return
          default:
            if (!cfg().value.username) return notify('Error', 'Please insert username', 'error')
            const username = count == 1
              ? cfg().value.username
              : cfg().value.username + '_' + i
            botInfo = getBotInfo(username)
            if (i == 0) showBottab()
        }

        newBot(botInfo)
        await delay(cfg().value.joinDelay || 1000)
      }
    }
  }

  function showBottab() {
    BrowserWindow.getAllWindows()[0].webContents.send('showBottab')
  }

  async function startFile() {
    showBottab()
    const filePath = cfg().namefile
    const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)
    const count = cfg().value.botMax || lines.length
    for (let i = 0; i < count; i++) {
      if (manager.stopBot) break
      newBot(getBotInfo(lines[i]))
      await delay(cfg().value.joinDelay || 1000)
    }
  }

  function getBotInfo(botName) {
    const server = cfg().value.server || 'localhost:25565'
    const [serverHost, serverPort] = server.split(':')
    const parsedPort = parseInt(serverPort) || 25565
    const options = {
      host: serverHost,
      port: parsedPort,
      username: botName,
      version: cfg().value.version,
      auth: cfg().value.authType,
      hideErrors: true,
      joinMessage: cfg().value.joinMessage,
      ...botMode(cfg().value.botMode),
      ...getProxy(cfg().value.proxyType)
    }
    return options
  }

  function getProxy(proxyType) {
    if (proxyType === 'none' || !cfg().value.proxyList) return
    const proxyList = cfg().value.proxyList.split(/\r?\n/)
    const randomIndex = crypto.randomInt(0, proxyList.length)
    const proxyPerBot = cfg().value.proxyPerBot

    if (manager._proxyUsed >= proxyPerBot) {
      manager._proxyUsed = 0
      manager._currentProxy++
      if (manager._currentProxy >= proxyList.length) manager._currentProxy = 0
    }
    manager._proxyUsed++

    const index = cfg().boolean.randomizeOrder ? randomIndex : manager._currentProxy
    const [host, port, username, password] = proxyList[index].split(':')
    return { protocol: proxyType, proxyHost: host, proxyPort: port, proxyUsername: username, proxyPassword: password }
  }

  function newBot(options) {
    if (options.auth === 'easymc') {
      if (options.username?.length !== 20) {
        return sendEvent(options.username, 'easymcAuth')
      }
      options.auth = easyMcAuth
      options.sessionServer ||= 'https://sessionserver.easymc.io'
    }

    const connectProxy = async (client) => {
      try {
        const socket = await connection(
          cfg().value.proxyType, options.proxyHost, options.proxyPort,
          options.proxyUsername, options.proxyPassword, options.host, options.port
        )
        client.setSocket(socket)
        client.emit('connect')
      } catch (error) {
        if (cfg().boolean.proxyLogChat) {
          sendEvent(client.username, 'chat', options.proxyHost + ':' + options.proxyPort + ' ' + error)
        }
      }
    }

    if (cfg().value.proxyType !== 'none') {
      options.connect = connectProxy
    }

    const bot = mineflayer.createBot({
      ...options,
      plugins: {
        anvil: false, book: false, boss_bar: false, breath: false, chest: false,
        command_block: false, craft: false, creative: false, enchantment_table: false,
        experience: false, explosion: false, fishing: false, furnace: false,
        generic_place: false, painting: false, particle: false, place_block: false,
        place_entity: false, rain: false, ray_trace: false, scoreboard: false,
        sound: false, spawn_point: false, tablist: false, team: false,
        time: false, title: false, villager: false
      },
      onMsaCode: (data) => sendEvent(options.username, 'authmsg', data.user_code)
    })

    let hitTimer = 0

    bot.once('login', () => {
      sendEvent(bot._client.username, 'login')
      if (cfg().boolean.runOnConnect) manager.startScript(bot._client.username)
      if (cfg().value.joinMessage) bot.chat(cfg().value.joinMessage)
    })
    bot.once('spawn', () => bot.loadPlugin(antiafk))
    bot.on('spawn', () => {
      if (cfg().boolean.runOnSpawn) manager.startScript(bot._client.username)
    })
    bot.on('messagestr', (msg) => sendEvent(bot._client.username, 'chat', msg))
    bot.on('windowOpen', (window) => {
      sendEvent(bot._client.username, 'chat', `Window Opened ' ${window.title ? ':' + window.title : ''}`)
    })
    bot.on('windowClose', (window) => {
      sendEvent(bot._client.username, 'chat', `Window Closed ' ${window.title ? ':' + window.title : ''}`)
    })
    bot.once('kicked', (reason) => {
      const parsed = JSON.parse(reason)
      sendEvent(bot._client.username, 'kicked', cleanText(parsed))
    })
    bot.once('end', (reason) => {
      sendEvent(bot._client.username, 'end', reason)
      if (cfg().boolean.autoReconnect) {
        setTimeout(() => newBot(options), cfg().value.reconnectDelay || 1000)
      }
    })

    bot.on('physicTick', () => {
      if (cfg().boolean.killauraToggle && manager.playerList.includes(bot._client.username)) {
        killaura()
      }
    })

    function killaura() {
      if (hitTimer <= 0 && bot.entity.onGround) {
        hit(cfg().boolean.targetPlayer, cfg().boolean.targetVehicle,
            cfg().boolean.targetMob, cfg().boolean.targetAnimal,
            cfg().value.killauraRange, cfg().boolean.killauraRotate)
        const baseDelay = cfg().value.killauraDelay || 10
        hitTimer = baseDelay + Math.floor(Math.random() * 5) - 2
      } else {
        hitTimer--
      }
    }

    function hit(player, vehicle, mob, animal, maxDistance, rotate) {
      const targetEntities = []
      Object.values(bot.entities).forEach((entity) => {
        const distance = bot.entity.position.distanceTo(entity.position)
        if (distance >= parseFloat(maxDistance)) return
        if (entity.type === 'player' && entity.username !== bot.username && player) targetEntities.push(entity)
        if (entity.kind === 'Vehicles' && vehicle) targetEntities.push(entity)
        if (entity.kind === 'Hostile mobs' && mob) targetEntities.push(entity)
        if (entity.kind === 'Passive mobs' && animal) targetEntities.push(entity)
      })
      if (targetEntities.length === 0) return
      targetEntities.forEach((entity) => {
        if (rotate) bot.lookAt(entity.position, false)
        bot.swingArm()
        bot.attack(entity)
      })
    }

    registerBotCommands(bot, botApi, cfg)
  }

  return manager
}
