const session = require('electron').remote.session;
const ipc = require('electron').ipcRenderer;

const PouchDB = require('pouchdb');
var db = new PouchDB('database');

// Query all cookies.
session.defaultSession.cookies.get({url: 'http://index.autographa.com'}, (error, cookie) => {
//    console.log(cookie[0].name);
    console.log(cookie[0].name + "|" + cookie[0].value);
});

const syncMsgBtn = document.getElementById('sync-msg');

syncMsgBtn.addEventListener('click', function () {
    const reply = ipc.sendSync('synchronous-message', 'ping');
    const message = `Synchronous message reply: ${reply}`;
    document.getElementById('sync-reply').innerHTML = message;
});

function createBooksList(booksLimit) {
    var i;
    for (i=1; i<=booksLimit; i++) {  
	b = document.createElement('button');
	b.className = "btn btn-default";
	b.id = "b"+i;
	t = document.createTextNode(i);
	b.appendChild(t);
	document.getElementById('leftpane').appendChild(b);
    }
}

function createChaptersList(chaptersLimit) {
    var i;
    for (i=1; i<=chaptersLimit; i++) {
	c = document.createElement('button');
	c.className = "access btn btn-default";
	t = document.createTextNode(i);
	c.appendChild(t);	
	c.id = "c"+i;
	document.getElementById('chapters-pane').appendChild(c);
    }
}

createBooksList(66);

books = document.querySelectorAll("button[id^=b]");
console.log(books)
for(i=1; i<=books.length; i++) {
    books[i-1].addEventListener("click", function (e) {
	console.log(e.target.id);
	db.get(e.target.id.substring(1).toString()).then(function (doc) {
	    chaptersPane = document.getElementById("chapters-pane");
	    while (chaptersPane.lastChild) {
		chaptersPane.removeChild(chaptersPane.lastChild);
	    }
	    createChaptersList(doc.chapters.length);
	}).catch(function (err) {
	    console.log('Error: While retrieving document. ' + err);
	});
    });
}
