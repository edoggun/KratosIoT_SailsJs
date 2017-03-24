/**
 * APIController
 *
 * @description :: Server-side logic for managing APIS
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Unrar = require('node-unrar');
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
    var userName = req.headers.userName;
    var params = req.params.all();
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
            console.log(dbKey);

            var portNo = JSON.stringify(doc.port);
            console.log(portNo);

            admin_db.close();

            var apiFolderLoc = '../Users/' + userName + '/APIs/std_api';
            var apiControllerLoc = apiFolderLoc + '/api/controllers/ApiController.js';

            // Change api name global param with the one we get from req
            fs.readFile(apiControllerLoc, 'utf8', function (err,data) {
              if (err) { return console.error(err); }
                                              
              var result = data.replace(/API_NAME/g, apiName);

              fs.writeFile(apiControllerLoc, result, 'utf8', function (err) {
                if (err) { return console.error(err); }  

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

                var localDiskDbLoc = '/.tmp/userDiskDb.db';
                var userDiskDbLoc = apiFolderLoc + '/.tmp/userDiskDb.db';

                fse.copy(localDiskDbLoc, userDiskDbLoc, function(err) {        
                  if (err) { return console.error(err); }
                });

                return res.json({
                  collection: apiName,
                  userName: userName,
                  apiURL:  'API_URL'
                });
                                
              });

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
    var fileName = apiName + '.rar';
    var fileLoc = '../UploadedAPIs/' + fileName;
    var destLoc = '../Users/' + userName + '/APIs/';

    // First delete if there is any same named apis in the user's APIs dir
    //fse.removeSync(destLoc);
    
    // Move uploaded api to user's APIs dir
    fse.move(fileLoc, destLoc + fileName, function (err) {
      if (err) { return res.serverError(err); }

      setTimeout(function () {
        var rar = new Unrar(destLoc + fileName);
       
        rar.extract(destLoc, null, function (err) {
          

        });

      }, 10000)

    });

    return res.json({
      response: apiName + ' api is uploaded successfully!'
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
    return res.json({
      todo: 'start() is not implemented yet!'
    });
  },


  /**
   * `APIController.stopApi()`
   */
  stopApi: function (req, res) {
    return res.json({
      todo: 'stop() is not implemented yet!'
    });
  },

};

