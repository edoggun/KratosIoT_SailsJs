/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    assert = require('assert');



module.exports = {
	
  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    // Creating user folder and APIs folder under it
    mkdirp('../Users/' + userName + '/APIs', function (err) {
        if (err) { return res.serverError(err); } 
        
        // Creating APPs folder under user folder
        mkdirp('../Users/' + userName + '/APPs', function (err) {
          if (err) { return res.serverError(err); }

          // Inserting user into DB
          var db = new Db('MongoDatabase', new Server('localhost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {

            var collection = db.collection("user");
            // Insert a single document
            collection.insert({userName: userName, status: 'ACT'});

            // Wait for a second before finishing up, to ensure we have written the item to disk
            setTimeout(function() {

              // Fetch the document
              collection.findOne({userName: userName}, function(err, item) {
                assert.equal(null, err);
                assert.equal(userName, item.userName);
                db.close();
              })

            }, 100);

          });

        });

    });

    return res.json({
      response: 'User ' + userName + ' successfully created'
    });
  },


  /**
   * `UserController.update()`
   */
  update: function (req, res) {
    return res.json({
      todo: 'update() is not implemented yet!'
    });
  },


  /**
   * `UserController.delete()`
   */
  delete: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    rimraf('../Users/' + userName, function (err) { 
      if (err) { return res.serverError(err); } 

      //Soft delete from DB by updating the entry column ACT->DEACT
      var db = new Db('MongoDatabase', new Server('localhost', 27017));
        // Fetch a collection to insert document into
        db.open(function(err, db) {

          var collection = db.collection("user");
          // Update the document with an atomic operator
          collection.update({userName: userName}, {$set:{status: 'DEACT'}});

          // Wait for a second before finishing up, to ensure we have written the item to disk
          setTimeout(function() {

            // Fetch the document
            collection.findOne({userName: userName}, function(err, item) {
              assert.equal(null, err);
              assert.equal(userName, item.userName);
              assert.equal('DEACT', item.status);
              db.close();
            })

          }, 100);

        });
      
    });

    return res.json({
      response: 'User ' + userName + ' successfully removed'
    });
  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    return res.json({
      todo: 'get() is not implemented yet!'
    });
  },


  /**
   * `UserController.getAll()`
   */
  getAll: function (req, res) {
    return res.json({
      todo: 'getAll() is not implemented yet!'
    });
  }
};

