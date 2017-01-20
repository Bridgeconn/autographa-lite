const session = require('electron').remote.session;
var bibUtil = require("../util/json_to_usfm.js"),
    DiffMatchPatch = require('diff-match-patch'),
    dmp_diff = new DiffMatchPatch();

var db = require(`${__dirname}/../util/data-provider`).targetDb(),
    refDb = require(`${__dirname}/../util/data-provider`).referenceDb(),
    book,
    chapter,
    currentBook,
    intervalId;


var constants = require('../util/constants.js'),
    booksList = constants.booksList,
    otBookStart = 1,
    otBookEnd = 39,
    ntBookStart = 40,
    ntBookEnd = 66,
    allBookStart = 1,
    allBookEnd = 66;

var stringReplace = require('../util/string_replace.js'),
    replaceCount = 0,
    allChapterReplaceCount = [],
    replacedChapter = {},
    replacedVerse = {},
    allChapters = {},
    chapter_hash = {},
    verses_arr = [],
    chapter_arr = [],
    diffModeFlag = false,
    targetDirtyFlag = false;


document.getElementById("save-btn").addEventListener("click", function(e) {
    var verses = currentBook.chapters[parseInt(chapter, 10) - 1].verses;
    verses.forEach(function(verse, index) {
        var vId = 'v' + (index + 1);
        verse.verse = document.getElementById(vId).textContent;
    });
    currentBook.chapters[parseInt(chapter, 10) - 1].verses = verses;
    db.get(currentBook._id).then(function(doc) {
        doc.chapters[parseInt(chapter, 10) - 1].verses = verses;
        db.put(doc).then(function(response) {
            alertModal("Save Message!!", "Edited Content saved successfully!!");
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
});

function createVerseInputs(verses, chunks, chapter) {
    document.getElementById('input-verses').innerHTML = "";
    var i, chunkIndex = 0,
        chunkVerseStart, chunkVerseEnd;
    for (i = 0; i < chunks.length; i++) {
        if (parseInt(chunks[i].chp, 10) === parseInt(chapter, 10)) {
            chunkIndex = i + 1;
            chunkVerseStart = parseInt(chunks[i].firstvs, 10);
            chunkVerseEnd = parseInt(chunks[i + 1].firstvs, 10) - 1;
            break;
        }
    }

    for (i = 1; i <= verses.length; i++) {
        var divContainer = document.createElement('div'),
            spanVerseNum = document.createElement('span'),
            spanVerse = document.createElement('span');
        if (i > chunkVerseEnd) {
            chunkVerseStart = parseInt(chunks[chunkIndex].firstvs, 10);
            if (chunkIndex === chunks.length - 1 || parseInt((chunks[chunkIndex + 1].chp), 10) != chapter) {
                chunkVerseEnd = verses.length;
            } else {
                chunkIndex++;
                chunkVerseEnd = parseInt(chunks[chunkIndex].firstvs, 10) - 1;
            }
        }
        var chunk = chunkVerseStart + '-' + chunkVerseEnd;
        spanVerse.setAttribute("chunk-group", chunk);
        spanVerse.contentEditable = true;
        spanVerse.id = "v" + i;
        spanVerse.appendChild(document.createTextNode(verses[i - 1].verse));
        spanVerseNum.setAttribute("class", "verse-num");
        spanVerseNum.appendChild(document.createTextNode(i));
        divContainer.appendChild(spanVerseNum);
        divContainer.appendChild(spanVerse);
        document.getElementById('input-verses').appendChild(divContainer);
        $(".diff-count-target").html("");
    }
    highlightRef();
}

session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
    book = '1';
    if (cookie.length > 0) {
        book = cookie[0].value;
    }
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        chapter = '1';
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
        document.getElementById('book-chapter-btn').innerHTML = booksList[parseInt(book, 10) - 1];
        document.getElementById('chapterBtnSpan').innerHTML = '<a  id="chapterBtn" data-toggle="tooltip" data-placement="bottom"  title="Select Chapter" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + book + "'" + ');" >' + chapter + '</a>'
        $('a[data-toggle=tooltip]').tooltip();
        db.get(book).then(function(doc) {
            refDb.get('refChunks').then(function(chunkDoc) {
                // console.log(doc.chapters[parseInt(chapter,10)-1].verses.length);
                currentBook = doc;
                createRefSelections();
                createVerseInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter);
            });
        }).catch(function(err) {
            console.log('Error: While retrieving document. ' + err);
        });
    });
});

function getDiffText(refId1, refId2, position, callback) {
    var t_ins = 0;
    var t_del = 0;
    var id1 = refId1 + '_' + bookCodeList[parseInt(book, 10) - 1],
        id2 = refId2 + '_' + bookCodeList[parseInt(book, 10) - 1],
        i,
        ref1 = "",
        ref2 = "";
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
    });
    refDb.get(id1).then(function(doc) {
        for (i = 0; i < doc.chapters.length; i++) {
            if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                break;
            }
        }
        return doc.chapters[i].verses
    }).then(function(response) {
        ref1 = response;
        refDb.get(id2).then(function(doc) {
            for (i = 0; i < doc.chapters.length; i++) {
                if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                    break;
                }
            }
            ref2 = doc.chapters[i].verses
            var refString = "";
            for (var i = 1; i <= ref1.length; i++) {
                var d = dmp_diff.diff_main(ref1[i - 1].verse, ref2[i - 1].verse);
                var diff_count = getDifferenceCount(d);
                t_ins += diff_count["ins"]
                t_del += diff_count["del"]
                var ds = dmp_diff.diff_prettyHtml(d);
                refString += '<div data-verse="r' + (i) + '"><span class="verse-num">' + (i) + '</span><span>' + ds + '</span></div>';
            }
            callback(null, refString, position, t_ins, t_del);
        });
    }).catch(function(err) {
        callback(err, null, null);
    });
}

// insertion and deletion count in difference text by passing verse
function getDifferenceCount(verse_diff) {
    var insertions = 0;
    var deletions = 0;
    for (var x = 0; x < verse_diff.length; x++) {
        var op = verse_diff[x][0];
        var data = verse_diff[x][1];
        switch (op) {
            case DiffMatchPatch.DIFF_INSERT:
                insertions += data.length;
                break;
            case DiffMatchPatch.DIFF_DELETE:
                deletions += data.length;
                break;
            case DiffMatchPatch.DIFF_EQUAL:
                insertions = 0;
                deletions = 0;
                break;
        }
    }
    return { ins: insertions, del: deletions }
}
// End insertion and deletion count in difference text

// save document after edit
function setDiffReferenceText() {
    // save document after edit
    saveTarget();

    //set difference
    var j = 0;
    for (j = 0; j < $('.ref-drop-down :selected').length; j++) {
        $("#section-" + j).find('div[type="ref"]').children().removeAttr("style");
        if (j + 1 < $('.ref-drop-down :selected').length) {
            getDiffText($($('.ref-drop-down :selected')[j]).val(), $($('.ref-drop-down :selected')[j + 1]).val(), j + 1, function(err, refContent, pos, t_ins, t_del) {
                if (err) {
                    console.log(err);
                } else {
                    $("#section-" + pos).find('div[type="ref"]').html(refContent);
                    $("#section-" + pos).find('.diff-count').html("<span>(+): " + t_ins + "</span><span> (-): " + t_del + "</span></span>");
                    t_ins = 0;
                    t_del = 0;
                }
            });
        }
    }
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        book = '1';
        if (cookie.length > 0) {
            book = cookie[0].value;
        }
    });
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
    });
    var book_verses = '';
    refId = $($('.ref-drop-down :selected')[j - 1]).val();
    refId = (refId === 0 ? document.getElementById('refs-select').value : refId);
    var id = refId + '_' + bookCodeList[parseInt(book, 10) - 1],
        i;
    refDb.get(id).then(function(doc) {
        for (i = 0; i < doc.chapters.length; i++) {
            if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                break;
            }
        }
        book_verses = doc.chapters[i].verses
    }).catch(function(err) {
        console.log(err);
    });
    db.get(book).then(function(doc) {
        refDb.get('refChunks').then(function(chunkDoc) {
            currentBook = doc;
            createVerseDiffInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter, book_verses);
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });

}

function setReferenceTextBack() {
    var j = 0;
    $('.ref-drop-down :selected').each(function(i, selected) {
        getReferenceText($(selected).val(), function(err, refContent) {
            if (err) {
                console.log(err);
            } else {
                $("#section-" + i).find('div[type="ref"]').html(refContent);
                $("#section-" + i).find('.diff-count').html("");
            }
        });
    });
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        book = '1';
        if (cookie.length > 0) {
            book = cookie[0].value;
        }
    });
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
    });
    db.get(book).then(function(doc) {
        refDb.get('refChunks').then(function(chunkDoc) {
            currentBook = doc;
            createVerseInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter);
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
}

function createVerseDiffInputs(verses, chunks, chapter, book_original_verses) {
    var t_ins = 0;
    var t_del = 0;
    document.getElementById('input-verses').innerHTML = "";
    var i, chunkIndex = 0,
        chunkVerseStart, chunkVerseEnd;
    for (i = 0; i < chunks.length; i++) {
        if (parseInt(chunks[i].chp, 10) === parseInt(chapter, 10)) {
            chunkIndex = i + 1;
            chunkVerseStart = parseInt(chunks[i].firstvs, 10);
            chunkVerseEnd = parseInt(chunks[i + 1].firstvs, 10) - 1;
            break;
        }
    }

    for (i = 1; i <= verses.length; i++) {
        var divContainer = '<div>';
        spanVerseNum = '';

        if (i > chunkVerseEnd) {
            chunkVerseStart = parseInt(chunks[chunkIndex].firstvs, 10);
            if (chunkIndex === chunks.length - 1 || parseInt((chunks[chunkIndex + 1].chp), 10) != chapter) {
                chunkVerseEnd = verses.length;
            } else {
                chunkIndex++;
                chunkVerseEnd = parseInt(chunks[chunkIndex].firstvs, 10) - 1;
            }
        }
        var chunk = chunkVerseStart + '-' + chunkVerseEnd;
        spanVerse = "<span chunk-group=" + chunk + " id=v" + i + ">";
        var d = dmp_diff.diff_main(book_original_verses[i - 1].verse, verses[i - 1].verse);
        var ds = dmp_diff.diff_prettyHtml(d);
        var diff_count = getDifferenceCount(d);
        t_ins += diff_count["ins"];
        t_del += diff_count["del"];
        spanVerse += ds;
        spanVerse += '</span>'
        spanVerseNum += '<span class="verse-num">' + i + '</span>' //appendChild(document.createTextNode(i));
        divContainer += spanVerseNum;
        divContainer += spanVerse;
        divContainer += '</div>'
        $("#input-verses").append(divContainer);

    }
    $(".diff-count-target").html("<span>(+): " + t_ins + "</span><span> (-): " + t_del + "</span></span>");
    highlightRef();
}


var bookCodeList = constants.bookCodeList;

function getReferenceText(refId, callback) {
    refId = (refId === 0 ? document.getElementById('refs-select').value : refId);
    var id = refId + '_' + bookCodeList[parseInt(book, 10) - 1],
        i;
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        chapter = '1';
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
    });
    refDb.get(id).then(function(doc) {
        for (i = 0; i < doc.chapters.length; i++) {
            if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                break;
            }
        }
        ref_string = doc.chapters[i].verses.map(function(verse, verseNum) {
            return '<div data-verse="r' + (verseNum + 1) + '"><span class="verse-num">' + (verseNum + 1) + '</span><span>' + verse.verse + '</span></div>';
        }).join('');
        callback(null, ref_string);
    }).catch(function(err) {
        callback(err, "");
    });
}

function createRefSelections() {
    if ($(".ref-drop-down").val() === null) {
        $(".ref-drop-down").find('option').remove().end();
        refDb.get('refs').then(function(doc) {
            doc.ref_ids.forEach(function(ref_doc) {
                if (ref_doc.isDefault) {
                    $('button[role="ref-selector"]').text(ref_doc.ref_name);
                    $(".current-val").val(ref_doc.ref_id);
                    getReferenceText(ref_doc.ref_id, function(err, refContent) {
                        if (err) {
                            console.log('Info: No references found in database. ' + err);
                            return;
                        }
                        $('div[type="ref"]').html(refContent);

                    });
                }
                /*==================== old drop down commented =============================*/
                //    var li = document.createElement('li'),
                // a = document.createElement('a');
                //    a.setAttribute('href', '#');
                //    a.setAttribute('data-value', ref_doc.ref_id);
                //    a.setAttribute('type', 'ref-selection');
                //    var t = document.createTextNode(ref_doc.ref_name);
                //    a.appendChild(t);
                //    li.appendChild(a);
                //    $('ul[type="refs-list"]').append(li);

                /*==============================================================*/
                $('<option></option>').val(ref_doc.ref_id).text(ref_doc.ref_name).appendTo(".ref-drop-down"); //new code for ref drop down

            });
        });
    } else {
        $('.ref-drop-down :selected').each(function(i, selected) {
            $(".current-val").val($(selected).val());
            getReferenceText($(selected).val(), function(err, refContent) {
                if (err) {
                    $(".ref-drop-down").val($(".ref-drop-down option:first").val());
                    getReferenceText($(".ref-drop-down option:first").val(), function(err, refContent) {
                        if (err) {
                            console.log("The selected language on book for current chapter is not available!!");
                        }
                        $('div[type="ref"]').html(refContent);
                    })
                    return;
                }
                if ($("#section-" + i).length > 0) {
                    $("#section-" + i).find('div[type="ref"]').html(refContent);
                } else {
                    $('div[type="ref"]').html(refContent);
                }
            });
        });

    }
}

$('.ref-drop-down').change(function(event) {
    var selectedRefElement = $(this);
    getReferenceText($(this).val(), function(err, refContent) {
        if (err) {
            selectedRefElement.val(selectedRefElement.next().val());
            console.log(err);
            alertModal("Language!!", "The selected language on book for current chapter is not available!!");
            return;
        } else {
            selectedRefElement.next().val(selectedRefElement.val());

        }
        selectedRefElement.closest('div.row').next('div.row').children('div[type="ref"]').html(refContent);
    });
});

function highlightRef() {
    var i,
        j,
        verses = document.querySelectorAll("span[id^=v]");
    for (i = 0; i < verses.length; i++) {
        verses[i].addEventListener("focus", function(e) {
            var limits = e.target.getAttribute("chunk-group").split("-").map(function(element) {
                return parseInt(element, 10) - 1;
            });
            $('div[data-verse^="r"]').css('background-color', '');
            for (j = limits[0]; j <= limits[1]; j++) {
                $('div[data-verse="r' + (j + 1) + '"]').css('background-color', '#b3ffa8');
            }
        });
    }
}

// Multi-reference windows
function setMultiwindowReference(layout) {

    var children = $('div.row-col-fixed').children(),
        editor = children[children.length - 1],
        i,
        clone,
        count = 1;
    if (layout === '2x') {
        if (children.length === 2) {
            return;
        }
        for (i = 0; i < children.length; i++) {
            $(children[i]).removeClass(function(index, css) {
                return (css.match(/(^|\s)col-sm-\S+/g) || []).join(' ');
            });
            $(children[i]).addClass('col-sm-6');
        }
        if (children.length > 2) {
            for (i = 1; i < children.length - 1; i++) {
                children[i].remove();
            }
        }
    } else if (layout === '3x') {
        if (children.length === 3) {
            return;
        }
        for (i = 0; i < children.length; i++) {
            $(children[i]).removeClass(function(index, css) {
                return (css.match(/(^|\s)col-sm-\S+/g) || []).join(' ');
            });
            $(children[i]).addClass('col-sm-4').attr("id", "section-" + i);

        }
        if (children.length > 3) {
            children[2].remove();
        } else if (children.length < 3) {
            element = $(children[0]).clone(true, true);
            //var newID = element.attr('id').replace(/\d+$/, function(str) { return parseInt(str) + 1});
            clone_ele = $(children[0]).clone(true, true).attr("id", "section-1").insertBefore('div.col-editor');
            clone_ele.find(".ref-drop-down").val(clone_ele.find(".current-val").val());
            //element.attr("id", newID).insertBefore('div.col-editor');
        }
    } else if (layout === '4x') {
        if (children.length === 4) {
            return;
        }
        for (i = 0; i < children.length; i++) {

            $(children[i]).removeClass(function(index, css) {
                return (css.match(/(^|\s)col-sm-\S+/g) || []).join(' ');
            });
            $(children[i]).addClass('col-sm-3').attr("id", "section-" + i);
            if (i == 2) {
                count = 2;
            }

        }
        for (i = 0; i < (4 - children.length); i++) {
            clone_ele = $(children[0]).clone(true, true).attr("id", "section-" + count).insertBefore('div.col-editor');
            clone_ele.find(".ref-drop-down").val(clone_ele.find(".current-val").val());
            count = count + 1;
        }
    }

}

$('a[role="multi-window-btn"]').click(function() {
    setMultiwindowReference($(this).data('output'));
    saveReferenceLayout($(this).data('output'));
});

function createBooksList(booksLimit) {
    document.getElementById('books-pane').innerHTML = "";
    for (var i = 1; i <= booksLimit; i++) {
        var li = document.createElement('li'),
            a = document.createElement('a'),
            bookName = document.createTextNode(constants.booksList[i - 1]);
        a.id = 'b' + i;
        a.setAttribute('href', "javascript:setBookName(" + "'" + "b" + i + "'" + ")");
        a.appendChild(bookName);
        li.appendChild(a);
        document.getElementById('books-pane').appendChild(li);
    }
}

function createChaptersList(chaptersLimit) {
    document.getElementById('chaptersList').innerHTML = "";
    for (var i = 1; i <= chaptersLimit; i++) {
        var li = document.createElement('li'),
            a = document.createElement('a'),
            chapterNumber = document.createTextNode(i);
        a.id = 'c' + i;
        a.setAttribute('href', "javascript:setChapter(" + "'" + i + "'" + ")");
        a.appendChild(chapterNumber);
        li.appendChild(a);
        document.getElementById('chaptersList').appendChild(li);
        a.addEventListener('click', function(e) {
            const cookie = { url: 'http://chapter.autographa.com', name: 'chapter', value: e.target.id.substring(1) };
            session.defaultSession.cookies.set(cookie, (error) => {
                if (error)
                    console.error(error);
            });
        });
    }
    $("#chapters").modal('show');
}

function setBookName(bookId) {
    chapter = '1';
    db.get(bookId.substring(1).toString()).then(function(doc) {
        book = bookId.substring(1).toString();
        // document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" href="javascript:getBookList();" id="book-chapter-btn">'+doc.book_name+'</a><span id="chapterBtnSpan"><a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList('+"'"+bookId.substring(1).toString()+"'"+')" >1</span></a>'
        const cookie = { url: 'http://book.autographa.com', name: 'book', value: bookId.substring(1) };
        session.defaultSession.cookies.set(cookie, (error) => {
            if (error)
                console.error(error);
        });
        setChapterCookie('0');
        createChaptersList(doc.chapters.length);
        closeModal($("#books"));
    }).catch(function(err) {
        closeModal($("#books"));
        console.log('Error: While retrieving document. ' + err);
    });

}

function setChapter(chapter) {
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        book = '1';
        chapter = chapter;
        if (cookie.length > 0) {
            book = cookie[0].value;
        }
        db.get(book).then(function(doc) {
            refDb.get('refChunks').then(function(chunkDoc) {
                currentBook = doc;
                chapter = chapter;
                createRefSelections();
                createVerseInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter);
            });
            document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" data-toggle="tooltip" data-placement="bottom"  title="Select Book" href="javascript:getBookList();" id="book-chapter-btn">' + doc.book_name + '</a><span id="chapterBtnSpan"><a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + book + "'" + ')" >' + chapter + '</span></a>'
            $('a[data-toggle=tooltip]').tooltip();
            setChapterButton(book, chapter);
            setChapterCookie(chapter);
            closeModal($("#chapters"));
        }).catch(function(err) {
            closeModal($("#chapters"));
            console.log('Error: While retrieving document. ' + err);
        });

    });
}

function setChapterButton(bookId, chapterId) {
    document.getElementById('chapterBtnSpan').innerHTML = '<a id="chapterBtn" data-toggle="tooltip" data-placement="bottom"  title="Select Chapter" class="btn btn-default" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + bookId + "'" + ');" >' + chapterId + '</a>'
    $('a[data-toggle=tooltip]').tooltip();

}

function setChapterCookie(chapter) {
    chapter = chapter;
    value = (chapter === '0') ? '1' : chapter;
    const cookie = { url: 'http://chapter.autographa.com', name: 'chapter', value: value };
    session.defaultSession.cookies.set(cookie, (error) => {
        if (error)
            console.error(error);
    });
}


function onBookSelect(bookId) {
    const cookie = { url: 'http://book.autographa.com', name: 'book', value: bookId.substring(1) };
    session.defaultSession.cookies.set(cookie, (error) => {
        if (error)
            console.error(error);
    });
    db.get(bookId.substring(1).toString()).then(function(doc) {
        chaptersPane = document.getElementById("chapters-pane");
        while (chaptersPane.lastChild) {
            chaptersPane.removeChild(chaptersPane.lastChild);
        }
        createChaptersList(doc.chapters.length);
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
}

function getBookList() {
    createBooksList(66);
    $("#books").modal('toggle');
}

// get book chapter list in popup
function getBookChapterList(bookId) {
    db.get(bookId).then(function(doc) {
        createChaptersList(doc.chapters.length);
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });

}
//end book chapter list

function closeModal(modal) {
    modal.modal('hide');
}

//validation for export
document.getElementById('export-usfm').addEventListener('click', function(e) {
    db.get('targetBible').then(function(doc) {
        refDb.get('refs').then(function(doc) {
            exportChoice();
        }).catch(function(err) {
            // handle any errors
            alertModal("Setting Error", "Please setup Target Language settings for export to work.");
        });
    }).catch(function(err) {
        // handle any errors
        alertModal("Setting Error", "Please setup Target Language settings for export to work.");
    });
});

$("#exportUsfm").on("click", function() {
    exportUsfm();
})

function exportChoice() {
    $("#dropdownBtn").html("Choose Stage" + ' <span class="caret"></span>');
    $("#stageText").val('');
    $("#exportChoice").modal();
    $("#exportChoice").toggle();
}

function exportUsfm() {
    // Reading the database object
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        if (error) {
            $("#exportChoice").modal('hide');
            alertModal("Error", "Unable to process request.");
            return;
        }
        book = {};
        db.get('targetBible').then(function(doc) {
            book.bookNumber = cookie[0].value;
            book.bookName = constants.booksList[parseInt(book.bookNumber, 10) - 1];
            book.bookCode = constants.bookCodeList[parseInt(book.bookNumber, 10) - 1];
            book.outputPath = doc.targetPath;
            filepath = bibUtil.toUsfm(book, $("#stageText").val(), doc);
            return filepath;
        }).then(function(filepath) {
            $("#exportChoice").modal('hide');
            alertModal("Book Exported", "Exported file at: " + filepath);
            return;
        }).catch(function(err) {
            $("#exportChoice").modal('hide');
            console.log('Error: Cannot get details from DB' + err);
            alertModal("Export Alert!!", "Please configure export setting!!");
        });
    });
}

// Alert Model Function for dynamic message
function alertModal(heading, formContent) {
    $("#heading").html(heading);
    $("#content").html(formContent);
    $("#dynamicModal").modal();
    $("#dynamicModal").toggle();
}

$("#otBooksBtn").on("click", function() {
    getBooksByLimit(otBookStart, otBookEnd);
});
$("#ntBooksBtn").on("click", function() {
    getBooksByLimit(ntBookStart, ntBookEnd);
});


$("#allBooksBtn").on("click", function() {
    getBooksByLimit(allBookStart, allBookEnd);
});

function getBooksByLimit(start, booksLength) {
    document.getElementById('books-pane').innerHTML = "";
    for (var i = start; i <= booksLength; i++) {
        var li = document.createElement('li'),
            a = document.createElement('a'),
            bookName = document.createTextNode(booksList[i - 1]);
        a.id = 'b' + i;
        a.setAttribute('href', "javascript:setBookName(" + "'" + "b" + i + "'" + ")");
        a.appendChild(bookName);
        li.appendChild(a);
        document.getElementById('books-pane').appendChild(li);
    }
}

function saveReferenceLayout(layout) {
    refDb.get('targetReferenceLayout').then(function(doc) {
        refDb.put({
            _id: 'targetReferenceLayout',
            layout: layout,
            _rev: doc._rev
        })
    }).catch(function(err) {
        refDb.put({
            _id: 'targetReferenceLayout',
            layout: layout
        }).catch(function(err) {
            //refDb.close();
        });
    });
}

$(function() {
    $('[type="checkbox"]').bootstrapSwitch();
    refDb.get('targetReferenceLayout').then(function(doc) {
        setMultiwindowReference(doc.layout);
    }).catch(function(err) {
        //Layout value unset.	    
    });
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        if (cookie.length == 0) {
            const cookie = { url: 'http://book.autographa.com', name: 'book', value: '1' };
            session.defaultSession.cookies.set(cookie, (error) => {
                if (error)
                    console.error(error);
            });
        }
    });

    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length == 0) {
            const cookie = { url: 'http://chapter.autographa.com', name: 'chapter', value: '1' };
            session.defaultSession.cookies.set(cookie, (error) => {
                if (error)
                    console.error(error);
            });
        }
    });

    $(".dropdown-menu").on('click', 'li a', function() {
        $(this).parent().parent().siblings(".btn:first-child").html($(this).text() + ' <span class="caret"></span>');
        $(this).parent().parent().siblings(".btn:first-child").val($(this).text());
        $("#stageText").val($(this).text());
        $("#exportUsfm").prop('disabled', false);
    });
    $("#stageText").on("keyup", function() {
        if ($(this).val().length > 0) {
            $("#exportUsfm").prop('disabled', false);
        } else {
            $("#exportUsfm").prop('disabled', true);
        }
    });

});

function isSameLanguage() {
    var verseLangCode = "",
        check_value = false;
    return db.get('targetBible').then(function(doc) {
        verseLangCode = doc.targetLang;
        languagedropDown = $(".ref-drop-down").length
        for (var i = 0; i < languagedropDown - 1; i++) {
            v1 = $($('.ref-drop-down :selected')[i]).val().split("_")[0]
            v2 = ""
            if ($($('.ref-drop-down :selected')[i + 1]).length) {
                v2 = $($('.ref-drop-down :selected')[i + 1]).val().split("_")[0]
            }
            if ((verseLangCode != v1) || (verseLangCode != v2)) {
                return false;
            }
        }
        if (languagedropDown == 1) {
            if ((verseLangCode != $($('.ref-drop-down :selected')[0]).val().split("_")[0])) {
                return false;
            }
        }
        return true;
    }).then(function(response) {
        return response;
    }).catch(function(err) {
        return false;
    });
}

$('.check-diff').on('switchChange.bootstrapSwitch', function(event, state) {
    if (state === true) {
        diffModeFlag = true;
        promise = isSameLanguage();
        promise.then(function(response) {
            if (response == false) {
                alertModal("Language!!", "Differences are not meaningful between different languages." + "Kindly select the same language across all panes to continue.");
                $('.check-diff').bootstrapSwitch('state', false);
                return false;
            } else {
                setDiffReferenceText();
                $(".verse-diff-on a").attr("disabled", "true").addClass("disable_a_href").css({ 'pointer-events': 'none' });
                $(".ref-drop-down").attr("disabled", "true");
            }
        });
    } else {
        diffModeFlag = false;
        setReferenceTextBack();
        $(".verse-diff-on a").removeAttr("disabled").removeClass("disable_a_href").css({ 'pointer-events': '' });;
        $(".ref-drop-down").removeAttr("disabled", "true");
    }
});

// call after stopped typing
function debounce(targetCheck, func, wait, immediate) {
    targetDirtyFlag = targetCheck;
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

// This will apply the debounce effect on the keyup event
// And it only fires 3000ms after the user stopped typing
$('#input-verses').on('keyup', debounce(true, function() {
    if (diffModeFlag == false) {
        saveTarget();
    }
}, 3000));

// call above function after stopped typing in the target pane end here
$(".font-button").bind("click", function() {
    var size = parseInt($('.col-ref').css("font-size"));
    if ($(this).hasClass("plus")) {
        size = size + 2;
    } else {
        size = size - 2;
        if (size <= 14) {
            size = 14;
        }
    }
    $('.col-ref').css("font-size", size);
});

function setAutoSaveTime(dateTime) {
    const cookie = { url: 'http://autosave.autographa.com', name: 'autosave', value: dateTime };
    session.defaultSession.cookies.set(cookie, (error) => {
        if (error)
            console.error(error);
    });
}

session.defaultSession.cookies.get({ url: 'http://autosave.autographa.com' }, (error, cookie) => {
    if (cookie.length > 0) {
        $("#saved-time").html("Last saved target at: " + cookie[0].value);
    }
});

// find and replace call here
function findAndReplaceText(searchVal, replaceVal, option) {
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        book = '1';
        if (cookie.length > 0) {
            book = cookie[0].value;
        }
    });
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            chapter = cookie[0].value;
        }
    });
    db.get(book).then(function(doc) {
        refDb.get('refChunks').then(function(chunkDoc) {
            currentBook = doc;
            if (option == "current") {
                var totalReplacedWord = findReplaceSearchInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chapter - 1, searchVal, replaceVal, option);
                allChapterReplaceCount.push(totalReplacedWord);
                var replacedCount = allChapterReplaceCount.reduce(function(a, b) {
                    return a + b; }, 0);
                $("#searchTextModal").modal('toggle');
                $("#replace-message").html("Book:" + currentBook.book_name + "<br>" + "Total word(s) replaced: " + replacedCount);
                $("#replaced-text-change").modal('toggle');
                replaceCount = 0;
                allChapterReplaceCount = [];
            } else {
                for (var i = 0; i < doc.chapters.length; i++) {
                    var totalReplacedWord = findReplaceSearchInputs(doc.chapters[parseInt(i + 1, 10) - 1].verses, i, searchVal, replaceVal, option);
                    allChapterReplaceCount.push(totalReplacedWord);
                    totalReplacedWord = 0;
                    replaceCount = 0;
                }
                $("#searchTextModal").modal('toggle');
                var replacedCount = allChapterReplaceCount.reduce(function(a, b) {
                    return a + b; }, 0);
                $("#replace-message").html("Book:" + currentBook.book_name + "<br>" + "Total word(s) replaced: " + replacedCount);
                $("#replaced-text-change").modal('toggle');
                allChapterReplaceCount = [];
            }
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
}
// find and replace call end here

// update replaced content
function findReplaceSearchInputs(verses, chapter, searchVal, replaceVal, option) {
    replacedVerse = {};
    var i;
    for (i = 1; i <= verses.length; i++) {
        if (option == "current") {
            var originalVerse = verses[i - 1].verse;
            replacedVerse[i] = i;
            if (originalVerse.search(new RegExp(searchVal, 'g')) >= 0) {
                modifiedVerse = originalVerse.replaceAll(searchVal, replaceVal);
                replacedVerse[i] = modifiedVerse;
                chapter_hash["verse"] = modifiedVerse;
                chapter_hash["verse_number"] = i + 1;
                verses_arr.push(chapter_hash);
                chapter_hash = {};
                replaceCount += originalVerse.match(new RegExp(searchVal, 'g')).length;
            } else {
                replacedVerse[i] = originalVerse;
                chapter_hash["verse"] = originalVerse;
                chapter_hash["verse_number"] = i + 1;
                verses_arr.push(chapter_hash);
                chapter_hash = {};
            }
        } else {
            var originalVerse = verses[i - 1].verse
            replacedVerse[i] = i;
            if (originalVerse.search(new RegExp(searchVal, 'g')) >= 0) {
                modifiedVerse = originalVerse.replaceAll(searchVal, replaceVal);
                chapter_hash["verse"] = modifiedVerse;
                chapter_hash["verse_number"] = i + 1;
                verses_arr.push(chapter_hash);
                chapter_hash = {};
                replaceCount += originalVerse.match(new RegExp(searchVal, 'g')).length;
            } else {
                chapter_hash["verse"] = originalVerse;
                chapter_hash["verse_number"] = i + 1;
                verses_arr.push(chapter_hash);
                chapter_hash = {};
            }
        }
    }
    replacedChapter[chapter] = replacedVerse;
    allChapters["chapter"] = chapter + 1;
    allChapters["verses"] = verses_arr;
    chapter_arr.push(allChapters);
    verses_arr = [];
    allChapters = {};
    highlightRef();
    return replaceCount;
}
// update replace content end here

// save text after replace
// by clicking on the save changes button 
function saveReplacedText() {
    var option = $("#chapter-option").val();
    db.get(currentBook._id).then(function(doc) {
        if (option == "current") {
            for (var c in replacedChapter) {
                var verses = currentBook.chapters[parseInt(c, 10)].verses;
                verses.forEach(function(verse, index) {
                    verse.verse = replacedChapter[c][index + 1];
                });
                doc.chapters[parseInt(c, 10)].verses = verses;
                db.put(doc, function(err, response) {
                    if (err) {
                        $("#replaced-text-change").modal('toggle');
                        alertModal("Error Message!!", "Something went wrong please try later!!");
                    } else {
                        window.location.reload();
                    }
                });
            }
            replacedChapter = {};
            replacedVerse = {};
        } else {
            doc.chapters = chapter_arr
            db.put(doc, function(err, res) {
                if (err) {
                    chapter_arr = [];
                    $("#replaced-text-change").modal('toggle');
                    alertModal("Error Message!!", "Something went wrong please try later!!");
                } else {
                    chapter_arr = [];
                    replacedChapter = {};
                    replacedVerse = {};
                    window.location.reload();
                }
            })
        }
    })
}

// replace change end

// find and replace popup call
$("#btnfindReplace").click(function() {
    $(".error").html("");
    findVal = $("#searchTextBox").val();
    replaceVal = $("#replaceTextBox").val();
    option = $(".form-check-input:checked").val();
    $("#chapter-option").val(option);
    if (findVal == "" && findVal.length == 0) {
        $("#findError").html("Please enter value to search");
        return
    }
    if (replaceVal == "" && replaceVal.length == 0) {
        $("#replaceError").html("Please enter value to replace");
        return
    }
    findAndReplaceText(findVal, replaceVal, option);
});

$("#btnfind").click(function() {
    findVal = $("#searchTextBox").val();
    if (findVal == "" && findVal.length == 0) {
        $("#searchTextModal").modal('toggle');
        alertModal("Find message!!", "Please enter find value to search.");
        return
    }
    findAndReplaceText(findVal, "highlight");
    $("#searchTextModal").modal('toggle');
});

$("#searchText").click(function() {
    $("#searchTextModal").modal('toggle');
    $(".error").html("");
    $("#searchTextBox").val('');
    $("#replaceTextBox").val('');
});

// replace cancel
$("#replace-cancel").click(function() {
    replacedChapter = {};
    replacedVerse = {};
    chapter_arr = [];
});
$(".navigation-btn").click(function() {
    if (targetDirtyFlag == true) {
        saveTarget();
    }
});

function saveTarget() {
    var verses = currentBook.chapters[parseInt(chapter, 10) - 1].verses;
    verses.forEach(function(verse, index) {
        var vId = 'v' + (index + 1);
        verse.verse = document.getElementById(vId).textContent;
    });
    currentBook.chapters[parseInt(chapter, 10) - 1].verses = verses;
    db.get(currentBook._id).then(function(book) {
        currentBook._rev = book._rev;
        db.put(currentBook).then(function(response) {
            var dateTime = new Date().toLocaleString();
            $("#saved-time").html("Last saved target at: " + dateTime);
            setAutoSaveTime(dateTime);
            clearInterval(intervalId);
        }).catch(function(err) {
            db.put(currentBook).then(function(response) {
                var dateTime = new Date().toLocaleString();
                $("#saved-time").html("Last saved target at: " + dateTime);
                setAutoSaveTime(dateTime);
            }).catch(function(err) {
                clearInterval(intervalId);
            });
            clearInterval(intervalId);
        });
    });
}
