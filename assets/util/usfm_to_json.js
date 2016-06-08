var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('test-data/41-MAT.usfm')
});

var book = {}, chapter = [], verse = [];
var counter = 0, c = 0, v = 0;
book.chapters = []

lineReader.on('line', function (line) {
    //    console.log(line);
    line = line.trim();
    splitLine = line.split(' ');
    if(splitLine[0] == '\\id') {
	book._id = splitLine[1];
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
    }  else if(splitLine.length == 1) {
	// Do nothing for now.
    } else if(c > 0) {
	if(line.startsWith('\\')) {
	    book.chapters[c-1].verses[v-1] += (' ' + line.substring(line.indexOf(' ')+1));
	} else {
	    book.chapters[c-1].verses[v-1] += (' ' + line);
	}
    }
});

lineReader.on('close', function(line) {
    console.log(book.chapters[2].verses);
});
