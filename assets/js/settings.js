const {dialog} = require('electron').remote;
const ipc = require('electron').ipcRenderer;

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
});*/

document.getElementById('ref-select-btn').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select reference folder"
			  }, function (selectedDir) {
			      console.log('selection is' + selectedDir);
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
				  //TODO Connect this to util.
			      }
			  });
});

