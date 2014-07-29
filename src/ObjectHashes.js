'use strict';

var wrap = require('./ObjectAnalyzer'),
  HashMap = require('./util/HashMap'),
  angularAnalyzer = require('./analyzer/angularAnalyzer'),
  builtInAnalyzer = require('./analyzer/builtInAnalyzer'),
  d3Analyzer = require('./analyzer/d3Analyzer');

var libraries = {
  builtIn: builtInAnalyzer,
  angular: angularAnalyzer,
  d3: d3Analyzer,
  win: wrap(new HashMap(), new HashMap()),
  user: wrap(new HashMap(), new HashMap()),
  all: wrap(new HashMap(), new HashMap())
};

// win max level initially is 0
libraries.win.preRender = function () {
  libraries.win.getObjects().empty();
  libraries.win.analyzeObjects([window], 0);
};
libraries.user.analyzeObjects([], 0);

// console.log(builtIn.getObjects());
// console.log(win.getObjects());
// console.log(user.getObjects());

module.exports = libraries;