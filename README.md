# WraithMC

A powerful Minecraft bot management tool with automation features, built with Electron and [Mineflayer](https://github.com/PrismarineJS/mineflayer).

## Features

- **Anti-AFK** - Keep your bots active and avoid being kicked
- **Chat Automation** - Automated chat messages with bypass capabilities
- **KillAura** - Combat automation targeting players, vehicles, mobs, or animals
- **Inventory Control** - Full inventory management for your bots
- **Movement Control** - Control bot movement and pathfinding
- **Auto Reconnect** - Automatically reconnect bots when disconnected
- **Scripting System** - Write custom scripts to automate bot behavior
- **Proxy Support** - SOCKS4/SOCKS5 proxy with scraping, testing, and rotation
- **EasyMC Support** - Authenticate using EasyMC tokens
- **Name Generator** - Generate random or legit-looking usernames
- **Multi-Bot** - Manage multiple bots simultaneously

## Supported Minecraft Versions

`1.8.x` - `1.20.x`

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# Windows (portable .exe)
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Download

Pre-built binaries are available on the [Releases](https://github.com/TVD-00/WraithMC/releases) page.

## Tech Stack

- **Framework:** [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- **Bot Engine:** [Mineflayer](https://github.com/PrismarineJS/mineflayer)
- **Storage:** [electron-store](https://github.com/sindresorhus/electron-store)
- **Proxy:** [socks](https://github.com/JoshGlazebrook/socks)

## Project Structure

```
WraithMC/
├── src/
│   ├── main/          # Electron main process (bot logic, IPC, proxy)
│   │   ├── bot/       # Bot manager and command handling
│   │   ├── ipc/       # IPC handlers (renderer <-> main)
│   │   └── js/        # Utilities (proxy, auth, anti-afk)
│   ├── preload/       # Preload scripts (API bridge)
│   └── renderer/      # UI (HTML/CSS/JS frontend)
│       ├── assets/    # Icons, styles
│       └── src/       # Frontend logic
├── electron-builder.yml
├── electron.vite.config.mjs
└── package.json
```

## License

[MIT](LICENSE) - Copyright (c) 2026 TVD
