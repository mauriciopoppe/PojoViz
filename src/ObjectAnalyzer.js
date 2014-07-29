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
function getProperties(obj, objectsOnly) {
  var properties = Object.getOwnPropertyNames(obj);

  function forbiddenKey(v) {
    return v.match(/^__.*?__$/) ||
      v.match(/^\$\$.*?\$\$$/);
  }

  properties = _.filter(properties, function (v) {
    var good = typeof v === 'string' && !forbiddenKey(v),
        r;
    if (objectsOnly) {
      try {
        r = good && typeof obj[v] === 'object';
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
    if (v === 'constructor') {
      type = 'object';
    }
    return {
      name: v,
      cls: hashKey(obj),
      type: type,
      linkeable: type === 'object'
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
  var constructor = obj.hasOwnProperty('constructor') &&
    obj.constructor;
  if (constructor &&
      _.findIndex(properties, { name: 'constructor' }) === -1) {
    properties.push({
      cls: hashKey(obj),
      name: 'constructor',
      type: 'object',
      linkeable: true
    });
  }

  // console.log(properties);
  return properties;
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
   * @type {Number}
   */
  this.levels = Infinity;
  /**
   * The analyzer needs this flag to work
   * @type {Boolean}
   */
  this.dirty = true;
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
        properties = getProperties(obj, true),
        name = hashKey.get(obj);

    if (!name) {
      throw 'the object needs to have a hashkey';
    }

    _.forEach(properties, function (v) {
      var ref = obj[v.name];
      if (ref !== null &&
          ref !== undefined &&
          !me.isForbidden(ref)) {

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
  },

  // template
  preRender: function () {},
  getProperties: getProperties,
  showSearch: function (name, property) {
    window.open('https://duckduckgo.com/?q=' +
      name + ' ' + property);
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
