module.exports = {
    toUsfm: function (book, stage, targetLangDoc) {
	const PouchDB = require('pouchdb');
	var db = new PouchDB('./db/targetDB'),
	    fs = require("fs"),
	    path = require("path"),
	    usfmContent = [];
	 var filePath;
	usfmContent.push('\\id ' + book.bookCode);
	usfmContent.push('\\mt ' + book.bookName);
	return db.get(book.bookNumber).then(function (doc) {
	    var chapterLimit = doc.chapters.length;
		doc.chapters.forEach(function (chapter, index) {

			usfmContent.push('\n\\c ' + chapter.chapter);
			chapter.verses.forEach(function (verse) {
			    // Push verse number and content.
			    usfmContent.push('\\v ' + verse.verse_number + ' ' + verse.verse);
			});
			if(index === chapterLimit-1) {
				//var dateString = new Date(new Date().getTime()).format("dd-MM-yyyy hh:mm");
				exportName = targetLangDoc.targetLang+"_"+ targetLangDoc.targetVersion+"_"+book.bookCode+"_"+stage+ "_" + getTimeStamp(new Date()); 
			    filePath = path.join(book.outputPath, exportName);
			    filePath += '.usfm';
			    fs.writeFileSync(filePath, usfmContent.join('\n'), 'utf8');
			    console.log('File exported at ' + filePath);
			    db.close();
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

function getTimeStamp(date) {
	var year = date.getFullYear(),
        month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1), // months are zero indexed
        day = (date.getDate() < 10 ? '0' : '') + date.getDate(),
        hour = (date.getHours() < 10 ? '0' : '') + date.getHours(),
        minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
        second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        //hourFormatted = hour % 12 || 12, // hour returned in 24 hour format
        //minuteFormatted = minute < 10 ? "0" + minute : minute,
        //morning = hour < 12 ? "am" : "pm";
    	return (year.toString().substr(2,2) + month + day +  hour + minute + second).toString();
}

