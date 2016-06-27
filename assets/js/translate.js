const session = require('electron').remote.session,
      PouchDB = require('pouchdb');

var db = new PouchDB('database'),
    refDb = new PouchDB('reference'),
    book,
    chapter,
    currentBook;

document.getElementById("save-btn").addEventListener("click", function (e) {
    var verses = currentBook.chapters[parseInt(chapter,10)-1].verses;
    verses.forEach(function (verse, index) {
	var vId = 'v'+(index+1);
	console.log(vId);
	verse.verse = document.getElementById(vId).textContent;
    });

    currentBook.chapters[parseInt(chapter,10)-1].verses = verses;
    db.put(currentBook).then(function (response) {
	console.log('Saved changes.');
    }).catch(function (err) {
	console.log('Error: While retrieving document. ' + err);
    });
});


/*document.getElementById("load-btn").addEventListener("click", function (e) {
  db.get('isDBSetup').then(function (doc) {
  db.get('1').then(function (doc) {
  document.getElementById("load-btn").addEventListener("click", function (e) {
  db.get('isDBSetup').then(function (doc) {
  db.get('1').then(function (doc) {
  console.log("Loading..");
  }); */

function createVerseInputs(verses, chunks, chapter) {
    var i, chunkIndex = 0, chunkVerseStart, chunkVerseEnd;
    for(i=0; i<chunks.length; i++) {
	if(parseInt(chunks[i].chp, 10) === parseInt(chapter, 10)) {
	    chunkIndex = i+1;
	    chunkVerseStart = parseInt(chunks[i].firstvs, 10);
	    chunkVerseEnd = parseInt(chunks[i+1].firstvs, 10) - 1;
	    break;
	}
    }

    for (i=1; i<=verses.length; i++) {
	var divContainer = document.createElement('div'),
	    divVerseNum = document.createElement('div'),
	    divVerse = document.createElement('div');
	if(i > chunkVerseEnd) {
	    chunkVerseStart = parseInt(chunks[chunkIndex].firstvs, 10);
	    if(chunkIndex === chunks.length-1 || parseInt((chunks[chunkIndex+1].chp), 10) != chapter) {
		chunkVerseEnd = verses.length;
	    } else {
		chunkIndex++;
		chunkVerseEnd = parseInt(chunks[chunkIndex].firstvs, 10)-1;
	    }
	}
	var chunk = chunkVerseStart + '-' + chunkVerseEnd;
	divVerse.setAttribute("chunk-group", chunk);
	divVerse.contentEditable = true;
	divVerse.style.cssText = 'width:95%;float:right';
	divVerse.id = "v"+i;
	divVerse.appendChild(document.createTextNode(verses[i-1].verse));
	divVerseNum.appendChild(document.createTextNode(i));
	divVerseNum.style.cssText = 'width:5%;float:left;';
	divContainer.appendChild(divVerseNum);
	divContainer.appendChild(divVerse);

	document.getElementById('input-verses-group').appendChild(divContainer);
    }
    highlightRef();
}

session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    book = cookie[0].value;
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	chapter = cookie[0].value;
	console.log('values are ' + book + ' ' + chapter);
	db.get(book).then(function (doc) {
	    refDb.get('refChunks').then(function (chunkDoc) {
		console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
		currentBook = doc;
		createRefSelections();
		createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses, chunkDoc.chunks[parseInt(book,10)-1], chapter);
	    });
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});
    });
});

var bookCodeList = require('../util/constants.js').bookCodeList;

function showReferenceText(ref_id) {
    ref_id = (ref_id === 0 ? document.getElementById('refs-select').value : ref_id);
    var id = ref_id + '_' + bookCodeList[parseInt(book,10)-1],
	i;
    console.log('id is = ' + id);
    refDb.get(id).then(function (doc) {
	for(i=0; i<doc.chapters.length; i++) {
	    if(doc.chapters[i].chapter == parseInt(chapter, 10)) {
		break;
	    }
	}
	document.getElementById('ref').innerHTML = doc.chapters[i].verses.map(function (verse, verseNum) {
	    return '<span id="r'+ (verseNum+1) +'">  <sup>' + (verseNum+1) + '</sup>' + verse.verse + '</span>';
	}).join('');
    }).catch(function (err) {
	console.log('Error: Unable to find requested reference in DB. ' + err);
    });
}

function createRefSelections() {
    refDb.get('refs').then(function (doc) {
	console.log(doc);
	doc.ref_ids.forEach(function (ref_doc) {
	    if(ref_doc.isDefault) {
		showReferenceText(ref_doc.ref_id);
	    }
	    var s = document.createElement('option');
	    s.value = ref_doc.ref_id;
	    var t = document.createTextNode(ref_doc.ref_name);
	    s.appendChild(t);
	    document.getElementById('refs-select').appendChild(s);
	});
    }).catch(function (err) {
	console.log('Info: No references found in Database. ' + err);
    });
}

document.getElementById("refs-select").addEventListener("change", function (e) {
    showReferenceText(e.target.value);
});

function highlightRef() {
    var i,
	j,
	verses = document.querySelectorAll("div[id^=v]");
    for(i=0; i<verses.length; i++) {
	verses[i].addEventListener("focus", function (e) {
	    var limits = e.target.getAttribute("chunk-group").split("-").map(function (element) {
		return parseInt(element, 10) - 1;
	    });;
	    console.log(limits);
	    var refs = document.querySelectorAll("span[id^=r]");
	    refs.forEach(function (ref) {
		ref.className = "";
	    });
	    for(j=limits[0]; j<=limits[1]; j++) {
		refs[j].className = "highlight";
	    }
	});
    }
}
