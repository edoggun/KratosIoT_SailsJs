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
      if (err) { return console.error(err); }

      var adminDb = admin_db.admin();
      // Authenticate using admin control over db
      adminDb.authenticate(admin, password, function (err, result) {
        if (err) { return console.error(err); }

        var api_collection = admin_db.collection('Definitions');

        var gatewayName = params.gatewayName ? params.gatewayName : "";
        var deviceName = params.deviceName ? params.deviceName : "";
        var sensorName = params.sensorName ? params.sensorName : "";
        var thingName = params.thingName ? params.thingName : "";
        var appApiName = params.appApiName ? params.appApiName : "";
        var appName = params.appName ? params.appName : "";

        api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                               appApiName: appApiName, appName: appName, userName: userName, isGenericApi: true, timeStamp: params.timeStamp, status: 'ACT'}, 
                               function (err, result) {
              
          if (err) { return console.error(err); } 

          var user_collection = admin_db.collection('Users');

          user_collection.findOne({userName: userName}, function(err, doc) {
            if (err) { return console.error(err); } 

            var port = doc.port;

            admin_db.close();

            Collections.create({userName: userName, collectionName: apiName, port: port, isGenericApi: true}).exec(function (err, result){
              if (err) { return res.serverError(err); }
            });

              
            Collections.find({
              where: { userName: userName },
              sort: 'createdAt DESC'
            }).exec(function(err, collections) {
              UserCollection.destroy().exec(function (err){
                if (err) { return console.error(err); }
              });

              for (var i=0; i<collections.length; i++) {
                UserCollection.create({collectionName: collections[i].collectionName}).exec(function (err, result) {
                  if (err) { return console.error(err); }
                })
              }

            });

            var apiFolderLoc = '../Users/' + userName + '/APIs/standard_sails';
            var localUserDiskDbLoc = '.tmp/userDiskDb.db';
            var userDiskDbLoc = apiFolderLoc + '/.tmp/userDiskDb.db';

            fse.copy(localUserDiskDbLoc, userDiskDbLoc, function(err) {        
              if (err) { return console.error(err); }
            });

            setTimeout(function() {
              exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
                if (error) { return console.error(error); } 

                if (stdout == "") {
                  exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(error, stdout, stderr) {
                    
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

  },

  /**
   * `APIController.createCustomApi()`
   */
  createCustomApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;

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
        if (err) { return console.error(err); }
      });   

      // Add user deinition to user collection in management db
      var admin_db = new Db(adminDB, new Server(dbServer, 27017));

      // Open management db
      admin_db.open(function(err, admin_db) {
        if (err) { return console.error(err); }

        var adminDb = admin_db.admin();
        // Authenticate using admin control over db
        adminDb.authenticate(admin, password, function (err, result) {
          if (err) { return console.error(err); }

          var api_collection = admin_db.collection('Definitions');

          var gatewayName = params.gatewayName ? params.gatewayName : "";
          var deviceName = params.deviceName ? params.deviceName : "";
          var sensorName = params.sensorName ? params.sensorName : "";
          var thingName = params.thingName ? params.thingName : "";
          var appApiName = params.appApiName ? params.appApiName : "";
          var appName = params.appName ? params.appName : "";

          api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                                 appApiName: appApiName, appName: appName, userName: userName, isGenericApi: false, timeStamp: params.timeStamp, status: 'ACT'}, 
                                 function (err, result) {
                
            if (err) { return console.error(err); } 

            admin_db.close();

          });

        });

      });     
     
      var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
      var destLoc = '../Users/' + userName + '/APIs/';

      fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));
        
      // Wait for 20 seconds before finishing up
      setTimeout(function() {

        return res.json({
          collection: apiName,
          userName: userName,
          apiURL: 'http://localhost:' + port.toString() + '/CustomAPI'
        });

      }, 2000);   

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
      if (err) { return console.error(err); } 

      var port = collection.port;
      // Stop API
      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (error) { return console.error(error); } 

        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {
            if (error) { return console.error(error); }

            // Wait for 10 seconds before finishing up
            setTimeout(function() {
              // Delete if there is any same named apis in the user's APIs dir
              fse.removeSync(destLoc + apiName);

              // Wait for 10 seconds before finishing up
              setTimeout(function() {
                
                fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));
                  
                // Wait for 20 seconds before finishing up
                setTimeout(function() {
                  // Start api
                  exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
                    if (error) { return console.error(error); }

                    if (stdout == "") {
                      exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(error, stdout, stderr) {
                        if (error) { return console.error(error); }
                      });

                      return res.json({
                        response: 'API has been updated'
                      });

                    }

                  });

                }, 2000); 
              
              }, 1000);

            }, 500);

          });

        }

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
      if (err) { return console.error(err); } 

      var port = collection.port;

      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {

          });

          // Wait for 5 seconds before going on to stop API properly
          setTimeout(function(){
            //Soft delete from DB by updating the entry column ACT->DEACT
            var admin_db = new Db(adminDB, new Server(dbServer, 27017));

            // Fetch a collection to insert document into
            admin_db.open(function(err, admin_db) {
              if (err) { return console.error(err); }

              var adminDb = admin_db.admin();
              // Authenticate using admin control over db
              adminDb.authenticate(admin, password, function (err, result) {
                if (err) { return console.error(err); }

                var collection = admin_db.collection("Definitions");
                // Update the document with an atomic operator
                collection.update({apiName: apiName}, {$set:{status: 'DEACT'}});


                admin_db.close();

                // First delete if there is any same named apis in the user's APIs dir
                fse.removeSync(fileLoc);

                // Wait for 10 seconds before deleting API from file system properly
                setTimeout(function() {

                  return res.json({
                    response: apiName + 'is successfully deleted'
                  });

                }, 1000);

              });

            });

          }, 500);

        }

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
      if (err) { return console.error(err); } 

      var port = collection.port;

      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (error) { return console.error(error); } 

        if (stdout == "") {
          exec('sails lift', { cwd: '../Users/' + userName + '/APIs/' + apiName }, function(error, stdout, stderr) {
            
          });
          
          return res.json({
            response: 'API has been started'
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
    var port = params.port; // TODO: will be changed after port management takes place

    Collections.findOne({
      where: { userName: userName, apiName: apiName }
    }).exec(function(err, collection) {
      if (err) { return console.error(err); } 

      var port = collection.port;

      var exec = require('child_process').exec;
      exec('netstat -ano | find "LISTENING" | find "' + port.toString() + '"', function(error, stdout, stderr) {
        if (err) { return console.error(err); } 
        
        if (stdout != "") {
          var stringData = stdout.toString().split("LISTENING");
          var stringData2 = stringData[2].toString().split("       ");
          var pid = stringData[1].toString().split("\n");

          exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {

          });

          return res.json({
            response: 'API has been stopped'
          });

        }

      });

    });

  },

};

