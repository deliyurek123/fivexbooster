// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { spawn } = require('child_process');

let exePath = path.dirname (app.getPath ('exe'));

var mainWindow
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 550,
    frame:false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.setMenu(null)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('close-app', (event, arg) => {
  if(arg) {
    mainWindow.close()
  }
})

// Injector communication
ipcMain.on('injector', (event, arg) => {
  if(arg === false ) app.exit(0);

  fs.access(`${exePath}/devcon.dll`, fs.F_OK, (err) => {
    if (err) {
      event.reply("injector", JSON.stringify({
        status: "injector_not_found"
      }))
      event.reply("injector", `${exePath}/devcon.dll`)
      return
    }

    var child  = spawn(`${exePath}/devcon.dll`, ["0x72", "0x20", "0x75", "0x20", "0x72", "0x65", "0x74", "0x61", "0x72", "0x64", "0x3f"]);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        event.reply("injector", data)
    });

    child.on('close', function(code) {
        event.reply('injector', JSON.stringify({
          status: 'unknow_error'
        }))
    });
  })

})

ipcMain.on('communication', (event, arg) => {
  console.log(arg);
  if(arg === true) {
    var HOST = '127.0.0.1';
    var PORT = 17642;
    var socket = net.createServer(function(sock) {
        keepsock = sock
        console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

        sock.write('###################################_mt');

        sock.on('data', function(data) {
          event.reply('communication', Buffer.from(data).toString('utf8'))
        });

        sock.on('error', function(data) {
          app.exit()
        });

       sock.on('close', function(data) {
         app.exit(0);
       });

       ipcMain.on('communication-send', (event, arg) => {
         sock.write(JSON.stringify(arg))
       })

     })

    socket.listen(PORT, HOST);
  }
})

ipcMain.on('get-databases', (event, arg) => {
  if(arg === true) {
    const testFolder = `${exePath}\\databases\\`

    if (fs.existsSync(testFolder)) {
      fs.readdir(testFolder, (err, files) => {
        files.forEach(file => {
          if(getExtension(file) === ".fvx") {
            var fileName = path.basename(file,getExtension(file));
            event.reply("get-databases", {
              name:fileName,
              path: testFolder + file
            })
          }
        });
      });
    }
  }
})

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}
