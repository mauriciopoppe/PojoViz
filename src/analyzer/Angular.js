'use strict';

var GenericAnalyzer = require('./GenericAnalyzer'),
  hashKey = require('../util/hashKey');

function Angular() {
  GenericAnalyzer.call(this, {
    global: 'angular',
    displayName: 'AngularJS',
    renderEachTime: true
  });

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
    '$timeout',
    // '$window'
  ].map(function (v) {
    return { checked: true, name: v };
  });
}

Angular.prototype = Object.create(GenericAnalyzer.prototype);

Angular.prototype.getSelectedServices = function () {
  var me = this,
    toAnalyze = [];

  window.angular.module('app', ['ng']);
  this.injector = window.angular.injector(['app']);

  me.services.forEach(function (s) {
    if (s.checked) {
      var obj = me.injector.get(s.name);
      hashKey.createHashKeysFor(obj, s.name);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
};

Angular.prototype.inspectSelf = function () {
  console.log('inspecting angular');
  hashKey.createHashKeysFor(window.angular, 'angular');
  this.analyzer.getObjects().empty();
  this.analyzer.add(
    [window.angular].concat(this.getSelectedServices())
  );
};

module.exports = Angular;