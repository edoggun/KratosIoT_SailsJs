/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	


  /**
   * `UserController.index()`
   */
  index: function (req, res) {
    User.find().exec(function(err, data){
      if (err) return next(err);
      res.json(data);
    });
  },


  /**
   * `UserController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    User.create({name: params.name, email: params.email, password: params.password}).exec(function createCB(err, created){
      return res.json({
        notice: 'Created user with name ' + created.name
      });
    });
  },


  /**
   * `UserController.show()`
   */
  show: function (req, res) {
    var params = req.params.all();
    User.findOne({name: params.name}).exec(function(err, data){
      if (err) return next(err);
      res.json(data);
    });
  },


  /**
   * `UserController.edit()`
   */
  edit: function (req, res) {
    var params = req.params.all();
    User.update({name: params.name, email: params.email, password: params.password}).exec(function(err, data){
      if (err) return next(err);
      res.json(data);
    });
  },


  /**
   * `UserController.delete()`
   */
  delete: function (req, res) {
    var params = req.params.all();
    User.destroy({name: params.name}).exec(function(err, data){
      if (err) return next(err);
      return res.json({
        notice: 'Deleted user with name ' + params.name
      });
    });
  }
};

