/**
 * APIController
 *
 * @description :: Server-side logic for managing APIS
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
// default options 
app.use(fileUpload());

var replace = require('replace');
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
   * `APIController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    var isGenericApi = params.isGenericApi;
    var apiType = params.apiType;
    var apiName;
    var definitionTableName;
    var controllerType;
    var modelType;
    var deleteController1;
    var deleteController2;
    var deleteController3;
    var deleteModel1;
    var deleteModel2;
    var deleteModel3;
    

    switch(apiType) {
      case "GatewayApi":
        apiName = params.gatewayName;
        definitionTableName = "Gateways";
        controllerType = "GatewayController";
        modelType = "Gateway";
        deleteController1 = "DeviceController";
        deleteController2 = "SensorController";
        deleteController3 = "ThingController";
        deleteModel1 = "Device";
        deleteModel2 = "Sensor";
        deleteModel3 = "Thing";
        break;
      case "DeviceApi":
        apiName = params.deviceName;
        definitionTableName = "Devices";
        controllerType = "DeviceController";
        modelType = "Device";
        deleteController1 = "GatewayController";
        deleteController2 = "SensorController";
        deleteController3 = "ThingController";
        deleteModel1 = "Gateway";
        deleteModel2 = "Sensor";
        deleteModel3 = "Thing";
        break;
      case "SensorApi":
        apiName = params.sensorName;
        definitionTableName = "Sensors";
        controllerType = "SensorController";
        modelType = "Sensor";
        deleteController1 = "GatewayController";
        deleteController2 = "DeviceController";
        deleteController3 = "ThingController";
        deleteModel1 = "Gateway";
        deleteModel2 = "Device";
        deleteModel3 = "Thing";
        break;
      case "ThingApi":
        apiName = params.thingName;
        definitionTableName = "Things";
        controllerType = "ThingController";
        modelType = "Thing";
        deleteController1 = "GatewayController";
        deleteController2 = "DeviceController";
        deleteController3 = "SensorController";
        deleteModel1 = "Gateway";
        deleteModel2 = "Device";
        deleteModel3 = "Sensor";
        break;
      case "AppApi":
        apiName = params.appName;
        definitionTableName = "Apps";
        //TODO:
        break;
      default:
        if (err) { return console.error(err); }
        break;
    }


    if (isGenericApi) {

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

          var gatewayName = params.gatewayName ? params.gatewayName : null;
          var deviceName = params.deviceName ? params.deviceName : null;
          var sensorName = params.sensorName ? params.sensorName : null;
          var thingName = params.thingName ? params.thingName : null;

          api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: gatewayName, deviceName: deviceName, sensorName: sensorName, thingName: thingName,
                                   userName: userName, isGenericApi: isGenericApi, timeStamp: params.timeStamp, port: params.port, status: 'Created'}, function (err, result) {
            
            if (err) { return console.error(err); } 

            var user_collection = admin_db.collection("Users");

            // Peform a simple find and return one document
            var collection = admin_db.collection("Users");

            collection.findOne({userName: userName}, function(err, doc) {
              assert.equal(null, err);

              var dbKey = JSON.stringify(doc.dbKey);
              console.log(dbKey);

              admin_db.close();

              // If Api type is generic, then copy standard (ready) api that is located in main directory to user's APIs directory
              fse.copy('../standard_sails', '../Users/' + userName + '/APIs/' + apiName, function(err) {        
                if (err) { return console.error(err); }

                // Change port number with the one we get from req in local file
                fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/config/local.js', 'utf8', function (err,data) {
                  if (err) { return console.error(err); }
                  
                  var port = params.port;

                  var result = data.replace(/portNo/g, port);

                  fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/config/local.js', result, 'utf8', function (err) {
                    if (err) { return console.error(err); }

                    // Change db user name in connections config file
                    fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', 'utf8', function (err,data) {
                      if (err) { return console.error(err); }

                      var result = data.replace(/userName/g, userName);

                      fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', result, 'utf8', function (err) {
                        if (err) { return console.error(err); }

                        // Change db password in connections config file
                        fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', 'utf8', function (err,data) {
                          if (err) { return console.error(err); }

                          var result = data.replace(/userDatabase/g, userName);

                          fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', result, 'utf8', function (err) {
                            if (err) { return console.error(err); }

                            // Change db name in connections config file
                            fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', 'utf8', function (err,data) {
                              if (err) { return console.error(err); }

                              var result = data.replace(/dbKey/g, dbKey);

                              fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/config/connections.js', result, 'utf8', function (err) {
                                if (err) { return console.error(err); }

                                // Change user name global param with the one we get from req
                                fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + controllerType + '.js', 'utf8', function (err,data) {
                                  if (err) { return console.error(err); }
                                  
                                  var result = data.replace(/USER_NAME/g, userName);

                                  fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + controllerType + '.js', result, 'utf8', function (err) {
                                    if (err) { return console.error(err); }

                                    // Change port number with the one we get from req in local file
                                    fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + controllerType + '.js', 'utf8', function (err,data) {
                                      if (err) { return console.error(err); }
                                      
                                      var result = data.replace(/API_NAME/g, apiName);

                                      fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + controllerType + '.js', result, 'utf8', function (err) {
                                        if (err) { return console.error(err); }  

                                        // Change port number with the one we get from req in local file
                                        fs.readFile('../Users/' + userName + '/APIs/' + apiName + '/api/models/' + modelType + '.js', 'utf8', function (err,data) {
                                          if (err) { return console.error(err); }
                                          
                                          var result = data.replace(/COLLECTION_NAME/g, apiName);

                                          fs.writeFile('../Users/' + userName + '/APIs/' + apiName + '/api/models/' + modelType + '.js', result, 'utf8', function (err) {
                                            if (err) { return console.error(err); } 

                                            // Delete unnecessary controllers
                                            fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + deleteController1 + '.js', function (err) {
                                              if (err) { console.error(err); }

                                              fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + deleteController2 + '.js', function (err) {
                                                if (err) { console.error(err); }

                                                fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/controllers/' + deleteController3 + '.js', function (err) {
                                                  if (err) { console.error(err); }

                                                  // Delete unnecessary models
                                                  fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/models/' + deleteModel1 + '.js', function (err) {
                                                    if (err) { console.error(err); }

                                                    fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/models/' + deleteModel2 + '.js', function (err) {
                                                      if (err) { console.error(err); }

                                                      fse.remove('../Users/' + userName + '/APIs/' + apiName + '/api/models/' + deleteModel3 + '.js', function (err) {
                                                        if (err) { console.error(err); }

                                                      });

                                                    });

                                                  });

                                                });

                                              });

                                            });

                                          });

                                        });

                                      });

                                    });

                                  });

                                });

                              });

                            });

                          });

                        });

                      });

                    });

                  });

                });
                        
              });

            });

          });

        });

      });

    } else {
      // Upload file to user's APIs directory from req.file()
      if (!req.files) {
        return res.status(400).send('No files were uploaded.');
      }

      let sampleFile = req.files.sampleFile;

      // Use the mv() method to place the file somewhere on your server 
      sampleFile.mv('/../Users/' + userName + '/APIs/' + 'apiName.rar', function(err) {
        if (err) {
          return res.status(500).send(err);
        }
     
        res.send('File uploaded!');
      });

    }

    


    return res.json({
      response: apiName + ' is created successfully for user ' + userName
    });
  },


  /**
   * `APIController.update()`
   */
  update: function (req, res) {
    return res.json({
      todo: 'update() is not implemented yet!'
    });
  },
  

  /**
   * `APIController.delete()`
   */
  delete: function (req, res) {
    return res.json({
      todo: 'delete() is not implemented yet!'
    });
  },


  /**
   * `APIController.start()`
   */
  start: function (req, res) {
    return res.json({
      todo: 'start() is not implemented yet!'
    });
  },


  /**
   * `APIController.stop()`
   */
  stop: function (req, res) {
    return res.json({
      todo: 'stop() is not implemented yet!'
    });
  },


  /**
   * `APIController.getUserAPIs()`
   */
  getUserAPIs: function (req, res) {
    return res.json({
      todo: 'getUserAPIs() is not implemented yet!'
    });
  },


  /**
   * `APIController.getUserAPPs()`
   */
  getUserAPPs: function (req, res) {
    return res.json({
      todo: 'getUserAPPs() is not implemented yet!'
    });
  }
};

