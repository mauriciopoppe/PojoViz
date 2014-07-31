'use strict';

var _ = require('lodash'),
  me, hashKey;

me = hashKey = function (v) {
  var value = v,
      uid = v;
  if (v && (typeof v === 'object' || typeof v === 'function')) {
    if (!me.get(v)) {
      me.createHashKeysFor(v);
    }
    uid = v[me.hiddenKey];
  }
  return typeof v + '-' + uid;
};
me.hiddenKey = '__pojoVizKey__';

me.get = function (v) {
  if (v.hasOwnProperty) {
    return v.hasOwnProperty(me.hiddenKey) &&
      v[me.hiddenKey];
  }
  return v[me.hiddenKey];
};

me.createHashKeysFor = function (obj) {

  function localToString(obj) {
    var match;
    try {
      match = obj.toString().match(/^\[object (\S*?)\]/);
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

    if (obj.hasOwnProperty &&
        obj.hasOwnProperty(me.hiddenKey)) {
      return obj[me.hiddenKey];
    }

    name = obj.hasOwnProperty &&
      obj.hasOwnProperty('name') &&
      typeof obj.name === 'string' &&
      obj.name;

    className = hasAClassName(obj);
    if (!name && className) {
      name = className;
    }

    name = name || _.uniqueId();
    name = name.replace(/[\. ]/g, '-');
    return name;
  }

  // if the obj is a prototype then try to analyze
  // the constructor first so that the prototype becomes
  // [name].prototype
  if (obj.hasOwnProperty &&
      obj.hasOwnProperty('constructor') &&
      typeof obj.constructor === 'function') {
    me.createHashKeysFor(obj.constructor);
  } else {
    me.set(obj, getName(obj));
    if (obj.hasOwnProperty &&
        obj.hasOwnProperty('prototype')) {
      me.set(obj.prototype, getName(obj) + '-prototype');
    }
  }
};

me.set = function (obj, key) {
  if (typeof key !== 'string') {
    throw 'The key needs to be a string';
  }
  if (!me.get(obj)) {
    Object.defineProperty(obj, me.hiddenKey, {
      value: key
    });
  }
  return me;
};

module.exports = me;