const {dialog} = require('electron').remote,
      ipc = require('electron').ipcRenderer,
      PouchDB = require('pouchdb');

var bibUtil = require("../util/usfm_to_json.js"),
    fs = require("fs"),
    path = require("path");

/*const PouchDB = require('pouchdb');
var refDb = new PouchDB('reference');
refDb.destroy().then(function (response) {
    console.log(response);
    console.log('done destroying.');
  // success
}).catch(function (err) {
  console.log(err);
});
db.get('targetBible').then(function (doc) {
    console.log(doc);
}).catch(function (err) {
    console.log(err);
});*/

document.getElementById('export-path').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select export destination folder"
			  }, function (selectedDir) {
			      if(selectedDir != null) {
				  e.target.value = selectedDir;
			      }
			  });
});

document.getElementById('save-btn').addEventListener('click', function (e) {
    db = new PouchDB('database');
    db.get('targetBible').then(function (doc) {
	console.log(doc);
	db.put({
	    _id: 'targetBible',
	    _rev: doc._rev,
	    targetLang: document.getElementById('target-lang').value,
	    targetVersion: document.getElementById('target-version').value,
	    targetPath: document.getElementById('export-path').value  
	}).then(function (e) {
	    db.close();
	});
    }).catch(function (err) {
	db.put({
	    _id: 'targetBible',
	    targetLang: document.getElementById('target-lang').value,
	    targetVersion: document.getElementById('target-version').value,
	    targetPath: document.getElementById('export-path').value  
	}).then(function (e) {
	    db.close();
	}).catch(function (err) {
	    db.close();
	});
    });
});

document.getElementById('ref-select-btn').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select reference folder"
			  }, function (selectedDir) {
			      if(selectedDir != null) {
				  var files = fs.readdirSync(selectedDir[0]);
				  files.forEach(function (file) {
				      var filePath = path.join(selectedDir[0], file);
//				      console.log(filePath + ' ' + fs.statSync(filePath).isFile());
				      if(fs.statSync(filePath).isFile()) {
					  var options = {
					      lang: document.getElementById('lang').value,
					      version: document.getElementById('version').value,
					      usfmFile: filePath
					  }
					  bibUtil.toJson(options);
				      }
				  });
			      }
			  });
});
