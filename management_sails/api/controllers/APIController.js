/**
 * APIController
 *
 * @description :: Server-side logic for managing APIS
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var exec = require('child_process').exec;
var unzip = require('unzip');
var fs = require('fs');
var fse = require('fs-extra');
var Db = require('mongodb').Db,
    Server = require('mongodb').Server;

var admin = 'admin';
var password = 'admin123';
var dbServer = 'localhost';


module.exports = {
	
  /**
   * `APIController.createStandardApi()`
   */
  createStandardApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;
    var apiType = params.apiType;

    var admin_db = new Db(admin, new Server(dbServer, 27017));

    // Open admin db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over admin db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return res.serverError(); }

        var api_collection = admin_db.collection('Definitions');

        var gatewayName = params.gatewayName ? params.gatewayName : "";
        var deviceName = params.deviceName ? params.deviceName : "";
        var sensorName = params.sensorName ? params.sensorName : "";
        var thingName = params.thingName ? params.thingName : "";
        var appApiName = params.appApiName ? params.appApiName : "";
        var appName = params.appName ? params.appName : "";
        var timeStamp = new Date();

        // Insert api definition to definitions table
        api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                               appApiName: appApiName, appName: appName, userName: userName, isGenericApi: true, timeStamp: timeStamp, status: 'ACT'}, 
                               function (err, result) {
              
          if (err) { return res.serverError(); } 

          var user_collection = admin_db.collection('Users');

          // Get user info from Users table to fetch std api port for the user
          user_collection.findOne({userName: userName}, function(err, doc) {
            if (err) { return res.notFound(); }

            var port = doc.port;

            admin_db.close();

            var createdAt = new Date();

            // Create an entry for the user's collectionName and port no in Collections localDiskDb
            Collections.create({userName: userName, collectionName: apiName, port: port, isGenericApi: true, createdAt: createdAt}).exec(function (err, result){
              if (err) { return res.serverError(err); }

              // Wait for a second to make sure entry is created
              setTimeout(function() {

                // Get user specific data to userDiskDb
                Collections.find({
                  where: { userName: userName },
                  sort: 'createdAt DESC'
                }).exec(function(err, collections) {
                  if (err) { return res.notFound(); }

                  // Delete all entry in UserCollection first
                  UserCollection.destroy().exec(function (err){
                    if (err) { return res.notFound(); }

                    // Wait for a second to make sure all entries are deleted
                    setTimeout(function() {

                      // Add all user specific entries to UserCollection userDiskDb
                      for (var i=0; i<collections.length; i++) {
                        UserCollection.create({collectionName: collections[i].collectionName}).exec(function (err, result) {
                          if (err) { return res.serverError(); }
                        })
                      }

                    }, 1000);

                  });

                });       

              }, 1000);

              // Wait for 2 seconds to start file operations
              setTimeout(function() {
                var apiFolderLoc = '../Users/' + userName + '/APIs/standard_sails';
                var localUserDiskDbLoc = '.tmp/userDiskDb.db';
                var userDiskDbLoc = apiFolderLoc + '/.tmp/userDiskDb.db';

                // Copy user specific userDiskDb to user's std api location for further usage by std api
                fse.copy(localUserDiskDbLoc, userDiskDbLoc, function(err) {     
                  if (err) { return res.serverError(); }

                  // Wait for 5 seconds to make sure file operations are completed
                  setTimeout(function() {

                    // Find out if the user's std api's port is being used or not
                    exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

                      // If it is not being used, then lift the std api for the user by default after creation
                      if (stdout == "") {
                        exec('sails lift', { cwd: '../Users/' + userName + '/APIs/standard_sails' }, function(err, stdout, stderr) {
                          
                        });
                          
                        return res.json({
                          collection: apiName,
                          userName: userName,
                          apiURL:  'http://localhost:' + port.toString() + '/GenericApi'
                        });
                        
                      }

                    });

                  }, 5000);
                    
                });

              }, 2000);

            });

          });

        });

      });

    });

  },

  /**
   * `APIController.createCustomApi()`
   */
  createCustomApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;
    var apiType = params.apiType;

    // Find out the latest port no that was used for a custom api
    Collections.find({
      where: { isGenericApi: false },
      sort: 'port DESC'
    }).exec(function(err, collections) {

      // If there were any other custom api before, then use latestPort + 1 port no for this new custom api
      var port;
      if (collections.length > 0) {
        var latestPort = collections[0].port;
        port = latestPort + 1;
      } else {
        port = 45000;
      }

      var createdAt = new Date();

      // Create an entry for the user's collectionName and port no in Collections localDiskDb
      Collections.create({userName: userName, collectionName: apiName, port: port, isGenericApi: false, createdAt: createdAt}).exec(function (err, result){
        if (err) { return res.serverError(); }
      });   

      var admin_db = new Db(admin, new Server(dbServer, 27017));

      // Open admin db
      admin_db.open(function(err, admin_db) {
        if (err) { return res.serverError(); }

        var adminDb = admin_db.admin();
        // Authenticate using admin control over admin db
        adminDb.authenticate(admin, password, function (err, result) {
          if (err) { return res.serverError(); }

          var api_collection = admin_db.collection('Definitions');

          var gatewayName = params.gatewayName ? params.gatewayName : "";
          var deviceName = params.deviceName ? params.deviceName : "";
          var sensorName = params.sensorName ? params.sensorName : "";
          var thingName = params.thingName ? params.thingName : "";
          var appApiName = params.appApiName ? params.appApiName : "";
          var appName = params.appName ? params.appName : "";
          var date = new Date();

          // Insert api definition to definitions table
          api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                                 appApiName: appApiName, appName: appName, userName: userName, isGenericApi: false, timeStamp: date, status: 'ACT'}, 
                                 function (err, result) {
                
            if (err) { return res.serverError(); } 

            admin_db.close();

            var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
            var destLoc = '../Users/' + userName + '/APIs/';

            // Unzip the custom api that was uploaded to a specific directory location to user's APIs directory
            fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));

            // Wait for 30 seconds before overwriting local file with port number
            setTimeout(function() {
              var apiLocalConfigFileLoc = destLoc + apiName + '/config/local.js';

              // Change _PORT_NO with the one we set above in local.js file
              fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
                if (err) { return res.notFound(); } 

                var result = data.replace(/_PORT_NO/g, port);

                fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                  if (err) { return res.notFound(); }

                  // Wait for 5 seconds before finishing up
                  setTimeout(function() {

                    return res.json({
                      collection: apiName,
                      userName: userName,
                      apiURL: 'http://localhost:' + port.toString()
                    });

                  }, 5000); 
                  
                });

              });

            }, 30000); 

          });

        });

      });     

    });

  },

  /**
   * `APIController.uploadApi()`
   */
  updateApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;
    var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
    var destLoc = '../Users/' + userName + '/APIs/';

    // Find custom api's port from localDiskDb
    Collections.findOne({
      where: { userName: userName, collectionName: apiName, isGenericApi: false }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); }

      var port = collection.port;
      
      // Check if the API is running or not
      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

        // If API is running, first stop the API to be able to update it properly
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

        }

        // Wait for 10 seconds to make sure the api is stopped in case it was running
        setTimeout(function() {
          // Delete if there is any same named apis in the user's APIs directory
          fse.remove(destLoc + apiName, function (err) {
            if (err) { return res.serverError(); }

            // Wait for 10 seconds to make sure api is deleted
            setTimeout(function() {
              
              // Unzip the uploaded api that was uploaded to a specific directory location to user's APIs directory
              fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));
                    
              // Wait for 45 seconds before overwriting local file with port number to make sure uploaded api is unzipped properly
              setTimeout(function() {

                var apiLocalConfigFileLoc = destLoc + apiName + '/config/local.js';

                // Change _PORT_NO with the one that was being used for the updated api
                fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
                  if (err) { return res.notFound(); } 

                  var result = data.replace(/_PORT_NO/g, port);

                  fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                    if (err) { return res.notFound(); } 

                    // Wait for 5 seconds before lifting the api
                    setTimeout(function() {
                      // Start api
                      exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(err, stdout, stderr) {
                            
                      });

                      // Wait 5 seconds to make sure if the api is lifted
                      setTimeout(function() {
                        return res.json({
                          response: apiName + ' API has successfully been updated'
                        });

                      }, 5000);
                      
                    }, 5000);

                  });

                });

              }, 45000); 
                
            }, 10000);

          });

        }, 10000);

      });

    });
    
  },
  

  /**
   * `APIController.deleteApi()`
   */
  deleteApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;
    var fileLoc = '../Users/' + userName + '/APIs/' + apiName;

    // Find api's port from localDiskDb
    Collections.findOne({
      where: { userName: userName, collectionName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); } 

      var port = collection.port;

      // Check if the API is running or not
      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

        // If API is running, first stop the API to be able to delete it properly
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

        }

        // Wait for 5 seconds to make sure if the api is stopped
        setTimeout(function(){
          //Soft delete from DB by updating the entry column ACT->DEACT
          var admin_db = new Db(admin, new Server(dbServer, 27017));

          // Open admin db
          admin_db.open(function(err, admin_db) {
            if (err) { return res.serverError(); }

            var adminDb = admin_db.admin();
            // Authenticate using admin control over admin db
            adminDb.authenticate(admin, password, function (err, result) {
              if (err) { return res.serverError(); }

              var collection = admin_db.collection("Definitions");
              // Update the status column with DEACT
              collection.update({apiName: apiName}, {$set:{status: 'DEACT'}});

              admin_db.close();

              // Delete api in the user's APIs directory
              fse.remove(fileLoc, function (err) {
                if (err) { return res.serverError(); }

                // Wait for 10 seconds to make sure api is deleted from directory
                setTimeout(function() {

                  return res.json({
                    response: apiName + 'has successfully been deleted'
                  });

                }, 10000);

              });

            });

          });

        }, 5000);

      });

    });  

  },


  /**
   * `APIController.startApi()`
   */
  startApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;
    var isGenericApi = params.isGenericApi;
    var generalStdApiName = isGenericApi ? 'standard_sails' : apiName;

    // Find api's port from localDiskDb
    Collections.findOne({
      where: { userName: userName, collectionName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); } 

      var port = collection.port;

      // Check if the app is up or not
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

        // If it is already up, then return with a proper message
        if (stdout != "") { return res.json({ response: apiName + ' API is already started' }); }

        // If it is not up, then lift the app
        if (stdout == "") {
          exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + generalStdApiName }, function(err, stdout, stderr) {
            
          });
          
          // Wait for 5 seconds to make sure if the app is started
          setTimeout(function() {

            return res.json({
              response: apiName + ' API has successfully been started'
            });

          }, 5000);
          
        }

      });

    });

  },


  /**
   * `APIController.stopApi()`
   */
  stopApi: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;

    // Find api's port from localDiskDb
    Collections.findOne({
      where: { userName: userName, collectionName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); }

      var port = collection.port;

      // Check if the app is up or not
      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

        // If it is already not up, then return with a proper message
        if (stdout == "") { return res.json({ response: apiName + ' API is already stopped' }); }
        
        // If it is up, then stop the app
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

          // Wait for 5 seconds to make sure if the app is stopped
          setTimeout(function() {

            return res.json({
              response: apiName + ' API has successfully been stopped'
            });

          }, 5000);

        }

      });

    });

  },

  /**
   * `APIController.getApiDetails()`
   */
  getApiDetails: function (req, res) {
    var userName = req.headers.username;
    var params = req.params.all();
    var apiName = params.apiName;

    // Find api's port from localDiskDb
    Collections.findOne({
      where: { userName: userName, collectionName: apiName }
    }).exec(function(err, collection) {
      if (err) { return console.error(err); } 

      var port = collection.port;

      // Check if the app is up or not
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {

        var apiStatus;

        // Assign api status 
        if (stdout == "") {
          apiStatus = 'Stopped';  
        } else {
          apiStatus = 'Started';
        }

        // Connect use db to collect stats info for a collection
        var userDB = userName;
        var user_db = new Db(userDB, new Server(dbServer, 27017));

        // Open user db
        user_db.open(function(err, user_db) {
          if (err) { return res.serverError(); }

          var adminDb = user_db.admin();

          // Authenticate using admin control over user db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return res.serverError(); }

            var collection = user_db.collection(apiName);

            // Retrieve the stats for the collection
            collection.stats(function(err, stats) {
              var collectionDocCount;
              var collectionSize;

              // Assign collection count and size params
              if (stats) {
                collectionDocCount = stats.count;
                collectionSize = stats.size;
              }

              // Get the latest message in the requested collection
              collection.find().sort({timeStamp: -1}).limit(1).toArray(function(err, doc) {
                if (err) { return res.notFound(); }

                var latestSentData = doc;

                user_db.close();

                return res.json({
                  apiName: apiName,
                  apiStatus: apiStatus,
                  collectionDocCount: collectionDocCount,
                  collectionSize: collectionSize,
                  latestSentData: latestSentData
                });

              });              

            });

          });

        });

      });

    });

  },


};

