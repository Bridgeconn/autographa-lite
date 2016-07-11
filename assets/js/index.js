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
	verse.verse = document.getElementById(vId).textContent;
    });

    currentBook.chapters[parseInt(chapter,10)-1].verses = verses;
    db.put(currentBook).then(function (response) {
	console.log('Saved changes.');
    }).catch(function (err) {
	console.log('Error: While retrieving document. ' + err);
    });
});

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

var constants = require('../util/constants.js');
var booksList = constants.booksList;

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
	console.log('values are ' + book + ' ' + chapter);
	document.getElementById('book-chapter-btn').innerHTML = booksList[parseInt(book,10)-1] + ' : ' + chapter;
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
    console.log('id is = ' + id);
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
$('a[role="multi-window-btn"]').click(function () {
    var children = $('div.row-col-fixed').children(),
	editor = children[children.length-1],
	i,
	clone;
    if($(this).data('output') === '2x') {
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
    } else if($(this).data('output') === '3x') {
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
    } else if($(this).data('output') === '4x') {
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
});
