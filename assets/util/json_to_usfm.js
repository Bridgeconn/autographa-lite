var exp = function (book) {
    const PouchDB = require('pouchdb');
    var db = new PouchDB('database'),
	fs = require("fs");
    var usfmContent = []
    db.get(book).then(function (doc) {
	var chapterLimit = doc.chapters.length;
	doc.chapters.forEach(function (chapter, index) {
	    console.log(chapter);

	    // Push chapter number.
	    usfmContent.push('\n\\c ' + chapter.chapter);

	    chapter.verses.forEach(function (verse) {
		// Push verse number and content.
		usfmContent.push('\\v ' + verse.verse_number + ' ' + verse.verse);
	    });
	    if(index === chapterLimit-1) {
		console.log(usfmContent);
		fs.writeFileSync('out.usfm', usfmContent.join('\n'), 'utf8');
		console.log('it is done.');
		db.close();
	    }
	});
    }).catch(function (err) {
	console.log('Do nothing.');
    });
}

exp('40');
