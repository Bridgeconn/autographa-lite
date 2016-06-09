module.exports = {
    /*
      All keys of options are required!
      e.g: options = {lang: 'en', version: 'udb', usfmFile: /home/test-data/L66_1 Corinthians_I.SFM}
    */
    
    toJson: function(options) {
	var lineReader = require('readline').createInterface({
	    input: require('fs').createReadStream(options.usfmFile)
	});

	const PouchDB = require('pouchdb');
	var refDb = new PouchDB('reference');
	
	var book = {}, verse = [];
	var c = 0, v = 0;
	var id_prefix = options.lang + '_' + options.version + '_';
	book.chapters = []

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
	    refDb.get(book._id).then(function (doc) {
		book._rev = doc._rev;
		db.put(book);
	    }).catch(function (err) {
		refDb.put(book);
	    });
	});
    }
};

