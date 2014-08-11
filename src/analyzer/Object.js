'use strict';

var GenericAnalyzer = require('./GenericAnalyzer'),
  utils = require('../util');

function PObject() {
  GenericAnalyzer.call(this);
}

PObject.prototype = Object.create(GenericAnalyzer.prototype);

PObject.prototype.inspectSelf = function () {
  console.log('inspecting Object objects');
  this.analyzer.add(this.getObjects());
};

PObject.prototype.getObjects = function () {
  return [Object];
};

module.exports = PObject;