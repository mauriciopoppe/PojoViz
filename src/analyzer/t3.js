'use strict';

var t3 = require('t3'),
  hashKey = require('../util/hashKey'),
  GenericAnalyzer = require('./GenericAnalyzer'),
  utils = require('../util');

function T3() {
  GenericAnalyzer.call(this, {
    global: 't3'
  });
}

T3.prototype = Object.create(GenericAnalyzer.prototype);

T3.prototype.inspectSelf = function () {
  console.log('inspecting t3');
  this.analyzer.getObjects().empty();
  hashKey.createHashKeysFor(t3, 't3');
  hashKey.createHashKeysFor(t3.model.Coordinates, 'Coordinates');
  hashKey.createHashKeysFor(t3.Application, 'Application');
  hashKey.createHashKeysFor(t3.controller.Keyboard, 'Keyboard');
  hashKey.createHashKeysFor(t3.controller.LoopManager, 'LoopManager');
  this.analyzer.add([
    t3,
    t3.model.Coordinates,
    t3.Application,
    t3.controller.Keyboard,
    t3.controller.LoopManager
  ]);
};

module.exports = T3;