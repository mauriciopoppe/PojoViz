'use strict';

var angular = require('angular'),
  utils = require('../util/'),
  wrap = require('../ObjectAnalyzer');

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
module.exports = res;