/**
 * GatewayController
 *
 * @description :: Server-side logic for managing Gateways
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

  // Mongodb Driver
  var Db = require('mongodb').Db,
  MongoClient = require('mongodb').MongoClient,
  Server = require('mongodb').Server,
  assert = require('assert');

  // Global username variable
  var g_uname = "USERNAME";

  // Error messages
  var colNotFound = 'Collection not found!';
  var unameErr = 'Username is incorrect!';
  var dbAuthErr = 'Authentication to database failed!'

  // User credantials to authenticate database
  //var user = "gizem";
  //var password = "gizem123";

  function usernameCheck(u) {
      if(g_uname == u)  return true;  // Username matches with global username
      else return false;   
  };



module.exports = {

    /**
     * `APIController.pushData()`
     */
    pushData: function (req, res) {

      // Get request headers
      var username = req.headers.username;
      var dbkey = req.headers.dbkey;

      // Get API collection name 
      var colName = req.param('apiName');

        // Authenticate username
        if(usernameCheck(username)) {
            // Declare database instance            
            var db = new Db('MongoDatabase', new Server('localhost', 27017));
            // Find collection by name
            UserCollection.findOne({collectionName: colName}).exec(function(err, doc) {
                
                if(!doc) { return res.json({ response: colNotFound }) }
                    
                    // Open database
                    db.open(function(err, db) {
                    // Authenticate user to mongo database
                    db.authenticate(username, dbkey, function(err, res) {

                    if (err) { return res.json({ response: dbAuthErr }) }
                          // Declare collection instance
                          var api_collection = db.collection(colName);
                          // Insert data to collection
                          api_collection.insert(req.body, function (err, result) {
                              if(err) { return res.serverError(err); }
                              else {
                                  return res.json({
                                      response: records 
                                  })
                              }
                            });
                      });
                    
                  });

           });
            // Close database connection
            db.close();
        }

        else {
          return res.json( {
            response: unameErr 
          })
        }
    },

  /**
   * `APIController.getLatestData()`
   */
  getLatestData: function (req, res) {

      // Get request headers
      var username = req.headers.username;
      var dbkey = req.headers.dbkey;

      // Get API collection name 
      var colName = req.param('apiName');

        // Authenticate username
        if(usernameCheck(username)) {
            // Declare database instance            
            var db = new Db('MongoDatabase', new Server('localhost', 27017));
            // Find latest data in the collection 
            UserCollection.findOne({collectionName: colName}).exec(function(err, doc) {
                
                if(!doc) { return res.json({ response: colNotFound }) }
                    
                    // Open database
                    db.open(function(err, db) {
                        // Authenticate user to mongo database
                        db.authenticate(username, dbkey, function(err, auth) {

                              if (err) { return res.json({ response: dbAuthErr }) }
                              // Declare collection instance
                              var api_collection = db.collection(colName);
                              // Get latest data in the collection
                              api_collection.find().sort({readTime:-1}).limit(1)
                                  .toArray(function(err,records){
                                          if(err) { return res.serverError(err); }

                                          
                                          else {
                                              return res.json({
                                                  response: records 
                                              })
                                          }
                                      });
                          });
                    });
           });
            // Close database connection
            db.close();
        }

        else {
          return res.json( {
            response: unameErr 
          })
        }  
            
  },


  /**
   * `APIController.getDataWithTimeInterval()`
   */
  getDataWithTimeInterval: function (req, res) {

    // Get start and end for time interval
    var username = req.headers.username;
    var dbkey = req.headers.dbkey;
    var startTime = req.headers.start_time;
    var endTime = req.headers.end_time;

    console.log(startTime);
    console.log(endTime);
    console.log(username);
    console.log(dbkey);
    console.log(req.headers);

      // Get API collection name 
      var colName = req.param('apiName');

        // Authenticate username
        if(usernameCheck(username)) {
            // Declare database instance            
            var db = new Db('MongoDatabase', new Server('localhost', 27017));
            UserCollection.findOne({collectionName: colName}).exec(function(err, doc) {
                
                if(!doc) { return res.json({ response: colNotFound }) }

                    db.open(function(err, db) {
                    // Authenticate user to mongo database
                    db.authenticate(username, dbkey, function(err, auth) {

                     if (err) { return res.json({ response: dbAuthErr }) }
                          // Declare collection instance
                          var api_collection = db.collection(colName);
                          // Get records between  datetimes
                          api_collection.find({
                          readTime: {
                          $gte: startTime,
                          $lt: endTime
                           }
                         }).limit(1000)
                           .toArray(function(err,records) {
                              if(err) { return res.serverError(err); }

                                      else {
                                              return res.json({
                                                  response: records 
                                              })
                                          } 
                            }); 

                     });

                   });

             });

            db.close();
           }
           else {
              return res.json( {
               response: unameErr 
                  });
              }
  },


  /**
  * `APIController.getDataWithCount()`
  */
  getDataWithCount: function (req, res) {

      // Get request headers
      var count = parseInt(req.headers.count);
      var username = req.headers.username;
      var dbkey = req.headers.dbkey;

      // Get API collection name 
      var colName = req.param('apiName');


        // Authenticate username
        if(usernameCheck(username)) {
            // Declare database instance            
            var db = new Db('MongoDatabase', new Server('localhost', 27017));
            // Find collection by name
            UserCollection.findOne({collectionName: colName}).exec(function(err, doc) {
                
                if(!doc) { return res.json({ response: colNotFound }) }
                    
                    // Open database
                    db.open(function(err, db) {
                        // Authenticate user to mongo database
                        db.authenticate(username, dbkey, function(err, auth) {

                        if (err) { return res.json({ response: dbAuthErr }) }
                              // Declare collection instance
                              var api_collection = db.collection(colName);
                              // Get last N record
                              api_collection.find().sort({readTime:-1}).limit(count)
                                  .toArray(function(err,records){
                                      if(err) { return res.serverError(err); }

                                      else {
                                              return res.json({
                                                  response: records 
                                              })
                                          }
                                  });
                        });
                    
                    });

                });
            // Close database connection
            db.close();
        }

        else {
          return res.json( {
            response: unameErr 
          })
        }
  }
};

