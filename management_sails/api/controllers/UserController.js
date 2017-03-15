/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = {
	
  
  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;
    // Creating user folder and APIs folder under it
    mkdirp('../Users/' + userName + '/APIs', function (err) {
        if (err) { return res.serverError(err); } 
        
        // Creating APPs folder under user folder
        mkdirp('../Users/' + userName + '/APPs', function (err) {
          if (err) { return res.serverError(err); }

          // Inserting user into DB
          User.create({userName: userName}).exec(function (err) {
            if (err) { return res.serverError(err); }
          });

        });

    });

    return res.json({
      response: 'User ' + userName + ' successfully created'
    });
  },


  /**
   * `UserController.update()`
   */
  update: function (req, res) {
    return res.json({
      todo: 'update() is not implemented yet!'
    });
  },


  /**
   * `UserController.delete()`
   */
  delete: function (req, res) {
    var params = req.params.all();
    var userName = params.userName;

    rimraf('../Users/' + userName, function (err) { 
      if (err) { return res.serverError(err); } 

      //TODO: Soft delete from DB by updating the entry column ACT->DEACT
      
    });

    return res.json({
      response: 'User ' + userName + ' successfully removed'
    });
  },


  /**
   * `UserController.get()`
   */
  get: function (req, res) {
    return res.json({
      todo: 'get() is not implemented yet!'
    });
  },


  /**
   * `UserController.getAll()`
   */
  getAll: function (req, res) {
    return res.json({
      todo: 'getAll() is not implemented yet!'
    });
  }
};

