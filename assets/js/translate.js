const session = require('electron').remote.session,
      PouchDB = require('pouchdb');

var db = new PouchDB('database');

document.getElementById("save-btn").addEventListener("click", function (e) {
    db.get('isDBSetup').then(function (doc) {
	db.get('1').then(function (doc) {
	    doc.chapters[0].verses[0] = "An edited verse."
	    return db.put({
		_id: '1',
		_rev: doc._rev,
		chapters: doc.chapters
	    });
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});	
    }).catch(function (err) {
	console.log("Error: Database not setup. " + err);
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

function createVerseInputs(verseLimit) {
    var i;
    for (i=1; i<=verseLimit; i++) {
	var divContainer = document.createElement('div'),
	    divVerseNum = document.createElement('div'),
	    divVerse = document.createElement('div');

	divVerse.contentEditable = true;
	divVerse.style.cssText = 'width:95%;float:right';
	divVerseNum.appendChild(document.createTextNode(i));
	divVerseNum.style.cssText = 'width:5%;float:left;';
	divContainer.appendChild(divVerseNum);
	divContainer.appendChild(divVerse);

	document.getElementById('verses-group').appendChild(divContainer);
    }
}

session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    var book = cookie[0].value;
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	var chapter = cookie[0].value;
	console.log('values are ' + book + ' ' + chapter);
	db.get(book.toString()).then(function (doc) {
	    console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
	    createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses.length);
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});	
    });
});

var bookCodeList = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];

function showReferenceText(ref_id) {
    session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
	var book = cookie[0].value;
	session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	    var chapter = cookie[0].value,
		refDb = new PouchDB('reference'),
		id = ref_id + '_' + bookCodeList[parseInt(book,10)-1];
	    refDb.get(id).then(function (doc) {
		//	    document.getElementById('ref').innerHTML = doc.chapters[parseInt(chapter,10)-1].verses;
		document.getElementById('ref').innerHTML = doc.chapters[parseInt(chapter,10)-1].verses.map(function (verse, verseNum) {
		    return '<span>  <sup>' + (verseNum+1) + '</sup>' + verse + '</span>';
		}).join('');
	    }).catch(function (err) {
		console.log('Error: Unable to find requested reference in DB. ' + err);
	    });
	});
    });
}

function createRefSelections() {
    refDb = new PouchDB('reference'),
    refDb.get('refs').then(function (doc) {
	console.log(doc);
	doc.ref_ids.forEach(function (ref_doc) {
	    if(ref_doc.isDefault) {
		showReferenceText(ref_doc.ref_id);
	    }
	    var s = document.createElement('option');
	    var t = document.createTextNode(ref_doc.ref_name);
	    s.appendChild(t);
	    document.getElementById('refs-select').appendChild(s);
	});
    }).catch(function (err) {
	console.log('Info: No references found in Database. ' + err);
    });
}

createRefSelections();
