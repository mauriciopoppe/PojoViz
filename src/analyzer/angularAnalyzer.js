'use strict';

var angular = require('angular'),
  hashKey = require('../util/hashKey'),
  HashMap = require('../util/HashMap'),
  wrap = require('../ObjectAnalyzer');

angular.module('app', ['ng']);
var res = wrap(),
    injector = angular.injector(['app']);

var services = [
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

function getSelectedServices() {
  var toAnalyze = [];
  services.forEach(function (s) {
    if (s.checked) {
      var obj = injector.get(s.name);
      hashKey.set(obj, s.name);
      // set the hash key to the prototype if possible
      hashKey.createHashKeysFor(obj);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
}

// window.INJECTOR = injector;
// window.SERVICES = services;
// hashKey.set(angular, 'angular');
// res.add(
//   [angular]
//     .concat(getSelectedServices())
// );

// expose the services for the ui to list them (in settings)
res.services = services;

res.preRender = function () {
  res.getObjects().empty();
  hashKey.set(angular, 'angular');
  res.add(
    [angular]
      .concat(getSelectedServices())
  );
};

res.showSearch = function (name, property) {
  window.open('https://duckduckgo.com/?q=' +
    'AngularJS ' + name + ' ' + property);
};

module.exports = res;