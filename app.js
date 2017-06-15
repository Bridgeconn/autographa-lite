const electron = require('electron');
const session = require('electron').session;
if(require('electron-squirrel-startup')) return;

// Module to control application life.
const {app} = electron
// Module to create native browser window.
const {BrowserWindow} = electron;

require('./application-menu.js');
const autoUpdater = require('./auto-update');
var http = require("http");
var dbBackedUp = false;
const fs = require('fs');
const path = require('path');
const dialog = require('electron').dialog;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let updateInProgress = false;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
    width: 800,
    height: 600,
    'min-width': 600,
    'min-height': 300,
    'accept-first-mouse': true,
    'title-bar-style': 'hidden',
    'webPreferences': {'session': session},
    show: false
    });

    // and load the index.html of the app.
    win.loadURL(`file:${__dirname}/app/views/index.html`);
    //loading window gracefully
    win.once('ready-to-show', () => {
    // Open the DevTools.
    win.webContents.openDevTools(); 
    win.maximize();
        win.show();
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
    if (process.platform !== 'darwin') {
        app.quit();
    }
    });
}

function preProcess() {
    return new Promise(
    function (resolve, reject) {
    // If DB does not exist in the application dir
        if(!fs.existsSync(path.join(`${__dirname}`, 'db'))){          
            if(fs.existsSync(app.getPath('userData')+'/db')){
                copyFolderRecursiveSync((app.getPath('userData')+'/db'), path.join(`${__dirname}`));
            }else{
                resolve('new installation');
                return;
            }

        }
        // check update available 
          autoUpdater.initialize();
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
                    var updateNow = dialog.showMessageBox(null, {
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    defaultId: 0,
                    cancelId: 1,
                    title: 'Update available',
                    message: 'There is an update available, do you want to restart and install it now?'
                  })
                  
                  if (updateNow === 0) {
                     // if user click to yes for update
                     // Check if backup location has DB folder.
                     // If yes. Copy db from Backup to installation folder.
                     // then
                    if(fs.existsSync(path.join(`${__dirname}`, 'db'))){
                        copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), app.getPath('userData'));
                        var ds = (new Date()).toISOString().replace(/[^0-9]/g, "");
                        copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), path.join(app.getPath('userData'), "db_backup_"+ds));
                        dbBackedUp = true;
                    }
                    if(dbBackedUp){
                        try {
                          require('./auto-updater')({
                            url: 'http://autographaus.bridgeconn.com/releases/win32/0.2.0/Autographa',
                            version: app.getVersion()
                          });
                          updateInProgress = true;
                          // resolve after yes click to install update.
                          resolve('updates available.');
                        }catch(e){
                            dialog.showErrorBox('Update Error', e.message);
                            resolve("update error");
                        }
                    }

                  }else{
                    dbBackedUp = false;
                    resolve('update rejected.');
                    return;
                  }
                }else{
                    resolve("Update not available");
                    return;
                }
              });
            });
            req.on('error', function(error) {
              // Error handling here
              console.log(error)
              dialog.showErrorBox('Update Error', "Error Occurred to check for updates. Please try later..");
              resolve("error occurred");
            });
            req.end();
          } catch (e) {
            dialog.showErrorBox('Update Error', e.message)
            resolve("error occurred");
          }
    })
     .then((response) => {
        
         //return dbSetup;
    return new Promise(
        function (resolve, reject) {
        // Setup database.
        var dbUtil = require(`${__dirname}/app/util/DbUtil.js`);
        dbUtil.setupTargetDb
            .then((response) => {
              return dbUtil.setupRefDb;
            })
            .then((response) => {
              resolve(response);
            }).then((response) => {
              return dbUtil.setupLookupsDb;
            })
            .then((response)=>{
                resolve(response)
            })
            .catch((err) => {
              console.log('Error while DB setup. ' + err);
              reject(err);
            });
        });
     })
     .then((response) => {
      if( updateInProgress == false ){
            createWindow(); 
            win.refDb = require(`${__dirname}/app/util/data-provider`).referenceDb();
            win.targetDb =  require(`${__dirname}/app/util/data-provider`).targetDb();
            win.lookupsDb = require(`${__dirname}/app/util/data-provider`).lookupsDb();
        }else{
           let child = new BrowserWindow({show: false, skipTaskbar: true, frame: false, width: 500, height: 200})
              child.loadURL(`file:${__dirname}/app/views/loading.html`);
              child.once('ready-to-show', () => {
                child.show()
              });
          }
      
     })
     .catch((err) => {
         console.log('Error while App initialization.' + err);
     });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', preProcess);


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
    app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
    createWindow();
    }
});

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

    if ( !fs.existsSync( target ) ) {
        fs.mkdirSync( target );
    }
    //check if folder needs to be created or integrated
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
            return
        } );
    }
}
