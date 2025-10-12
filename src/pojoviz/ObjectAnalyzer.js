import _ from "lodash";

import HashMap from "./util/HashMap";
import hashKey from "./util/hashKey";
import labeler from "./util/labeler";
import utils from "./util";

/**
 * Given an object `obj`, this function executes `fn` only if `obj` is
 * an object or a function, if it's a function then `obj.prototype` is analyzed
 * if it exists then it will execute `fn` again
 *
 * Note that the only argument which fn is executed with is obj for the first
 * call and obj.prototype for the second call if it's possible
 *
 * @param {Object} obj
 * @param {Function} fn Function to be invoked with obj/obj.prototype according
 * to the rules cited above
 */
function withFunctionAndPrototype(obj, fn) {
  if (utils.isObjectOrFunction(obj)) {
    fn(obj);
    if (utils.isFunction(obj) && utils.isObjectOrFunction(obj.prototype)) {
      fn(obj.prototype);
    }
  }
}

/**
 * @constructor
 *
 * Class Analyzer, saves objects in an internal HashMap after doing
 * a dfs traversal of a source object through its `add` method.
 *
 * Whenever a graph needs to be analyzed an instance of Analyzer is created and
 * a dfs routine is run starting (presumably) in the root node:
 *
 * e.g.
 *
 *      var analyzer = new Analyzer();
 *      analyzer.add([Object]);
 *
 * The internal hashMap will save the following traversable values:
 *
 * - Object
 * - Object.prototype (Reachable from Object)
 * - Function (Reachable from Function.prototype)
 * - Function.prototype (Reachable from Object through the __proto__ link)
 *
 * There are some troublesome structures do which include huge objects like
 * window or document, to avoid analyzing this kind of objects the analyzer can
 * be instructed to forbid the addition of some objects:
 *
 * e.g.
 *
 *      var analyzer = new Analyzer();
 *      analyzer.forbid([Function])
 *      analyzer.add([
 *        Object
 *      ]);
 *
 * - Object
 * - Object.prototype (Reachable from Object)
 * - Function.prototype (Reachable from Object through the __proto__ link)
 *
 * @param {Object} config
 * @param {Object} [config.cache = true]
 * @param {Object} [config.levels = Analyzer.DFS_LEVELS]
 * @param {Object} [config.visitConstructors = Analyzer.VISIT_CONSTRUCTORS]
 * @param {Object} [config.visitSimpleFunctions = Analyzer.VISIT_SIMPLE_FUNCTIONS]
 */
class Analyzer {
  constructor(config) {
    config = _.merge(_.clone(Analyzer.DEFAULT_CONFIG, true), config);

    /**
     * items registered in this instance
     * @type {HashMap}
     */
    this.__items__ = new HashMap();

    /**
     * Forbidden objects
     * @type {HashMap}
     */
    this.__forbidden__ = new HashMap();

    /**
     * Print debug info in the console
     * @type {boolean}
     */
    this.debug = config.debug;

    /**
     * True to save the properties of the objects analyzed in an
     * internal cache
     * @type {Boolean}
     * @cfg {boolean} [cache=true]
     */
    this.cache = config.cache;

    /**
     * Dfs levels
     * @type {number}
     */
    this.levels = config.levels;

    /**
     * True to include function constructors in the analysis graph
     * i.e. the functions that have a prototype
     * @type {boolean}
     * @cfg {boolean} [visitConstructors=false]
     */
    this.visitConstructors = config.visitConstructors;

    /**
     * True to include all the functions in the analysis graph,
     * see #traversableObjectProperties
     * @type {boolean}
     * @cfg {boolean} [visitSimpleFunctions=false]
     */
    this.visitSimpleFunctions = config.visitSimpleFunctions;

    /**
     * True to include all the functions in the analysis graph,
     * see #traversableObjectProperties
     * @type {boolean}
     * @cfg {boolean} [visitSimpleFunctions=false]
     */
    this.visitArrays = config.visitArrays;

    /**
     * @private
     * Internal property cache, each value is an array of objects
     * generated in #getProperties
     * @type {Object}
     */
    this.__objectsCache__ = {};

    /**
     * @private
     * Internal links cache, each value is an array of objects
     * generated in #getOwnLinks
     * @type {Object}
     */
    this.__linksCache__ = {};
  }

  set(options) {
    const me = this;
    _.forOwn(options, function (v, k) {
      if (me.hasOwnProperty(k) && k.indexOf("__") === -1) {
        me[k] = v;
      }
    });
  }

  /**
   * Checks if an object is in the forbidden hash
   * @param  {Object}  obj
   * @return {boolean}
   */
  isForbidden(obj) {
    return this.__forbidden__.get(obj);
  }

  /**
   * Let `value` be the result of executing obj[property], this method
   * returns an object with a summary of the properties of `value` which are
   * useful to know for the analyzer:
   *
   * - parent         {string} the hashKey of the parent
   * - property       {string} the name of the property used to reach value,
   *                      i.e. parent[property] = value
   * - value          {*} the value itself
   * - type           {string} the result of calling `typeof value`
   * - isTraversable  {boolean} true if `value` is traversable
   * - isFunction     {boolean} true if `value` is a function
   * - isObject       {boolean} true if `value` is an object
   * - toString       {string} the result of calling {}.toString with `value`
   *
   * @param {Object|Function} value
   * @param {Object|Function} parent
   * @param {string} property
   * @returns {Object}
   */
  buildNodeProperties(value, parent, property) {
    return {
      parent: hashKey(parent),
      property: property,
      //value: value,
      type: typeof value,
      isTraversable: utils.isTraversable(value),
      isFunction: utils.isFunction(value),
      isObject: utils.isObject(value),
      toString: utils.internalClassProperty(value),
    };
  }

  /**
   * Determines the properties that obj[property] has which are
   * useful for other methods like #getProperties, the properties are
   * returned in a simple object and are the ones declared in
   * #getNodeProperties
   *
   * The following properties might be set depending on what `value` is:
   *
   * - unreachable        {boolean} true if there was an error executing `value`
   * - isSimpleFunction   {boolean} true if `value` is a simple function
   * - isConstructor      {boolean} true if `value` is a constructor
   *
   * @param obj
   * @param property
   * @returns {Object}
   */
  traversableObjectProperties(obj, property) {
    const me = this;
    let value;
    try {
      value = obj[property];
    } catch (e) {
      return {
        parent: hashKey(obj),
        property: property,
        unreachable: true,
        isTraversable: false,
      };
    }
    // self, parent, property
    const properties = me.buildNodeProperties(value, obj, property);

    // if the current property is a function and it's not allowed to
    // visit simple functions mark the property as not traversable
    if (properties.isFunction && !this.visitSimpleFunctions) {
      const ownProperties = Object.getOwnPropertyNames(value);
      let length = ownProperties.length;
      // the minimum number of properties a normal function has is 5
      // - ["length", "name", "arguments", "caller", "prototype"]

      // an additional property retrieved is the hidden key that
      // the hash function may have already set
      if (ownProperties.indexOf(hashKey.hiddenKey) > -1) {
        --length;
      }
      // discard the prototype link to consider a property simple
      if (ownProperties.indexOf("prototype") > -1) {
        --length;
      }
      if (length <= 4) {
        // it's simple if it only has
        // - ["length", "name", "arguments", "caller"]
        properties.isTraversable = false;
        properties.isSimpleFunction = true;
      }
    }

    // if the current property is a function and it's allowed to
    // visit function constructors verify if `value` is a
    // function constructor (it's name must be capitalized to be one)
    if (properties.isFunction && this.visitConstructors) {
      if (utils.isConstructor(value)) {
        properties.isTraversable = true;
        properties.isConstructor = true;
      }
    }

    // verification of the flag visitArrays when it's set to false
    if (properties.toString === "Array" && !this.visitArrays) {
      properties.isTraversable = false;
    }

    return properties;
  }

  /**
   * Retrieves all the properties of the object `obj`, each property is returned
   * as an object with the properties set in #traversableObjectProperties,
   * additionally this function sets the following properties:
   *
   * - hidden       {boolean} (true if it's a hidden property like [[Prototype]])
   *
   * @param  {Object} obj
   * @param  {boolean} [traversableOnly] True to return only the traversable properties
   * @return {Array} Array of objects with the properties described above
   */
  getProperties(obj, traversableOnly) {
    const me = this;
    const hk = hashKey(obj);
    let allProperties;
    let nodeProperties;

    if (!obj) {
      throw "this method needs an object to analyze";
    }

    if (this.cache) {
      if (!traversableOnly && this.__objectsCache__[hk]) {
        return this.__objectsCache__[hk];
      }
    }

    // Object.getOwnPropertyNames returns an array of strings
    // with the properties (enumerable or not)
    allProperties = Object.getOwnPropertyNames(obj);

    allProperties = allProperties
      .filter(function (property) {
        // filter out forbidden properties
        return !utils.objectPropertyIsForbidden(obj, property);
      })
      .map(function (property) {
        // obtain detailed info of all the valid properties
        return me.traversableObjectProperties(obj, property);
      })
      .filter(function (propertyDescription) {
        if (traversableOnly) {
          // filter out non traversable properties
          return propertyDescription.isTraversable;
        }
        return true;
      });

    // <labeler>
    // set a name on itself if it's a constructor
    labeler(obj);
    // set a name on each traversable property
    allProperties
      .filter(function (propertyDescription) {
        return propertyDescription.isTraversable;
      })
      .forEach(function (propertyDescription) {
        labeler(obj, propertyDescription.property);
      });

    // special properties
    // __proto__
    const proto = Object.getPrototypeOf(obj);
    if (proto) {
      nodeProperties = me.buildNodeProperties(proto, obj, "[[Prototype]]");
      nodeProperties.hidden = true;
      allProperties.push(nodeProperties);
    }

    if (this.cache && !traversableOnly) {
      this.__objectsCache__[hk] = allProperties;
    }

    return allProperties;
  }

  /**
   * Main DFS routine, it analyzes each traversable object until
   * the recursion level has been reached or there are no objects
   * to be analyzed
   *
   * - for each object in `objects`
   *  - if it wasn't analyzed yet
   *  - if it's not forbidden
   *   - add the item to the items HashMap
   *   - find all the traversable properties
   *   - call `analyze` object with each traversable object
   *     that can be reached from the current object
   *
   * @param  {Array} objects      Array of objects to be analyzed
   * @param  {number} currentLevel Current dfs level
   */
  analyzeObjects(objects, currentLevel) {
    const me = this;
    if (currentLevel <= me.levels) {
      objects.forEach(function (v) {
        if (
          !me.__items__.get(v) && // registered check
          !me.isForbidden(v) // forbidden check
        ) {
          // add the item to the registered items pool
          me.__items__.put(v);

          // dfs to the next level
          me.analyzeObjects(
            // get all the links outgoing from `v`
            me
              .getOwnLinks(v)
              // to analyze the tree only the `to` property is needed
              .map(function (link) {
                return link.to;
              }),
            currentLevel + 1,
          );
        }
      });
    }
  }

  /**
   * Given an traversable object `obj`, this method returns an array of direct traversable
   * object which can be reached from `obj`, each object has the following properties:
   *
   * - from     {object} (`this`)
   * - fromHash {string} (from's hash)
   * - to       {object} (a reachable traversable object from `this`)
   * - toHash   {string} (to's hash)
   * - property {string} (the name of the property which links `from` with `to`, i.e.
   *                      this[property] = to)
   *
   * @param  {Object} obj
   * @return {Array}
   */
  getOwnLinks(obj) {
    const me = this;
    const links = [];
    let properties;
    const name = hashKey(obj);

    // <debug>
    //console.log(name);
    // </debug>

    if (me.cache && me.__linksCache__[name]) {
      return me.__linksCache__[name];
    }

    // args:
    // - object whose properties will be analyzed
    // - traversable properties only
    properties = me.getProperties(obj, true);

    if (!name) {
      throw "the object needs to have a hashkey";
    }

    properties
      .filter(function (desc) {
        // desc.property might be [[Prototype]], since obj["[[Prototype]]"]
        // doesn't exist it's not valid a property to be accessed
        return desc.property !== "[[Prototype]]";
      })
      .forEach(function (desc) {
        const ref = obj[desc.property];
        if (!ref) {
          throw new Error("obj[property] should exist");
        }
        if (!me.isForbidden(ref)) {
          links.push({
            from: obj,
            fromHash: hashKey(obj),
            to: ref,
            toHash: hashKey(ref),
            property: desc.property,
          });
        }
      });

    const proto = Object.getPrototypeOf(obj);
    if (proto && !me.isForbidden(proto)) {
      links.push({
        from: obj,
        fromHash: hashKey(obj),
        to: proto,
        toHash: hashKey(proto),
        property: "[[Prototype]]",
      });
    }

    if (this.cache) {
      this.__linksCache__[name] = links;
    }

    return links;
  }

  /**
   * Marks this analyzer as dirty
   */
  makeDirty() {
    this.dirty = true;
  }

  /**
   * Set the number of levels for the dfs routine
   * @param {number} l
   */
  setLevels(l) {
    this.levels = l;
  }

  /**
   * Gets the items stored in this Analyzer
   * @returns {HashMap}
   */
  getItems() {
    return this.__items__;
  }

  /**
   * Gets the items stored in this Analyzer
   * @returns {HashMap}
   */
  getForbidden() {
    return this.__forbidden__;
  }

  /**
   * @private
   * Returns the labels of the object `obj`, each label is stored in
   * the labeler util
   *
   * @param  obj
   * @return {Array}
   */
  stringifyObjectLabels(obj) {
    const labels = labeler(obj);
    if (!labels.size()) {
      throw new Error("object must have labels");
    }
    return labels.getValues();
  }

  /**
   * @private
   * This method stringifies the properties of the object `obj`, to avoid
   * getting the JSON.stringify cyclic error let's delete some properties
   * that are know to be objects/functions
   *
   * @param  obj
   * @return {Array}
   */
  stringifyObjectProperties(obj) {
    return this.getProperties(obj);
  }

  /**
   * @private
   * Returns a representation of the outgoing links of
   * an object
   * @return {Object}
   */
  stringifyObjectLinks(obj) {
    const me = this;
    return me.getOwnLinks(obj).map(function (link) {
      // discarded: from, to
      return {
        from: link.fromHash,
        to: link.toHash,
        property: link.property,
      };
    });
  }

  /**
   * Stringifies the objects saved in this analyzer
   * @return {Object}
   */
  stringify() {
    const me = this;
    const labels = {};
    const nodes = {};
    const edges = {};
    if (me.debug) {
      console.log(me);
    }
    me.debug && console.time("stringify");
    _.forOwn(me.__items__, function (v) {
      const hk = hashKey(v);
      labels[hk] = me.stringifyObjectLabels(v);
      nodes[hk] = me.stringifyObjectProperties(v);
      edges[hk] = me.stringifyObjectLinks(v);
    });
    if (me.debug) {
      console.log("nodes", nodes);
      console.log("edges", edges);
      console.log("labels", labels);
    }
    me.debug && console.timeEnd("stringify");
    return {
      labels: labels,
      edges: edges,
      nodes: nodes,
    };
  }

  /**
   * Alias for #analyzeObjects
   * @param {Array} objects
   * @chainable
   */
  add(objects) {
    //console.time('analyze');
    this.analyzeObjects(objects, 0);
    //console.timeEnd('analyze');
    return this;
  }

  /**
   * Removes some existing objects from the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to remove the prototype
   * if the current object being removed is a function
   * @chainable
   */
  remove(objects, withPrototype) {
    const me = this;

    function doRemove(obj) {
      me.__items__.remove(obj);
    }

    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doRemove);
      } else {
        doRemove(obj);
      }
    });
    return me;
  }

  /**
   * Forbids some objects to be added to the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  forbid(objects, withPrototype) {
    const me = this;
    me.remove(objects, withPrototype);

    function doForbid(obj) {
      me.__forbidden__.put(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doForbid);
      } else {
        doForbid(obj);
      }
    });
  }

  /**
   * Allows some objects to be added to the items HashMap, call this to
   * remove some existing objects from the forbidden HashMap (so that when
   * the tree is analyzed again)
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  allow(objects, withPrototype) {
    const me = this;

    function doAllow(obj) {
      me.__forbidden__.remove(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doAllow);
      } else {
        doAllow(obj);
      }
    });
  }

  /**
   * Empties all the info stored in this analyzer
   */
  reset() {
    this.__linksCache__ = {};
    this.__objectsCache__ = {};
    this.__forbidden__.empty();
    this.__items__.empty();
  }
}

/**
 * True to add an additional flag to the traversable properties of a node
 * if the node is a constructor
 * @type {boolean}
 */
Analyzer.VISIT_CONSTRUCTORS = true;

/**
 * True to visit simple functions which don't have additional links, see
 * #traversableObjectProperties
 * @type {boolean}
 */
Analyzer.VISIT_SIMPLE_FUNCTIONS = false;

/**
 * True to visit arrays
 * @type {boolean}
 */
Analyzer.VISIT_ARRAYS = true;

/**
 * Default number of levels to be analyzed by this constructor
 * @type {number}
 */
Analyzer.DFS_LEVELS = 15;

/**
 * Default config used whenever an instance of Analyzer is created
 * @type {Object}
 */
Analyzer.DEFAULT_CONFIG = {
  cache: true,
  debug: false,
  visitConstructors: Analyzer.VISIT_CONSTRUCTORS,
  visitSimpleFunctions: Analyzer.VISIT_SIMPLE_FUNCTIONS,
  visitArrays: Analyzer.VISIT_ARRAYS,
  levels: Analyzer.DFS_LEVELS,
};

const proto = Analyzer.prototype;
function chain(method) {
  const originalMethod = proto[method];
  proto[method] = function (...args) {
    proto.makeDirty.call(this);
    return originalMethod.apply(this, args);
  };
}

// call #makeDirty before all these methods are called
chain("add");
chain("remove");
chain("forbid");
chain("allow");

export default Analyzer;
