const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const app = electron.app
const dialog = electron.dialog;
const ipc = require('electron').ipcMain
var dbBackedUp = false;
const fs = require('fs');
const path = require('path');

// const autrequire('electron').autoUpdater


let template = [{
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        // on reload, start fresh and close any old
        // open secondary windows
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(function (win) {
            if (win.id > 1) {
              win.close()
            }
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: 'Toggle Full Screen',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: 'Reopen Window',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: function () {
      app.emit('activate')
    }
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Learn More About',
    click: function () {
      electron.shell.openExternal('http://www.autographa.com')
    }
  }]
}]

function addUpdateMenuItems (items, position) {
  if (process.mas) return

  const version = electron.app.getVersion()
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: 'Checking for Update',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: 'Check for Update',
    visible: false,
    key: 'checkForUpdate',
    click: function (item, focusedWindow) {
      // Basic solution: display a message box to the user
      var http = require("http");
      var options = {
          hostname: 'autographaus.bridgeconn.com',
          path: '/updates/latest/version?v='+app.getVersion(),
          method: 'GET',
          headers: {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength("")
          }
        };
        try {
        var req = http.request(options, (res) => {
          var body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            var resData = JSON.parse(body);
            if(resData["update"]){
                var updateNow = dialog.showMessageBox(focusedWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                defaultId: 0,
                cancelId: 1,
                title: 'Update available',
                message: 'There is an update available, do you want to restart and install it now?'
              });
              if (updateNow === 0) {
                  const refDb = require(`${__dirname}/app/util/data-provider`).referenceDb();
                  const targetDb = require(`${__dirname}/app/util/data-provider`).targetDb();
                  const lookupsDb = require(`${__dirname}/app/util/data-provider`).lookupsDb();
                  refDb.close().then(function(response){
                    lookupsDb.close();
                    return targetDb.close();
                  })
                  .then(function(){
                    console.log("response")
                    if(fs.existsSync(path.join(`${__dirname}`, 'db'))){
                      copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), path.join(app.getPath('userData')));
                      var ds = (new Date()).toISOString().replace(/[^0-9]/g, "");
                      copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), path.join(app.getPath('userData'), "db_backup_"+ds));
                      try {
                        require('./auto-updater')({
                          url: 'http://autographaus.bridgeconn.com/releases/win32/0.2.0/Autographa',
                          version: app.getVersion()
                        });
                        focusedWindow.hide();
                        let child = new BrowserWindow({parent: focusedWindow, modal: true, show: false, skipTaskbar: true, frame: false, width: 500, height: 200})
                            child.loadURL(`file:${__dirname}/app/views/loading.html`);
                            child.once('ready-to-show', () => {
                              child.show()
                            });
                      } catch (e) {
                        console.log(e.message)
                        dialog.showErrorBox('Update Error', e.message)
                      }
                    }
                  }).catch((err) => {
                    console.log('Error while DB setup. ' + err);
                  });
                // if(fs.existsSync(path.join(`${__dirname}`, 'db'))){
                //   copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), app.getPath('userData'));
                //   dbBackedUp = true;
                // }
                
              }else{
                console.log("cancel")
              }
            }
          });
        });
        req.on('error', function(error) {
          // Error handling here
          dialog.showErrorBox('Update Error', "Error Occured to check for updates. Please try later..");
        });
        req.end();
      } catch (e) {
        console.log(e.message);
      }
      // require('electron').autoUpdater.checkForUpdates()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = electron.app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        app.quit()
      }
    }]
  })

  // Window menu.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  })

  addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', function () {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

app.on('browser-window-created', function () {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', function () {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = true
})

function copyFileSync( source, target ) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    //check if folder needs to be created or integrated
   
    if ( !fs.existsSync( target ) ) {
        fs.mkdirSync( target );
    }
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }
    //copy
    if ( fs.existsSync( source ) && fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}
