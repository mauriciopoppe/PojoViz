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

function isObjectOrFunction(v) {
  return !!(v && (typeof v === 'object' ||
    typeof v === 'function'));
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
  this.objects = config.objects || new HashMap();
  /**
   * Forbidden objects
   * @type {HashMap}
   */
  this.forbidden = config.forbidden || new HashMap();

  /**
   * Cache of properties
   * @type {Object}
   */
  this.__cacheObjects = {};

  /**
   * Cache of links
   * @type {Object}
   */
  this.__cacheLinks = {};

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
   * True to save the properties of the objects analyzed in an
   * internal cache
   * @type {Boolean}
   */
  this.cache =
    config.hasOwnProperty('cache') ?
    config.cache : true;
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
   * @return {Array} Array of objects, each object has the following
   * properties:
   *
   * - name
   * - cls
   * - type
   * - linkeable (if it's an object this property is set to true)
   */
  getProperties: function (obj, linkableOnly) {
    var me = this,
      hk = hashKey(obj),
      properties;

    if (!obj) {
      throw 'this method needs an object to analyze';
    }

    if (this.cache) {
      if (!linkableOnly && this.__cacheObjects[hk]) {
        // console.log('objects from cache :)');
        return this.__cacheObjects[hk];
      }
    }

    properties = Object.getOwnPropertyNames(obj);

    function forbiddenKey(v) {
      // forbidden in strict mode
      return ~forbiddenInStrictMode.indexOf(v) ||
        v.match(/^__.*?__$/) ||
        v.match(/^\$\$.*?\$\$$/) ||
        v.match(/[:+~!><=//\[\]@\. ]/);
    }

    properties = _.filter(properties, function (v) {
      var good = typeof v === 'string' && !forbiddenKey(v),
          r;
      if (linkableOnly) {
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
      var type,
        linkeable;
      try {
        // type = null|string|undefined|number|object
        type = typeof obj[v];
        linkeable = isObjectOrFunction(obj[v]);
      } catch(e) {
        type = 'undefined';
        linkeable = false;
      }

      return {
        // parent: hashKey(obj),
        name: v,
        type: type,
        linkeable: linkeable
      };
    });

    // special properties
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      properties.push({
        name: '[[Prototype]]',
        // cls: hashKey(obj),
        type: 'object',
        linkeable: true,
        hidden: true
      });
    }
    var constructor = obj.hasOwnProperty &&
      obj.hasOwnProperty('constructor') &&
      typeof obj.constructor === 'function';
    if (constructor &&
        _.findIndex(properties, { name: 'constructor' }) === -1) {
      properties.push({
        // cls: hashKey(obj),
        name: 'constructor',
        type: 'function',
        linkeable: true
      });
    }

    if (this.cache && !linkableOnly) {
      this.__cacheObjects[hk] = properties;
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
          !me.objects.get(v) &&         // already registered
          !me.isForbidden(v)              // forbidden check
          ) {

        // add to the registered object pool
        me.objects.put(v);

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
   * - to
   * - property (string)
   *
   * @param  {Object} obj
   * @return {Array}
   */
  getOwnLinks: function (obj) {
    var me = this,
        links = [],
        properties,
        name = hashKey(obj);

    if (this.__cacheLinks[name]) {
      // console.log('links from cache :)');
      return this.__cacheLinks[name];
    }

    properties = me.getProperties(obj, true);

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
      // because of the levels a reference might not exist
      if (!ref) {
        return;
      }

      // if the object doesn't have a hashkey
      // let's give it a name equal to the property
      // being analyzed
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

    if (this.cache) {
      this.__cacheLinks[name] = links;
    }

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
    return this.objects;
  },

  /**
   * Stringifies an object properties
   * @param  obj
   * @param  toString
   * @return {Array}
   */
  stringifyObjectProperties: function (obj) {
    return this.getProperties(obj);
  },

  /**
   * Returns a representation of the links of
   * an object
   * @return {Array}
   */
  stringifyObjectLinks: function (obj) {
    var me = this;
    return me.getOwnLinks(obj).map(function (link) {
      // discarded: from, to
      return {
        from: link.fromHash,
        to: link.toHash,
        property: link.property
      };
    });
  },

  /**
   * Stringifies the objects saved in this analyzer
   * @return {Object}
   */
  stringify: function () {
    var me = this,
      nodes = {},
      edges = {};
    console.time('stringify');
    _(this.objects).forOwn(function (v) {
      nodes[hashKey(v)] = me.stringifyObjectProperties(v);
      edges[hashKey(v)] = me.stringifyObjectLinks(v);
    });
    console.timeEnd('stringify');
    return {
      nodes: nodes,
      edges: edges
    };
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
    console.time('analyze');
    this.analyzeObjects(objects, 0);
    console.timeEnd('analyze');
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
      me.objects.remove(obj);
      if (withPrototype && obj.hasOwnProperty('prototype')) {
        me.objects.remove(obj.prototype);
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
