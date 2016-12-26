const session = require('electron').remote.session,
      {Menu} = require('electron').remote,
      PouchDB = require('pouchdb');
var bibUtil = require("../util/json_to_usfm.js");
var constants = require('../util/constants.js');

function createBooksList(booksLimit) {
  for (var i=1; i<=booksLimit; i++) {
  	var li = document.createElement('li'),
  	    a = document.createElement('a'),
  	    bookName = document.createTextNode(constants.booksList[i-1]);
        a.id = 'b'+i;
  	a.setAttribute('href', '#');
  	a.appendChild(bookName);
  	li.appendChild(a);
  	document.getElementById('books-pane').appendChild(li);
  }
}

function createChaptersList(chaptersLimit) {
  for (var i=1; i<=chaptersLimit; i++) {
    var li = document.createElement('li'),
        a = document.createElement('a'),
        chapterNumber = document.createTextNode(i);
        a.id = 'c'+i;
    a.setAttribute('href', 'index.html');
    a.appendChild(chapterNumber);
    li.appendChild(a);
    document.getElementById('chapters-pane').appendChild(li);
    a.addEventListener('click', function (e) {
	    const cookie = {url: 'http://chapter.autographa.com', name: 'chapter', value: e.target.id.substring(1)};
	    session.defaultSession.cookies.set(cookie, (error) => {
		    if (error)
		      console.error(error);
	    });
    });
  }
}

function onBookSelect(bookId) {
  document.querySelector('.page-header').innerHTML = constants.booksList[parseInt(bookId.substring(1), 10)-1];
  const cookie = {url: 'http://book.autographa.com', name: 'book', value: bookId.substring(1)};
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error)
      console.error(error);
  });
  var db = new PouchDB('./db/targetDB');
  db.get(bookId.substring(1).toString()).then(function (doc) {
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
}

createBooksList(66);

// Check for existing book in session.
session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
  var onLoadBookId = 'b1';
  if(cookie.length > 0) {
    onLoadBookId = 'b'+cookie[0].value;
  }
  onBookSelect(onLoadBookId);
});

books = document.querySelectorAll("a[id^=b]");
for(i=1; i<=books.length; i++) {
  books[i-1].addEventListener("click", function (e) {
    onBookSelect(e.target.id);
  });
}

$('a[type="export"]').click(function () {
    session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
	book = {};
	var db = new PouchDB('./db/targetDB');
	db.get('targetBible').then(function (doc) {
	    book.bookNumber = cookie[0].value;
	    book.bookName = constants.booksList[parseInt(book.bookNumber, 10)-1];
	    book.bookCode = constants.bookCodeList[parseInt(book.bookNumber, 10)-1];
	    book.outputPath = doc.targetPath;
	    bibUtil.toUsfm(book);
	}).catch(function (err) {
	    console.log('Error: Cannot get details from DB' + err);
	});
    });
});

//validation for export
document.getElementById('export-usfm').addEventListener('click', function (e) {
  db = new PouchDB('./db/targetDB');
  // Deleting database
  // db.destroy(function (err, response) {
  //    if (err) {
  //       return console.log(err);
  //    } else {
  //      console.log("deleting");
  //    }
  // });

  // Reading the database object
  db.get('targetBible').then(function (doc) {
    if(doc){
      console.log(doc);
      alertModal("Porgress task", "This task is in progrss");
      return;
    }else{
      //****** export logic *****************/
      alertModal("Export Alert!!", "Please configure export setting!!");
      return;
    }
  }).catch(function (err) {
    alertModal("Something went wrong!!", "Contact support team!!");
    return;
  });
});

// Alert Model Function for dynamic message
function alertModal(heading, formContent) {
  $("#heading").html(heading);
  $("#content").html(formContent);
  $("#dynamicModal").modal();
  $("#dynamicModal").toggle();
}
