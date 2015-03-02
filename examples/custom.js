'use strict';

// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas');

var Inspector = pojoviz.Inspector;

var toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

function BuiltIn(options) {
  Inspector.call(this, options);
}

BuiltIn.prototype = Object.create(Inspector.prototype);

/**
 * @override
 *
 * When the inspector is ready to analyze objects, analyze only
 * the objects stored in the `toInspect` array, note that no
 * object is forbidden this way
 */
BuiltIn.prototype.inspectSelf = function () {
  this.analyzer.add(toInspect);
};

// let's create a BuiltIn
var inspector = new BuiltIn();
inspector
  .init()
  .then(function (inspector) {
    pojoviz.draw.render(inspector);
  })
  .done();