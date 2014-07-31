'use strict';

var wrap = require('./ObjectAnalyzer');

var libraries = {
  builtIn: require('./analyzer/builtInAnalyzer'),
  angular: require('./analyzer/angularAnalyzer'),
  d3: require('./analyzer/d3Analyzer'),
  win: require('./analyzer/windowAnalyzer'),
  pojoviz: require('./analyzer/pojovizAnalyzer'),
  threejs: require('./analyzer/threejsAnalyzer'),
  t3: require('./analyzer/t3Analyzer')
};

// console.log(libraries);

// win max level initially is 0
// libraries.win.preRender = function () {
//   libraries.win.getObjects().empty();
//   libraries.win.analyzeObjects([window], 0);
// };

// console.log(builtIn.getObjects());
// console.log(win.getObjects());
// console.log(user.getObjects());

module.exports = libraries;