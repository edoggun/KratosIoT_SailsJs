/**
 * API.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    apiType : { type: 'string' },

    apiName : { type: 'string' },

    gatewayName : { type: 'string' },

    deviceName : { type: 'string' },

    userName : { type: 'string' },

    timestamp : { type: 'string' },

    port : { type: 'string' }
    
  }
};

