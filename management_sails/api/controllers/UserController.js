/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs-extra');
var generator = require('generate-password');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    assert = require('assert');

var admin = "admin";
var password = "admin123";
var dbServer = "localhost";
var dbServerPort = "27017";
var managementDB = "ManagementDB"


module.exports = {
	
  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    var generatedUserPass = generator.generate({
            length: 8,
            numbers: true
        });
         
    // 'uEyMTw32v9' 
    console.log(generatedUserPass);
    
    // Connect admin db in mongodb
    var connectionString = "mongodb://" + admin + ":" + password + "@" + dbServer + ":" + dbServerPort + "/admin";

    // Connect using the connection string
    MongoClient.connect(connectionString, {native_parser:true}, function(err, db) {

      // Add user deinition to user collection in management db
      var management_db = new Db(managementDB, new Server(dbServer, 27017));

      // Open management db
      management_db.open(function(err, management_db) {

        var collection = management_db.collection("Users");
        // Insert a single document
        collection.insert({userName: userName, status: 'ACT', dbKey: generatedUserPass});

        // Wait for a second before finishing up, to ensure we have written the item to disk
        setTimeout(function() {

          // Fetch the document
          collection.findOne({userName: userName}, function(err, item) {
            assert.equal(null, err);
            assert.equal(userName, item.userName);

            management_db.close();
          })

        }, 100);

      });

      // Create user db to handle user defined api data collections
      var userDB = userName;
      var user_db = new Db(userDB, new Server(dbServer, 27017));

      // Open user db
      user_db.open(function(err, user_db) {
        if (err) { return console.log(err); }

        // Add user to the database
        user_db.addUser(userName, generatedUserPass, {
              roles: [
                "readWrite"
              ]   
        }, function(err, result) {
            if (err) { return console.log(err); }
              
            // Creating user folder along with APIs and APPs folders under it
            var dirAPIs = '../Users/' + userName + '/APIs';
            fs.ensureDirSync(dirAPIs);
            var dirAPPs = '../Users/' + userName + '/APPs';
            fs.ensureDirSync(dirAPPs);

            user_db.close();

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
    var params = req.params.all();
    var userName = 'dogukan';
    var apiName = 'Gateway1';
    var dbKey = 'IAXG3YQg';

          var management_db = new Db(managementDB, new Server(dbServer, 27017));

          // Open user db
          management_db.open(function (err, management_db) {
            if (err) {
              return console.log(err);
            }
            console.log(admin);
            console.log(password);

            management_db.authenticate(admin, password, function (err, result) {
              if (err) {
                return console.log(err);
              }
              // Create a capped collection with a maximum of 1000 documents
              management_db.createCollection('ABC', function (err, collection) {
                if (err) {
                  return console.log(err);
                }

                // Insert a document in the capped collection
                collection.insert({
                  data : "data"
                }, function (err, result) {
                  if (err) {
                    return console.log(err);
                  }
                  management_db.close();
                  console.log("here2");

                });

              });
            });

            console.log("here3");

          });
    
    return res.json({
      response: 'data was added to ' + apiName + ' collection'
    });
    
  },


  /**
   * `UserController.delete()`+
   */
  delete: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    var dir = "../Users/" + userName;
    fs.removeSync(dir);

    //Soft delete from DB by updating the entry column ACT->DEACT
    var db = new Db(managementDB, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    db.open(function(err, db) {

      var collection = db.collection("Users");
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

    return res.json({
      response: 'User ' + userName + ' successfully removed'
    });
  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    // Get user from DB
    var db = new Db(managementDB, new Server(dbServer, 27017));
    // Establish connection to db
    db.open(function(err, db) {

      
      // Peform a simple find and return one document
      var collection = db.collection("Users");

      collection.findOne({userName: userName}, function(err, doc) {
        assert.equal(null, err);

        db.close();

        return res.json({
          response: doc
        });

      });

    }); 

  },


  /**
   * `UserController.getAll()`
   */
  getAll: function (req, res) {

    // Get all users from DB
    var db = new Db(managementDB, new Server(dbServer, 27017));
    // Establish connection to db
    db.open(function(err, db) {


      var collection = db.collection("Users");
      // Peform a simple find and return all the documents
      collection.find().toArray(function(err, docs) {
        assert.equal(null, err);

        db.close();

        return res.json({
          response: docs
        });

      });

    }); 

  },

  /**
   * `UserController.get()`
   */
  getDbKeyForUser: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    // Get user from DB
    var db = new Db(managementDB, new Server(dbServer, 27017));
    // Establish connection to db
    db.open(function(err, db) {
      
      // Peform a simple find and return one document
      var collection = db.collection("Users");

      collection.findOne({userName: userName}, function(err, doc) {
        assert.equal(null, err);

        db.close();

        return res.json({
          dbKey: doc.dbKey
        });

      });

    }); 

  },


};