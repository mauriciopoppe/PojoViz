'use strict';

var three = require('THREE'),
  hashKey = require('../util/hashKey'),
  wrap = require('../ObjectAnalyzer');

var res = wrap();

// res.preRender = function () {
//   res.getObjects().empty();
//   res.analyzeObjects([window], 0);
// };

// res.forbid([d3, dagre, angular, pojoviz], true);
hashKey.set(three, 'THREE');
res.add([three]);

module.exports = res;