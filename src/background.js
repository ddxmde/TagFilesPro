'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  Menu, dialog
} from 'electron'


import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'


const {
  ipcMain
} = require('electron')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

//========== 创建本地文件访问协议=================
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
function registerSafeFileProtocol() {
  const safeFileProtocol = 'electrondemo-safe-file-protocol'
  protocol.registerFileProtocol(safeFileProtocol, (request, callback) => {
    const url = request.url.replace(`${safeFileProtocol}://`, '')
    // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
    const decodedUrl = decodeURIComponent(url)
    try {
      return callback(decodedUrl)
    } catch (error) {
      console.error('ERROR: main | registerSafeFileProtocol | Could not get file path', error)
    }
  })
}
//========== 创建本地文件访问协议=================


//================创建窗口函数==============
function createWindow() { 
  // 主程序窗口
  win = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
  
}

function createMiniWindow() {
  // 右键启动程序-添加标签窗口
  win = new BrowserWindow({
    width: 400,
    height: 120,
    minWidth: 400,
    minHeight: 120,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration: true,
      webSecurity: false
    }
  })
}
//================创建窗口函数==============


//=============app window 事件监听============
win.on('closed', () => {
  win = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('ready', async () => {
  registerSafeFileProtocol()
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  const processArgs = process.argv
  if (processArgs[1]) {
    //鼠标右键事件响应
    createMiniWindow()
    //win.webContents.openDevTools()
    Menu.setApplicationMenu(null)
    //给文件添加标签
    createProtocol('app')
    win.loadURL('app://./addTags.html')
    ipcMain.on('getProcessArgs', (event, args) => {
      event.reply('getProcessArgs-response', processArgs)
    })
  } else {
    createWindow()
    Menu.setApplicationMenu(null)
  }
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
//=============app window 事件监听============

// =======================ipc通信===================
/**
 * 全屏按钮事件
*/
ipcMain.on('toggal-fullscreen', (event, arg) => {
  if (win.isMaximized()) {
    win.restore()
  } else {
    win.maximize()
  }
})
/**
 * 退出事件
 */
ipcMain.on('window-close', (event) => {
  console.log('guanji')
  win.close()
  app.exit()
})

import ipEvent from './main/ipcEvent'
ipEvent()

// =======================ipc通信===================


