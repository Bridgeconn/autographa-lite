const session = require('electron').remote.session,
      ipc = require('electron').ipcRenderer,
      {Menu} = require('electron').remote,
      PouchDB = require('pouchdb');
var bibUtil = require("../util/json_to_usfm.js");

const menu = Menu.buildFromTemplate([
    {
        label: 'Autographa',
	submenu: [
	    {
		label: 'Settings',
		click: function () {
		    ipc.sendSync('show-import-window');
		}
	    }
	]
    }
]);

Menu.setApplicationMenu(menu);

var booksList = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];

function createBooksList(booksLimit) {
    var i;
    for (i=1; i<=booksLimit; i++) {
	b = document.createElement('button');
	b.className = "stack pseudo button";
	b.id = "b"+i;
	t = document.createTextNode(booksList[i-1]);
	b.appendChild(t);
	document.getElementById('leftpane').appendChild(b);
    }
}

function createChaptersList(chaptersLimit) {
    var i;
    for (i=1; i<=chaptersLimit; i++) {
	c = document.createElement('button');
	c.className = "access pseudo button";
	t = document.createTextNode(i);
	c.appendChild(t);
	c.id = "c"+i;
	document.getElementById('chapters-pane').appendChild(c);
	c.addEventListener('click', function (e) {
	    const cookie = {url: 'http://chapter.autographa.com', name: 'chapter', value: e.target.id.substring(1)};
	    session.defaultSession.cookies.set(cookie, (error) => {
		if (error)
		    console.error(error);
	    });
	    const reply = ipc.sendSync('synchronous-message', 'ping');
	    const message = `Synchronous message reply: ${reply}`;
	});
    }
}

createBooksList(66);

books = document.querySelectorAll("button[id^=b]");
for(i=1; i<=books.length; i++) {
    books[i-1].addEventListener("click", function (e) {
	const cookie = {url: 'http://book.autographa.com', name: 'book', value: e.target.id.substring(1)};
	session.defaultSession.cookies.set(cookie, (error) => {
	    if (error)
		console.error(error);
	});
	var db = new PouchDB('database');
	db.get(e.target.id.substring(1).toString()).then(function (doc) {
	    chaptersPane = document.getElementById("chapters-pane");
	    while (chaptersPane.lastChild) {
		chaptersPane.removeChild(chaptersPane.lastChild);
	    }
	    createChaptersList(doc.chapters.length);
	    db.close();
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	    db.close();
	});
    });
}

document.getElementById("export-btn").addEventListener("click", function (e) {
    session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
	console.log(cookie);
	book = {};
	var db = new PouchDB('database');
	db.get('targetBible').then(function (doc) {
	    console.log(doc);
	    book.bookNumber = cookie[0].value;
	    book.bookName = booksList[parseInt(book.bookNumber, 10)-1];
	    book.outputPath = doc.targetPath;
	    bibUtil.toUsfm(book);	    
	}).catch(function (err) {
	    console.log('Error: Cannot get details from DB');
	});
    });
});
