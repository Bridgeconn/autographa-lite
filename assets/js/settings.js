const {dialog} = require('electron').remote,
      ipc = require('electron').ipcRenderer,
      PouchDB = require('pouchdb');

var bibUtil = require("../util/usfm_to_json.js"),
    fs = require("fs"),
    path = require("path");

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

document.getElementById('target-import-path').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select import folder for target"
			  }, function (selectedDir) {
			      if(selectedDir != null) {
				  e.target.value = selectedDir;
			      }
			  });
});

document.getElementById('save-btn').addEventListener('click', function (e) {
	if (target_setting() == false)
		return;
    db = new PouchDB('database');
    db.get('targetBible').then(function (doc) {
	db.put({
	    _id: 'targetBible',
	    _rev: doc._rev,
	    targetLang: document.getElementById('target-lang').value,
	    targetVersion: document.getElementById('target-version').value,
	    targetPath: document.getElementById('export-path').value
	}).then(function (e) {
	    db.close();
	    alertModal("Language Setting", "Language setting saved successfully!!");
	});
    }).catch(function (err) {
	db.put({
	    _id: 'targetBible',
	    targetLang: document.getElementById('target-lang').value,
	    targetVersion: document.getElementById('target-version').value,
	    targetPath: document.getElementById('export-path').value
	}).then(function (e) {
	    db.close();
	    alertModal("Language Setting", "Language setting saved successfully!!");
	}).catch(function (err) {
	    db.close();
	    alert_message(".alert-danger", "Something went wrong!! Please try again");
	});
    });
});

document.getElementById('ref-import-btn').addEventListener('click', function (e) {
	if (reference_setting() == false )
		return;
    var refDb = new PouchDB('reference'),
	ref_id_value = document.getElementById('ref-lang-code').value.toLowerCase() + '_' + document.getElementById('ref-version').value.toLowerCase(),
	ref_entry = {},
    	files = fs.readdirSync(document.getElementById('ref-path').value);
    ref_entry.ref_id = ref_id_value;
    ref_entry.ref_name =  document.getElementById('ref-name').value;
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
		saveJsonToDB(files);
		alertModal("Reference Usfm Setting", "Reference Usfm Setting saved successfully!!");
	    });
	} else {
	    saveJsonToDB(files);
	    alertModal("Reference Usfm Setting", "Reference Usfm Setting saved successfully!!");
	}
    }).catch(function (err) {
	var refs = {
	    _id: 'refs',
	    ref_ids: []
	};
	ref_entry.isDefault = true;
	refs.ref_ids.push(ref_entry);
	refDb.put(refs).then(function (res) {
	    saveJsonToDB(files);
	    alertModal("Reference Usfm Setting", "Reference Usfm Setting saved successfully!!");
	});
    });
});

document.getElementById('target-import-btn').addEventListener('click', function (e) {
	if (import_sync_setting() == false)
		return;
    var contents = require('fs').readFileSync('./lib/full_net_bible.json', {
			encoding: 'utf8',
			flag: 'r'
    });
    eng_bible = JSON.parse(contents);
    var codesList = require('../util/constants.js').bookCodeList, i;
    for(i=0; i<eng_bible.length; i++) {
			eng_bible[i]._id = "en_net_" + codesList[i];
			delete eng_bible[i].bible_name;
			delete eng_bible[i].book_name;
			delete eng_bible[i].language_code;
			delete eng_bible[i].version;
    }
    console.log(eng_bible);
    require('fs').writeFileSync('./output_en.json', JSON.stringify(eng_bible), {
			encoding: 'utf8',
			flag: 'w'
    });

    var inputPath = document.getElementById('target-import-path').value;
    var files = fs.readdirSync(inputPath);
    files.forEach(function (file) {
			var filePath = path.join(inputPath, file);
			if(fs.statSync(filePath).isFile() && !file.startsWith('.')) {
		//	    console.log(filePath);
			    var options = {
						lang: 'hi',
						version: 'ulb',
						usfmFile: filePath,
						targetDb: 'target'
			    }
			    bibUtil.toJson(options);
			}
    });
    alertModal("Import and Sync", "Import and Sync Setting saved successfully!!");
});


function saveJsonToDB(files) {
    files.forEach(function (file) {
	if(!file.startsWith('.')) {
	    var filePath = path.join(document.getElementById('ref-path').value, file);
	    //				      console.log(filePath + ' ' + fs.statSync(filePath).isFile());
	    if(fs.statSync(filePath).isFile()) {
		var options = {
		    lang: document.getElementById('ref-lang-code').value.toLowerCase(),
		    version: document.getElementById('ref-version').value.toLowerCase(),
		    usfmFile: filePath,
		    targetDb: 'refs'
		}
		bibUtil.toJson(options);
	    }
	}
    });
}

document.getElementById('ref-path').addEventListener('click', function (e) {
    dialog.showOpenDialog({properties: ['openDirectory'],
			   filters: [{name: 'All Files', extensions: ['*']}],
			   title: "Select reference version folder"
			  }, function (selectedDir) {
			      if(selectedDir != null) {
				  e.target.value = selectedDir;
			      }
			  });
});



// Validation check for reference settings
function reference_setting(){
  var name     = $("#ref-name").val(),
  	 langCode = $("#ref-lang-code").val(),
  	 version  = $("#ref-version").val(),
  	 path     = $("#ref-path").val(),
  	 isValid = true;
  if(name == ""){
    alert_message(".alert-danger", "Reference Bible name must not be blank");
    isValid = false;
  }else if(langCode === null || langCode === "") {
    alert_message(".alert-danger", "Reference Bible language code must not be blank");
     isValid = false;
  }else if(version === null || version === ""){
    alert_message(".alert-danger", "Reference Bible version must not be blank");
    isValid = false;
  }else if(path === null || path === ""){
    alert_message(".alert-danger", "Reference Bible path must not be blank");
    isValid = false;
  }else{
    isValid = true;
    
  }
  return isValid;
} //validation reference settings

// Validation check for target language settings
function target_setting(){
  var langCode  = $("#target-lang").val(),
  	 version   = $("#target-version").val(),
  	 path     = $("#export-path").val(),
     isValid = true;

  if(langCode === null || langCode === ""){
    alert_message(".alert-danger", "Target Bible language code must not be blank");
    isValid = false;
  }else if(version === null || version === ""){
    alert_message(".alert-danger", "Target Bible version must not be blank");
    isValid = false;
  }else if(path === null || path === ""){
    alert_message(".alert-danger", "Target Bible path must not be blank");
    isValid = false;
  }else{
    isValid = true;
  }
  return isValid;
} //validation target setting

function import_sync_setting(){
	var targetImportPath = $("#target-import-path").val();
	isValid = true;
	if ( targetImportPath === null || targetImportPath === "") {
		alert_message(".alert-danger", "Import and Sync target must not be blank.");
    	isValid = false;
	}
	return isValid;
}

function alert_message(type,message){
  $(type).css("display", "block");
    $(type).fadeTo(2000, 1000).slideUp(1000, function(){
       $(type).css("display", "none");
    });
  $(type+" "+"span").html(message);
}

function setReferenceSetting(){
	db = new PouchDB('database');
	db.get('targetBible').then(function (doc) {
		$("#target-lang").val(doc.targetLang);
  	 	$("#target-version").val(doc.targetVersion);
  	 	$("#export-path").val(doc.targetPath);
	}).catch(function (err) {
		$("#target-lang").val("");
  	 	$("#target-version").val("");
  	 	$("#export-path").val("");
	});	
}
//get reference setting
$(function(){
	setReferenceSetting();
});

function alertModal(heading, formContent) {
  $("#heading").html(heading);
  $("#content").html(formContent);
  $("#dynamicModal").modal();
  $("#dynamicModal").toggle();
}