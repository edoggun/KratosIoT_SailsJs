/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

//var spawn = require('child_process').spawn;
var fs = require('fs-extra');
var generator = require('generate-password');
var Db = require('mongodb').Db,
    Server = require('mongodb').Server;
    
var admin = 'admin';
var password = 'admin123';
var dbServer = 'localhost';
var dbServerPort = '27017';


module.exports = {
	  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var userName = req.headers.username;
    var timeStamp = new Date();

    Collections.find({
        where: { isGenericApi: true },
        sort: 'port DESC'
      }).exec(function(err, collections) {

        var port;
        if (collections.length > 0) {
          var latestPort = collections[0].port;
          port = latestPort + 1;
        } else {
          port = 40000;
        }

        var dbKey = generator.generate({
          length: 16,
          numbers: true
        });
        
        // Add user deinition to user collection in management db
        var admin_db = new Db(admin, new Server(dbServer, 27017));
        // Open management db
        admin_db.open(function(err, admin_db) {
          if (err) { return res.serverError(); }

          var adminDb = admin_db.admin();
          // Authenticate using admin control over db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return res.serverError(); }

            var collection = admin_db.collection("Users");

            // Insert a single document
            collection.insert({userName: userName, status: 'ACT', dbKey: dbKey, port: port, timeStamp: timeStamp}, function (err) {
              if (err) { return res.serverError(); }
            });

            admin_db.close();

          });

        });

        // Create user db to handle user defined api data collections
        var userDB = userName;
        var user_db = new Db(userDB, new Server(dbServer, 27017));

        // Open user db
        user_db.open(function(err, user_db) {
          if (err) { return res.serverError(); }

          var adminDb = user_db.admin();
          // Authenticate using admin control over db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return res.serverError(); }

            // Add user to the database
            user_db.addUser(userName, dbKey, {
                  roles: [
                    "readWrite"
                  ]   
            }, function(err, result) {
                if (err) { return res.serverError(); }
                  
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
          if (err) { return res.serverError(); }    

          // Wait for a second before finishing up, to ensure we have written the item to disk
          setTimeout(function() {
            // Change port number with the one we get from req in local file
            fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
              if (err) { return res.notFound(); }
                           
              var result = data.replace(/_PORT_NO/g, port);

              fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                if (err) { return res.notFound(); }

                // Change user name global param with the one we get from req
                fs.readFile(apiControllerLoc, 'utf8', function (err,data) {
                  if (err) { return res.notFound(); }
                                            
                  var result = data.replace(/_USER_NAME/g, userName);

                  fs.writeFile(apiControllerLoc, result, 'utf8', function (err) {
                    if (err) { return res.notFound(); }

                    return res.json({
                      response: 'User: ' + userName + ' with dbKey: ' + dbKey + ' is successfully created'
                    });

                  });

                });

              });

            });

          }, 1000);    

        });  

    });

  },


  /**
   * `UserController.update()`
   */
  update: function (req, res) {

    

  },


  /**
   * `UserController.delete()`+
   */
  delete: function (req, res) {
    var userName = req.headers.username;

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var collection = admin_db.collection("Users");
        // Update the document with an atomic operator
        collection.update({userName: userName}, {$set:{status: 'DEACT'}}, function(err, result) {
          if (err) { return res.notFound(); }

          admin_db.close();

          // Remove user from file system
          var dir = "../Users/" + userName;
          fs.removeSync(dir);

          // Wait for 5 seconds before deleting User from file system properly
          setTimeout(function() {
            return res.json({
              response: 'User ' + userName + ' is successfully removed'
            });

           }, 500);

        });

      });

    });

  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    var userName = req.headers.username;

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        collection.findOne({userName: userName}, function(err, doc) {
          if (err) { return res.notFound(); }

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
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        collection.find().toArray(function(err, docs) {
          if (err) { return res.notFound(); }

          admin_db.close();

          return res.json({
            response: docs
          });

        });

      });

    });

  },

  /**
   * `UserController.getDbKeyForUser()`
   */
  getDbKeyForUser: function (req, res) {
    var userName = req.headers.username;

    //Soft delete from DB by updating the entry column ACT->DEACT
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Fetch a collection to insert document into
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        // Peform a simple find and return one document
        var collection = admin_db.collection("Users");

        collection.findOne({userName: userName}, function(err, doc) {
          if (err) { return res.notFound(); }

          admin_db.close();

          return res.json({
            dbKey: doc.dbKey
          });

        });

      });

    });

  },


};