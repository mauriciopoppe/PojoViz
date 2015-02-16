define(['ObjectAnalyzer', 'util/hashKey', 'util/HashMap', 'angular'],
    function (wrap, hashKey, HashMap, angular) {
  'use strict';
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
  res.add(getSelectedServices());

  // expose the services for the ui
  res.services = services;
  res.preRender = function () {
    res.getItems().empty();
    res.add(getSelectedServices());
  };

  res.showSearch = function (name, property) {
    window.open('https://duckduckgo.com/?q=' +
      'AngularJS ' + name + ' ' + property);
  };

  return res;
});