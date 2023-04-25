window.$ = window.jQuery = require('jquery');
const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit'); 
const { ipcRenderer } = require('electron');
const os = require('os');
// const pty = require('node-pty');

const terminal = new Terminal({
    cursorBlink: true
});

terminal.onTitleChange((title) => {
  ipcRenderer.send('update-title', title);
});

const fitAddon = new FitAddon();

terminal.loadAddon(fitAddon);

terminal.open(document.getElementById('terminal'));

terminal.onData((data) => {
  ipcRenderer.send('terminal.toPty', data);
});

ipcRenderer.on('terminal.fromPty', (event, data) => {
  terminal.write(data);
});

function resize() {
  fitAddon.fit();
}

window.addEventListener('resize', () => {
  resize();
});

jQuery("#terminal textarea").focus();

setTimeout(resize, 100);


/** LOG CONFIG TO CONSOLE **/
config = JSON.parse(ipcRenderer.sendSync('synchronous-message', ''));
console.log("App Name: " + config.name);
console.log("App Title: " + config.title);
console.log("App Version: " + config.version);
console.log('Node.js Version: ' + process.version);
console.log('Chromium Version: ' + process.versions['chrome'] );
console.log('Electron Version: ' + process.versions.electron);
console.log('jQuery Version: ' + jQuery.fn.jquery);
jQuery(".title").html(config.title);