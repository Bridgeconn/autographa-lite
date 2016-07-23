module.exports = {
    toUsfm: function (book) {
	console.log(book);
	const PouchDB = require('pouchdb');
	var db = new PouchDB('database'),
	    fs = require("fs"),
	    path = require("path"),
	    usfmContent = [];
	 var filePath;
	usfmContent.push('\\id ' + book.bookCode);
	usfmContent.push('\\mt ' + book.bookName);
	return db.get(book.bookNumber).then(function (doc) {
	    var chapterLimit = doc.chapters.length;
		doc.chapters.forEach(function (chapter, index) {
	//		console.log(chapter);

			// Push chapter number.
			usfmContent.push('\n\\c ' + chapter.chapter);

			chapter.verses.forEach(function (verse) {
			    // Push verse number and content.
			    usfmContent.push('\\v ' + verse.verse_number + ' ' + verse.verse);
			});
			if(index === chapterLimit-1) {
	//		    console.log(usfmContent);
			     filePath = path.join(book.outputPath, book.bookName);
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
