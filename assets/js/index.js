const session = require('electron').remote.session,
      PouchDB = require('pouchdb');
var bibUtil = require("../util/json_to_usfm.js");

var db = new PouchDB('database'),
    refDb = new PouchDB('reference'),
    book,
    chapter,
    currentBook;


var constants = require('../util/constants.js');
	 booksList = constants.booksList,
	 otBookStart = 1,
	 otBookEnd = 39,
	 ntBookStart = 40,
	 ntBookEnd = 66,
	 allBookStart = 1,
	 allBookEnd = 66;

document.getElementById("save-btn").addEventListener("click", function (e) {
	db = new PouchDB('database');
    var verses = currentBook.chapters[parseInt(chapter,10)-1].verses;
    verses.forEach(function (verse, index) {
	var vId = 'v'+(index+1);
	verse.verse = document.getElementById(vId).textContent;
    });
    currentBook.chapters[parseInt(chapter,10)-1].verses = verses;
    db.put(currentBook).then(function (response) {
		db.close();
		alertModal("Save Message!!", "Edited Content saved successfully!!");
    }).catch(function (err) {
    	db.close();
    });
});

function createVerseInputs(verses, chunks, chapter) {
	document.getElementById('input-verses').innerHTML = "";
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
	    spanVerseNum = document.createElement('span'),
	    spanVerse = document.createElement('span');
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
	spanVerse.setAttribute("chunk-group", chunk);
	spanVerse.contentEditable = true;
	spanVerse.id = "v"+i;
	spanVerse.appendChild(document.createTextNode(verses[i-1].verse));
	spanVerseNum.appendChild(document.createTextNode(i));
	divContainer.appendChild(spanVerseNum);
	divContainer.appendChild(spanVerse);
	document.getElementById('input-verses').appendChild(divContainer);
    }
    highlightRef();
}

session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    book = '1';
    if(cookie.length > 0) {
	book = cookie[0].value;
    }
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	chapter = '1';
	if(cookie.length > 0) {
	    chapter = cookie[0].value;
	}
	document.getElementById('book-chapter-btn').innerHTML = booksList[parseInt(book,10)-1];
	document.getElementById('chapterBtnSpan').innerHTML = '<a  id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList('+"'"+book+"'"+');" >'+chapter+'</a>'
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

var bookCodeList = constants.bookCodeList;

function getReferenceText(refId, callback) {
    refId = (refId === 0 ? document.getElementById('refs-select').value : refId);
    var id = refId + '_' + bookCodeList[parseInt(book,10)-1],
	i;
    session.defaultSession.cookies.get({url: 'http://chapter.autographa.com'}, (error, cookie) => {
	chapter = '1';
		if(cookie.length > 0) {
		    chapter = cookie[0].value;
		}
	});	
    refDb.get(id).then(function (doc) {
	for(i=0; i<doc.chapters.length; i++) {
	    if(doc.chapters[i].chapter == parseInt(chapter, 10)) {
		break;
	    }
	}
	ref_string = doc.chapters[i].verses.map(function (verse, verseNum) {
	    return '<div data-verse="r' + (verseNum+1) +'"><span>' + (verseNum+1) + '</span><span>' + verse.verse + '</span></div>';
	}).join('');
	callback(null, ref_string);
    }).catch(function (err) {
	callback(err)
    });
}

function createRefSelections() {

	$('ul[type="refs-list"] li').remove();
    refDb.get('refs').then(function (doc) {
	doc.ref_ids.forEach(function (ref_doc) {
	    if(ref_doc.isDefault) {
		$('button[role="ref-selector"]').text(ref_doc.ref_name);
		getReferenceText(ref_doc.ref_id, function(err, refContent) {
		    if(err) {
			console.log('Info: No references found in database. ' + err);
			return;
		    }
		    $('div[type="ref"]').html(refContent);
		});
	    }
	    var li = document.createElement('li'),
		a = document.createElement('a');
	    a.setAttribute('href', '#');
	    a.setAttribute('data-value', ref_doc.ref_id);
	    a.setAttribute('type', 'ref-selection');
	    var t = document.createTextNode(ref_doc.ref_name);
	    a.appendChild(t);
	    li.appendChild(a);
	    $('ul[type="refs-list"]').append(li);
	});
	$('a[type="ref-selection"]').click(function() {
	    var selectedRefElement = $(this);
	    selectedRefElement.closest('ul[type="refs-list"]').siblings('button[role="ref-selector"]').text($(this).text());
	    getReferenceText($(this).attr("data-value"), function(err, refContent) {
		if(err) {
		    console.log('Info: No references found in database. ' + err);
		    return;
		}
		selectedRefElement.closest('div.row').next('div.row').children('div[type="ref"]').html(refContent);
	    });
	});
    }).catch(function (err) {
	console.log('Info: No references found in Database. ' + err);
    });
}

function highlightRef() {
    var i,
	j,
	verses = document.querySelectorAll("span[id^=v]");
    for(i=0; i<verses.length; i++) {
	verses[i].addEventListener("focus", function (e) {
	    var limits = e.target.getAttribute("chunk-group").split("-").map(function (element) {
		return parseInt(element, 10) - 1;
	    });
	    $('div[data-verse^="r"]').css('background-color', '');
	    for(j=limits[0]; j<=limits[1]; j++) {
		$('div[data-verse="r' + (j+1) + '"]').css('background-color', '#b3ffa8');
	    }
	});
    }
}

// Multi-reference windows
function setMultiwindowReference(layout){

	var children = $('div.row-col-fixed').children(),
	editor = children[children.length-1],
	i,
	clone;
    if(layout === '2x') {
		if(children.length === 2) {
		    return;
		}
		for(i=0; i<children.length; i++) {
		    $(children[i]).removeClass (function (index, css) {
			return (css.match (/(^|\s)col-sm-\S+/g) || []).join(' ');
		    });
		    $(children[i]).addClass('col-sm-6');
		}
		if(children.length > 2) {
		    for(i=1; i<children.length-1; i++) {
			children[i].remove();
		    }
		}
    } else if(layout === '3x') {
		if(children.length === 3) {
		    return;
		}
		for(i=0; i<children.length; i++) {
		    $(children[i]).removeClass (function (index, css) {
			return (css.match (/(^|\s)col-sm-\S+/g) || []).join(' ');
		    });
		    $(children[i]).addClass('col-sm-4');
		}
		if(children.length > 3) {
		    children[0].remove();
		} else if(children.length < 3) {
		    $(children[0]).clone(true, true).insertBefore('div.col-editor');
		}
    } else if(layout === '4x') {
		if(children.length === 4) {
		    return;
		}
		for(i=0; i<children.length; i++) {
		    $(children[i]).removeClass (function (index, css) {
			return (css.match (/(^|\s)col-sm-\S+/g) || []).join(' ');
		    });
		    $(children[i]).addClass('col-sm-3');
		}
		for(i=0; i<(4-children.length); i++) {
		    $(children[0]).clone(true, true).insertBefore('div.col-editor');
		}
    }
    
}
$('a[role="multi-window-btn"]').click(function () {
    setMultiwindowReference($(this).data('output'));
    saveReferenceLayout($(this).data('output'));
});
function createBooksList(booksLimit) {
  document.getElementById('books-pane').innerHTML = "";
  for (var i=1; i<=booksLimit; i++) {
  	var li = document.createElement('li'),
  	    a = document.createElement('a'),
  	    bookName = document.createTextNode(constants.booksList[i-1]);
        a.id = 'b'+i;
  	a.setAttribute('href', "javascript:setBookName("+"'"+"b"+i+"'"+")");
  	a.appendChild(bookName);
  	li.appendChild(a);
  	document.getElementById('books-pane').appendChild(li);
  }
}

function createChaptersList(chaptersLimit) {
  document.getElementById('chaptersList').innerHTML = "";
  for (var i=1; i<=chaptersLimit; i++) {
    var li = document.createElement('li'),
        a = document.createElement('a'),
        chapterNumber = document.createTextNode(i);
        a.id = 'c'+i;
    a.setAttribute('href', "javascript:setChapter("+"'"+i+"'"+")");
    a.appendChild(chapterNumber);
    li.appendChild(a);
    document.getElementById('chaptersList').appendChild(li);
     a.addEventListener('click', function (e) {
	    const cookie = {url: 'http://chapter.autographa.com', name: 'chapter', value: e.target.id.substring(1)};
	    session.defaultSession.cookies.set(cookie, (error) => {
		    if (error)
		      console.error(error);
	    });
    });
  }
  $("#chapters").modal('show');
}

function setBookName(bookId){
	chapter = '1';
	var db = new PouchDB('database');
	db.get(bookId.substring(1).toString()).then(function (doc) {
	book = bookId.substring(1).toString();
  	// document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" href="javascript:getBookList();" id="book-chapter-btn">'+doc.book_name+'</a><span id="chapterBtnSpan"><a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList('+"'"+bookId.substring(1).toString()+"'"+')" >1</span></a>'
  	const cookie = {url: 'http://book.autographa.com', name: 'book', value: bookId.substring(1)};
  	session.defaultSession.cookies.set(cookie, (error) => {
	if (error)
	    console.error(error);
	});
	setChapterCookie('0');
	// refDb.get('refChunks').then(function (chunkDoc) {
	// 	console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
	// 	currentBook = doc;
	// 	createRefSelections();
	// 	createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses, chunkDoc.chunks[parseInt(book,10)-1], chapter);
	//  });

	// $("#chapterBtn").click();
	//location.reload();
	createChaptersList(doc.chapters.length);
  	db.close();
  	closeModal($("#books"));
  }).catch(function (err) {
  	closeModal($("#books"));
  	console.log('Error: While retrieving document. ' + err);
  	db.close();
  });
 
}

function setChapter(chapter){
	session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
    book = '1';
    chapter = chapter;
    if(cookie.length > 0) {
		book = cookie[0].value;
    }
    var db = new PouchDB('database');
    refDb = new PouchDB('reference');
	db.get(book).then(function (doc) {
		refDb.get('refChunks').then(function (chunkDoc) {
			console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
			currentBook = doc;
			chapter = chapter;
			createRefSelections();
			createVerseInputs(doc.chapters[parseInt(chapter,10)-1].verses, chunkDoc.chunks[parseInt(book,10)-1], chapter);
		 });
		document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" href="javascript:getBookList();" id="book-chapter-btn">'+doc.book_name+'</a><span id="chapterBtnSpan"><a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList('+"'"+book+"'"+')" >'+chapter+'</span></a>'
		setChapterButton(book, chapter);
		setChapterCookie(chapter);
		closeModal($("#chapters"));
	//location.reload();
  	db.close();
  }).catch(function (err) {
  	closeModal($("#chapters"));
  	console.log('Error: While retrieving document. ' + err);
  	db.close();
  });
  	
   });
}

function setChapterButton(bookId, chapterId){
	document.getElementById('chapterBtnSpan').innerHTML = '<a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList('+"'"+bookId+"'"+');" >'+chapterId+'</a>'
}

function setChapterCookie(chapter){
	chapter = chapter;
	value = (chapter === '0') ? '1' : chapter;
	const cookie = {url: 'http://chapter.autographa.com', name: 'chapter', value: value};
	session.defaultSession.cookies.set(cookie, (error) => {
	if (error)
	    console.error(error);
	});
}


function onBookSelect(bookId) {
 // document.querySelector('.page-header').innerHTML = constants.booksList[parseInt(bookId.substring(1), 10)-1];
  const cookie = {url: 'http://book.autographa.com', name: 'book', value: bookId.substring(1)};
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error)
      console.error(error);
  });
  var db = new PouchDB('database');
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
function getBookList(){
  createBooksList(66);
  $("#books").modal('toggle');
}

/************ get book chapter list in popup*************/
function getBookChapterList(bookId){
	var db = new PouchDB('database');
	db.get(bookId).then(function (doc) {
    createChaptersList(doc.chapters.length)
  	//document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" href="javascript:getBookList();" id="book-chapter-btn">'+doc.book_name+'</a><a class="btn btn-default" href="#" >1</a>'
  	db.close();
  }).catch(function (err) {
  	console.log('Error: While retrieving document. ' + err);
  	db.close();
  });

}/************** end book chapter list **************************************/

function closeModal(modal){
	modal.modal('hide');
}

//validation for export
document.getElementById('export-usfm').addEventListener('click', function (e) {
  console.log("hi...");
  db = new PouchDB('database');
  // Reading the database object
  db.get('targetBible').then(function (doc) {
    if(doc){
      session.defaultSession.cookies.get({url: 'http://book.autographa.com'}, (error, cookie) => {
		book = {};
		var db = new PouchDB('database');
		db.get('targetBible').then(function (doc) {
		    book.bookNumber = cookie[0].value;
		    book.bookName = constants.booksList[parseInt(book.bookNumber, 10)-1];
		    book.bookCode = constants.bookCodeList[parseInt(book.bookNumber, 10)-1];
		    book.outputPath = doc.targetPath;
		    filepath = bibUtil.toUsfm(book);
		    return filepath;
		}).then(function(filepath){
			alertModal("Export Message!!", "File exported at: "+ filepath);
			return;
		}).catch(function (err) {
		    console.log('Error: Cannot get details from DB' + err);
		});
    });
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

$("#otBooksBtn").on("click", function(){
	getBooksByLimit(otBookStart, otBookEnd);
});
$("#ntBooksBtn").on("click", function(){
	getBooksByLimit(ntBookStart, ntBookEnd);
});


$("#allBooksBtn").on("click", function(){
	getBooksByLimit(allBookStart, allBookEnd);
});

function getBooksByLimit(start, booksLength){
  document.getElementById('books-pane').innerHTML = "";
  for (var i=start; i<= booksLength ; i++) {
	var li = document.createElement('li'),
  	    a = document.createElement('a'),
  	    bookName = document.createTextNode(booksList[i-1]);
        a.id = 'b'+i;
  	a.setAttribute('href', "javascript:setBookName("+"'"+"b"+i+"'"+")");
  	a.appendChild(bookName);
  	li.appendChild(a);
  	document.getElementById('books-pane').appendChild(li);
  }
}

function saveReferenceLayout(layout){
	var refDb = new PouchDB('reference');
    refDb.get('targetReferenceLayout').then(function (doc) {
		refDb.put({
		    _id: 'targetReferenceLayout',
		     layout: layout,
		     _rev: doc._rev
		}).then(function (e) {
		    refDb.close();
			});
	  }).catch(function (err) {
		refDb.put({
		     _id: 'targetReferenceLayout',
		     layout: layout
		}).then(function (e) {
		    refDb.close();
		}).catch(function (err) {
		    refDb.close();
			});
    });
}

$(function(){
	refDb = new PouchDB('reference');
  	refDb.get('targetReferenceLayout').then(function (doc) {
			setMultiwindowReference(doc.layout);
		}).catch(function (err) {
			console.log(err);
		});
});


