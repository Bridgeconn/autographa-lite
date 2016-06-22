const PouchDB = require('pouchdb');
var db = new PouchDB('database');

function destroyDbs() {
    db.destroy().then(function (response) {
	console.log(response);
	console.log('done destroying.');
	db.close();
    }).catch(function (err) {
	console.log(err);
	db.close();
    });

    var refDb = new PouchDB('reference');
    refDb.destroy().then(function (response) {
	console.log(response);
	console.log('done destroying refs.');
	refDb.close();
    }).catch(function (err) {
	console.log(err);
	refDb.close();
    });
}

function setupTargetDb() {
    db.get('isDBSetup').then(function (doc) {
	db.close();    
    }).catch(function (err) {
	console.log(err);
	const bibleJson = require('./lib/full_net_bible.json');
	db.bulkDocs(bibleJson).then(function (response) {
	    console.log('i loaded.');
	    console.log(response);
	    db.close();
	}).catch(function (err) {
	    console.log(err);
	    db.close();
	});
    });
}

function setupRefDb() {
    var refDb = new PouchDB('reference');
    const refEnJson = require('/home/joel/bib-edit-data/output.json');
    refDb.bulkDocs(refEnJson).then(function (response) {
	console.log('done ref en.');
	console.log(response);
	refDb.close();
    }).catch(function (err) {
	console.log('error');
	console.log(err);
	refDb.close();
    });
}

//destroyDbs();
setupTargetDb();
setupRefDb();
