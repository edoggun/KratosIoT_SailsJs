/**
 * Gateway.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

  	gatewayName : { 
  		type: 'string',
  		primaryKey: true 
  	},

    userName : { 
    	type: 'string',
    	required: true,
    	defaultsTo: '' 
    },

    data : { 
    	type: 'json',
    	required: true,
    	defaultsTo: '' 
    },

    readTime : {
    	type: 'date',
    	required: true,
    	defaultsTo: ''
    },
     toJSON: function() {
            var obj = this.toObject();
            delete obj.id;
            delete obj.createdAt;
            delete obj.updatedAt;
            return obj;
       }, //TODO Filter records when querying
  },

  tableName: "custom_gateway_collection2"
};

