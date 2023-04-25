var devtoolsOn = true;

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path')
const fs = require('fs');
const os = require('os');
const pty = require('node-pty');

function readConf() {
    const data = fs.readFileSync(__dirname + '/../../package.json', 'utf8');
    return data;
}

ipcMain.on('synchronous-message', (event, arg) => {
    event.returnValue = readConf();
});

const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');
const ptyProcess = pty.spawn(shell, ['-i'], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env,
});

function createWindow() {
    // Create a new window
    const window = new BrowserWindow({
        transparent: true,
        width: 800,
        height: 600,
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname + '/../../src/images/icon/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    ptyProcess.on('data', (data) => {
        window.webContents.send('terminal.fromPty', data);
    });

    ptyProcess.on('exit', () => {
        window.close();
      });
      

    ipcMain.on('terminal.toPty', (event, data) => {
        ptyProcess.write(data);
    });

    ipcMain.on('update-title', (event, title) => {
        window.setTitle(title);
    });

    window.webContents.on("did-finish-load", () => {

        ptyProcess.write("clear\r");
        
        if(devtoolsOn) {
            let devtools = new BrowserWindow()
            window.webContents.setDevToolsWebContents(devtools.webContents)
            window.webContents.openDevTools({ mode: 'detach' })
            devtools.hide();
            devtools.removeMenu();
            const electron = require('electron');
            var screenElectron = electron.screen;
            var mainScreen = screenElectron.getPrimaryDisplay();
            var dimensions = mainScreen.size;
            var devtoolsWidth = 800;
            var devtoolsPosition = dimensions.width - devtoolsWidth;
            devtools.setSize(devtoolsWidth, dimensions.height);
            devtools.setPosition(devtoolsPosition, 0);
            devtools.show();
        }

        window.show();
        window.focus();
    });

    window.on("close", () => {
        mainWindow = null;
        app.quit();
     });

    window.loadFile("src/index.html");

}

app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});