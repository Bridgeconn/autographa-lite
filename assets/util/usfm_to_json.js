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
	    //    console.log(line);
	    var line = line.trim();
	    var splitLine = line.split(' ');
	    if(splitLine[0] == '\\id') {
		temp = id_prefix + splitLine[1];
		book._id = id_prefix + splitLine[1];
	    } else if(splitLine[0] == '\\c') {
		book.chapters.push({
		    "verses": verse
		});
		verse = [];
		c++;
		v = 0;
	    } else if(splitLine[0] == '\\v') {
		book.chapters[c-1].verses.push(line.substring(line.indexOf(' ', 3)+1));
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
	    const PouchDB = require('pouchdb');
	    var db;
	    if(options.targetDb === 'refs') {
		db = new PouchDB('reference');
		db.get(book._id).then(function (doc) {
		    book._rev = doc._rev;
		    db.put(book);
		}).catch(function (err) {
		    db.put(book);
		});
	    } else if(options.targetDb === 'target') {
		console.log('in here then');
		db = new PouchDB('database');
		const booksCodes = require('./constants.js').bookCodeList;
		var bookId = book._id.split('_');
		bookId = bookId[bookId.length-1].toUpperCase();
		var i;
		for(i=0; i<booksCodes.length; i++) {
		    if(bookId === booksCodes[i]) {
			i++;
			break;
		    }
		}
		console.log(i);
		db.get(i.toString()).then(function (doc) {
		    console.log(doc);
		});
	    }
	});
    }
};

