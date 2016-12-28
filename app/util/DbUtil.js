module.exports = {
    destroyDbs: function() {
	const PouchDB = require('pouchdb-core')
	      .plugin(require('pouchdb-adapter-leveldb')),
	      //PouchDB = require('pouchdb'),	
	      targetDb = new PouchDB('./db/targetDB');
	targetDb.destroy().then(function (response) {
	    console.log('targetDB destroyed!.');
	    targetDb.close();
	}).catch(function (err) {
	    console.log(err);
	    targetDb.close();
	});

	const refDb = new PouchDB('./db/referenceDB');
	refDb.destroy().then(function (response) {
	    console.log('referenceDB destroyed!');
	    refDb.close();
	}).catch(function (err) {
	    console.log(err);
	    refDb.close();
	});
    },

    setupTargetDb: new Promise(
	function(resolve, reject) {
	    const PouchDB = require('pouchdb-core')
	      .plugin(require('pouchdb-adapter-leveldb')),
//	    const PouchDB = require('pouchdb'),
		  targetDb = new PouchDB(`${__dirname}/../../db/targetDB`);
		  //targetDb = new PouchDB('../../db/targetDB');
	    targetDb.get('isDBSetup')
		.then(function (doc) {
		    targetDb.close();
		    resolve('TargetDB exists.');
		})
		.catch(function (err) {
		    const bibleJson = require(`${__dirname}/../lib/full_bible_skel.json`);
		    //const bibleJson = require('../lib/full_bible_skel.json');
		    targetDb.bulkDocs(bibleJson)
			.then(function (response) {
			    targetDb.close();
			    resolve('Successfully setup Target DB.');
			})
			.catch(function (err) {
			    targetDb.close();
			    reject(err);
			});
		});
	}),
    
    setupRefDb: new Promise (
	function(resolve, reject) {
	    const PouchDB = require('pouchdb-core')
		  .plugin(require('pouchdb-adapter-leveldb')),
//	    const PouchDB = require('pouchdb'),	
		  refDb = new PouchDB(`${__dirname}/../../db/referenceDB`);
		  //refDb = new PouchDB('../../db/referenceDB');
	    refDb.get('refs')
		.then(function (doc) {
		    refDb.close();
		    resolve('ReferenceDB exists.');
		})
		.catch(function (err) {
		    const refEnUlbJson = require(`${__dirname}/../lib/en_ulb.json`),
			  refEnUdbJson = require(`${__dirname}/../lib/en_udb.json`),
			  refHiUlbJson = require(`${__dirname}/../lib/hi_ulb.json`),
			  chunksJson = require(`${__dirname}/../lib/chunks.json`),
			  refsConfigJson = require(`${__dirname}/../lib/refs_config.json`);
		    refDb.put(chunksJson)	
			.then(function (response) {
			    return refDb.put(refsConfigJson);
			})
			.then(function (response) {
			    return refDb.bulkDocs(refEnUlbJson);
			})
			.then(function (response) {
			    return refDb.bulkDocs(refEnUdbJson);
			})
			.then(function (response) {
			    return refDb.bulkDocs(refHiUlbJson);
			})
			.then(function (response) {
			    refDb.close();
			    resolve('Successfully loaded reference texts.');
			})
			.catch(function (err) {
			    refDb.close();
			    reject('Error loading reference data.' + err);
			});
		});
	})
};
