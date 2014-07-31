'use strict';

var angular = require('angular'),
  d3 = require('d3'),
  hashKey = require('../util/hashKey'),
  wrap = require('../ObjectAnalyzer');

var builtInObjects = [
  // Object, Function,
  // Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  // window
], res = wrap();

// set a defined hashkey for the D3 object
hashKey
  .set(d3, 'd3')
  // .set(d3.behavior, 'd3-behavior')
  // .set(d3.ns, 'd3-ns')
  // .set(d3.time, 'd3-time')
  // .set(d3.geo, 'd3-geo')
  // .set(d3.geom, 'd3-geom')
  // .set(d3.interpolators, 'd3-interpolators')
  // .set(d3.layout, 'd3-layout')
  // .set(d3.random, 'd3-random')
  // .set(d3.scale, 'd3-scale')
  // .set(d3.svg, 'd3-svg');
hashKey.createHashKeysFor(d3);

res.add([d3]);
module.exports = res;