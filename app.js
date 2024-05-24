const { app, BrowserWindow, ipcMain } = require('electron');
const screenshot = require('screenshot-desktop');
const robot = require("robotjs");
const socket = require('socket.io-client')('http://192.168.1.18:5000');

let interval;

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 150,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Para permitir nodeIntegration
        }
    });
    win.removeMenu();
    win.loadFile('index.html');

    socket.on("mouse-move", (data) => {
        const obj = JSON.parse(data);
        const { x, y } = obj;
        robot.moveMouse(x, y);
    });

    socket.on("mouse-click", () => {
        robot.mouseClick();
    });

    socket.on("type", (data) => {
        const obj = JSON.parse(data);
        const { key } = obj;
        robot.keyTap(key);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on("start-share", (event) => {
    const uuid = "test"; // Aquí usamos el identificador "test"
    socket.emit("join-message", uuid);
    event.reply("uuid", uuid);

    interval = setInterval(() => {
        screenshot().then((img) => {
            const imgStr = Buffer.from(img).toString('base64');
            const obj = { room: uuid, image: imgStr };
            socket.emit("screen-data", JSON.stringify(obj));
        });
    }, 500);
});

ipcMain.on("stop-share", () => {
    clearInterval(interval);
});
