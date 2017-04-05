/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

//var spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs-extra');
const generator = require('generate-password');
const Db = require('mongodb').Db,
    Server = require('mongodb').Server;
    
const admin = 'admin';
const password = 'admin123';
const dbServer = 'localhost';


module.exports = {
	  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var userName = req.headers.username;
    var timeStamp = new Date();

    // Set std api port for each new user
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

        // Generate dbkey for user db
        var dbKey = generator.generate({
          length: 16,
          numbers: true
        });
        
        // Add user definition to user collection in management db
        var admin_db = new Db(admin, new Server(dbServer, 27017));
        // Open management db
        admin_db.open(function(err, admin_db) {
          if (err) { return res.serverError(); }

          var adminDb = admin_db.admin();
          // Authenticate using admin control over admin db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return res.serverError(); }

            var collection = admin_db.collection("Users");

            // Insert user definition
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
          // Authenticate using admin control over user db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return res.serverError(); }

            // Add user to the database with readWrite right
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

        // Creating user directory along with APIs and APPs folders under it
        var dirAPIs = path.join('..', 'Users', userName, 'APIs');
        fs.ensureDirSync(dirAPIs);
        var dirAPPs = path.join('..', 'Users', userName, 'APPs');
        fs.ensureDirSync(dirAPPs);

        var stdApiFolderLoc = path.join('..', 'standard_sails');
        var apiFolderLoc = path.join('..', 'Users', userName, 'APIs', 'standard_sails');
        var apiLocalConfigFileLoc = path.join('..', 'Users', userName, 'APIs', 'standard_sails', 'config', 'local.js');
        var apiConnectionConfigFileLoc = path.join('..', 'Users', userName, 'APIs', 'standard_sails', 'config', 'connections.js');
        var apiControllerLoc = path.join('..', 'Users', userName, 'APIs', 'standard_sails', 'api', 'controllers', 'ApiController.js');

        // By default, copy standard (ready) api that is located in main directory to user's APIs directory
        fs.copy(stdApiFolderLoc, apiFolderLoc, function(err) {        
          if (err) { return res.serverError(); }    

          // Wait for a second before setting config files
          setTimeout(function() {
            // Change _PORT_NO with the one we set above in local.js file
            fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
              if (err) { return res.notFound(); }
                           
              var result = data.replace(/_PORT_NO/g, port);

              fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                if (err) { return res.notFound(); }

                // Change _USER_NAME global param with the one we get from req
                fs.readFile(apiControllerLoc, 'utf8', function (err,data) {
                  if (err) { return res.notFound(); }
                                            
                  var result = data.replace(/_USER_NAME/g, userName);

                  fs.writeFile(apiControllerLoc, result, 'utf8', function (err) {
                    if (err) { return res.notFound(); }

                    return res.json({
                      userName: userName,
                      dbKey: dbKey
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
    

    return res.json({
      response: "Not being used for the time being.."
    });

  },


  /**
   * `UserController.delete()`
   */
  delete: function (req, res) {
    var userName = req.headers.username;

    //Soft delete from DB by updating the status column ACT->DEACT
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Open admin db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over admin db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var collection = admin_db.collection("Users");
        // Update the user status as DEACT
        collection.update({userName: userName}, {$set:{status: 'DEACT'}}, function(err, result) {
          if (err) { return res.notFound(); }

          admin_db.close();

          // Remove user from file system
          var userDirectory = path.join('..', 'Users', userName);

          fs.remove(userDirectory, function (err) {
            if (err) { return res.serverError(); }

            // Wait for 5 seconds to ensure that the user directory is deleted
            setTimeout(function() {
              return res.json({
                response: 'User ' + userName + ' has been successfully removed'
              });

             }, 500);

          });

        });

      });

    });

  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    var userName = req.headers.username;

    // Get user info from user definitions table
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Open admin db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over admin db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var collection = admin_db.collection("Users");

        // Find the user
        collection.findOne({userName: userName}, function(err, doc) {
          if (err) { return res.notFound(); }

          admin_db.close();

          return res.json({
            userName: userName,
            status: doc.status,
            port: doc.port,
            timeStamp: doc.timeStamp
          });

        });

      });

    });

  },


  /**
   * `UserController.getAll()`
   */
  getAll: function (req, res) {

    // Get all users info from user definitions table
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Open admin db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over admin db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var collection = admin_db.collection("Users");

        // Find all users
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

    // Get dbKey for the user
    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Open admin db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over admin db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var collection = admin_db.collection("Users");

        // Find the user
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