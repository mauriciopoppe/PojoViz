'use strict';

var _ = require('lodash'),
  hashKey = require('../util/hashKey'),
  GenericAnalyzer = require('./GenericAnalyzer');

function Window() {
  GenericAnalyzer.call(this, {
    renderEachTime: true
  });
}

Window.prototype = Object.create(GenericAnalyzer.prototype);

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
  this.analyzer.add([window]);
};

module.exports = Window;