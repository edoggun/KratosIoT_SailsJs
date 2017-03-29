/**
 * APIController
 *
 * @description :: Server-side logic for managing APIS
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var unzip = require('unzip');
var fs = require('fs');
var fse = require('fs-extra');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    assert = require('assert');

var admin = "admin";
var password = "admin123";
var dbServer = "localhost";
var dbServerPort = "27017";
var adminDB = "admin";


module.exports = {
	
  /**
   * `APIController.createApi()`
   */
  createApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var isGenericApi = params.isGenericApi;
    var apiName = params.apiName;
    var apiType = params.apiType;
    var definitionTableName = "Definitions";

    Collections.create({userName: userName, collectionName: apiName}).exec(function (err, result){
      if (err) { return res.serverError(err); }
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

        var api_collection = admin_db.collection(definitionTableName);

        var gatewayName = params.gatewayName ? params.gatewayName : "";
        var deviceName = params.deviceName ? params.deviceName : "";
        var sensorName = params.sensorName ? params.sensorName : "";
        var thingName = params.thingName ? params.thingName : "";
        var appApiName = params.appApiName ? params.appApiName : "";
        var appName = params.appName ? params.appName : "";

        api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                               appApiName: appApiName, appName: appName, userName: userName, isGenericApi: isGenericApi, timeStamp: params.timeStamp, status: 'Created'}, 
                               function (err, result) {
            
          if (err) { return console.error(err); } 

          var user_collection = admin_db.collection("Users");

          user_collection.findOne({userName: userName}, function(err, doc) {
            assert.equal(null, err);

            var dbKey = JSON.stringify(doc.dbKey);
            var port = JSON.stringify(doc.port);

            admin_db.close();

            
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
            var localDiskDbLoc = '.tmp/userDiskDb.db';
            var userDiskDbLoc = apiFolderLoc + '/.tmp/userDiskDb.db';

            fse.copy(localDiskDbLoc, userDiskDbLoc, function(err) {        
              if (err) { return console.error(err); }
            });

            return res.json({
              collection: apiName,
              userName: userName,
              apiURL:  'http://localhost:' + port + '/GenericAPI'
            });
              
          });

        });

      });

    });

  },

  /**
   * `APIController.uploadApi()`
   */
  uploadApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var fileLoc = '../UploadedAPIs/' + apiName + '.zip';
    var destLoc = '../Users/' + userName + '/APIs/';

    // First delete if there is any same named apis in the user's APIs dir
    fse.removeSync(destLoc + apiName);

    // Wait for a second before finishing up, to ensure we have written the item to disk
    setTimeout(function() {

      fs.createReadStream(fileLoc).pipe(unzip.Extract({ path: destLoc }));
      return res.json({
        response: apiName + 'is successfully uploaded'
      });

    }, 2000);   
    
  },
  

  /**
   * `APIController.deleteApi()`
   */
  deleteApi: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var apiName = params.apiName;
    var fileLoc = '../Users/' + userName + '/APIs/' + apiName;

    // First delete if there is any same named apis in the user's APIs dir
    fse.removeSync(fileLoc);

    return res.json({
      response: apiName + 'is successfully deleted'
    });

  },


  /**
   * `APIController.startApi()`
   */
  startApi: function (req, res) {
    var params = req.params.all();
    var port = params.port; // TODO: will be changed after port management takes place

    exec('netstat -ano | find "LISTENING" | find "' + port + '"', function(error, stdout, stderr) {
      if (stdout) {
        var exec = require('child_process').exec;
        exec('sails lift', {
          cwd: '../Users/dogukan/APIs/Device24'
        }, function(error, stdout, stderr) {
          
          return res.json({
            todo: 'API has started'
          });

        });
        
      }

    });

  },


  /**
   * `APIController.stopApi()`
   */
  stopApi: function (req, res) {
    var params = req.params.all();
    var port = params.port; // TODO: will be changed after port management takes place

    var exec = require('child_process').exec;
    exec('netstat -ano | find "LISTENING" | find "' + port + '"', function(error, stdout, stderr) {
      var stringData = stdout.toString().split("LISTENING");
      var stringData2 = stringData[2].toString().split("       ");
      var pid = stringData[1].toString().split("\n");
      console.log('A' + pid[0] + 'A');

      exec('taskkill /pid ' + pid[0].toString() + ' /F', function(error, stdout, stderr) {
        
        return res.json({
          todo: 'API has stopped'
        });

      });

    });

  },

};

