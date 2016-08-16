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
	const bibleJson = require('./lib/full_bible_skel.json');
	db.bulkDocs(bibleJson).then(function (response) {
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
    refDb.get('refs').then(function (doc) {
	refDb.close();
    }).catch(function (err) {
	const refEnJson = require('./lib/refs.json'),
	      chunksJson = require('./lib/chunks.json');
	refDb.bulkDocs(refEnJson).then(function (response) {
	    refDb.put(chunksJson).then(function (response) {
		console.log(response);
		refDb.close();	
	    });
	}).catch(function (err) {
	    console.log('Error loading reference data. ' + err);
	    refDb.close();
	});	
    });
}

//destroyDbs();
setupTargetDb();
setupRefDb();
