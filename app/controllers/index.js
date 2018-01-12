const session = require('electron').remote.session;
const { dialog} = require('electron').remote;
const electron = require('electron').remote;
var Promise = require('bluebird');
var bibUtil = require("../util/json_to_usfm.js"),
    DiffMatchPatch = require('diff-match-patch'),
    dmp_diff = new DiffMatchPatch();
    i18n = new(require('../../translations/i18n')),
    app = require('electron').remote.app;

var db = electron.getCurrentWindow().targetDb,
    refDb = electron.getCurrentWindow().refDb,//require(`${__dirname}/../util/data-provider`).referenceDb(),
    lookupsDb = electron.getCurrentWindow().lookupsDb,
    book,
    chapter,
    currentBook,
    intervalId,
    lastVerse,
    verseLength = 0;
    versesLength = 0,
    chunkGroup = [],
    activeRefs = {},
    currentWin = electron.getCurrentWindow();


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
    targetDirtyFlag = false,

    bibUtil_to_json = require(`${__dirname}/../util/usfm_to_json`),
    fs = require("fs"),
    path = require("path"),
    codeClicked = false,
    constants = require(`${__dirname}/../util/constants.js`),
    removeReferenceLink = '',
    ref_select = '';
    langcodeLimit = 100;

// var fs = Promise.promisifyAll(require("fs"));

    // require(`./${__dirname}/../controllers/exportBook`)

document.getElementById("print-pdf").addEventListener("click", function(e){
    
    i18n.isRtl().then((res)=>{
        if(!res){
               let id = $('.ref-drop-down').val() + '_' + bookCodeList[parseInt(book, 10) - 1];

        let htmlContent = '';
        let inlineData = `<!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta name="description" content="">
                    <style >
                    p {
                        font-size: 100%;
                    }
                    .newspaper ul li ol li:before {
                        font-size: 62%
                    }
                     .chapter {
                        font-size: 180%;
                        }

                    p {
                        font-family: Helvetica;
                    }

                    .body {
                        background-color: #f5f8fa;
                        line-height: 100%;
                    }

                    .newspaper {
                        -webkit-column-count: 2;
                        -moz-column-count: 2;
                        column-count: 2;
                    }

                    .chapter {
                        display: inline-block;
                        margin-left: 4px;
                        float: left;
                        text-align: right;
                        margin-right: 5px;
                    }

                    .list {
                        margin: 0 auto;
                        padding-top: 0px;
                    }
                    .newspaper ul{float: left; width: 100%;}
                    .newspaper ul li {
                        list-style: none;
                        float: left;
                        display: block;
                        width: 100%;
                    }

                    .newspaper ul li ol {
                        counter-reset: item+1;
                        list-style-type: none;
                        margin: 0;
                        padding: 0;
                        margin-left: -16px;
                    }

                    .newspaper ul li ol li {
                        display: block;
                        float: left;
                        width: 100%;
                    }
                    .newspaper ul li ol li:before {
                       width: 3%;
                    float: left;
                    font-weight: bold;
                    content: counter(item) " ";
                    counter-increment: item;
                    margin-right: 8px;
                    padding-left: 10px;
                    text-align: right;
                    }
                    .newspaper ul li ol li p {width: 90%; margin:0 0 10px 0; padding: 0 29px 0px 0px; float: left; box-sizing: border-box;}
                    .firstLi {margin-bottom: 8px; line-height: 20px; width: 80%}

                    @media only screen and (max-width: 1024px) {
                        .newspaper ul li ol li p {
                    width: 80%;
                    margin: 0 0 10px 0;
                    padding: 0 8px 0px 0px;
                    float: left;
                    line-height: 20px;
                    box-sizing: border-box;
                }
                .newspaper ul li {
                    list-style: none;
                    float: left;
                    display: block;
                    width: 90%;
                    padding-right: 21px;
                }
                .chapter {
                        margin-right: 6px;
                    width: 18%;
                }
                      }
                @media only screen and (max-width: 768px) {
                .chapter {
                    margin-right: 4px;
                    width: 31%;
                }
                }

                    @media only screen and (max-width: 700px) {
                    .newspaper ul li ol li p {
                    width: 80%;
                }
                    .newspaper ul li ol li:before {
                    width: 7%;
                    }
                    .chapter {
                         display: inline-block;
                    margin-left: -44px;
                    float: right;
                    text-align: right;
                    margin-right: 12px;
                    width: 100%;
                }
                    }
                    .newspaper{margin-right: 2px}
                    .firstLi {display: inline-flex;}

                @media only print {
                     .body {
                        line-height: 120%;
                       margin-top: 2px;
                    }

                }
                    </style>
</head><body class="body">
    <center><h1>${currentBook.book_name}</h1></center>
    <div class="newspaper">`
            var contentFlag = false;
            db.get(currentBook._id).then(function(doc) {
                doc.chapters.map((obj, i) => {
                    for( let i=0; i<obj.verses.length; i++){
                        if (obj.verses[i].verse !== "" && obj.verses[i].verse !== null){
                            contentFlag = true;
                        }
                        if(i==0){
                            htmlContent += 
                            `<ul class="list">
                                <li>
                                    <p class="firstLi"><span class="chapter">${obj.chapter}</span>${obj.verses[i].verse}</p>
                                </li><li><ol>`
                        }else{
                            htmlContent += `
                            <div><li><p>${obj.verses[i].verse}</p></li></div>`
                        }
                    }
                    htmlContent+= `</ol></li></ul>`
                    if(contentFlag)
                        inlineData += htmlContent;
                    htmlContent = '';
                    contentFlag = false;
                 })
                inlineData+= '</div></body></html>'
                db.get('targetBible').then((doc) => {
                    let filepath = path.join(doc.targetPath, `${currentBook.book_name}.html`);
                    fs.writeFile(filepath, inlineData , function (err) {
                    if (err) {
                        alertModal("export", "Oops! error occured. Please try later");
                        return;
                    }else{
                        alertModal("export", `File exported at location: ${filepath}`);
                    }
                    });    
                }); 
            });     
        } else {
                i18n.getLocale().then((locale) => {

                     let id = $('.ref-drop-down').val() + '_' + bookCodeList[parseInt(book, 10) - 1];
            let htmlContent = '';
            let inlineData = `<!DOCTYPE html>
                <html lang="en" dir="rtl">

                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta name="description" content="">
                    <style>

                        p {
                        font-size: 100%;
                    }
                    .newspaper ul li ol li:before {
                        font-size: 62%
                    }
                     .chapter {
                        font-size: 35px;
                        }

                    p {
                    font-family: Awami Nastaliq;
                    }

                    .body {
                        background-color: #f5f8fa;
                        line-height: 120%;
                    }

                    .newspaper {
                        -webkit-column-count: 2;
                        -moz-column-count: 2;
                        column-count: 2;
                    }
                    .list {
                        margin: 0 auto;
                        padding-top: 5px;
                    }
                   

                    .newspaper ul{float: right; width: 100%;}
                    .newspaper ul li {
                        list-style: none;
                        float: right;
                        display: block;
                        width: 100%;
                            margin-right: 16px;
                    }

                    .newspaper ul li ol {
                        counter-reset: item+1;
                        list-style-type: none;
                        margin: 0;
                        padding: 0;
                    }

                    .newspaper ul li ol li {
                        display: block;
                        float: right;
                        width: 100%;
                    }

                    .newspaper ul li ol li:before {
                        width: 3%;
                        float: right;
                        font-weight: bold;
                        content: counter(item, arabic-indic) "  ";
                        counter-increment: item;
                        margin-top: 3px;
                    }
                    .newspaper ul li ol li p {
                    width: 90%;
                    margin: 0 0 10px 0;
                    padding: 0 10px 0px 0px;
                    float: right;
                    box-sizing: border-box;
                    text-align: right;
                }

                ul li span.chapter { float: right; display: inline-block !important; min-height: 11px; width: 6%;}
                .firstLi {float: right;  text-align: right; margin-right: 23px; width: 60%}

                    @media only print {
                        .firstLi {width: 80%; margin-bottom: 0px;}
                        ul li span.chapter {margin-left: 5px}
                    }
        
                    </style>
                    </head>
                <body class="body">
                <center><h1>${currentBook.book_name}</h1></center>
                <div class="newspaper">`
                var contentFlag = false;
                db.get(currentBook._id).then(function(doc) {
                    doc.chapters.map((obj, i) => {
                        for( let i=0; i<obj.verses.length; i++){
                            if (obj.verses[i].verse !== "" && obj.verses[i].verse !== null){
                                contentFlag = true;
                            }
                            if(i==0){
                                htmlContent += 
                                `<ul class="list">
                                    <li>
                                        <p class="firstLi"><span class="chapter">${obj.chapter.toLocaleString(locale)}</span>${obj.verses[i].verse}</p>
                                    </li><li><ol>`
                            }else{
                                htmlContent += `
                                <li><p>${obj.verses[i].verse}</p></li>`
                            }
                        }
                        htmlContent+= `</ol></li></ul>`
                        if(contentFlag)
                            inlineData += htmlContent;
                        htmlContent = '';
                        contentFlag = false;
                     })
                    inlineData+= '</div></body></html>'
                    db.get('targetBible').then((doc) => {
                        let filepath = path.join(doc.targetPath, `${currentBook.book_name}.html`);
                        fs.writeFile(filepath, inlineData , function (err) {
                        if (err) {
                            alertModal("export", "Oops! error occured. Please try later");
                            return;
                        }else{
                            alertModal("export", `File exported at location: ${filepath}`);
                        }
                        });    
                    }); 
                });     
                
                });
            }
            
        },(err)=> {
            console.log(err)
        });

});


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
            alertModal("dynamic-msg-trans-data", "dynamic-msg-saved-change");
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
});

function createVerseInputs(verses, chunks, chapter) {
    document.getElementById('input-verses').innerHTML = "";
    i18n.getLocale().then((res) => {
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
            spanVerseNum.appendChild(document.createTextNode(i.toLocaleString(res)));
            divContainer.id = "verseCon" + i;
            divContainer.appendChild(spanVerseNum);
            divContainer.appendChild(spanVerse);
            document.getElementById('input-verses').appendChild(divContainer);
            $(".diff-count-target").html("");
        }
        lastVerse = i;
        versesLength  = verses.length;
        highlightRef();
    });
    
}

function lastVisitFromSession(success, failure) {
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            book = cookie[0].value;
            session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
                if (cookie.length > 0) {
                    chapter = cookie[0].value;
                    // initializeTextInUI(book, chapter);
                    success(book, chapter);
                } else {
                    failure();
                }
            });
        } else {
            failure();
        }
    });
}

function lastVisitFromDB(success) {
    refDb.get("ref_history")
        .then(function(doc) {
            book = doc.visit_history[0].bookId;
            chapter = doc.visit_history[0].chapter;
            var cookie = { url: 'http://book.autographa.com', name: 'book', value: book };
            session.defaultSession.cookies.set(cookie, (error) => {
                if (error)
                    console.error(error);
                var cookie = { url: 'http://chapter.autographa.com', name: 'chapter', value: chapter };
                session.defaultSession.cookies.set(cookie, (error) => {
                    if (error)
                        console.error(error);
                    success(book, chapter);
                });
            });
        }).catch(function(err) {
            console.log('Error: While retrieving document. ' + err);
        });
}



function initializeTextInUI(book, chapter) {
    setLocaleText("#book-chapter-btn", ("book-"+(booksList[book - 1]).replace(/\s+/g, '-').toLowerCase()), "text");
    i18n.getLocale().then((lang) => {
        document.getElementById('chapterBtnSpan').innerHTML = '<a  id="chapterBtn" data-toggle="tooltip" data-placement="bottom"  title="Select Chapter" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + book + "'" + ');" >' + parseInt(chapter, 10).toLocaleString(lang) + '</a>'
        setLocaleText('#chapterBtn', "tooltip-select-chapter", 'title');
        // $('[data-toggle=tooltip]').tooltip();

    }).catch(function(err){
        document.getElementById('chapterBtnSpan').innerHTML = '<a  id="chapterBtn" data-toggle="tooltip" data-placement="bottom"  title="Select Chapter" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + book + "'" + ');" >' + parseInt(chapter, 10).toLocaleString() + '</a>'
        // $('[data-toggle=tooltip]').tooltip();

    });
    setLocaleText("#chapterBtn", 'tooltip-select-chapter', "title");
    db.get(book).then(function(doc) {
        refDb.get('refChunks').then(function(chunkDoc) {
            currentBook = doc;
            createRefSelections();
            createVerseInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter);
        });
    }).catch(function(err) {
        console.log('Error: While retrieving document. ' + err);
    });
}

// Get last viewed book and chapter either from session or from DB, in that order.
lastVisitFromSession(
    function(book, chapter) {
        initializeTextInUI(book, chapter);
    },
    function() {
        lastVisitFromDB(initializeTextInUI);
    }
);

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
        refDb.get('ref_history').then(function(doc) {
            chapter = doc.visit_history[0].chapter;
            if (cookie.length > 0) {
                chapter = cookie[0].value;
            }
            refDb.get(id).then(function(doc) {
                for (i = 0; i < doc.chapters.length; i++) {
                    if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                        break;
                    }
                }
                ref_string = doc.chapters[i].verses.map(function(verse, verseNum) {
                    let transLatedVerse = refId === "arb_vdt" ? (verseNum+1).toLocaleString('ar') : (verseNum+1);
                    return '<div data-verse="r' + (verseNum + 1) + '"><span class="verse-num">' + transLatedVerse + '</span><span>' + verse.verse + '</span></div>';
                }).join('');
                callback(null, ref_string);
            }).catch(function(err) {
                callback(err, "");
            });
        });
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
                        if(ref_doc.ref_id == "arb_vdt"){
                             $('div[type="ref"]').html(refContent).attr("dir", "rtl").addClass("rtl");
                        }else{
                            $('div[type="ref"]').html(refContent);
                        }
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
        var refCookieValue = {}
        refDb.get('activeRefs').then((doc) => {
            if (doc.activeRefs) {
                // $.each(doc.activeRefs, function(i, v){
                //     doc.activeRefs[v.name.toString()] = v.value
                // });
                $.each(doc.activeRefs, function(i, val){
                    if($('.ref-drop-down')[i] && $('.ref-drop-down')[i].length > 0 ){
                        $('.ref-drop-down')[i].value = val;
                        $(".current-val")[i].value = val;
                    }
                    getReferenceText(val, function(err, refContent) {
                        if (err) {
                            $(".ref-drop-down")[i].value = val;
                            getReferenceText(val, function(err, refContent) {
                                if (err) {
                                    console.log("This chapter is not available in the selected reference version.");
                                }
                                if(val === "arb_vdt"){
                                    $('div[type="ref"]').html(refContent).attr('dir', 'rtl');
                                }else{
                                    $('div[type="ref"]').html(refContent);

                                }
                            })
                            return;
                        }                        
                        if(val === "arb_vdt"){
                            $("#section-" + i).find('div[type="ref"]').html(refContent).attr('dir', 'rtl').addClass('rtl');
                        }else{
                            $("#section-" + i).find('div[type="ref"]').html(refContent);
                        }
                    });
                });
            }else {
                $('.ref-drop-down :selected').each(function(i, selected) {
                    $(".current-val").val($(selected).val());
                    getReferenceText($(selected).val(), function(err, refContent) {
                        if (err) {
                            $(".ref-drop-down").val($(".ref-drop-down option:first").val());
                            getReferenceText($(".ref-drop-down option:first").val(), function(err, refContent) {
                                if (err) {
                                    console.log("This chapter is not available in the selected reference version.");
                                }
                                $('div[type="ref"]').html(refContent);
                            })
                            return;
                        }
                        if($(selected).val() == "arb_vdt") {
                            $('div[type="ref"]').attr("dir", "rtl");
                            $('div[type="ref"]').addClass('rtl');
                        }else{
                            $('div[type="ref"]').removeAttr("dir", "rtl");
                        }
                        if ($("#section-" + i).length > 0) {
                            $("#section-" + i).find('div[type="ref"]').html(refContent);
                        } else {
                            $('div[type="ref"]').html(refContent);
                        }
                    });
                });
            } 
        });
    }
}

$('.ref-drop-down').change(function(event) {
    var selectedRefElement = $(this);
    let refDropDownPos = $(this).siblings('.current-pos').val().toString();
    var cookieRef = { url: 'http://refs.autographa.com', name: refDropDownPos , value: selectedRefElement.val() };
    session.defaultSession.cookies.set(cookieRef, (error) => {
        if (error)
            console.log(error);
    });
    activeRefs[refDropDownPos] = selectedRefElement.val();
    refDb.get('activeRefs').then((doc) => {
        doc._rev = doc._rev;
        doc.activeRefs = Object.assign(doc.activeRefs, activeRefs);
        refDb.put(doc);
    }, (err) => {
        refDb.put({_id: "activeRefs" , activeRefs: activeRefs}).then((res) => {
        }, (err) => {
            console.log(err);
        });
    });
    getReferenceText($(this).val(), function(err, refContent) {
        if (err) {
            selectedRefElement.val(selectedRefElement.next().val());
            alertModal("dynamic-msg-error", "dynamic-msg-selected-ref-ver");
            return;
        } else {
            selectedRefElement.next().val(selectedRefElement.val());
        }        
        if(selectedRefElement.val() === 'arb_vdt'){
            selectedRefElement.closest('div.row').next('div.row').children('div[type="ref"]').html(refContent).attr("dir", "rtl").addClass("rtl");
        }else{
            selectedRefElement.closest('div.row').next('div.row').children('div[type="ref"]').html(refContent).removeAttr("dir")
        }        
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
            $('div[data-verse^="r"]').css({ "background-color": "", "font-weight": "", "padding-left": "10px", "padding-right": "10px" });
            for (j = limits[0]; j <= limits[1]; j++) {
                $('div[data-verse="r' + (j + 1) + '"]').css({ "background-color": "rgba(11, 130, 255, 0.1)",  "padding-left": "10px", "padding-right": "10px", "margin-right": "10px" });
            }
            $('div[data-verse="r' + (limits[0] + 1) + '"]').css({ "border-radius": "10px 10px 0px 0px" });
            $('div[data-verse="r' + (limits[1] + 1) + '"]').css({ "border-radius": "0px 0px 10px 10px" });

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
            clone_ele.find(".current-pos").val('1');
            var refVal = clone_ele.find(".current-val").val()
            if(refVal != ""){
                console.log(refVal)
                var cookieRef = { url: 'http://refs.autographa.com', name: "1" , value: refVal };
                session.defaultSession.cookies.set(cookieRef, (error) => {
                    if (error)
                        console.log(error);
                });
            }
            //element.attr("id", newID).insertBefore('div.col-editor');
        }
    } else if (layout === '4x') {
        if (children.length === 4) {
            return;
        }
        for (i = 0; i < children.length; i++) {

            $(children[i]).removeClass(function(index, css) {
                return (css.match(/(^|\s)col-sm-\S+/g) || []).join(' ');
            });$
            $(children[i]).addClass('col-sm-3').attr("id", "section-" + i);
            if (i == 2) {
                count = 2;
            }

        }
        for (i = 0; i < (4 - children.length); i++) {
            clone_ele = $(children[0]).clone(true, true).attr("id", "section-" + count).insertBefore('div.col-editor');
            clone_ele.find(".ref-drop-down").val(clone_ele.find(".current-val").val());
            clone_ele.find(".current-pos").val(count);
            var refVal = clone_ele.find(".current-val").val()
            if(refVal != ""){
                var cookieRef = { url: 'http://refs.autographa.com', name: "2" , value: refVal };
                session.defaultSession.cookies.set(cookieRef, (error) => {
                    if (error)
                        console.log(error);
                });
            }
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
            (function(j){
                i18n.__("book-"+(constants.booksList[j - 1]).replace(/\s+/g, '-').toLowerCase()).then((res)=>{
                      var li = document.createElement('li'),
                        a = document.createElement('a'),
                        bookName = document.createTextNode(res);
                    a.id = 'b' + j;
                    a.setAttribute('href', "javascript:setBookName(" + "'" + "b" + j + "'" + ")");
                    a.appendChild(bookName);
                    li.appendChild(a);
                    document.getElementById('books-pane').appendChild(li);
                }); 
            })(i);
        }
        session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
            if (cookie.length > 0) {
                book = cookie[0].value;
                $("#b" + book).addClass("link-active");
                $("#c" + $("#chapterBtn").text()).addClass("link-active");
            } else {
                refDb.get("ref_history").then(function(doc) {
                    book = doc.visit_history[0].bookId;
                    chapter = doc.visit_history[0].chapter;
                    $("#b" + book).addClass("link-active");
                    $("#c" + chapter).addClass("link-active");
                });
            }
        });  
    
}

function createChaptersList(chaptersLimit) {
    document.getElementById('chaptersList').innerHTML = "";
        i18n.getLocale().then((locale) => {
             for (var i = 1; i <= chaptersLimit; i++) {
                var li = document.createElement('li'),
                    a = document.createElement('a'),
                    chapterNumber = document.createTextNode(i.toLocaleString(locale));
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
        })
}

function setBookName(bookId) {
    $(".selected ul li a").removeClass("link-active");
    $("#" + bookId).addClass("link-active");
    db.get(bookId.substring(1).toString()).then(function(doc) {
        book = bookId.substring(1).toString();
        // setChapterCookie('0');
        createChaptersList(doc.chapters.length);
        $('#booksTab').removeClass('is-active');
        $('#books-panel').removeClass('is-active');
        $("#chapterTab").addClass('is-active');
        $("#chapters-panel").addClass("is-active");
    }).catch(function(err) {
        closeModal($("#books"));
        console.log('Error: While retrieving document. ' + err);
    });

}

function setChapter(chapter) {
    db.get(book).then(function(doc) {
        refDb.get('refChunks').then(function(chunkDoc) {
            currentBook = doc;
            chapter = chapter;
            createRefSelections();
            createVerseInputs(doc.chapters[parseInt(chapter, 10) - 1].verses, chunkDoc.chunks[parseInt(book, 10) - 1], chapter);
        });
        i18n.__("book-"+ doc.book_name.replace(/\s+/g, '-').toLowerCase()).then((res) => {
            i18n.getLocale().then((locale) => {
                document.getElementById("bookBtn").innerHTML = '<a class="btn btn-default" data-toggle="tooltip" data-placement="bottom"  title="Select Book" href="javascript:getBookList();" id="book-chapter-btn">' + res  + '</a><span id="chapterBtnSpan"><a id="chapterBtn" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + book + "'" + ')" >' + parseInt(chapter, 10).toLocaleString(locale) + '</span></a>'
                setLocaleText("#book-chapter-btn", 'tooltip-select-book', 'title');
                setChapterButton(book, chapter);
            });
        });
        setChapterCookie(chapter);
        saveLastVisit(book, chapter);
        closeModal($("#bookChapTabModal"));
    }).catch(function(err) {
        closeModal($("#bookChapTabModal"));
        console.log('Error: While retrieving document. ' + err);
    });
    chunkGroup = [];
}
function setChapterButton(bookId, chapterId) {
    i18n.getLocale().then((locale) => {
        document.getElementById('chapterBtnSpan').innerHTML = '<a id="chapterBtn" data-toggle="tooltip" data-placement="bottom"  title="Select Chapter" class="btn btn-default" class="btn btn-default" href="javascript:getBookChapterList(' + "'" + bookId + "'" + ');" >' + parseInt(chapterId, 10).toLocaleString(locale) + '</a>'    
        setLocaleText("#chapterBtn", 'tooltip-select-chapter', "title");
    });
    
    const cookie = { url: 'http://book.autographa.com', name: 'book', value: bookId };
    session.defaultSession.cookies.set(cookie, (error) => {
        if (error)
            console.error(error);
    });
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
    $("#bookChapTabModal").modal('toggle');
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            book = cookie[0].value;
            db.get(book).then(function(doc) {
                createChaptersList(doc.chapters.length);
                $('#booksTab').addClass('is-active');
                $('#books-panel').addClass('is-active');
                $("#chapterTab").removeClass('is-active');
                $("#chapters-panel").removeClass("is-active");
            }).catch(function(err) {
                closeModal($("#books"));
                console.log('Error: While retrieving document. ' + err);
            });
        }
    });

}
// get book chapter list in popup
function getBookChapterList(bookId) {
    db.get(bookId).then(function(doc) {
        createChaptersList(doc.chapters.length);
        createBooksList(66);
        $("#bookChapTabModal").modal('toggle');
        $('#booksTab').removeClass('is-active');
        $('#books-panel').removeClass('is-active');
        $("#chapterTab").click().addClass('is-active');
        $("#chapters-panel").addClass("is-active");

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
            alertModal("dynamic-msg-error", "dynamic-msg-enter-translation");
        });
    }).catch(function(err) {
        // handle any errors
        alertModal("dynamic-msg-error", "dynamic-msg-enter-translation");
    });
});

$("#exportUsfm").on("click", function() {
    exportUsfm();
})

function exportChoice() {
    i18n.__("dynamic-msg-stage-trans").then((res) => {
        $("#dropdownBtn").html(res + ' <span class="caret"></span>');
    });
    $("#stageText").val('');
    $("#exportChoice").modal();
    $("#exportChoice").toggle();
}

function exportUsfm() {
    // Reading the database object
    session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, cookie) => {
        if (error) {
            $("#exportChoice").modal('hide');
            alertModal("dynamic-msg-error", "dynamic-msg-process-req");
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
            i18n.__("label-exported-file").then((res) => {
                alertModal("dynamic-msg-book-exported", res +" : " + filepath);
                return;
            })
            
        }).catch(function(err) {
            $("#exportChoice").modal('hide');
            console.log('Error: Cannot get details from DB' + err);
            alertModal("dynamic-msg-error", "dynamic-msg-enter-translation");
        });
    });
}

function alertModal(heading, formContent) {
    setLocaleText("#heading", heading, 'text');
    setLocaleText("#content", formContent, 'text');
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
        (function(j){
            i18n.__("book-"+(constants.booksList[j - 1]).replace(/\s+/g, '-').toLowerCase()).then((res)=>{
                  var li = document.createElement('li'),
                    a = document.createElement('a'),
                    bookName = document.createTextNode(res);
                a.id = 'b' + j;
                a.setAttribute('href', "javascript:setBookName(" + "'" + "b" + j + "'" + ")");
                a.appendChild(bookName);
                li.appendChild(a);
                document.getElementById('books-pane').appendChild(li);
            });   

        })(i);
    }
    $("#b"+currentBook._id).addClass('link-active');
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
    // $('#switch-2').bootstrapSwitch();
    i18n.isRtl().then((res)=>{
        if(res){
            $('head').append('<link rel="stylesheet" href="../assets/stylesheets/material.rtl.min.css">');
            $("#input-verses").attr("dir", "rtl");
            $("#input-verses").addClass('rtl');
        }
    });
    db.get('targetBible').then((doc) => {
        if(doc.langScript == "RTL"){
            $("#input-verses").attr("dir", "rtl").addClass("arabic").removeClass("english");
            $("#script-dir-rtl")[0].MaterialRadio.check();

        }
    }, (err) => {
    })
    setReferenceSetting();
    buildReferenceList();

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
    $("#trans-stage").on('click', 'li a', function() {
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

    refDb.get('autoupdate').then(function(doc) {
        if(doc.enable){
            $("#label-autoupdate-enable")[0].MaterialRadio.check();
        }
    }).catch(function(err){
        console.log(err)
    });

    refDb.get('appFirstRun').then(function(doc){
        if(doc.isFirstRun){
            doc.isFirstRun = false;
            refDb.put(doc);
            $('#bannerformmodal').modal('toggle');
            document.getElementById("label-auto-update").click();
        }
    }).catch(function(error){
        console.log(error)
    })

});
//check same langauge in the reference
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
//check difference on click
$('.check-diff').on('click', function() {
    if ($(this).is(':checked') === true) {
        diffModeFlag = true;
        promise = isSameLanguage();
        promise.then(function(response) {
            if (response == false) {
                $('.check-diff').removeAttr('checked')
                alertModal("dynamic-msg-error", "dynamic-compare-mode");
                $('#switchLable')[0].MaterialSwitch.off();
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
    var numFontSize = parseInt($('.verse-num').css("font-size"));
    if ($(this).hasClass("plus")) {
        size = size + 2;
        numFontSize = numFontSize + 1;
        if (size >= 30) {
            size = 30;
        }
        if(numFontSize >= 30){
            numFontSize = 30
        }
    } else {
        size = size - 2;
        numFontSize = numFontSize -1 ;
        if (size <= 14) {
            size = 14;
        }
        if(numFontSize <= 10){
            numFontSize = 10;
        }
    }
    $("#fontSlider").slider('setValue', size);
    $('.col-ref').css("font-size", size);
    $('.verse-num').css("font-size", numFontSize);
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
        i18n.__('label-last-saved').then((res)=>{
            $("#saved-time").html(res+"  "+ cookie[0].value);
        });
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
                    return a + b;
                }, 0);
                $("#searchTextModal").modal('toggle');
                i18n.__("dynamic-msg-book").then((dynMsgBook)=>{

                    i18n.__("book-"+currentBook.book_name.replace(/\s+/g, '-').toLowerCase()).then((currentBookWord)=>{
                        return dynMsgBook +" : "+currentBookWord
                    }).then((res)=>{
                        i18n.__("label-total-word-replaced").then((totalWordMsg)=>{
                            $("#replace-message").html(res + "<br>" + totalWordMsg + " :  " + replacedCount);
                        });
                    });
                });
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
                    return a + b;
                }, 0);
                i18n.__("dynamic-msg-book").then((dynMsgBook)=>{

                    i18n.__("book-"+currentBook.book_name.replace(/\s+/g, '-').toLowerCase()).then((currentBookWord)=>{
                        return dynMsgBook +" : "+currentBookWord
                    }).then((res)=>{
                        i18n.__("label-total-word-replaced").then((totalWordMsg)=>{
                            $("#replace-message").html(res + "<br>" + totalWordMsg + " :  " + replacedCount);
                        });
                    });
                });
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
            if (originalVerse.search(new RegExp(escapeRegExp(searchVal), 'g')) >= 0) {
                modifiedVerse = originalVerse.replaceAll(searchVal, replaceVal);
                replacedVerse[i] = modifiedVerse;
                chapter_hash["verse"] = modifiedVerse;
                chapter_hash["verse_number"] = i + 1;
                verses_arr.push(chapter_hash);
                chapter_hash = {};
                replaceCount += originalVerse.match(new RegExp(escapeRegExp(searchVal), 'g')).length;
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
            if (originalVerse.search(new RegExp(escapeRegExp(searchVal), 'g')) >= 0) {
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
                        alertModal("dynamic-msg-error", "dynamic-msg-went-wrong");
                    } else {
                        replaceCount = 0;
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
                    alertModal("dynamic-msg-error", "dynamic-msg-went-wrong");
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
        setLocaleText("#findError", 'error-msg-search-validation', 'html')
        return
    }
    if (replaceVal == "" && replaceVal.length == 0) {
        setLocaleText("#replaceError", "error-msg-replace-validation", 'html');
        return
    }
    findAndReplaceText(findVal, replaceVal, option);
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
            var dateTime = new Date();
            i18n.__('label-last-saved').then((res)=>{
                $("#saved-time").html(res+"  "+ formatDate(dateTime));
            });
            setAutoSaveTime(formatDate(dateTime));
            clearInterval(intervalId);
        }).catch(function(err) {
            db.put(currentBook).then(function(response) {
                var dateTime = new Date();
                i18n.__('label-last-saved').then((res)=>{
                    $("#saved-time").html(res+"  "+ formatDate(dateTime));
                });
                setAutoSaveTime(formatDate(dateTime));
            }).catch(function(err) {
                clearInterval(intervalId);
            });
            clearInterval(intervalId);
        });
    });
}
// save last visit in database
function saveLastVisit(book, chapter) {
    refDb.get('ref_history').then(function(doc) {
        doc.visit_history = [{ "book": $('#book-chapter-btn').text(), "chapter": chapter, "bookId": book }]
        refDb.put(doc).then(function(response) {}).catch(function(err) {
            console.log(err);
        });
    });
}
//save last visit end

//font slider 
$("#fontSlider").slider();
$("#fontSlider").on("slide", function(slideEvt) {
    $("#fontSliderSliderVal").text(slideEvt.value);
    $('.col-ref').css("font-size", slideEvt.value);
    $('.verse-num').css("font-size", slideEvt.value-4);
});

$("#fontSlider").on("slideStart", function(slideEvt) {
    $("#fontSliderSliderVal").text(slideEvt.value);
    $('.col-ref').css("font-size", slideEvt.value);
    $('.verse-num').css("font-size", slideEvt.value-4);
});

//font slider

//setting tab
function settings(evt, settingsTab) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(settingsTab).style.display = "block";
    evt.currentTarget.className += " active";
}


// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

// $(document).ready(function() {
$(".selected ul li a").click(function() {
    $(".selected ul li a").removeClass("link-active");
    // $(".tab").addClass("active"); // instead of this do the below 
    $(this).addClass("link-active");
});
// });

//setting js


document.getElementById('export-path').addEventListener('click', function(e) {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
        filters: [{ name: 'All Files', extensions: ['*'] }],
        title: "Select export destination folder"
    }, function(selectedDir) {
        if (selectedDir != null) {
            e.target.value = selectedDir;
        }
    });
});

document.getElementById('target-import-path').addEventListener('click', function(e) {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
        filters: [{ name: 'All Files', extensions: ['*'] }],
        title: "Select import folder for target"
    }, function(selectedDir) {
        if (selectedDir != null) {
            e.target.value = selectedDir;
        }
    });
});

document.getElementById('save-settings').addEventListener('click', function(e) {
    if (target_setting() == false)
        return;
    const settingData = { 
        _id: 'targetBible',
        targetLang: document.getElementById('target-lang-code').value,
        targetVersion: document.getElementById('target-version').value,
        targetPath: document.getElementById('export-path').value,
        langScript: $("#lang-script-ltr").is(':checked') ? "LTR" : "RTL"
    }
    db.get('targetBible').then((doc) => {
        settingData._rev = doc._rev;
        db.put(settingData).then((res) => {
            window.location.reload();
            // alert_message(".alert-success", "dynamic-msg-saved-trans");
        });
    }, (err) => {
        db.put(settingData).then((res) => {
            // alert_message(".alert-success", "dynamic-msg-saved-trans");
            window.location.reload();
        }, (err) => {
            console.log(err)
            alert_message(".alert-danger", "dynamic-msg-went-wrong");
        });
    });
});

document.getElementById('ref-import-btn').addEventListener('click', function(e) {
    if (reference_setting() == false)
        return;
    $("#loading-img").show();
    var ref_id_value = document.getElementById('langCode').value.toLowerCase() + '_' + document.getElementById('ref-version').value.toLowerCase(),
        ref_entry = {},
        ref_arr = [],
        files = fs.readdirSync(document.getElementById('ref-path').value);
    ref_entry.ref_id = ref_id_value;
    ref_entry.ref_name = document.getElementById('ref-name').value;
    ref_entry.isDefault = false;
    ref_arr.push(ref_entry);
        refDb.get('refs').then(function(doc) {
            ref_entry = {}
            var refExistsFlag = false;
            var updatedDoc = doc.ref_ids.forEach(function(ref_doc) {
                if (ref_doc.ref_id === ref_id_value) {
                    refExistsFlag = true;
                }
                ref_entry.ref_id = ref_doc.ref_id;
                ref_entry.ref_name = ref_doc.ref_name;
                ref_entry.isDefault = ref_doc.isDefault;
                ref_arr.push(ref_entry)
                ref_entry= {};
            });
            if (!refExistsFlag) {
                // doc.ref_ids.push(ref_entry);
                doc.ref_ids = ref_arr;
                refDb.put(doc).then(function(res) {
                    saveJsonToDB(files);
                    buildReferenceList();
                    alert_message(".alert-success", "dynamic-msg-imp-ref-text");
                    clearReferenceSetting();
                });
            } else {
                saveJsonToDB(files);
                buildReferenceList();
                alert_message(".alert-success", "dynamic-msg-imp-ref-text");
                clearReferenceSetting();

            }
        }).catch(function(err) {
            if (err.message === 'missing') {
                var refs = {
                    _id: 'refs',
                    ref_ids: []
                };
                ref_entry.isDefault = true;
                refs.ref_ids.push(ref_entry);
                refDb.put(refs).then(function(res) {
                    saveJsonToDB(files);
                    buildReferenceList();
                    alert_message(".alert-success", "dynamic-msg-imp-ref-text");
                    clearReferenceSetting();
                }).catch(function(internalErr) {
                    alert_message(".alert-danger", "dynamic-msg-imp-error");
                });
            } else if (err.message === 'usfm parser error') {
                alert_message(".alert-danger", "dynamic-msg-parse-error");
            } else {
                alert_message(".alert-danger", "dynamic-msg-imp-error");
            }
        });
});

document.getElementById('target-import-btn').addEventListener('click', function(e) {
    if (import_sync_setting() == false)
        return;
    $("#loading-img").show();
    var inputPath = document.getElementById('target-import-path').value;
    var files = fs.readdirSync(inputPath);
    Promise.map(files, function(file){
        var filePath = path.join(inputPath, file);
        if (fs.statSync(filePath).isFile() && !file.startsWith('.')) {
            var options = {
                lang: 'hi',
                version: 'ulb',
                usfmFile: filePath,
                targetDb: 'target'
            }
            bibUtil_to_json.toJson(options);
        }
    }).then(function(res){
        $("#loading-img").hide();
    }).catch(function(err){
        $("#loading-img").hide();
    })
    // files.forEach(function(file) {
    //     var filePath = path.join(inputPath, file);
    //     if (fs.statSync(filePath).isFile() && !file.startsWith('.')) {
    //         //console.log(filePath);
    //         var options = {
    //             lang: 'hi',
    //             version: 'ulb',
    //             usfmFile: filePath,
    //             targetDb: 'target'
    //         }
    //         bibUtil_to_json.toJson(options);
    //     }
    // });
    
});

$('#importModal').on('hidden.bs.modal', function () {
    window.location.reload();
})



function saveJsonToDB(files) {
    const location = document.getElementById('ref-path').value
    const langCode = document.getElementById('langCode').value.toLowerCase();
    const version = document.getElementById('ref-version').value.toLowerCase();
    Promise.map(files, function(file){
        console.log(file)
        if (!file.startsWith('.')) {
            var filePath = path.join(location, file);
            if (fs.statSync(filePath).isFile()) {
                var options = {
                    lang: langCode,
                    version: version,
                    usfmFile: filePath,
                    targetDb: 'refs'
                }
                bibUtil_to_json.toJson(options);
            }
        }
    }).then(function() {
        $("#loading-img").hide();
    }).catch(function(err){
        $("#loading-img").hide();
    })
    // files.forEach(function(file) {
        // if (!file.startsWith('.')) {
        //     var filePath = path.join(document.getElementById('ref-path').value, file);
        //     //console.log(filePath + ' ' + fs.statSync(filePath).isFile());
        //     if (fs.statSync(filePath).isFile()) {
        //         var options = {
        //             lang: document.getElementById('langCode').value.toLowerCase(),
        //             version: document.getElementById('ref-version').value.toLowerCase(),
        //             usfmFile: filePath,
        //             targetDb: 'refs'
        //         }
        //         bibUtil_to_json.toJson(options);
        //     }
        // }
    // });
}

document.getElementById('ref-path').addEventListener('click', function(e) {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
        filters: [{ name: 'All Files', extensions: ['*'] }],
        title: "Select reference version folder"
    }, function(selectedDir) {
        if (selectedDir != null) {
            e.target.value = selectedDir;
        }
    });
});



// Validation check for reference settings
function reference_setting() {
    var name = $("#ref-name").val(),
        langCode = $("#langCode").val(),
        version = $("#ref-version").val(),
        path = $("#ref-path").val(),
        isValid = true;
    if (name == "") {
        alert_message(".alert-danger", "dynamic-msg-bib-name-validation");
        isValid = false;
    } else if (langCode === null || langCode === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-code-validation");
        isValid = false;
    }else if(langCode.match(/^\d/)) {
        alert_message(".alert-danger", "dynamic-msg-bib-code-start-with-number");
        isValid = false;
    }
    else if((/^([a-zA-Z0-9_-]){3,8}$/).test(langCode) === false){
        alert_message(".alert-danger", "dynamic-msg-bib-code-start-with-number");
        isValid = false;
    }
    else if (version === null || version === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-version-validation");
        isValid = false;
    } else if (path === null || path === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-path-validation");
        isValid = false;
    } else {
        isValid = true;

    }
    return isValid;
} //validation reference settings

// Validation check for target language settings
function target_setting() {
    var langCode = $("#target-lang-code").val(),
        version = $("#target-version").val(),
        path = $("#export-path").val(),
        isValid = true;
    if (langCode === null || langCode === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-code-validation");
        isValid = false;
    }else if(langCode.match(/^\d/)) {
        alert_message(".alert-danger", "dynamic-msg-bib-code-start-with-number");
        isValid = false;
    }
    else if((/^([a-zA-Z0-9_-]){3,8}$/).test(langCode) === false){
        alert_message(".alert-danger", "dynamic-msg-bib-code-start-with-number");
        isValid = false;
    }
    else if (version === null || version === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-version-validation");
        isValid = false;
    } else if (path === null || path === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-path-validation");
        isValid = false;
    } else {
        isValid = true;
    }
    return isValid;
} //validation target setting

function import_sync_setting() {
    var targetImportPath = $("#target-import-path").val();
    isValid = true;
    if (targetImportPath === null || targetImportPath === "") {
        alert_message(".alert-danger", "dynamic-msg-bib-path-validation");
        isValid = false;
    }
    return isValid;
}

function alert_message(type, message) {
    $(type).css("display", "block");
    $(type).fadeTo(2000, 1000).slideUp(1000, function() {
        $(type).css("display", "none");
    });
    setLocaleText(type + " " + "span", message, 'html')
}

function setReferenceSetting() {
    db.get('targetBible').then(function(doc) {
        $("#target-lang-code").val(doc.targetLang);
        $("#target-lang")[0].parentNode.MaterialTextfield.change(doc.targetLang);
        $("#target-version")[0].parentNode.MaterialTextfield.change(doc.targetVersion);
        $("#export-path")[0].parentNode.MaterialTextfield.change(doc.targetPath);
    }).catch(function(err) {
        $("#target-lang")[0].parentNode.MaterialTextfield.change("");
        $("#target-version")[0].parentNode.MaterialTextfield.change("");
        $("#export-path")[0].parentNode.MaterialTextfield.change("");
    });
}

function matchCode(input) {
    // var matches = []
    var filteredResults = {};
    return lookupsDb.allDocs({
        startkey: input.toLowerCase(),
        endkey: input.toLowerCase() + '\uffff',
        include_docs: true
    }).then(function(response) {
        var data = ""
        if (response != undefined && response.rows.length > 0) {
            $.each(response.rows, function(index, value) {
                    doc = value.doc
                    if (doc) {
                        //matches.push({ name: doc.name+' ('+doc.lang_code+') ' , id: doc._id });
                        if (!filteredResults.hasOwnProperty(doc.lang_code)) {
                            filteredResults[doc.lang_code] = doc.name; // 0 duplicates
                        } else {
                            existingValue = filteredResults[doc.lang_code]
                            filteredResults[doc.lang_code] = (existingValue + " , " + doc.name);
                        }
                    }

                })
                // return matches;
            return filteredResults
        } else {
            return [];
        }
    }).catch(function(err) {
        console.log(err);
    })
}

function changeInput(val, inputId, fieldValue, listId) {
    codeClicked = false; // flag to check language code clicked on list or not
    if (val.length >= 2) {
        var autoCompleteResult = matchCode(val)
        autoCompleteResult.then(function(res) {
            var parent_ul = "<ul>";
            if (res) {
                $.each(res, function(langCode, names) {
                    // CREATE AND ADD SUB LIST ITEMS.
                    parent_ul += "<li><span class='code-name'>" + names + ' (' + langCode + ') ' + "</span><input type='hidden' value=" + "'" + langCode + "'" + "class='code-id'/> </li>"
                });
                parent_ul += "</ul>"
                $(listId).html(parent_ul).show();
                $(listId + " li").on("click", function(e) {
                    var $clicked = $(this);
                    codeName = $clicked.children().select(".code-name").text();
                    codeId = $clicked.find(".code-id");
                    $(inputId).val(codeName);
                    $(fieldValue).val(codeId.val());
                    codeClicked = true;
                });
            }
        });
    }else{
         $(listId).hide();
    }
    $(document).on("click", function(e) {
        var $clicked = $(e.target);
        if (!$clicked.hasClass("search")) {
            $(".lang-code").fadeOut();
        }
    });
    $('#inputSearch').click(function() {
        $(".lang-code").fadeIn();
    });
}
$("#ref-lang-code").keyup(function() {
    $("#langCode").val('');
    i18n.getLocale().then((locale) => {
        if(locale === "en"){
            changeInput($("#ref-lang-code").val(), "#ref-lang-code", "#langCode", "#reference-lang-result");
        }
    });
});

$("#target-lang").keyup(function() {
    $("#target-lang-code").val('');
    i18n.getLocale().then((locale) => {
        if(locale === "en"){
            changeInput($("#target-lang").val(), "#target-lang", "#target-lang-code", "#target-lang-result");
        }
    });
});

var langOptions = {limit : 50, include_docs: true};

function loadLanguageCode(inputId, fieldValue, listId){
    i18n.getLocale().then((locale) => {
        if(locale != 'en'){
            let filteredResults = {};
            lookupsDb.allDocs(
                langOptions
            ).then(function(response) {
                var data = ""
                if (response != undefined && response.rows.length > 0) {
                    // console.log(response.rows[0].doc.lang_code)                  
                    $.each(response.rows, function(index, value) {
                      
                            doc = value.doc
                            if (doc) {
                                //matches.push({ name: doc.name+' ('+doc.lang_code+') ' , id: doc._id });
                                if (!filteredResults.hasOwnProperty(doc.lang_code)) {
                                    filteredResults[doc.lang_code] = doc.name; // 0 duplicates
                                } else {
                                    existingValue = filteredResults[doc.lang_code]
                                    filteredResults[doc.lang_code] = (existingValue + " , " + doc.name);
                                }
                            }
                            langOptions.startkey = response.rows[response.rows.length - 1].doc._id;
                            langOptions.skip = 1;

                    })
                    var parent_ul = "<ul>";
                    if (filteredResults) {
                        $.each(filteredResults, function(langCode, names) {
                            // CREATE AND ADD SUB LIST ITEMS.
                            parent_ul += "<li><span class='code-name'>" + names + ' (' + langCode + ') ' + "</span><input type='hidden' value=" + "'" + langCode + "'" + "class='code-id'/> </li>"
                        });
                        parent_ul += "</ul>"
                        $(listId).append(parent_ul).show();
                        $(listId + " li").on("click", function(e) {
                            var $clicked = $(this);
                            codeName = $clicked.children().select(".code-name").text();
                            codeId = $clicked.find(".code-id");
                            $(inputId).val(codeName);
                            $(fieldValue).val(codeId.val());
                            codeClicked = true;
                        });
                    }
                } else {
                    $(listId).hide();
                }
            }).catch(function(err) {
                console.log(err);
            })
            $(document).on("click", function(e) {
                var $clicked = $(e.target);
                if (!$clicked.hasClass("search")) {
                    $(".lang-code").fadeOut();
                    codeClicked = false;
                }
            });
        }
    });
}
$("#target-lang-result").scroll( function(){
    if($(this).scrollTop() + $(this).height() == $(this)[0].scrollHeight ){
        loadLanguageCode("#ref-lang-code", "#langCode", "#target-lang-result");
    }
});
$('#reference-lang-result').scroll( function(){
    if($(this).scrollTop() + $(this).height() == $(this)[0].scrollHeight ){
        loadLanguageCode("#ref-lang-code", "#langCode", "#reference-lang-result");
    }
});


$("#label-import-ref-text").click(function(){
    langOptions = {limit: 5, include_docs: true};
    loadLanguageCode("#ref-lang-code", "#langCode", "#reference-lang-result");        
});

$("#defaultOpen").click(function(){
    loadLanguageCode("#target-lang", "#target-lang-code", "#target-lang-result");        
});
$("#target-lang").focus(function(){
    loadLanguageCode("#target-lang", "#target-lang-code", "#target-lang-result");        
});

$("#ref-lang-code").focus(function(){
    loadLanguageCode("#ref-lang-code", "#langCode", "#reference-lang-result");        
});

$('#ref-lang-code').on('blur', function() {
    // if (!codeClicked) {
    //     $(this).val('') // clear language code textbox
    // }
    $("#langCode").val($(this).val());
    $(".lang-code").fadeOut();
});
$('#target-lang').on('blur', function() {
    // if (!codeClicked) {
    //     $(this).val('') // clear language code textbox
    // }
    $("#target-lang-code").val($(this).val());
    $(".lang-code").fadeOut();
});

function buildReferenceList() {
    $("#reference-list").html('');
    $(".ref-drop-down").html('');
    refDb.get('refs').then(function(doc) {
        tr = '';
        var remove_link = '';
        doc.ref_ids.forEach(function(ref_doc) {
            var ref_id = ref_doc.ref_id
            var ref_first = ref_id.substr(0, ref_id.indexOf('_'));
            var ref_except_first =  ref_id.substr(ref_id.indexOf('_')+1);
            tr += "<tr><td>";
            tr += ref_doc.ref_name;
            tr += "</td>";
            tr += "<td>"+ref_first+"</td>"
            tr += "<td>"+ref_except_first+"</td>"
            if (constants.defaultReferences.indexOf(ref_doc.ref_id) >= 0) {
                tr += "<td></td>";
            } else {
                tr += "<td><a data-id=" + ref_doc.ref_id + " href=javaScript:void(0); class='edit-ref'>Rename</a> | <a data-id=" + ref_doc.ref_id + " href=javaScript:void(0) class='remove-ref'>Remove</a></td>";
            }
            tr += "</tr>";
            var ref_name = ref_first.toUpperCase()+"-"+ref_except_first;
            $('<option></option>').val(ref_doc.ref_id).text(ref_name).appendTo(".ref-drop-down");
        });
        $("#reference-list").html(tr);
    })
}
$(document).on('click', '.edit-ref', function() {
    var tdElement = $(this).parent().parent().children(':first-child');
    var temp_text = tdElement.text();
    var docId = $(this).data('id');
    $(this).css('pointer-events', 'none');
    tdElement.html('<input type="text"  class="ref-text" value="' + tdElement.text() + '" maxlength="25" />&nbsp;<a data-docid=' + docId + ' class="save-ref-text" href="javaScript:void(0)">Save</a> | <a data-temp = ' + temp_text + ' class="cancel-ref" href="javaScript:void(0)">Cancel</a>');
});
$(document).on('click', '.cancel-ref', function() {
    var tdElement = $(this).parent().parent().children(':first-child');
    tdElement.html($(this).data('temp'));
    tdElement.parent().children(':last-child').find('.edit-ref').css('pointer-events', '');
});
$(document).on('click', '.remove-ref', function() {
    var element = $(this);
    removeReferenceLink = element;
    var modal = $("#confirmModal");
    modal.modal("show");
    $("#confirmMessage").html("dynamic-msg-del-ref-text");
});
$("#confirmOk").click(function() {
    removeRef(removeReferenceLink);
});

function removeRef(element) {
    var ref_ids = [];
    refDb.get('refs').then(function(doc) {
        doc.ref_ids.forEach(function(ref_doc) {
            if (ref_doc.ref_id != element.data('id')) {
                ref_ids.push({ ref_id: ref_doc.ref_id, ref_name: ref_doc.ref_name, isDefault: ref_doc.isDefault });
            }
        })
        doc.ref_ids = ref_ids;
        return refDb.put(doc);
    }).then(function(res) {
        element.closest('tr').remove();
        buildReferenceList();
        $("#confirmModal").modal("hide");
    }).catch(function(err) {
        $("#confirmModal").modal("hide");
        alertModal("dynamic-msg-error", "dynamic-msg-del-unable");
    })
}
$(document).on('click', '.save-ref-text', function() {
    var textElement = $(this).prev();
    var docId = $(this).data('docid');
    var tdElement = $(this).parent();
    var result = false;
    if (textElement.val() === '') {
        alertModal("dynamic-msg-error", "dynamic-msg-ref-name-validation");
        return;
    }
    var ref_ids = [];
    refDb.get('refs').then(function(doc) {
        doc.ref_ids.forEach(function(ref_doc) {
            if ((ref_doc.ref_id != docId) && (ref_doc.ref_name.toLowerCase() === textElement.val().toLowerCase())) {
                result = true;
                return
            }
            if (ref_doc.ref_id != docId) {
                ref_ids.push({ ref_id: ref_doc.ref_id, ref_name: ref_doc.ref_name, isDefault: ref_doc.isDefault });
            } else {
                ref_ids.push({ ref_id: ref_doc.ref_id, ref_name: textElement.val(), isDefault: ref_doc.isDefault })
            }
        })
        if (result == true) {
            return true;
        } else {
            doc.ref_ids = ref_ids;
            return refDb.put(doc);
        }
    }).then(function(res) {
        if (res == true) {
            alertModal("dynamic-msg-error", "dynamic-msg-name-taken");
        } else {
            tdElement.html(textElement.val());
            tdElement.next().find('.edit-ref').css('pointer-events', '');
        }
    }).catch(function(err) {
        alertModal("dynamic-msg-error", "dynamic-msg-ren-unable");
    })
});

function clearReferenceSetting() {
    $('#langCode').val('');
    $('#ref-name').val('');
    $('#ref-path').val('');
    $('#ref-version').val('');
    $("#ref-lang-code").val('');
}

$("#btnSettings").click(function() {
    $('#bannerformmodal').modal('toggle');
    loadLanguageCode("#target-lang", "#target-lang-code", "#target-lang-result");        
})
$("#btnAbout").click(function() {
    $('#aboutmodal').modal('toggle')
})
$(document).on('show.bs.modal', '#bannerformmodal', function() {
    setReferenceSetting();
    buildReferenceList();
});

$("#chapterTab").click(function() {
    session.defaultSession.cookies.get({ url: 'http://chapter.autographa.com' }, (error, cookie) => {
        if (cookie.length > 0) {
            chapter = cookie[0].value;
            $("#c"+chapter).addClass("link-active");
        } else {
            
        }
    });
})
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function formatDate(date) {
  var monthNames = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "June", "July",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  var hours = date.getHours();
  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  minutes = minutes < 10 ? '0'+minutes : minutes;

  return hours+ ':' + minutes  
}

$("#btnSaveLang").click(function(){
    // app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
    // app.quit();
    refDb.get('app_locale').then(function(doc) {
            let appLang = $("#localeList").val();
            doc.appLang = appLang;
            refDb.put(doc);
            alert_message(".alert-success", "dynamic-msg-save-language");
        }).catch(function(err) {
            if (err.message === 'missing') {
                var locale = {
                    _id: 'app_locale',
                    appLang: $("#localeList").val()
                };
                refDb.put(locale).then(function(res) {
                    alert_message(".alert-success", "dynamic-msg-save-language"); 
                }).catch(function(internalErr) {
                    alert_message(".alert-danger", "dynamic-msg-went-wrong");
                });
            } 
        });
})

$("#btnSaveAutoupdate").click(function(){
    refDb.get('autoupdate').then(function(doc) {
           if($("#autoupdate-enable").is(":checked")){
                doc.enable = true
           }else{
                doc.enable = false
           }
           refDb.put(doc)
           alert_message(".alert-success", "dynamic-msg-save-language");
        }).catch(function(err) {
            alert_message(".alert-danger", "dynamic-msg-went-wrong");
        });
})

function setLocaleText(id, phrase, option){
    switch(option){
        case 'text':
            i18n.__(phrase).then((trans)=> $(id).text(trans));
            break;
        case 'html':
            i18n.__(phrase).then((trans)=> $(id).html(trans));
            break;
        case 'title':
            i18n.__(phrase).then((trans)=> $(id).attr('title', trans).tooltip('fixTitle').tooltip('setContent'));
        case 'placeholder':
            i18n.__(phrase).then((trans)=> $(id).attr('placeholder', trans));
    }
    
}
$("#label-language").click(function(){

    refDb.get('app_locale').then(function(doc) {
            $("#localeList").val(doc.appLang);
        }).catch(function(err) {
            $("#localeList").val();
        });
});

$("#source-code-url").click(function(){
    electron.shell.openExternal('https://github.com/Bridgeconn/autographa-lite');
});
