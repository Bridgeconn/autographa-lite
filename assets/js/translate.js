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

function createVerseInputs(verses) {
    var i;
    for (i=1; i<=verses.length; i++) {
	var divContainer = document.createElement('div'),
	    divVerseNum = document.createElement('div'),
	    divVerse = document.createElement('div');

	divVerse.contentEditable = true;
	divVerse.style.cssText = 'width:95%;float:right';
	divVerse.id = "v"+i;
	divVerse.appendChild(document.createTextNode(verses[i-1].verse));
	divVerseNum.appendChild(document.createTextNode(i));
	divVerseNum.style.cssText = 'width:5%;float:left;';
	divContainer.appendChild(divVerseNum);
	divContainer.appendChild(divVerse);

	document.getElementById('verses-group').appendChild(divContainer);
    }
}

session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    book = cookie[0].value;
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	chapter = cookie[0].value;
	console.log('values are ' + book + ' ' + chapter);
	db.get(book).then(function (doc) {
	    console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
	    currentBook = doc;
	    createRefSelections();
	    createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses);
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});	
    });
});

var bookCodeList = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];

function showReferenceText(ref_id) {
    ref_id = (ref_id === 0 ? document.getElementById('refs-select').value : ref_id);
    var id = ref_id + '_' + bookCodeList[parseInt(book,10)-1];
    console.log('id is = ' + id)
    refDb.get(id).then(function (doc) {
	//	    document.getElementById('ref').innerHTML = doc.chapters[parseInt(chapter,10)-1].verses;
	document.getElementById('ref').innerHTML = doc.chapters[parseInt(chapter,10)-1].verses.map(function (verse, verseNum) {
	    return '<span>  <sup>' + (verseNum+1) + '</sup>' + verse + '</span>';
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
