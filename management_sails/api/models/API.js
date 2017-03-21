/**
 * API.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    apiType : { type: 'string' },

    gatewayName : { type: 'string' },

    deviceName : { type: 'string' },

    sensorName : { type: 'string' },

    thingName : { type: 'string' },

    appName : { type: 'string' },

    userName : { type: 'string' },

    isGenericApi : { type: 'boolean'},

    timestamp : { type: 'string' },

    port : { type: 'integer' }
    
  }
};

