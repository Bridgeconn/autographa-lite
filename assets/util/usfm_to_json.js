module.exports = {
    /*
      All keys of options are required!
      e.g: options = {lang: 'en', version: 'udb', usfmFile: /home/test-data/L66_1 Corinthians_I.SFM}
    */
    
    toJson: function(options) {
	var lineReader = require('readline').createInterface({
	    input: require('fs').createReadStream(options.usfmFile)
	});
	
	var book = {}, verse = [];
	var c = 0, v = 0;
	var id_prefix = options.lang + '_' + options.version + '_';
	book.chapters = [];

	lineReader.on('line', function (line) {
	    var line = line.trim();
	    var splitLine = line.split(' ');
	    if(!line) {
		//Do nothing for empty lines.
	    } else if(splitLine[0] == '\\id') {
		temp = id_prefix + splitLine[1];
		book._id = id_prefix + splitLine[1];
	    } else if(splitLine[0] == '\\c') {
		book.chapters.push({
		    "verses": verse,
		    "chapter": parseInt(splitLine[1], 10)
		});
		verse = [];
		c++;
		v = 0;
	    } else if(splitLine[0] == '\\v') {
		book.chapters[c-1].verses.push({
		    "verse_number": parseInt(splitLine[1], 10),
		    "verse": line.substring(line.indexOf(' ', 3)+1)
		});
		v++;
	    } else if(splitLine[0] == '\\s') {
		//Do nothing for section headers now.
	    } else if(splitLine.length == 1) {
		// Do nothing for now here.
	    } else if(c > 0) {
		if(line.startsWith('\\')) {
		    book.chapters[c-1].verses[v-1] += (' ' + line.substring(line.indexOf(' ')+1));
		} else {
		    book.chapters[c-1].verses[v-1] += (' ' + line);
		}
	    }
	});

	lineReader.on('close', function(line) {
/*	    console.log(book);
	    require('fs').writeFileSync('./output.json', JSON.stringify(book), {
		encoding: 'utf8',
		flag: 'a'
	    });
	    require('fs').writeFileSync('./output.json', ',\n', {
		encoding: 'utf8',
		flag: 'a'
	    });*/
	    
	    const PouchDB = require('pouchdb');
	    var db;
	    if(options.targetDb === 'refs') {
		db = new PouchDB('reference');
		db.get(book._id).then(function (doc) {
		    book._rev = doc._rev;
		    db.put(book).then(function (doc) {
			console.log("Successfully loaded and updated refs.");
		    }).catch(function (err) {
			console.log("Error: While updating refs. " + err);
		    });
		}).catch(function (err) {
		    db.put(book).then(function (doc) {
			console.log("Successfully loaded new refs.");
		    }).catch(function (err) {
			console.log("Error: While loading new refs. " + err);
		    });
		});
	    } else if(options.targetDb === 'target') {
		db = new PouchDB('database');
		const booksCodes = require('./constants.js').bookCodeList;
		var bookId = book._id.split('_');
		bookId = bookId[bookId.length-1].toUpperCase();
		var i, j, k;
		for(i=0; i<booksCodes.length; i++) {
		    if(bookId === booksCodes[i]) {
			i++;
			break;
		    }
		}
		db.get(i.toString()).then(function (doc) {
		    for(i=0; i<doc.chapters.length; i++) {
			for(j=0; j<book.chapters.length; j++) {
			    if(book.chapters[j].chapter === doc.chapters[i].chapter) {
				var versesLen = Math.min(book.chapters[j].verses.length, doc.chapters[i].verses.length);
				for(k=0; k<versesLen; k++) {
				    var verseNum = book.chapters[j].verses[k].verse_number;
				    doc.chapters[i].verses[verseNum-1] = book.chapters[j].verses[k];
				    book.chapters[j].verses[k] = undefined;
				}
				//check for extra verses in the imported usfm here.
				break;
			    }
			}
		    }
		    db.put(doc).then(function (response) {
			console.log(response);
		    }).catch(function (err) {
			console.log('Error: While trying to save to DB. ' + err);
		    });
		});
	    }
	});
    }
};

