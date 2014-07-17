define(['ObjectAnalyzer', 'util/hashKey', 'util/utils',
  'util/HashMap', 'angular'],
    function (wrap, hashKey, utils, HashMap, angular) {
  'use strict';
  var builtInObjects = [
    Object, Function,
    Array, Date, Boolean, Number, Math, String, RegExp, JSON,
    // window
  ], res = wrap();
  res.showSearch = function (name, property) {
    var url = 'https://developer.mozilla.org/en-US/search?' +
      utils.toQueryString({
        q: encodeURIComponent(name + ' ' + property),
      });
    window.open(url);
  };
  res.add(builtInObjects);
  return res;
});