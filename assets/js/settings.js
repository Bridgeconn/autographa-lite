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
				  var refDb = new PouchDB('reference'),
				      files = fs.readdirSync(selectedDir[0]);
				  var ref_id_value = document.getElementById('lang').value + '_' + document.getElementById('version').value,
				      ref_entry = {};
				  ref_entry.ref_id = ref_id_value;
				  ref_entry.ref_name =  'English - NET';
				  ref_entry.isDefault = false;
				  refDb.get('refs').then(function (doc) {
				      var refExistsFlag = false;
				      var updatedDoc = doc.ref_ids.forEach(function (ref_doc) {
					  if(ref_doc.ref_id === ref_id_value) {
					      refExistsFlag = true;
					  }
				      });
				      if(!refExistsFlag) {
					  doc.ref_ids.push(ref_entry);
					  refDb.put(doc).then(function (res) {
					      refDb.close();
					  });
				      } else {
					  refDb.close();
				      }
				  }).catch(function (err) {
				      var refs = {
					  _id: 'refs',
					  ref_ids: []
				      };
				      ref_entry.isDefault = true;
				      refs.ref_ids.push(ref_entry);
				      refDb.put(refs).then(function (res) {
					  refDb.close();
				      });
				  });
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
