const timeStamp = require('./timestamp');
module.exports = {
    toUsfm: function (book, stage, targetLangDoc) {
	const PouchDB = require('pouchdb-core')
	      .plugin(require('pouchdb-adapter-leveldb'));
//	const PouchDB = require('pouchdb');
	var db = electron.getCurrentWindow().targetDb;
	//var db = new PouchDB(`${__dirname}/../../db/targetDB`);
	var fs = require("fs"),
	    path = require("path"),
	    usfmContent = [];
	var filePath;
	usfmContent.push('\\id ' + book.bookCode);
	usfmContent.push('\\mt ' + book.bookName);
	return db.get(book.bookNumber).then(function (doc) {
	    var chapterLimit = doc.chapters.length;
	    doc.chapters.forEach(function (chapter, index) {
		usfmContent.push('\n\\c ' + chapter.chapter);
		usfmContent.push('\\p');
		chapter.verses.forEach(function (verse) {
		    // Push verse number and content.
		    usfmContent.push('\\v ' + verse.verse_number + ' ' + verse.verse);
		});
		if(index === chapterLimit-1) {
		    exportName = targetLangDoc.targetLang+"_"+ targetLangDoc.targetVersion+"_"+book.bookCode+"_"+stage+ "_" + timeStamp.getTimeStamp(new Date()); 
		    filePath = path.join(book.outputPath, exportName);
		    filePath += '.usfm';
		    fs.writeFileSync(filePath, usfmContent.join('\n'), 'utf8');
		    console.log('File exported at ' + filePath);
		    //db.close();
		}
	    });
	    return filePath;
	}).then(function(path){
	    return path;
	}).catch(function (err) {
	    console.log(err);
	});
    }
};


