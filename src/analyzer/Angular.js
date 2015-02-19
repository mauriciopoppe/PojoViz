'use strict';

var _ = require('lodash');
var Inspector = require('./Inspector');
var hashKey = require('../util/hashKey');

function Angular(config) {
  Inspector.call(this, _.merge({
    entryPoint: 'angular',
    displayName: 'AngularJS',
    alwaysDirty: true,
    additionalForbiddenTokens: 'global:jQuery'
  }, config));

  this.services = [
    '$animate',
    '$cacheFactory',
    '$compile',
    '$controller',
    // '$document',
    '$exceptionHandler',
    '$filter',
    '$http',
    '$httpBackend',
    '$interpolate',
    '$interval',
    '$locale',
    '$log',
    '$parse',
    '$q',
    '$rootScope',
    '$sce',
    '$sceDelegate',
    '$templateCache',
    '$timeout'
    // '$window'
  ].map(function (v) {
    return { checked: true, name: v };
  });
}

Angular.prototype = Object.create(Inspector.prototype);

Angular.prototype.getSelectedServices = function () {
  var me = this,
    toAnalyze = [];

  global.angular.module('app', ['ng']);
  this.injector = global.angular.injector(['app']);

  me.services.forEach(function (s) {
    if (s.checked) {
      var obj = me.injector.get(s.name);
      hashKey.createHashKeysFor(obj, s.name);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
};

/**
 * @override
 */
Angular.prototype.inspectSelf = function () {
  var me = this;
  this.debug && console.log('inspecting angular');
  hashKey.createHashKeysFor(global.angular, 'angular');

  // get the objects that need to be forbidden
  var toForbid = me.parseForbiddenTokens();
  this.debug && console.log('forbidding: ', toForbid);
  this.analyzer.forbid(toForbid, true);

  this.analyzer.add(
    [global.angular].concat(this.getSelectedServices())
  );
};

/**
 * @template
 * Since Angular is a script retrieved on demand but the instance
 * is already created in InspectedInstance, let's alter the
 * properties it has before making the request
 */
Angular.prototype.modifyInstance = function (options) {
  this.src = options.src;
};

module.exports = Angular;