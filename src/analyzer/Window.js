'use strict';

var _ = require('lodash'),
  hashKey = require('../util/hashKey'),
  GenericAnalyzer = require('./GenericAnalyzer');

var toInspect = [window];

function Window() {
  GenericAnalyzer.call(this, {
    levels: 1,
    rendereachtime: true,
    functionconstructors: false
  });
}

Window.prototype = Object.create(GenericAnalyzer.prototype);

Window.prototype.getObjects = function () {
  return toInspect;
};

Window.prototype.inspectSelf = function () {
  console.log('inspecting window');
  var me = this,
    hashes = require('../ObjectHashes');

  _.forOwn(hashes, function (v, k) {
    if (v.global && window[v.global]) {
      me.analyzer.forbid([window[v.global]], true);
    }
  });
  this.analyzer.getObjects().empty();
  this.analyzer.setLevels(this.levels);
  this.analyzer.add(me.getObjects());
};

module.exports = Window;