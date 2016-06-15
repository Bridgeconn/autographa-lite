const electron = require('electron');
const ipc = electron.ipcMain
const PouchDB = require('pouchdb');
const session = require('electron').session;

// Module to control application life.
const {app} = electron
// Module to create native browser window.
const {BrowserWindow} = electron;

var db = new PouchDB('database');

/*db.destroy().then(function (response) {
  console.log(response);
  console.log('done destroying.');
  // success
  }).catch(function (err) {
  console.log(err);
  }); */

db.get('isDBSetup').then(function (doc) {
    // handle doc
    db.close();    
/*    console.log('Already loaded.');
    db.get('targetBible').then(function (doc) {
	console.log(doc);
	db.close();
    }).catch(function (err) {
	console.log('targetBible not set');
	db.close();
    });*/
}).catch(function (err) {
    console.log(err);
    const bibleJson = require('./lib/full_net_bible.json');
    db.bulkDocs(bibleJson).then(function (response) {
	console.log('i loaded.');
	console.log(response);
	// handle response
	db.close();
    }).catch(function (err) {
	console.log(err);
	db.close();
    });
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

var util = require('util');

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
	width: 800,
	height: 600,
	'min-width': 600,
	'min-height': 300,
	'accept-first-mouse': true,
	'title-bar-style': 'hidden',
	'webPreferences': {'session': session}
    });

    win.maximize();

    // Open the DevTools.
    win.webContents.openDevTools();

    // and load the index.html of the app.
    win.loadURL(`file:${__dirname}/assets/index.html`);

    // Emitted when the window is closed.
    win.on('closed', () => {
	// Dereference the window object, usually you would store windows
	// in an array if your app supports multi windows, this is the time
	// when you should delete the corresponding element.
	win = null;
	exportWindow = null;
    });

    exportWindow = new BrowserWindow({
	width: 500,
	height: 800,
	show: false
    });
    exportWindow.loadURL(`file:${__dirname}/assets/settings.html`);
    exportWindow.openDevTools();
    exportWindow.on('closed', () => {
	exportWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
	app.quit();
    }
});

ipc.on('synchronous-message', function (event, arg) {
    db.close();
    win.loadURL(`file:${__dirname}/assets/translate.html`);
    event.returnValue = 'pong';
});

ipc.on('show-import-window', function () {
    exportWindow.show();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
	createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
