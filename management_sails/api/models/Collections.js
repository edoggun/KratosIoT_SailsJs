/**
 * Collections.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

  	userName : { type: 'string'},

  	collectionName : { type: 'string' },

  	port : { type: 'integer'},

  	isGenericApi : { type: 'boolean'}

  },
  
  connection: 'localDiskDb'

};

