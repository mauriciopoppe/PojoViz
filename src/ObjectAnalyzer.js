var HashMap = require('./util/HashMap'),
  hashKey = require('./util/hashKey'),
  _ = require('lodash');

// utils
function eachObjectAndPrototype(obj, fn) {
  fn(obj);
  if (obj.hasOwnProperty('prototype')) {
    fn(obj.prototype);
  }
}

/**
 * Wraps a function with another
 * @param  {Function} fn
 * @param  {Function}   wrapper
 * @return {*}
 */
function wrapFn(fn, wrapper) {
  return function () {
    // NOTE: `this` will be the instance
    wrapper.call(this);
    var args = [].slice.call(arguments);
    return fn.apply(this, args);
  };
}

/**
 * Properties forbidden in strict mode
 * @type {Array}
 */
var forbiddenInStrictMode = [
  'callee', 'caller', 'arguments'
];

/**
 * @constructor
 * Object analyz
 * @param {[type]} config [description]
 */
function Analyzer(config) {
  if (!(this instanceof Analyzer)) {
    return new Analyzer(config);
  }
  config = config || {};

  /**
   * Objects registered in this instance
   * @type {HashMap}
   */
  this.objectMap = config.objectMap || new HashMap();
  /**
   * Forbidden objects
   * @type {HashMap}
   */
  this.forbidden = config.forbidden || new HashMap();
  /**
   * Dfs levels
   * @type {number}
   */
  this.levels = Infinity;
  /**
   * If the analyzer is dirty then it has some pending work
   * to do
   * @type {boolean}
   */
  this.dirty = true;
  /**
   * True to include function constructors in the analysis graph
   * i.e. the functions that have a prototype
   * @type {boolean}
   */
  this.functionConstructors =
    config.hasOwnProperty('functionConstructors') ?
    config.functionConstructors : false;
  /**
   * True to include all the functions in the analysis graph
   * @type {boolean}
   */
  this.allFunctions =
    config.hasOwnProperty('allFunctions') ?
    config.allFunctions : false;
  /**
   * True to allow HTML nodes
   * @type {boolean}
   */
  this.htmlNode =
    config.hasOwnProperty('htmlNode') ?
    config.htmlNode : false;
}

Analyzer.prototype = {
  constructor: Analyzer,

  /**
   * Checks if an object is in the forbidden hash
   * @param  {Object}  obj
   * @return {boolean}
   */
  isForbidden: function (obj) {
    return this.forbidden.get(obj);
  },

  isLinkable: function (key, obj) {
    if (!obj) {
      return false;
    }

    var v = typeof obj === 'object';

    // if (v) {
    //   if (!this.htmlNode && v instanceof Node) { return false; }
    //   return true;
    // }

    // if (!this.htmlNode) {
    //   v = v && !(v instanceof Node);
    // }fdeq1`

    // typeof obj === 'function' &&
    //   console.log(Object.getOwnPropertyNames(obj));
    if (!v && this.allFunctions) {
      // minimize the nodes created by considering functions
      // with more properties than the usual ones
      v = typeof obj === 'function';
      v = v && Object.getOwnPropertyNames(obj).length > 5;
    }
    if (!v && this.functionConstructors) {
      v = typeof obj === 'function';
      v = v && (
        obj.name &&
        obj.name[0].match(/^[A-Z]/) ||
        key[0].match(/^[A-Z]/)
      );
    }
    return v;
  },

  /**
   * Gets the enumerable properties an object discarding
   * forbidden ones
   *
   * @param  {Object} obj
   * @param  {boolean} objectsOnly True consider objects only
   * @return {Array} Array of objects, each object has the following
   * properties:
   *
   * - name
   * - cls
   * - type
   * - linkeable (if it's an object this property is set to true)
   */
  getProperties: function (obj, objectsOnly) {
    var me = this,
      properties = Object.getOwnPropertyNames(obj);

    function forbiddenKey(v) {
      // forbidden in strict mode
      return ~forbiddenInStrictMode.indexOf(v) ||
        v.match(/^__.*?__$/) ||
        v.match(/^\$\$.*?\$\$$/) ||
        v.match(/[:+~!><=//\[\]@ ]/);   // jquery strange property
    }

    properties = _.filter(properties, function (v) {
      var good = typeof v === 'string' && !forbiddenKey(v),
          r;
      if (objectsOnly) {
        try {
          r = good && me.isLinkable(v, obj[v]);
        } catch (e) {
          r = false;
          // uncomment to see why obj[v] is not allowed
          // console.log(e);
        } finally {
          return r;
        }
      }
      return good;
    }).map(function (v) {
      var type;
      try {
        // type = null|string|undefined|number|object
        type = obj[v] ? typeof obj[v] : '' + obj[v];
      } catch(e) {
        type = 'undefined';
      }
      // if (v === 'constructor') {
      //   type = 'object';
      // }
      return {
        name: v,
        cls: hashKey(obj),
        type: type,
        linkeable: true
      };
    });

    // special properties
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      properties.push({
        name: '[[Prototype]]',
        cls: hashKey(obj),
        type: 'object',
        linkeable: true
      });
    }
    var constructor = obj.hasOwnProperty &&
      obj.hasOwnProperty('constructor') &&
      typeof obj.constructor === 'function';
    if (constructor &&
        _.findIndex(properties, { name: 'constructor' }) === -1) {
      properties.push({
        cls: hashKey(obj),
        name: 'constructor',
        type: 'function',
        linkeable: true
      });
    }

    // console.log(properties);
    return properties;
  },

  /**
   * Analyzes a list of objects recursively
   * @param  {Array} objects      Array of objects
   * @param  {number} currentLevel Current dfs level
   */
  analyzeObjects: function (objects, currentLevel) {
    var me = this;
    objects.forEach(function (v) {
      if (currentLevel <= me.levels &&    // dfs level
          !me.objectMap.get(v) &&         // already registered
          !me.isForbidden(v)              // forbidden check
          ) {

        // if (v.hasOwnProperty('__processed__')) {
        //   debugger;
        //   throw 'wtf';
        // }
        // Object.defineProperty(v, '__processed__', {
        //   value: 'processsed'
        // });

        // add to the registered object pool
        me.objectMap.put(v);

        // dfs to the next level
        me.analyzeObjects(
          me.getOwnLinks(v).map(function (link) {
            return link.to;
          }),
          currentLevel + 1
        );
      }
    });
  },

  /**
   * Returns a list of links, each link is an object which has the
   * following properties:
   *
   * - from
   * - fromHash
   * - toHash
   * - toHash
   * - property (string)
   *
   * @param  {Object} obj
   * @return {Array}
   */
  getOwnLinks: function (obj) {
    // TODO: memoization
    var me = this,
        links = [],
        properties = me.getProperties(obj, true),
        name = hashKey(obj);

    // var names = properties.map(function (v) {
    //   return v.name;
    // });
    // console.log(hashKey(obj), names);

    function getAugmentedHash(obj, name) {
      if (!hashKey.has(obj) &&
          name !== 'prototype' &&
          name !== 'constructor') {
        hashKey.createHashKeysFor(obj, name);
      }
      return hashKey(obj);
    }

    if (!name) {
      throw 'the object needs to have a hashkey';
    }

    _.forEach(properties, function (v) {
      var ref = obj[v.name];
      if (!ref) { return; }
      getAugmentedHash(ref, v.name);

      if (!me.isForbidden(ref)) {
        links.push({
          from: obj,
          fromHash: hashKey(obj),
          to: ref,
          toHash: hashKey(ref),
          property: v.name
        });
      }
    });

    var proto = Object.getPrototypeOf(obj);
    if (proto && !me.isForbidden(proto)) {
      links.push({
        from: obj,
        fromHash: hashKey(obj),
        to: proto,
        toHash: hashKey(proto),
        property: '[[Prototype]]'
      });
    }

    // console.log(links);
    return links;
  },

  makeDirty: function () {
    this.dirty = true;
  },

  setLevels: function (l) {
    this.levels = l;
  },

  setDirty: function (d) {
    this.dirty = d;
  },

  setFunctionConstructors: function (v) {
    this.functionConstructors = v;
  },

  getObjects: function () {
    return this.objectMap;
  },

  /**
   * For each object registered in this objectMap returns
   * an array of the objects it's connected to:
   *
   * {
   *   'object1': [ [object Object], [object Object], ... ],
   *   'object2': [ [object Object], [object Object], ... ]
   * }
   *
   * @return {Object}
   */
  getLinks: function () {
    var me = this,
        links = {};
    _.forOwn(this.objectMap, function (v, k) {
      links[k] = me.getOwnLinks(v).map(function (link) {
        return hashKey(link.to);
      });
    });
    return links;
  },

  /**
   * Alias for getOwnLinks
   * @param  {Object} obj
   * @return {Array}
   */
  getLinkDetails: function (obj) {
    if (!obj) {
      throw 'The object must be defined';
    }
    return this.getOwnLinks(obj);
  }
};

// aditional objects that need the prototype to exist
var aProto = Analyzer.prototype;
_.merge(aProto, {

  /**
   * Adds a list of objects to analyze and make the analyzer dirty
   * @param  {Array<Objects>} objects
   * @return {this}
   */
  add: wrapFn(function (objects) {
    this.analyzeObjects(objects, 0);
    return this;
  }, aProto.makeDirty),

  /**
   * Removes a list of objects, if `withPrototype` is true then
   * also the prototype is removed
   * @param  {Array<Objects>} objects
   * @param  {boolean} withPrototype
   * @return {this}
   */
  remove: wrapFn(function (objects, withPrototype) {
    var me = this;
    objects.forEach(function (obj) {
      me.objectMap.remove(obj);
      if (withPrototype && obj.hasOwnProperty('prototype')) {
        me.objectMap.remove(obj.prototype);
      }
    });
    return me;
  }, aProto.makeDirty),

  /**
   * Forbids a list of objects, if `withPrototype` is true then
   * also the prototype is forbidden
   * @param  {Array<Objects>} objects
   * @param  {boolean} withPrototype
   * @return {this}
   */
  forbid: wrapFn(function (objects, withPrototype) {
    var me = this;
    me.remove(objects, withPrototype);
    objects.forEach(function (obj) {
      me.forbidden.put(obj);
      if (withPrototype && obj.hasOwnProperty('prototype')) {
        me.forbidden.put(obj.prototype);
      }
    });
  }, aProto.makeDirty),

  /**
   * Unforbids a list of objects, if `withPrototype` is true then
   * also the prototype is unforbidden
   * @param  {Array<Objects>} objects
   * @param  {boolean} withPrototype
   * @return {this}
   */
  unforbid: wrapFn(function (objects, withPrototype) {
    var me = this;
    objects.forEach(function (obj) {
      me.forbidden.remove(obj);
      if (withPrototype && obj.hasOwnProperty('prototype')) {
        me.forbidden.remove(obj.prototype);
      }
    });
  }, aProto.makeDirty)
});

module.exports = Analyzer;
