'use strict';

var _ = require('lodash'),
  Generic = require('./analyzer/GenericAnalyzer'),
  Angular = require('./analyzer/Angular'),
  Window = require('./analyzer/Window'),
  PObject = require('./analyzer/Object'),
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
      // this only works on the generic analyzers
      if (!v._hasfc) {
        v.analyzer.setFunctionConstructors(newValue);
      }
    });
    return proto;
  }
};

libraries = Object.create(proto);
_.merge(libraries, {
  object: new PObject(),
  builtIn: new BuiltIn(),
  window: new Window(),
  // popular
  angular: new Angular(),
  // mine
  // t3: new Generic({ global: 't3' }),
  // huge
  three: new Generic({
    global: 'THREE',
    rendereachtime: true
  }),
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