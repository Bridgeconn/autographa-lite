const electron = require('electron');
const session = require('electron').session;
if(require('electron-squirrel-startup')) return;

// Module to control application life.
const {app} = electron
// Module to create native browser window.
const {BrowserWindow} = electron;

require('./application-menu.js');
const autoUpdater = require('./auto-updater');
var http = require("http");
const fs = require('original-fs');
const path = require('path');
const mkdirp = require('mkdirp');
const dialog = require('electron').dialog;
const dir = path.join(app.getPath('temp'), '..', 'Autographa');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let willQuitApp = false;

let getLatestRelease = () => {
  const versionsDesc = fs.readdirSync(dir).filter((file) => {
    if(file.startsWith("app-")){
      const filePath = path.join(dir, file);
      return fs.statSync(filePath).isDirectory();
    }
  }).reverse();
  return versionsDesc[0];
}


function deleteFile(dir, file) {
    return new Promise(function (resolve, reject) {
        var filePath = path.join(dir, file);
        fs.lstat(filePath, function (err, stats) {
            if (err) {
                return reject(err);
            }
            if (stats.isDirectory()) {
                resolve(deleteDirectory(filePath));
            } else {
                fs.unlink(filePath, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }
        });
    });
};

function deleteDirectory(dir) {
    return new Promise(function (resolve, reject) {
        fs.access(dir, function (err) {
            if (err) {
                return reject(err);
            }
            fs.readdir(dir, function (err, files) {
                if (err) {
                    return reject(err);
                }
                Promise.all(files.map(function (file) {
                    return deleteFile(dir, file);
                })).then(function () {
                    fs.rmdir(dir, function (err) {
                        if (err) {
                          console.log(err)
                            return reject(err);
                        }
                        resolve();
                    });
                }).catch(reject);
            });
        });
    });
};


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
	// win.webContents.openDevTools();	
	win.maximize();
        win.show();
    });


    // Emitted when the window is closed.
    win.on('close', (e) => {  
          /* the user tried to quit the app */
          if(autoUpdaterOptions.updateDownloaded) {
              win.refDb.close();
              win.targetDb.close();
              win.lookupsDb.close();
              if(fs.existsSync(path.join(`${__dirname}`, 'db'))){
                copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), app.getPath('userData'));
                var ds = (new Date()).toISOString().replace(/[^0-9]/g, "");
                copyFolderRecursiveSync(path.join(`${__dirname}`, 'db'), path.join(app.getPath('userData'), "DB_backups", "db_backup_"+ds));
              }
              win = null;
          }
          else{
            win = null;
          }
      app.quit();
    });
}


function preProcess() {
    return new Promise(
    function (resolve, reject) {
    
        // If DB does not exist in the application dir
        if(!fs.existsSync(path.join(`${__dirname}`, 'db'))){ 
            if(fs.existsSync(app.getPath('userData')+'/db')){
                copyFolderRecursiveSync((app.getPath('userData')+'/db'), path.join(`${__dirname}`));
                resolve("db copied");
                return
            }else{
                resolve('new installation');
                return;
            }

        }else{
          resolve("db already exist");
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
            if (fs.existsSync(dir)){
              fs.readdirSync(dir).filter((file) => {
                  if(file.startsWith("app-") && file != getLatestRelease()){
                    const filePath = path.join(dir, file);
                    deleteDirectory(filePath).then(function(res){
                      console.log(res)
                    }).catch(function(err){
                      console.log(err);
                    })
                  }
              });
            }
            createWindow(); 
            win.refDb = require(`${__dirname}/app/util/data-provider`).referenceDb();
            win.targetDb =  require(`${__dirname}/app/util/data-provider`).targetDb();
            win.lookupsDb = require(`${__dirname}/app/util/data-provider`).lookupsDb();
            autoUpdaterOptions = {refDb: win.refDb, updateDownloaded: false}
            autoUpdater.initialize(autoUpdaterOptions);
     })
     .catch((err) => {
         console.log('Error while App initialization.' + err);
     });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', preProcess);

app.on('before-quit', () => willQuitApp = true);



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
        mkdirp.sync( targetFolder );
    }
    if(!fs.existsSync(app.getPath('userData')+'/DB_backups')){
      mkdirp.sync(app.getPath('userData')+"/DB_backups")
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
