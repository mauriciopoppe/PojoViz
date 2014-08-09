'use strict';

var GenericAnalyzer = require('./GenericAnalyzer'),
  utils = require('../util');

var toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

function BuiltIn() {
  GenericAnalyzer.call(this);
}

BuiltIn.prototype = Object.create(GenericAnalyzer.prototype);

BuiltIn.prototype.inspectSelf = function () {
  console.log('inspecting builtIn objects');
  this.analyzer.add(this.getObjects());
};

BuiltIn.prototype.getObjects = function () {
  return toInspect;
};

BuiltIn.prototype.showSearch = function (nodeName, nodeProperty) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(nodeName + ' ' + nodeProperty),
    });
  window.open(url);
};

module.exports = BuiltIn;