'use strict';

var utils = require('../util/'),
  hashKey = require('../util/hashKey'),
  HashMap = require('../util/HashMap'),
  wrap = require('../ObjectAnalyzer');

var classes = [{
  //   obj: require('./angularAnalyzer'),
  //   name: 'angularAnalyzer'
  // }, {
  //   obj: require('./builtInAnalyzer'),
  //   name: 'builtInAnalyzer'
  // }, {
  //   obj: require('./d3Analyzer'),
  //   name: 'd3Analyzer'
  // }, {
  //   obj: require('./pojovizAnalyzer'),
  //   name: 'pojovizAnalyzer'
  // }, {
  //   obj: require('./windowAnalyzer'),
  //   name: 'windowAnalyzer'
  // }, {
    obj: require('../util/hashKey'),
    name: 'hashKey'
  }, {
    obj: require('../util/HashMap'),
    name: 'HashMap'
  }, {
    obj: require('../util/'),
    name: 'utils'
  }, {
    obj: require('../view/Canvas'),
    name: 'Canvas'
  }, {
    obj: require('../view/Node'),
    name: 'Node'
  }, {
    obj: require('../view/Property'),
    name: 'Property'
  }, {
    obj: require('../ObjectAnalyzer'),
    name: 'ObjectAnalyzer'
  }, {
    obj: require('../ObjectHashes'),
    name: 'ObjectHashes'
  }
]
  .map(function (v) {
    hashKey.set(v.obj, v.name);
    // set the hash key to the prototype if possible
    hashKey.createHashKeysFor(v.obj);
    return v.obj;
  });

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
  res.setLevels(1);
  res.add(classes);
};

module.exports = res;