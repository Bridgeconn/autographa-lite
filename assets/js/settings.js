const {dialog} = require('electron').remote;
var bibUtil = require("../util/usfm_to_json.js");
const ipc = require('electron').ipcRenderer;

//bibUtil.toJson(options);
require('electron').remote.getCurrentWindow().removeAllListeners();

document.getElementById('ref-select-btn').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select reference folder"
			  }, function (selection) {
			      console.log('selection is' + selection);
			      if(selection != null) {
				  options = {
				      lang: document.getElementById('lang').value,
				      version: document.getElementById('version').value,
				      usfmFile: selection[0]
				  }
				  console.log(options);
				  //TODO Connect this to util.
//				  bibUtil.toJson(options);
			      }
			  });    
});

