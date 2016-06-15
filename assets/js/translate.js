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
	var v = document.createElement('textarea');
	v.className = "form-control";
	v.setAttribute("rows", "3");
	v.id = "v"+i;
	document.getElementById('verses-group').appendChild(v);
    }
}

session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    book = cookie[0].value;
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	chapter = cookie[0].value;
	console.log('values are ' + book + ' ' + chapter);
	db.get(book.toString()).then(function (doc) {
	    console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
	    createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses.length);
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});	
    });
});
