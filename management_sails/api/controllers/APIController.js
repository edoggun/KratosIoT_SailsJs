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

var admin = "admin";
var password = "admin123";
var dbServer = "localhost";
var dbServerPort = "27017";
var adminDB = "admin";


module.exports = {
	
  /**
   * `APIController.createStandardApi()`
   */
  createStandardApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var apiType = params.apiType;

    // Add user deinition to user collection in management db
    var admin_db = new Db(adminDB, new Server(dbServer, 27017));

    // Open management db
    admin_db.open(function(err, admin_db) {
      if (err) { return res.serverError(); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
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

        api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                               appApiName: appApiName, appName: appName, userName: userName, isGenericApi: true, timeStamp: date, status: 'ACT'}, 
                               function (err, result) {
              
          if (err) { return res.serverError(); } 

          var user_collection = admin_db.collection('Users');

          user_collection.findOne({userName: userName}, function(err, doc) {
            if (err) { return res.notFound(); }

            var port = doc.port;

            admin_db.close();

            Collections.create({userName: userName, collectionName: apiName, port: port, isGenericApi: true}).exec(function (err, result){
              if (err) { return res.serverError(err); }
            });

              
            Collections.find({
              where: { userName: userName },
              sort: 'createdAt DESC'
            }).exec(function(err, collections) {
              if (err) { return res.notFound(); }

              UserCollection.destroy().exec(function (err){
                if (err) { return res.notFound(); }
              });

              for (var i=0; i<collections.length; i++) {
                UserCollection.create({collectionName: collections[i].collectionName}).exec(function (err, result) {
                  if (err) { return res.serverError(); }
                })
              }

              var apiFolderLoc = '../Users/' + userName + '/APIs/standard_sails';
              var localUserDiskDbLoc = '.tmp/userDiskDb.db';
              var userDiskDbLoc = apiFolderLoc + '/.tmp/userDiskDb.db';

              fse.copy(localUserDiskDbLoc, userDiskDbLoc, function(err) {        
                if (err) { return res.serverError(); }

                setTimeout(function() {
                  exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {
                    if (err) { return res.serverError(); } 

                    if (stdout == "") {
                      exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(err, stdout, stderr) {
                        if (err) { return res.serverError(); }
                      });
                      
                      return res.json({
                        collection: apiName,
                        userName: userName,
                        apiURL:  'http://localhost:' + JSON.stringify(doc.port) + '/GenericAPI'
                      });
                      
                    }

                  });

                }, 300);
                
              });

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
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var apiType = params.apiType;

    Collections.find({
      where: { userName: userName, isGenericApi: false },
      sort: 'port DESC'
    }).exec(function(err, collections) {

      var port;
      if (collections) {
        var latestPort = collections[0].port;
        port = latestPort + 1;
      } else {
        port = 45000;
      }

      Collections.create({userName: userName, collectionName: apiName, port: port, isGenericApi: false}).exec(function (err, result){
        if (err) { return res.serverError(); }
      });   

      // Add user deinition to user collection in management db
      var admin_db = new Db(adminDB, new Server(dbServer, 27017));

      // Open management db
      admin_db.open(function(err, admin_db) {
        if (err) { return res.serverError(); }

        var adminDb = admin_db.admin();
        // Authenticate using admin control over db
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

          api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                                 appApiName: appApiName, appName: appName, userName: userName, isGenericApi: false, timeStamp: date, status: 'ACT'}, 
                                 function (err, result) {
                
            if (err) { return res.serverError(); } 

            admin_db.close();

            var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
            var destLoc = '../Users/' + userName + '/APIs/';

            fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));

            // Wait for 20 seconds before overwriting local file with port number
            setTimeout(function() {
              var apiLocalConfigFileLoc = destLoc + apiName + '/config/local.js';

              // Change port number 
              fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
                if (err) { return res.notFound(); } 

                var result = data.replace(/$PORT_NO/g, port);

                fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                  if (err) { return res.notFound(); }

                  // Wait for 3 seconds before finishing up
                  setTimeout(function() {

                    return res.json({
                      collection: apiName,
                      userName: userName,
                      apiURL: 'http://localhost:' + port.toString() + '/CustomAPI'
                    });

                  }, 500); 
                  
                });

              });

            }, 2000); 

          });

        });

      });     

    });

  },

  /**
   * `APIController.uploadApi()`
   */
  updateApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
    var destLoc = '../Users/' + userName + '/APIs/';

    // Find port
    Collections.findOne({
      where: { userName: userName, apiName: apiName, isGenericApi: false }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); }

      var port = collection.port;
      // Check if the API is running or not
      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {
        if (err) { return res.serverError(); } 

        // If API is running, first stop the API to be able to update it properly
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

        }

        // Wait for 10 seconds before stopping the api in case it is running
        setTimeout(function() {
          // Delete if there is any same named apis in the user's APIs dir
          fse.removeSync(destLoc + apiName);

          // Wait for 10 seconds before finishing up
          setTimeout(function() {
                
            fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));
                  
            // Wait for 20 seconds before overwriting local file with port number
            setTimeout(function() {

              var apiLocalConfigFileLoc = destLoc + apiName + '/config/local.js';

              // Change port number 
              fs.readFile(apiLocalConfigFileLoc, 'utf8', function (err,data) {
                if (err) { return res.notFound(); } 

                var result = data.replace(/$PORT_NO/g, port);

                fs.writeFile(apiLocalConfigFileLoc, result, 'utf8', function (err) {
                  if (err) { return res.notFound(); } 

                  // Wait for 3 seconds before lifting the api
                  setTimeout(function() {
                    // Start api
                    exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {
                      if (err) { return res.serverError(); }

                      if (stdout != "") { return res.serverError(); }

                      if (stdout == "") {
                        exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(err, stdout, stderr) {
                          if (err) { return res.serverError(); }
                        });

                        return res.json({
                          response: apiName + ' API has successfully been updated'
                        });

                      }

                    });

                  }, 300);

                });

              });

            }, 2000); 
              
          }, 1000);

        }, 500);

      });

    });
    
  },
  

  /**
   * `APIController.deleteApi()`
   */
  deleteApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var fileLoc = '../Users/' + userName + '/APIs/' + apiName;

    Collections.findOne({
      where: { userName: userName, apiName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); } 

      var port = collection.port;

      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {
        if (err) { return res.serverError(); }

        // If API is up, stop first to delete
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

        }

        // Wait for 5 seconds before going on to stop API properly
        setTimeout(function(){
          //Soft delete from DB by updating the entry column ACT->DEACT
          var admin_db = new Db(adminDB, new Server(dbServer, 27017));

          // Fetch a collection to insert document into
          admin_db.open(function(err, admin_db) {
            if (err) { return res.serverError(); }

            var adminDb = admin_db.admin();
            // Authenticate using admin control over db
            adminDb.authenticate(admin, password, function (err, result) {
              if (err) { return res.serverError(); }

              var collection = admin_db.collection("Definitions");
              // Update the document with an atomic operator
              collection.update({apiName: apiName}, {$set:{status: 'DEACT'}});

              admin_db.close();

              // First delete if there is any same named apis in the user's APIs dir
              fse.removeSync(fileLoc);

              // Wait for 10 seconds before deleting API from file system properly
              setTimeout(function() {

                return res.json({
                  response: apiName + 'has successfully been deleted'
                });

              }, 1000);

            });

          });

        }, 500);

      });

    });  

  },


  /**
   * `APIController.startApi()`
   */
  startApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;

    Collections.findOne({
      where: { userName: userName, apiName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); } 

      var port = collection.port;

      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(err, stdout, stderr) {
        if (err) { return res.serverError(); }

        if (stdout != "") { return res.json({ response: apiName + ' API is already started' }); }

        if (stdout == "") {
          exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(err, stdout, stderr) {
            if (err) { return res.serverError(); }
          });
          
          return res.json({
            response: apiName + ' API has successfully been started'
          });
          
        }

      });

    });

  },


  /**
   * `APIController.stopApi()`
   */
  stopApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;

    Collections.findOne({
      where: { userName: userName, apiName: apiName }
    }).exec(function(err, collection) {
      if (err) { return res.notFound(); }

      var port = collection.port;

      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (err) { return res.serverError(); }

        if (stdout == "") { return res.json({ response: apiName + ' API is already stopped' }); }
        
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {
            if (err) { return res.serverError(); }
          });

          return res.json({
            response: apiName + ' API has successfully been stopped'
          });

        }

      });

    });

  },

  /**
   * `APIController.getApiDetails()`
   */
  getApiDetails: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;

    Collections.findOne({
      where: { userName: userName, apiName: apiName }
    }).exec(function(err, collection) {
      if (err) { return console.error(err); } 

      var port = collection.port;

      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (error) { return console.error(error); } 

        var apiStatus;

        if (stdout == "") {
          apiStatus = 'Stopped';  
        } else {
          apiStatus = 'Started';
        }

        // Create user db to handle user defined api data collections
        var userDB = userName;
        var user_db = new Db(userDB, new Server(dbServer, 27017));

        // Open management db
        user_db.open(function(err, user_db) {
          if (err) { return console.error(err); }

          var adminDb = user_db.admin();

          // Authenticate using admin control over db
          adminDb.authenticate(admin, password, function (err, result) {
            if (err) { return console.error(err); }

            var collection = user_db.collection(apiName);

            // Retrieve the statistics for the collection
            collection.stats(function(err, stats) {
              var collectionDocCount = stats.count;
              var collectionSize = stats.size;

              collection.find().sort({timeStamp: -1}).limit(1).toArray(function(err, doc) {

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

