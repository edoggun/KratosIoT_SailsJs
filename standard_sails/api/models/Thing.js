/**
 * Thing.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

  	thingName : { type: 'string' },

    userName : { type: 'string' },

    data : { type: 'json' }

  },

  tableName : 'ThingCollection'

};

