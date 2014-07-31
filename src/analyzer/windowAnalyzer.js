'use strict';

var angular = require('angular'),
  pojoviz = require('../'),
  d3 = require('d3'),
  three = require('THREE'),
  t3 = require('t3'),
  dagre = require('dagre'),
  angular = require('angular'),
  utils = require('../util/'),
  wrap = require('../ObjectAnalyzer');

var res = wrap();

res.showSearch = function (name, property) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(name + ' ' + property),
    });
  window.open(url);
};
res.preRender = function () {
  res.getObjects().empty();
  res.forbid([
    d3,
    dagre,
    angular,
    pojoviz,
    three,
    t3
  ], true);
  res.add([window]);
};


module.exports = res;