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
var adminDB = "admin"


module.exports = {
	  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var port = params.port;

    var dbKey = generator.generate({
            length: 16,
            numbers: true
        });
         
    // 'uEyMTw32v9' 
    console.log(dbKey);

    // Add user deinition to user collection in management db
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Open management db
    admin_db.open(function(err, admin_db) {
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        var collection = admin_db.collection("Users");

        // Insert a single document
        collection.insert({userName: userName, status: 'ACT', dbKey: dbKey, port: port}, function (err) {
          if (err) { return console.error(err); }
        });

        // Wait for a second before finishing up, to ensure we have written the item to disk
        setTimeout(function() {

          // Fetch the document
          collection.findOne({userName: userName}, function(err, item) {
            assert.equal(null, err);
            assert.equal(userName, item.userName);

            admin_db.close();
          })

        }, 100);

      });

    });

    // Create user db to handle user defined api data collections
    var userDB = userName;
    var user_db = new Db(userDB, new Server(dbServer, 27017));

    // Open user db
    user_db.open(function(err, user_db) {
      if (err) { return console.error(err); }

      var adminDb = user_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        // Add user to the database
        user_db.addUser(userName, dbKey, {
              roles: [
                "readWrite"
              ]   
        }, function(err, result) {
            if (err) { return console.error(err); }
              
            user_db.close();

        });

      });

    });

    // Creating user folder along with APIs and APPs folders under it
    var dirAPIs = '../Users/' + userName + '/APIs';
    fs.ensureDirSync(dirAPIs);
    var dirAPPs = '../Users/' + userName + '/APPs';
    fs.ensureDirSync(dirAPPs);

    var stdApiFolderLoc = '../standard_sails';
    var apiFolderLoc = '../Users/' + userName + '/APIs/standard_sails';
    var apiLocalConfigFileLoc = apiFolderLoc + '/config/local.js';
    var apiConnectionConfigFileLoc = apiFolderLoc + '/config/connections.js';
    var apiControllerLoc = apiFolderLoc + '/api/controllers/ApiController.js'

    // If Api type is generic, then copy standard (ready) api that is located in main directory to user's APIs directory
    fs.copy(stdApiFolderLoc, apiFolderLoc, function(err) {        
      if (err) { return console.error(err); }    

      // Wait for a second before finishing up, to ensure we have written the item to disk
      setTimeout(function() {
        // Change port number with the one we get from req in local file
        fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
          if (err) { return console.error(err); }
                       
          var port = params.port;

          var result = data.replace(/$PORT_NO/g, port);

          fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
            if (err) { return console.error(err); }

            // Change user name global param with the one we get from req
            fs.readFile(apiControllerLoc, 'utf8', function (err,data) {
              if (err) { return console.error(err); }
                                        
              var result = data.replace(/$USER_NAME/g, userName);

              fs.writeFile(apiControllerLoc, result, 'utf8', function (err) {
                if (err) { return console.error(err); }

                return res.json({
                  response: 'User: ' + userName + ' with dbKey: ' + dbKey + ' was successfully created'
                });

              });

            });

          });

        });

      }, 1000);    

    });  

  },


  /**
   * `UserController.update()`
   */
  update: function (req, res) {

    // Being used for testing purposes
    var exec = require('child_process').exec;
    exec('netstat -ano | find "LISTENING" | find "8080"', function(error, stdout, stderr) {
      var stringData = stdout.toString().split("LISTENING");
      var stringData2 = stringData[2].toString().split("       ");
      var pid = stringData[1].toString().split("\n");
      console.log('A' + pid[0] + 'A');

      exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {
      

      });

    });

    
    return res.json({
      response: 'DONE'
    });

  },


  /**
   * `UserController.delete()`+
   */
  delete: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        var collection = admin_db.collection("Users");
        // Update the document with an atomic operator
        collection.update({userName: userName}, {$set:{status: 'DEACT'}});

        // Wait for a second before finishing up, to ensure we have written the item to disk
        setTimeout(function() {
        // Fetch the document
          collection.findOne({userName: userName}, function(err, item) {
            assert.equal(null, err);
            assert.equal(userName, item.userName);
            assert.equal('DEACT', item.status);

            // Remove user from file system
            var dir = "../Users/" + userName;
            fs.removeSync(dir);

            admin_db.close();

            return res.json({
              response: 'User ' + userName + ' successfully removed'
            });

          })

        }, 100);

      });

    });

  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        collection.findOne({userName: userName}, function(err, doc) {
          assert.equal(null, err);

          admin_db.close();

          return res.json({
            response: doc
          });

        });

      });

    });

  },


  /**
   * `UserController.getAll()`
   */
  getAll: function (req, res) {

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        // Peform a simple find and return all the documents
        collection.find().toArray(function(err, docs) {
          assert.equal(null, err);

          admin_db.close();

          return res.json({
            response: docs
          });

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

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        collection.findOne({userName: userName}, function(err, doc) {
          assert.equal(null, err);

          admin_db.close();

          return res.json({
            dbKey: doc.dbKey
          });

        });

      });

    });

  },


};