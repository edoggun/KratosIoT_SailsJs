/**
 * APIController
 *
 * @description :: Server-side logic for managing APIS
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

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
var managementDB = "ManagementDB";


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
    

    switch(apiType) {
      case "GatewayApi":
        apiName = params.gatewayName;
        definitionTableName = "Gateways";
        break;
      case "DeviceApi":
        apiName = params.deviceName;
        definitionTableName = "Devices";
        break;
      case "SensorApi":
        apiName = params.sensorName;
        definitionTableName = "Sensors";
        break;
      case "ThingApi":
        apiName = params.thingName;
        definitionTableName = "Things";
        break;
      case "AppApi":
        apiName = params.appName;
        definitionTableName = "Apps";
        break;
      default:
        break;
    }


    if (isGenericApi) {
      
      // Get user from DB
      var management_db = new Db(managementDB, new Server(dbServer, 27017));
      // Establish connection to db
      management_db.open(function(err, management_db) {

        management_db.authenticate(admin, password, function (err, result) {
          // Peform a simple find and return one document
          var user_collection = management_db.collection("Users");

          user_collection.findOne({userName: userName}, function(err, doc) {
            if (err) { return console.log(err); }   

            management_db.close();

            var dbKey = JSON.stringify(doc.dbKey);
            console.log(dbKey);

            var api_collection = management_db.collection(definitionTableName);

            api_collection.insert({apiName: apiName, apiType: apiType, gatewayName: params.gatewayName, deviceName: params.deviceName, sensorName: params.sensorName, 
                                   userName: userName, isGenericApi: isGenericApi, timeStamp: params.timeStamp, port: params.port, status: 'Created'}, function (err, result) {

              if (err) { return console.log(err); }  
              

              var userDB = userName;

              var user_db = new Db(userDB, new Server(dbServer, 27017));

              // Open user db
              user_db.open(function (err, user_db) {
                if (err) { return console.log(err); }

                user_db.authenticate(userName, dbKey, function (err, result) {
                  if (err) { return console.log(err); }
                  // Create a capped collection with a maximum of 1000 documents
                  user_db.createCollection(apiName, function (err, collection) {
                    if (err) { return console.log(err); }

                    user_db.close();

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
                        });

                      });

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

