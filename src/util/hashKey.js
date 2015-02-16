'use strict';

var _ = require('lodash');
var assert = require('assert');
var utils = require('./');
var me, hashKey;
/**
 * Gets a store hashkey only if it's an object
 * @param  {[type]} obj
 * @return {[type]}
 */
function get(obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return obj.hasOwnProperty &&
    obj.hasOwnProperty(me.hiddenKey) &&
    obj[me.hiddenKey];
}

/**
 * TODO: document
 * Sets a key on an object
 * @param {[type]} obj [description]
 * @param {[type]} key [description]
 */
function set(obj, key) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  assert(
    key && typeof key === 'string',
    'The key needs to be a valid string'
  );
  if (!get(obj)) {
    Object.defineProperty(obj, me.hiddenKey, {
      value: typeof obj + '-' + key
    });
  }
  return me;
}

me = hashKey = function (v) {
  var uid = v;
  if (utils.isObjectOrFunction(v)) {
    if (!get(v)) {
      me.createHashKeysFor(v);
    }
    uid = get(v);
    if (!uid) {
      console.err('no hashkey :(', v);
    }
    assert(uid, 'error getting the key');
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};
me.hiddenKey = '__pojoVizKey__';

me.createHashKeysFor = function (obj, name) {

  function localToString(obj) {
    var match;
    try {
      match = {}.toString.call(obj).match(/^\[object (\S*?)\]/);
    } catch (e) {
      match = false;
    }
    return match && match[1];
  }

  /**
   * Analyze the internal property [[Class]] to guess the name
   * of this object, e.g. [object Date], [object Math]
   * Many object will give false positives (they will match [object Object])
   * so let's consider Object as the name only if it's equal to
   * Object.prototype
   * @param  {Object}  obj
   * @return {Boolean}
   */
  function hasAClassName(obj) {
    var match = localToString(obj);
    if (match === 'Object') {
      return obj === Object.prototype && 'Object';
    }
    return match;
  }

  function getName(obj) {
    var name, className;

    // return the already generated hashKey
    if (get(obj)) {
      return get(obj);
    }

    // generate a new key based on
    // - the name if it's a function
    // - a unique id
    name = typeof obj === 'function' &&
      typeof obj.name === 'string' &&
      obj.name;

    className = hasAClassName(obj);
    if (!name && className) {
      name = className;
    }

    name = name || _.uniqueId();
    return name;
  }

  // the name is equal to the passed name or the
  // generated name
  name = name || getName(obj);
  name = name.replace(/[\. ]/img, '-');

  // if the obj is a prototype then try to analyze
  // the constructor first so that the prototype becomes
  // [name].prototype
  // special case: object.constructor = object
  if (obj.hasOwnProperty &&
      obj.hasOwnProperty('constructor') &&
      typeof obj.constructor === 'function' &&
      obj.constructor !== obj) {
    return me.createHashKeysFor(obj.constructor);
  }

  // set name on self
  set(obj, name);

  // set name on the prototype
  if (typeof obj === 'function' &&
      obj.hasOwnProperty('prototype')) {
    set(obj.prototype, name + '-prototype');
  }
};

me.has = function (v) {
  return v.hasOwnProperty &&
    v.hasOwnProperty(me.hiddenKey);
};

module.exports = me;