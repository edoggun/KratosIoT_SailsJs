/**
 * GatewayController
 *
 * @description :: Server-side logic for managing Gateways
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 /*
  var Db = require('mongodb').Db,
  MongoClient = require('mongodb').MongoClient,
  Server = require('mongodb').Server,
  assert = require('assert');
  */

  // VALIDATION VARIABLES
  var g_uname = "USERNAME";
  var g_dbkey = "DB_KEY";
  var g_collectionid = "bornovagw";

  // ERROR MESSAGES
  var colNotFound = 'Collection not found!';
  var authErr = 'Authentication error!'

  function authenticate(u, d) {
      if(g_uname == u && g_dbkey == d)  return true;  // Successful auth
      else return false;   // Auth failed   
  };

module.exports = {

    /**
     * `GatewayController.sendMessage()`
     */
    sendMessage: function (req, res) {

    // Parse HTTP request parameters
    var params = req.params.all();
    var gwName = params.gatewayName;
    var uName = params.userName;
    var dt = params.data;
    var time = params.readTime;

      // Authenticate username&database key
      if(authenticate(req.headers.username, req.headers.dbkey)) {
          // Check if collection_id matches with thing name
          if(g_collectionid == req.headers.collectionid) {
              // Create a new document in the collection
              Gateway.create( {gatewayName: gwName, userName: uName, data: dt, readTime: time } )
              .exec(function (err, newRecord) {

                if(err) { return res.serverError(err); }

                return res.json( {
                  response: 'Data has been stored in' + ' ' + Gateway.tableName
                });
              });

          }
                else {
                  return res.json( {
                    response: colNotFound
                  })
                }
      }

      else {
        return res.json( {
          response: authErr 
        })
      }
    },

  /**
   * `GatewayController.getLatestMessage()`
   */
  getLatestMessage: function (req, res) {

    var params = req.params.all();
    var latest_gwName = params.gatewayName;
    var latest_uName = params.userName;
    var latest_dt = params.data;
    var latest_time = params.readTime;

    // Authenticate username&database key
    if(authenticate(req.headers.username, req.headers.dbkey)) {
        // Check if collection_id matches with thing name
        if(g_collectionid == req.headers.collectionid) {
            // Find the latest reading in the collection
            Gateway.find().sort({readTime: -1}).limit(1)
                   .exec(function(err, record){

                      if(err) { return res.serverError(err); }

                      return res.json( {
                        response: record
                      });
                   });
          }
        else {
          return res.json( {
            response: colNotFound 
          })
        }
    }

    else {
      return res.json( {
        response: authErr 
      })
    }
  },


  /**
   * `GatewayController.getMessagesWithInterval()`
   */
  getMessagesWithInterval: function (req, res) {

    var params = req.params.all();
    var getInterval_gwName = params.gatewayName;
    var getInterval_uName = params.usernName;
    var getInterval_dt = params.data;
    var getInterval_time = params.readTime;
    // Define start and end for time interval
    var startTime = req.param('start');
    var endTime = req.param('end');

    // Authenticate username&database key
    if(authenticate(req.headers.username, req.headers.dbkey)) {
        // Check if collection_id matches with thing name
        if(g_collectionid == req.headers.collectionid) {
          // Find records in a datetime range 
          Gateway.find({
            readTime: {
              $gte: new Date(startTime),
              $lt: new Date(endTime)
            }
          }).limit(1000)
          .exec(function(err,records){

            if(err){ return res.serverError(err); }

            return res.json( {
              response: records
            });
          });
        }
        else {
          return res.json( {
            response: colNotFound 
          })
        }
    }

    else {
      return res.json( {
        response: authErr 
      })
    }
  },


  /**
  * `GatewayController.getMessageWithCount()`
  */
  getMessageWithCount: function (req, res) {

    var params = req.params.all();
    var getCounted_gwName = params.gatewayName;
    var getCounted_uName = params.userName;
    var getCounted_dt = params.data;
    var getCounted_time = params.readTime;
    // Get total record count
    var count = req.param('count');

    // Authenticate username&database key
    if(authenticate(req.headers.username, req.headers.dbkey)) {
        // Check if collection_id matches with thing name
        if(g_collectionid == req.headers.collectionid) {
          // Find last x readings
          Gateway.find().sort({readTime: -1}).limit(count)
                 .exec(function(err, records){

                    if(err) { return res.serverError(err); }

                    return res.json( {
                      response: records
                    });
                 });
          }
          else {
          return res.json( {
            response: colNotFound 
          })
        }
    }

    else { 
      return res.json( {
        response: authErr 
      })
    }
  }
};

