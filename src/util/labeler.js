/**
 * Created by mauricio on 2/21/15.
 */
var _ = require('lodash');
var assert = require('assert');
var hashKey = require('./hashKey');
var utils = require('./');
var me, labeler;
var doGet, doSet, doInsert;

var proto = {
  first: function () {
    return this.values[0];
  },
  size: function () {
    return this.values.length;
  },
  getValues: function () {
    return this.values;
  }
};

/**
 * @param {Object} from
 * @param {string} property
 * @param {string} [config]
 *
 *  - config.labelOverride Overrides the property label with this value
 *  - config.highPriority {boolean} if set to true then the label will be
 *  prepended instead of being append
 *
 * @type {Function}
 */
me = labeler = function (from, property, config) {
  assert(utils.isObjectOrFunction(from), 'from needs to be an object or a function');
  config = config || {};
  var to = from[property];
  if (utils.isObjectOrFunction(to)) {
    var fromHash = hashKey(from);
    // creates the array to hold all the labels
    doSet(to);

    // if the property is `prototype` append the name of the constructor
    // this means that it has a higher priority so the item should be prepended
    if (property === 'prototype' && utils.isConstructor(from)) {
      property = from.name + '.' + property;
      config.highPriority = true;
    }

    if (!_.find(to[me.hiddenLabel], { from: fromHash, label: property })) {
      doInsert(to, {
        from: fromHash,
        label: property
      }, config);
    }
  }
  var r = Object.create(proto);
  r.values = to[me.hiddenLabel] || [];
  return r;
};

me.hiddenLabel = '__pojovizLabel__';

/**
 * The object has a hidden key if it exists and is
 * an array
 * @param v
 * @returns {boolean}
 */
me.has = function (v) {
  return utils.internalClassProperty(doGet(v)) === 'Array';
};

/**
 * Gets a store hashkey only if it's an object
 * @param  {*} obj
 * @return {*} False if it there's not a hidden label, a string if there is
 */
doGet = function (obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return Object.prototype.hasOwnProperty.call(obj, me.hiddenLabel) &&
    obj[me.hiddenLabel];
};

/**
 * @private
 * Sets a hidden key on an object, the hidden key is an array of objects,
 * each object has the following structure:
 *
 *  {
 *    from: string,
 *    label: string
 *  }
 *
 * @param {*} obj The object to set the hiddenKey
 */
doSet = function (obj) {
  var value;
  if (!me.has(obj)) {
    value = [];
    Object.defineProperty(obj, me.hiddenLabel, {
      configurable: true,
      value: value
    });
    if (!obj[me.hiddenLabel]) {
      // in node setting the instruction above might not have worked
      console.warn('hashKey#doSet() setting the value on the object directly');
      obj[me.hiddenLabel] = value;
    }
    assert(obj[me.hiddenLabel], 'Object.defineProperty did not work!');
  }
  return me;
};

doInsert = function (destination, properties, config) {
  var arr = destination[me.hiddenLabel];
  var index = config.highPriority ? 0 : arr.length;

  // label override
  if (config.labelOverride) {
    properties.label = config.labelOverride;
  }

  // insertion either at start or end
  arr.splice(index, 0, properties);
};

module.exports = me;