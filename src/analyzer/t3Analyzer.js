'use strict';

var t3 = require('t3'),
  hashKey = require('../util/hashKey'),
  wrap = require('../ObjectAnalyzer');

var res = wrap();

// res.preRender = function () {
//   res.getObjects().empty();
//   res.analyzeObjects([window], 0);
// };

// res.forbid([d3, dagre, angular, pojoviz], true);
res.preRender = function () {
  res.getObjects().empty();
  hashKey.set(t3, 't3');
  hashKey.set(t3.model.Coordinates, 'Coordinates');
  hashKey.set(t3.Application, 'Application');
  hashKey.set(t3.controller.Keyboard, 'Keyboard');
  hashKey.set(t3.controller.LoopManager, 'LoopManager');
  res.add([
    t3,
    t3.model.Coordinates,
    t3.Application,
    t3.controller.Keyboard,
    t3.controller.LoopManager
  ]);
};

module.exports = res;