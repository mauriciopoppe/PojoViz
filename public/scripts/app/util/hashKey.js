define(['lib/lodash'], function (_) {
  var hashKey = function (v) {
    var value = v,
        uid = v;
    if (v && (typeof v === 'object' || typeof v === 'function')) {
      if (!me.get(v)) {
        me.createHashKeysFor(v);
      }
      uid = v[me.hiddenKey];
    }
    return typeof v + '-' + uid;
  }, me = hashKey;
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
        obj.hasOwnProperty('constructor')) {
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

  window.hashKey = hashKey;
  return me;
});