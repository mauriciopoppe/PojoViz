'use strict';

var hashKey = require('../util/hashKey'),
  GenericAnalyzer = require('./GenericAnalyzer'),
  utils = require('../util');

function PojoViz() {
  GenericAnalyzer.call(this, {
    global: 'pojoviz'
  });
}

PojoViz.prototype = Object.create(GenericAnalyzer.prototype);

PojoViz.prototype.inspectSelf = function () {
  console.log('inspecting t3');
  this.analyzer.getObjects().empty();
  
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
  }]
  .map(function (v) {
    hashKey.createHashKeysFor(v.obj, v.name);
    return v.obj;
  });
  this.analyzer.setLevels(1);
  this.analyzer.add(classes);
};

module.exports = PojoViz;