'use strict';

var _ = require('lodash'),
  Generic = require('./analyzer/GenericAnalyzer'),
  Angular = require('./analyzer/Angular'),
  T3 = require('./analyzer/T3'),
  Window = require('./analyzer/Window'),
  PojoViz = require('./analyzer/PojoViz'),
  BuiltIn = require('./analyzer/BuiltIn');

var libraries;

var proto = {
  createNew: function (global, options) {
    console.log('creating a generic container for: ' + global);
    return (libraries[global] = new Generic(options));
  }
};

libraries = Object.create(proto);
_.merge(libraries, {
  builtIn: new BuiltIn(),
  angular: new Angular(),
  d3: new Generic({ global: 'd3' }),
  window: new Window(),
  pojoviz: new PojoViz(),
  three: new Generic({ global: 'THREE' }),
  t3: new T3()
});

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