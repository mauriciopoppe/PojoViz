'use strict';

var _ = require('lodash'),
  Generic = require('./analyzer/GenericAnalyzer'),
  Angular = require('./analyzer/Angular'),
  Window = require('./analyzer/Window'),
  PojoViz = require('./analyzer/PojoViz'),
  BuiltIn = require('./analyzer/BuiltIn');

var libraries;

var proto = {
  createNew: function (global, options) {
    console.log('creating a generic container for: ' + global, options);
    return (libraries[global] = new Generic(options));
  },
  all: function (fn) {
    _.forOwn(libraries, fn);
  },
  markDirty: function () {
    proto.all(function (v) {
      v.markDirty();
    });
    return proto;
  },
  setFunctionConstructors: function (newValue) {
    proto.all(function (v) {
      v.analyzer.setFunctionConstructors(newValue);
    });
    return proto;
  }
};

libraries = Object.create(proto);
_.merge(libraries, {
  builtIn: new BuiltIn(),
  window: new Window(),
  // popular
  d3: new Generic({ global: 'd3', allfunctions: true }),
  three: new Generic({ global: 'THREE' }),
  angular: new Angular(),
  // mine
  pojoviz: new PojoViz(),
  t3: new Generic({ global: 't3', functionconstructors: true })
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