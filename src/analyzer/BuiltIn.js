'use strict';

var GenericAnalyzer = require('./GenericAnalyzer'),
  utils = require('../util');

function BuiltIn() {
  GenericAnalyzer.call(this);
}

BuiltIn.prototype = Object.create(GenericAnalyzer.prototype);

BuiltIn.prototype.inspectSelf = function () {
  console.log('inspecting builtIn objects');
  var builtInObjects = [
    Object, Function,
    Array, Date, Boolean, Number, Math, String, RegExp, JSON,
    Error
  ];
  this.analyzer.add(builtInObjects);
};

BuiltIn.prototype.showSearch = function (nodeName, nodeProperty) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(nodeName + ' ' + nodeProperty),
    });
  window.open(url);
};

module.exports = BuiltIn;