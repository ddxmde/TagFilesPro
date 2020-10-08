'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  Menu, dialog
} from 'electron'

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'


const {
  ipcMain
} = require('electron')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
// protocol.interceptFileProtocol('file', (req, callback) => {
//   const url = req.url.substr(8);
//   callback(slash(decodeURI(url)));
// }, (error) => {
//   if (error) {
//     console.error('Failed to register protocol');
//   }
// });
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration: true,
      webSecurity: false
    }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

function createMiniWindow(){
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
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
  if (processArgs[1]){
      //鼠标右键事件响应
      createMiniWindow()
      //win.webContents.openDevTools()
      Menu.setApplicationMenu(null)
          //给文件添加标签
      createProtocol('app')
      win.loadURL('app://./addTags.html')
      ipcMain.on('getProcessArgs', (event,args)=>{
        event.reply('getProcessArgs-response', processArgs)
      })
      
  }else{
      createWindow()
      Menu.setApplicationMenu(null)
  }
  
})

// Exit cleanly on request from parent process in development mode.
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




