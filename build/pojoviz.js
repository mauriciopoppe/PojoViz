!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.pojoviz=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"dagre":[function(_dereq_,module,exports){
module.exports=_dereq_('JWa/F1');
},{}],"lodash":[function(_dereq_,module,exports){
module.exports=_dereq_('K2RcUv');
},{}],"q":[function(_dereq_,module,exports){
module.exports=_dereq_('qLuPo1');
},{}],4:[function(_dereq_,module,exports){
var HashMap = _dereq_('./util/HashMap'),
  hashKey = _dereq_('./util/hashKey'),
  _ = _dereq_('lodash');

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
  this.items = config.items || new HashMap();
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
          !me.items.get(v) &&         // already registered
          !me.isForbidden(v)              // forbidden check
          ) {

        // add to the registered object pool
        me.items.put(v);

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

  getItems: function () {
    return this.items;
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
    _(this.items).forOwn(function (v) {
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
      me.items.remove(obj);
      if (withPrototype && obj.hasOwnProperty('prototype')) {
        me.items.remove(obj.prototype);
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

},{"./util/HashMap":12,"./util/hashKey":13,"lodash":"K2RcUv"}],5:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash'),
  Generic = _dereq_('./analyzer/Inspector'),
  Angular = _dereq_('./analyzer/Angular'),
  Window = _dereq_('./analyzer/Window'),
  PObject = _dereq_('./analyzer/Object'),
  BuiltIn = _dereq_('./analyzer/BuiltIn');

var libraries;

var proto = {
  create: function (global, options) {
    console.log('creating a generic container for: ' + global, options);
    return (libraries[global] = new Generic(options));
  },
  all: function (fn) {
    _.forOwn(libraries, fn);
  },
  markDirty: function () {
    proto.all(function (v) {
      v.markDirty();
    });
    return proto;
  },
  setFunctionConstructors: function (newValue) {
    proto.all(function (v) {
      // this only works on the generic analyzers
      if (!v._hasfc) {
        v.analyzer.setFunctionConstructors(newValue);
      }
    });
    return proto;
  }
};

libraries = Object.create(proto);
_.merge(libraries, {
  object: new PObject(),
  builtIn: new BuiltIn(),
  window: new Window(),
  // popular
  angular: new Angular(),
  // mine
  // t3: new Generic({ global: 't3' }),
  // huge
  three: new Generic({
    global: 'THREE',
    rendereachtime: true
  })
});

// console.log(libraries);
module.exports = libraries;
},{"./analyzer/Angular":6,"./analyzer/BuiltIn":7,"./analyzer/GenericAnalyzer":8,"./analyzer/Object":9,"./analyzer/Window":10,"lodash":"K2RcUv"}],6:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./Inspector'),
  hashKey = _dereq_('../util/hashKey');

function Angular() {
  GenericAnalyzer.call(this, {
    global: 'angular',
    displayname: 'AngularJS',
    rendereachtime: true
  });

  this.services = [
    '$animate',
    '$cacheFactory',
    '$compile',
    '$controller',
    // '$document',
    '$exceptionHandler',
    '$filter',
    '$http',
    '$httpBackend',
    '$interpolate',
    '$interval',
    '$locale',
    '$log',
    '$parse',
    '$q',
    '$rootScope',
    '$sce',
    '$sceDelegate',
    '$templateCache',
    '$timeout',
    // '$window'
  ].map(function (v) {
    return { checked: true, name: v };
  });
}

Angular.prototype = Object.create(GenericAnalyzer.prototype);

Angular.prototype.getSelectedServices = function () {
  var me = this,
    toAnalyze = [];

  window.angular.module('app', ['ng']);
  this.injector = window.angular.injector(['app']);

  me.services.forEach(function (s) {
    if (s.checked) {
      var obj = me.injector.get(s.name);
      hashKey.createHashKeysFor(obj, s.name);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
};

Angular.prototype.inspectSelf = function () {
  console.log('inspecting angular');
  hashKey.createHashKeysFor(window.angular, 'angular');
  this.analyzer.getItems().empty();
  this.analyzer.add(
    [window.angular].concat(this.getSelectedServices())
  );
};

module.exports = Angular;
},{"../util/hashKey":13,"./GenericAnalyzer":8}],7:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./Inspector'),
  utils = _dereq_('../util');

var toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

function BuiltIn() {
  GenericAnalyzer.call(this);
}

BuiltIn.prototype = Object.create(GenericAnalyzer.prototype);

BuiltIn.prototype.inspectSelf = function () {
  console.log('inspecting builtIn objects');
  this.analyzer.add(this.getObjects());
};

BuiltIn.prototype.getItems = function () {
  return toInspect;
};

BuiltIn.prototype.showSearch = function (nodeName, nodeProperty) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(nodeName + ' ' + nodeProperty),
    });
  window.open(url);
};

module.exports = BuiltIn;
},{"../util":14,"./GenericAnalyzer":8}],8:[function(_dereq_,module,exports){
'use strict';

var Q = _dereq_('q'),
  _ = _dereq_('lodash'),
  utils = _dereq_('../util/'),
  hashKey = _dereq_('../util/hashKey'),
  analyzer = _dereq_('../ObjectAnalyzer');

var searchEngine = 'https://duckduckgo.com/?q=';

/**
 * TODO
 * [Inspector description]
 * @param {[type]} options [description]
 */
function GenericAnalyzer(options) {
  options = _.merge({
    levels: 10,
    forbidden: [],
    src: '',
    functionConstructors: GenericAnalyzer.SHOW_FUNCTION_CONSTRUCTORS,
    renderEachTime: false,
    allFunctions: false
  }, options);
  /**
   *
   * @type {[type]}
   */
  this.global = options.global;
  this.displayname = options.displayname;
  /**
   * # of unique objects to be analyzed during the `inspect` phase
   * @type {number} [levels=10]
   */
  this.levels = options.hasOwnProperty('levels') ? options.levels : 10;
  /**
   * Objects which are forbidden
   * @type {string}
   */
  this.forbidden = options.forbidden || [];
  this.src = options.src;
  this._hasfc = options.hasOwnProperty('functionconstructors');
  this.functionconstructors = this._hasfc ?
    options.functionconstructors : GenericAnalyzer.SHOW_FUNCTION_CONSTRUCTORS;
  this.rendereachtime = options.hasOwnProperty('rendereachtime') ?
    options.rendereachtime : false;
  this.allfunctions = options.hasOwnProperty('allfunctions') ?
    options.allfunctions : false;

  this.inspected = false;

  // parse forbid string to array
  this.parse();

  this.analyzer = analyzer({
    functionConstructors: this.functionconstructors,
    allFunctions: this.allfunctions
  });
}

GenericAnalyzer.SHOW_BUILTIN = false;
GenericAnalyzer.SHOW_FUNCTION_CONSTRUCTORS = true;
GenericAnalyzer.FORBIDDEN = 'pojoviz:window,pojoviz:builtIn,document';

GenericAnalyzer.prototype.init = function () {
  var me = this;
  console.log('%cPojoViz', 'font-size: 15px; color: ');
  return me.fetch()
    .then(function () {
      if (me.rendereachtime || !me.inspected) {
        me.inspect();
      }
      return me;
    });
};

GenericAnalyzer.prototype.parse = function () {
  if (typeof this.forbidden === 'string') {
    this.forbidden = this.forbidden.split(',');
  }
  if (typeof this.functionconstructors === 'string') {
    this.functionconstructors = this.functionconstructors === 'true';
  }
  if (typeof this.rendereachtime === 'string') {
    this.rendereachtime = this.rendereachtime === 'true';
  }
  if (typeof this.allfunctions === 'string') {
    this.allfunctions = this.allfunctions === 'true';
  }
};

GenericAnalyzer.prototype.markDirty = function () {
  this.inspected = false;
};

GenericAnalyzer.prototype.inspectSelf = function () {
  console.log('analyzing window.' + this.global);
  var me = this,
    analyzer = this.analyzer,
    forbidden = [].concat(this.forbidden);
  // set a predefied global
  hashKey.createHashKeysFor(window[this.global], this.global);
  // clean
  analyzer.getItems().empty();
  analyzer.forbidden.empty();
  analyzer.setLevels(this.levels);

  // settings > show links to built in objects
  if (!GenericAnalyzer.SHOW_BUILTIN) {
    forbidden = forbidden.concat(
      GenericAnalyzer.FORBIDDEN.split(',')
    );
  }

  forbidden.forEach(function(f) {
    var arr,
      tokens;
    if (!f.indexOf('pojoviz:')) {
      tokens = f.split(':');
      arr = _dereq_('../ObjectHashes')[tokens[1]].getItems();
    } else {
      arr = [window[f]];
    }
    console.log('forbidding: ', arr);
    analyzer.forbid(arr, true);
  });

  analyzer.add([window[this.global]]);

};

GenericAnalyzer.prototype.setDirty = function () {
  // mark this container as inspected
  this.inspected = true;
  return this;
};

GenericAnalyzer.prototype.inspect = function () {
  this
    .setDirty()
    .inspectSelf();
};

GenericAnalyzer.prototype.preRender = function () {
};

GenericAnalyzer.prototype.fetch = function () {
  var me = this,
    script;

  function getValue() {
    return window[me.global];
  }

  function promisify(v) {
    return function () {
      utils.notification('fetching script ' + v, true);
      var deferred = Q.defer();
      script = document.createElement('script');
      script.src = v;
      script.onload = function () {
        utils.notification('completed script ' + v, true);
        deferred.resolve(getValue());
      };
      document.head.appendChild(script);
      return deferred.promise;
    };
  }

  if (this.src) {
    if (getValue()) {
      console.log('resource already fetched ' + this.src);
    } else {
      var srcs = this.src.split('|');
      return srcs.reduce(function (prev, current) {
        return prev.then(promisify(current));
      }, Q('reduce'));
    }
  }

  return Q(true);
};

GenericAnalyzer.prototype.showSearch = function (nodeName, nodeProperty) {
  var me = this;
  window.open(
    _.template('${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}', {
      searchEngine: searchEngine,
      lucky: GenericAnalyzer.lucky ? '!ducky' : '',
      libraryName: me.displayname || me.global,
      nodeName: nodeName,
      nodeProperty: nodeProperty
    })
  );
};

module.exports = GenericAnalyzer;
},{"../ObjectAnalyzer":4,"../ObjectHashes":5,"../util/":14,"../util/hashKey":13,"lodash":"K2RcUv","q":"qLuPo1"}],9:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./Inspector'),
  utils = _dereq_('../util');

function PObject() {
  GenericAnalyzer.call(this);
}

PObject.prototype = Object.create(GenericAnalyzer.prototype);

PObject.prototype.inspectSelf = function () {
  console.log('inspecting Object objects');
  this.analyzer.add(this.getObjects());
};

PObject.prototype.getItems = function () {
  return [Object];
};

module.exports = PObject;
},{"../util":14,"./GenericAnalyzer":8}],10:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash'),
  hashKey = _dereq_('../util/hashKey'),
  GenericAnalyzer = _dereq_('./Inspector');

var toInspect = [window];

function Window() {
  GenericAnalyzer.call(this, {
    levels: 1,
    rendereachtime: true,
    functionconstructors: false
  });
}

Window.prototype = Object.create(GenericAnalyzer.prototype);

Window.prototype.getItems = function () {
  return toInspect;
};

Window.prototype.inspectSelf = function () {
  console.log('inspecting window');
  var me = this,
    hashes = _dereq_('../ObjectHashes');

  _.forOwn(hashes, function (v, k) {
    if (v.global && window[v.global]) {
      me.analyzer.forbid([window[v.global]], true);
    }
  });
  this.analyzer.getItems().empty();
  this.analyzer.setLevels(this.levels);
  this.analyzer.add(me.getObjects());
};

module.exports = Window;
},{"../ObjectHashes":5,"../util/hashKey":13,"./GenericAnalyzer":8,"lodash":"K2RcUv"}],11:[function(_dereq_,module,exports){
var _ = _dereq_('lodash'),
  Q = _dereq_('q'),
  dagre = _dereq_('dagre'),
  utils = _dereq_('./util/'),
  ObjectHashes = _dereq_('./ObjectHashes');

// enable promise chain debug
Q.longStackSupport = true;

var container, oldContainer;
var renderer, oldRenderer;
var pojoviz;

/**
 *
 * @return {Object} [description]
 */
function process(container) {
  var g = new dagre.Digraph(),
      properties,
      node,
      library = container.analyzer,
      str = library.stringify(),
      libraryNodes = str.nodes,
      libraryEdges = str.edges;

  // create the graph
  // each element of the graph has
  // - label
  // - width
  // - height
  // - properties
  _.forOwn(libraryNodes, function (properties, k) {
    var label = k.match(/\S*?-(.*)/)[1];
    // console.log(k, label.length);
    node = {
      label: k,
      width: label.length * 10
    };
    // lines + header + padding bottom
    node.height = properties.length * 15 + 50;
    node.properties = properties;
    properties.forEach(function (v) {
      node.width = Math.max(node.width, v.name.length * 10);
    });
    g.addNode(k, node);
  });

  // build the edges from node to node
  _.forOwn(libraryEdges, function (links) {
    links.forEach(function (link) {
      if (g.hasNode(link.from) && g.hasNode(link.to)) {
        g.addEdge(null, link.from, link.to);
      }
    });
  });

  // layout of the graph
  var layout = dagre.layout()
    .nodeSep(30)
    // .rankSep(70)
    // .rankDir('TB')
    .run(g);

  var nodes = [],
      edges = [],
      center = {x: 0, y: 0},
      mn = {x: Infinity, y: Infinity},
      mx = {x: -Infinity, y: -Infinity},
      total = g.nodes().length;

  // update the node info of the node adding:
  // - x
  // - y
  // - predecessors
  // - successors
  layout.eachNode(function (k, layoutInfo) {
    var x = layoutInfo.x;
    var y = layoutInfo.y;

    node = g.node(k);
    node.x = x;
    node.y = y;
    node.predecessors = g.predecessors(k);
    node.successors = g.successors(k);
    nodes.push(node);

    // calculate the bbox of the graph to center the graph
    var mnx = x - node.width / 2;
    var mny = y - node.height / 2;
    var mxx = x + node.width / 2;
    var mxy = y + node.height / 2;

    center.x += x;
    center.y += y;
    mn.x = Math.min(mn.x, mnx);
    mn.y = Math.min(mn.y, mny);
    // console.log(x, y, ' dim ', node.width, node.height);
    mx.x = Math.max(mx.x, mxx);
    mx.y = Math.max(mx.y, mxy);
  });

  center.x /= (total || 1);
  center.y /= (total || 1);

  // create the edges from property to node
  _(libraryEdges).forOwn(function (links) {
    links.forEach(function (link) {
      if (g.hasNode(link.from) && g.hasNode(link.to)) {
        edges.push(link);
      }
    });
  });

  return {
    edges: edges,
    nodes: nodes,
    center: center,
    mn: mn,
    mx: mx
  };
}

// render
function render() {
  var data;

  if (container === oldContainer) {
    return;
  }

  utils.notification('processing ' + container.global);

  // pre render
  oldRenderer && oldRenderer.clean();
  renderer.clean();

  setTimeout(function () {
    container.preRender();
    console.log('process & render start: ', new Date());
    // data has
    // - edges (property -> node)
    // - nodes
    // - center
    //
    console.time('process');
    data = process(container);
    console.timeEnd('process');

    utils.notification('rendering ' + container.global);

    console.time('render');
    renderer.render(data);
    console.timeEnd('render');

    utils.notification('complete!');
  }, 0);
}

// public api
pojoviz = {
  renderers: {},
  addRenderers: function (newRenderers) {
    _.merge(pojoviz.renderers, newRenderers);
  },
  nullifyContainer: function () {
    oldContainer = container;
    container = null;
  },
  getContainer: function () {
    return container;
  },
  setContainer: function (containerName, options) {
    oldContainer = container;
    container = ObjectHashes[containerName];

    if (!container) {
      container = ObjectHashes.create(containerName, options);
    } else {
      // required to fetch external resources
      container.src = options.src;
    }

    return container.init();
  },
  setRenderer: function (r) {
    oldRenderer = renderer;
    renderer = pojoviz.renderers[r];
  },
  getRenderer: function () {
    return renderer;
  },
  render: render,

  // expose inner modules
  ObjectHashes: _dereq_('./ObjectHashes'),
  ObjectAnalyzer: _dereq_('./ObjectAnalyzer'),
  analyzer: {
    GenericAnalyzer: _dereq_('./analyzer/Inspector')
  },
  utils: _dereq_('./util'),

  // user vars
  userVariables: []
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getContainer()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;
},{"./ObjectAnalyzer":4,"./ObjectHashes":5,"./analyzer/GenericAnalyzer":8,"./util":14,"./util/":14,"dagre":"JWa/F1","lodash":"K2RcUv","q":"qLuPo1"}],12:[function(_dereq_,module,exports){
'use strict';

var hashKey = _dereq_('./hashKey');

function HashMap() {
}

HashMap.prototype = {
  put: function (key, value) {
    this[hashKey(key)] = (value || key);
  },
  get: function (key) {
    return this[hashKey(key)];
  },
  remove: function (key) {
    var v = this[hashKey(key)];
    delete this[hashKey(key)];
    return v;
  },
  empty: function () {
    var p,
        me = this;
    for (p in me) {
      if (me.hasOwnProperty(p)) {
        delete this[p];
      }
    }
  }
};

module.exports = HashMap;
},{"./hashKey":13}],13:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash'),
  assert = _dereq_('./').assert,
  me, hashKey;

function isObjectOrFunction(v) {
  return v && (typeof v === 'object' || typeof v === 'function');
}

/**
 * Gets a store hashkey only if it's an object
 * @param  {[type]} obj
 * @return {[type]}
 */
function get(obj) {
  assert(isObjectOrFunction(obj), 'obj must be an object|function');
  return obj.hasOwnProperty &&
    obj.hasOwnProperty(me.hiddenKey) &&
    obj[me.hiddenKey];
}

/**
 * Sets a key on an object
 * @param {[type]} obj [description]
 * @param {[type]} key [description]
 */
function set(obj, key) {
  assert(isObjectOrFunction(obj), 'obj must be an object|function');
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
  var value = v,
      uid = v;

  if (isObjectOrFunction(v)) {
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
    me.createHashKeysFor(obj.constructor);
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
},{"./":14,"lodash":"K2RcUv"}],14:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash');

var propertiesTransformation = {
  '[[Prototype]]': '__proto__'
};

var utils = {
  assert: function (v, message) {
    if (!v) {
      throw message || 'error';
    }
  },
  translate: function (x, y) {
    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
  },
  scale: function (s) {
    return 'scale(' + (s || 1) + ')';
  },
  transform: function (obj) {
    var t = [];
    _.forOwn(obj, function (v, k) {
      t.push(utils[k].apply(utils, v));
    });
    return t.join(' ');
  },
  prefixer: function () {
    var args = [].slice.call(arguments);
    args.unshift('pv');
    return args.join('-');
  },
  transformProperty: function (v) {
    if (propertiesTransformation.hasOwnProperty(v)) {
      return propertiesTransformation[v];
    }
    return v;
  },
  escapeCls: function(v) {
    return v.replace(/\$/g, '_');
  },
  toQueryString: function (obj) {
    var s = '',
        i = 0;
    _.forOwn(obj, function (v, k) {
      if (i) {
        s += '&';
      }
      s += k + '=' + v;
      i += 1;
    });
    return s;
  },
  createEvent: function (eventName, details) {
    return new CustomEvent(eventName, {
      detail: details
    });
  },
  notification: function (message, consoleToo) {
    var ev = utils.createEvent('pojoviz-notification', message);
    consoleToo && console.log(message);
    document.dispatchEvent(ev);
  },
  createJsonpCallback: function (url) {
    var script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
  }
};

module.exports = utils;
},{"lodash":"K2RcUv"}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9PYmplY3RBbmFseXplci5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvT2JqZWN0SGFzaGVzLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9Bbmd1bGFyLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9CdWlsdEluLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9HZW5lcmljQW5hbHl6ZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL2FuYWx5emVyL09iamVjdC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvV2luZG93LmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvdXRpbC9IYXNoTWFwLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy91dGlsL2hhc2hLZXkuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL3V0aWwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgSGFzaE1hcCA9IHJlcXVpcmUoJy4vdXRpbC9IYXNoTWFwJyksXG4gIGhhc2hLZXkgPSByZXF1aXJlKCcuL3V0aWwvaGFzaEtleScpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbi8vIHV0aWxzXG5mdW5jdGlvbiBlYWNoT2JqZWN0QW5kUHJvdG90eXBlKG9iaiwgZm4pIHtcbiAgZm4ob2JqKTtcbiAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eSgncHJvdG90eXBlJykpIHtcbiAgICBmbihvYmoucHJvdG90eXBlKTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGEgZnVuY3Rpb24gd2l0aCBhbm90aGVyXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgIHdyYXBwZXJcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIHdyYXBGbihmbiwgd3JhcHBlcikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIC8vIE5PVEU6IGB0aGlzYCB3aWxsIGJlIHRoZSBpbnN0YW5jZVxuICAgIHdyYXBwZXIuY2FsbCh0aGlzKTtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0T3JGdW5jdGlvbih2KSB7XG4gIHJldHVybiAhISh2ICYmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgfHxcbiAgICB0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJykpO1xufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yYmlkZGVuIGluIHN0cmljdCBtb2RlXG4gKiBAdHlwZSB7QXJyYXl9XG4gKi9cbnZhciBmb3JiaWRkZW5JblN0cmljdE1vZGUgPSBbXG4gICdjYWxsZWUnLCAnY2FsbGVyJywgJ2FyZ3VtZW50cydcbl07XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBPYmplY3QgYW5hbHl6XG4gKiBAcGFyYW0ge1t0eXBlXX0gY29uZmlnIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gQW5hbHl6ZXIoY29uZmlnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBBbmFseXplcikpIHtcbiAgICByZXR1cm4gbmV3IEFuYWx5emVyKGNvbmZpZyk7XG4gIH1cbiAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuXG4gIC8qKlxuICAgKiBPYmplY3RzIHJlZ2lzdGVyZWQgaW4gdGhpcyBpbnN0YW5jZVxuICAgKiBAdHlwZSB7SGFzaE1hcH1cbiAgICovXG4gIHRoaXMub2JqZWN0cyA9IGNvbmZpZy5vYmplY3RzIHx8IG5ldyBIYXNoTWFwKCk7XG4gIC8qKlxuICAgKiBGb3JiaWRkZW4gb2JqZWN0c1xuICAgKiBAdHlwZSB7SGFzaE1hcH1cbiAgICovXG4gIHRoaXMuZm9yYmlkZGVuID0gY29uZmlnLmZvcmJpZGRlbiB8fCBuZXcgSGFzaE1hcCgpO1xuXG4gIC8qKlxuICAgKiBDYWNoZSBvZiBwcm9wZXJ0aWVzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB0aGlzLl9fY2FjaGVPYmplY3RzID0ge307XG5cbiAgLyoqXG4gICAqIENhY2hlIG9mIGxpbmtzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB0aGlzLl9fY2FjaGVMaW5rcyA9IHt9O1xuXG4gIC8qKlxuICAgKiBEZnMgbGV2ZWxzXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmxldmVscyA9IEluZmluaXR5O1xuICAvKipcbiAgICogSWYgdGhlIGFuYWx5emVyIGlzIGRpcnR5IHRoZW4gaXQgaGFzIHNvbWUgcGVuZGluZyB3b3JrXG4gICAqIHRvIGRvXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFRydWUgdG8gc2F2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0cyBhbmFseXplZCBpbiBhblxuICAgKiBpbnRlcm5hbCBjYWNoZVxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHRoaXMuY2FjaGUgPVxuICAgIGNvbmZpZy5oYXNPd25Qcm9wZXJ0eSgnY2FjaGUnKSA/XG4gICAgY29uZmlnLmNhY2hlIDogdHJ1ZTtcbiAgLyoqXG4gICAqIFRydWUgdG8gaW5jbHVkZSBmdW5jdGlvbiBjb25zdHJ1Y3RvcnMgaW4gdGhlIGFuYWx5c2lzIGdyYXBoXG4gICAqIGkuZS4gdGhlIGZ1bmN0aW9ucyB0aGF0IGhhdmUgYSBwcm90b3R5cGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmZ1bmN0aW9uQ29uc3RydWN0b3JzID1cbiAgICBjb25maWcuaGFzT3duUHJvcGVydHkoJ2Z1bmN0aW9uQ29uc3RydWN0b3JzJykgP1xuICAgIGNvbmZpZy5mdW5jdGlvbkNvbnN0cnVjdG9ycyA6IGZhbHNlO1xuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGFsbCB0aGUgZnVuY3Rpb25zIGluIHRoZSBhbmFseXNpcyBncmFwaFxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuYWxsRnVuY3Rpb25zID1cbiAgICBjb25maWcuaGFzT3duUHJvcGVydHkoJ2FsbEZ1bmN0aW9ucycpID9cbiAgICBjb25maWcuYWxsRnVuY3Rpb25zIDogZmFsc2U7XG4gIC8qKlxuICAgKiBUcnVlIHRvIGFsbG93IEhUTUwgbm9kZXNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmh0bWxOb2RlID1cbiAgICBjb25maWcuaGFzT3duUHJvcGVydHkoJ2h0bWxOb2RlJykgP1xuICAgIGNvbmZpZy5odG1sTm9kZSA6IGZhbHNlO1xufVxuXG5BbmFseXplci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBBbmFseXplcixcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFuIG9iamVjdCBpcyBpbiB0aGUgZm9yYmlkZGVuIGhhc2hcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0ZvcmJpZGRlbjogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiB0aGlzLmZvcmJpZGRlbi5nZXQob2JqKTtcbiAgfSxcblxuICBpc0xpbmthYmxlOiBmdW5jdGlvbiAoa2V5LCBvYmopIHtcbiAgICBpZiAoIW9iaikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciB2ID0gdHlwZW9mIG9iaiA9PT0gJ29iamVjdCc7XG5cbiAgICAvLyBpZiAodikge1xuICAgIC8vICAgaWYgKCF0aGlzLmh0bWxOb2RlICYmIHYgaW5zdGFuY2VvZiBOb2RlKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIC8vICAgcmV0dXJuIHRydWU7XG4gICAgLy8gfVxuXG4gICAgLy8gaWYgKCF0aGlzLmh0bWxOb2RlKSB7XG4gICAgLy8gICB2ID0gdiAmJiAhKHYgaW5zdGFuY2VvZiBOb2RlKTtcbiAgICAvLyB9ZmRlcTFgXG5cbiAgICAvLyB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmXG4gICAgLy8gICBjb25zb2xlLmxvZyhPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopKTtcbiAgICBpZiAoIXYgJiYgdGhpcy5hbGxGdW5jdGlvbnMpIHtcbiAgICAgIC8vIG1pbmltaXplIHRoZSBub2RlcyBjcmVhdGVkIGJ5IGNvbnNpZGVyaW5nIGZ1bmN0aW9uc1xuICAgICAgLy8gd2l0aCBtb3JlIHByb3BlcnRpZXMgdGhhbiB0aGUgdXN1YWwgb25lc1xuICAgICAgdiA9IHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgICB2ID0gdiAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmxlbmd0aCA+IDU7XG4gICAgfVxuICAgIGlmICghdiAmJiB0aGlzLmZ1bmN0aW9uQ29uc3RydWN0b3JzKSB7XG4gICAgICB2ID0gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgIHYgPSB2ICYmIChcbiAgICAgICAgb2JqLm5hbWUgJiZcbiAgICAgICAgb2JqLm5hbWVbMF0ubWF0Y2goL15bQS1aXS8pIHx8XG4gICAgICAgIGtleVswXS5tYXRjaCgvXltBLVpdLylcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnVtZXJhYmxlIHByb3BlcnRpZXMgYW4gb2JqZWN0IGRpc2NhcmRpbmdcbiAgICogZm9yYmlkZGVuIG9uZXNcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7QXJyYXl9IEFycmF5IG9mIG9iamVjdHMsIGVhY2ggb2JqZWN0IGhhcyB0aGUgZm9sbG93aW5nXG4gICAqIHByb3BlcnRpZXM6XG4gICAqXG4gICAqIC0gbmFtZVxuICAgKiAtIGNsc1xuICAgKiAtIHR5cGVcbiAgICogLSBsaW5rZWFibGUgKGlmIGl0J3MgYW4gb2JqZWN0IHRoaXMgcHJvcGVydHkgaXMgc2V0IHRvIHRydWUpXG4gICAqL1xuICBnZXRQcm9wZXJ0aWVzOiBmdW5jdGlvbiAob2JqLCBsaW5rYWJsZU9ubHkpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgaGsgPSBoYXNoS2V5KG9iaiksXG4gICAgICBwcm9wZXJ0aWVzO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHRocm93ICd0aGlzIG1ldGhvZCBuZWVkcyBhbiBvYmplY3QgdG8gYW5hbHl6ZSc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIGlmICghbGlua2FibGVPbmx5ICYmIHRoaXMuX19jYWNoZU9iamVjdHNbaGtdKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdvYmplY3RzIGZyb20gY2FjaGUgOiknKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19jYWNoZU9iamVjdHNbaGtdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByb3BlcnRpZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopO1xuXG4gICAgZnVuY3Rpb24gZm9yYmlkZGVuS2V5KHYpIHtcbiAgICAgIC8vIGZvcmJpZGRlbiBpbiBzdHJpY3QgbW9kZVxuICAgICAgcmV0dXJuIH5mb3JiaWRkZW5JblN0cmljdE1vZGUuaW5kZXhPZih2KSB8fFxuICAgICAgICB2Lm1hdGNoKC9eX18uKj9fXyQvKSB8fFxuICAgICAgICB2Lm1hdGNoKC9eXFwkXFwkLio/XFwkXFwkJC8pIHx8XG4gICAgICAgIHYubWF0Y2goL1s6K34hPjw9Ly9cXFtcXF1AXFwuIF0vKTtcbiAgICB9XG5cbiAgICBwcm9wZXJ0aWVzID0gXy5maWx0ZXIocHJvcGVydGllcywgZnVuY3Rpb24gKHYpIHtcbiAgICAgIHZhciBnb29kID0gdHlwZW9mIHYgPT09ICdzdHJpbmcnICYmICFmb3JiaWRkZW5LZXkodiksXG4gICAgICAgICAgcjtcbiAgICAgIGlmIChsaW5rYWJsZU9ubHkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByID0gZ29vZCAmJiBtZS5pc0xpbmthYmxlKHYsIG9ialt2XSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByID0gZmFsc2U7XG4gICAgICAgICAgLy8gdW5jb21tZW50IHRvIHNlZSB3aHkgb2JqW3ZdIGlzIG5vdCBhbGxvd2VkXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBnb29kO1xuICAgIH0pLm1hcChmdW5jdGlvbiAodikge1xuICAgICAgdmFyIHR5cGUsXG4gICAgICAgIGxpbmtlYWJsZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHR5cGUgPSBudWxsfHN0cmluZ3x1bmRlZmluZWR8bnVtYmVyfG9iamVjdFxuICAgICAgICB0eXBlID0gdHlwZW9mIG9ialt2XTtcbiAgICAgICAgbGlua2VhYmxlID0gaXNPYmplY3RPckZ1bmN0aW9uKG9ialt2XSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgdHlwZSA9ICd1bmRlZmluZWQnO1xuICAgICAgICBsaW5rZWFibGUgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gcGFyZW50OiBoYXNoS2V5KG9iaiksXG4gICAgICAgIG5hbWU6IHYsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGxpbmtlYWJsZTogbGlua2VhYmxlXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gc3BlY2lhbCBwcm9wZXJ0aWVzXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICBuYW1lOiAnW1tQcm90b3R5cGVdXScsXG4gICAgICAgIC8vIGNsczogaGFzaEtleShvYmopLFxuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgbGlua2VhYmxlOiB0cnVlLFxuICAgICAgICBoaWRkZW46IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgY29uc3RydWN0b3IgPSBvYmouaGFzT3duUHJvcGVydHkgJiZcbiAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSAmJlxuICAgICAgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJztcbiAgICBpZiAoY29uc3RydWN0b3IgJiZcbiAgICAgICAgXy5maW5kSW5kZXgocHJvcGVydGllcywgeyBuYW1lOiAnY29uc3RydWN0b3InIH0pID09PSAtMSkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgLy8gY2xzOiBoYXNoS2V5KG9iaiksXG4gICAgICAgIG5hbWU6ICdjb25zdHJ1Y3RvcicsXG4gICAgICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgICAgIGxpbmtlYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUgJiYgIWxpbmthYmxlT25seSkge1xuICAgICAgdGhpcy5fX2NhY2hlT2JqZWN0c1toa10gPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKHByb3BlcnRpZXMpO1xuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBbmFseXplcyBhIGxpc3Qgb2Ygb2JqZWN0cyByZWN1cnNpdmVseVxuICAgKiBAcGFyYW0gIHtBcnJheX0gb2JqZWN0cyAgICAgIEFycmF5IG9mIG9iamVjdHNcbiAgICogQHBhcmFtICB7bnVtYmVyfSBjdXJyZW50TGV2ZWwgQ3VycmVudCBkZnMgbGV2ZWxcbiAgICovXG4gIGFuYWx5emVPYmplY3RzOiBmdW5jdGlvbiAob2JqZWN0cywgY3VycmVudExldmVsKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmIChjdXJyZW50TGV2ZWwgPD0gbWUubGV2ZWxzICYmICAgIC8vIGRmcyBsZXZlbFxuICAgICAgICAgICFtZS5vYmplY3RzLmdldCh2KSAmJiAgICAgICAgIC8vIGFscmVhZHkgcmVnaXN0ZXJlZFxuICAgICAgICAgICFtZS5pc0ZvcmJpZGRlbih2KSAgICAgICAgICAgICAgLy8gZm9yYmlkZGVuIGNoZWNrXG4gICAgICAgICAgKSB7XG5cbiAgICAgICAgLy8gYWRkIHRvIHRoZSByZWdpc3RlcmVkIG9iamVjdCBwb29sXG4gICAgICAgIG1lLm9iamVjdHMucHV0KHYpO1xuXG4gICAgICAgIC8vIGRmcyB0byB0aGUgbmV4dCBsZXZlbFxuICAgICAgICBtZS5hbmFseXplT2JqZWN0cyhcbiAgICAgICAgICBtZS5nZXRPd25MaW5rcyh2KS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgICAgIHJldHVybiBsaW5rLnRvO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIGN1cnJlbnRMZXZlbCArIDFcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGxpc3Qgb2YgbGlua3MsIGVhY2ggbGluayBpcyBhbiBvYmplY3Qgd2hpY2ggaGFzIHRoZVxuICAgKiBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogLSBmcm9tXG4gICAqIC0gdG9cbiAgICogLSBwcm9wZXJ0eSAoc3RyaW5nKVxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIGdldE93bkxpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgbGlua3MgPSBbXSxcbiAgICAgICAgcHJvcGVydGllcyxcbiAgICAgICAgbmFtZSA9IGhhc2hLZXkob2JqKTtcblxuICAgIGlmICh0aGlzLl9fY2FjaGVMaW5rc1tuYW1lXSkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ2xpbmtzIGZyb20gY2FjaGUgOiknKTtcbiAgICAgIHJldHVybiB0aGlzLl9fY2FjaGVMaW5rc1tuYW1lXTtcbiAgICB9XG5cbiAgICBwcm9wZXJ0aWVzID0gbWUuZ2V0UHJvcGVydGllcyhvYmosIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gZ2V0QXVnbWVudGVkSGFzaChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghaGFzaEtleS5oYXMob2JqKSAmJlxuICAgICAgICAgIG5hbWUgIT09ICdwcm90b3R5cGUnICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKG9iaiwgbmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzaEtleShvYmopO1xuICAgIH1cblxuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgJ3RoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSBhIGhhc2hrZXknO1xuICAgIH1cblxuICAgIF8uZm9yRWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbiAodikge1xuICAgICAgdmFyIHJlZiA9IG9ialt2Lm5hbWVdO1xuICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgbGV2ZWxzIGEgcmVmZXJlbmNlIG1pZ2h0IG5vdCBleGlzdFxuICAgICAgaWYgKCFyZWYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb2JqZWN0IGRvZXNuJ3QgaGF2ZSBhIGhhc2hrZXlcbiAgICAgIC8vIGxldCdzIGdpdmUgaXQgYSBuYW1lIGVxdWFsIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgLy8gYmVpbmcgYW5hbHl6ZWRcbiAgICAgIGdldEF1Z21lbnRlZEhhc2gocmVmLCB2Lm5hbWUpO1xuXG4gICAgICBpZiAoIW1lLmlzRm9yYmlkZGVuKHJlZikpIHtcbiAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgICAgdG86IHJlZixcbiAgICAgICAgICB0b0hhc2g6IGhhc2hLZXkocmVmKSxcbiAgICAgICAgICBwcm9wZXJ0eTogdi5uYW1lXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvICYmICFtZS5pc0ZvcmJpZGRlbihwcm90bykpIHtcbiAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICBmcm9tOiBvYmosXG4gICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgIHRvOiBwcm90byxcbiAgICAgICAgdG9IYXNoOiBoYXNoS2V5KHByb3RvKSxcbiAgICAgICAgcHJvcGVydHk6ICdbW1Byb3RvdHlwZV1dJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIHRoaXMuX19jYWNoZUxpbmtzW25hbWVdID0gbGlua3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmtzO1xuICB9LFxuXG4gIG1ha2VEaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICB9LFxuXG4gIHNldExldmVsczogZnVuY3Rpb24gKGwpIHtcbiAgICB0aGlzLmxldmVscyA9IGw7XG4gIH0sXG5cbiAgc2V0RGlydHk6IGZ1bmN0aW9uIChkKSB7XG4gICAgdGhpcy5kaXJ0eSA9IGQ7XG4gIH0sXG5cbiAgc2V0RnVuY3Rpb25Db25zdHJ1Y3RvcnM6IGZ1bmN0aW9uICh2KSB7XG4gICAgdGhpcy5mdW5jdGlvbkNvbnN0cnVjdG9ycyA9IHY7XG4gIH0sXG5cbiAgZ2V0T2JqZWN0czogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9iamVjdHM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIGFuIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEBwYXJhbSAgdG9TdHJpbmdcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvcGVydGllcyhvYmopO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVwcmVzZW50YXRpb24gb2YgdGhlIGxpbmtzIG9mXG4gICAqIGFuIG9iamVjdFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdExpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICByZXR1cm4gbWUuZ2V0T3duTGlua3Mob2JqKS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIC8vIGRpc2NhcmRlZDogZnJvbSwgdG9cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZyb206IGxpbmsuZnJvbUhhc2gsXG4gICAgICAgIHRvOiBsaW5rLnRvSGFzaCxcbiAgICAgICAgcHJvcGVydHk6IGxpbmsucHJvcGVydHlcbiAgICAgIH07XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIHRoZSBvYmplY3RzIHNhdmVkIGluIHRoaXMgYW5hbHl6ZXJcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgIG5vZGVzID0ge30sXG4gICAgICBlZGdlcyA9IHt9O1xuICAgIGNvbnNvbGUudGltZSgnc3RyaW5naWZ5Jyk7XG4gICAgXyh0aGlzLm9iamVjdHMpLmZvck93bihmdW5jdGlvbiAodikge1xuICAgICAgbm9kZXNbaGFzaEtleSh2KV0gPSBtZS5zdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzKHYpO1xuICAgICAgZWRnZXNbaGFzaEtleSh2KV0gPSBtZS5zdHJpbmdpZnlPYmplY3RMaW5rcyh2KTtcbiAgICB9KTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ3N0cmluZ2lmeScpO1xuICAgIHJldHVybiB7XG4gICAgICBub2Rlczogbm9kZXMsXG4gICAgICBlZGdlczogZWRnZXNcbiAgICB9O1xuICB9XG59O1xuXG4vLyBhZGl0aW9uYWwgb2JqZWN0cyB0aGF0IG5lZWQgdGhlIHByb3RvdHlwZSB0byBleGlzdFxudmFyIGFQcm90byA9IEFuYWx5emVyLnByb3RvdHlwZTtcbl8ubWVyZ2UoYVByb3RvLCB7XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBsaXN0IG9mIG9iamVjdHMgdG8gYW5hbHl6ZSBhbmQgbWFrZSB0aGUgYW5hbHl6ZXIgZGlydHlcbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHJldHVybiB7dGhpc31cbiAgICovXG4gIGFkZDogd3JhcEZuKGZ1bmN0aW9uIChvYmplY3RzKSB7XG4gICAgY29uc29sZS50aW1lKCdhbmFseXplJyk7XG4gICAgdGhpcy5hbmFseXplT2JqZWN0cyhvYmplY3RzLCAwKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ2FuYWx5emUnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSwgYVByb3RvLm1ha2VEaXJ0eSksXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBsaXN0IG9mIG9iamVjdHMsIGlmIGB3aXRoUHJvdG90eXBlYCBpcyB0cnVlIHRoZW5cbiAgICogYWxzbyB0aGUgcHJvdG90eXBlIGlzIHJlbW92ZWRcbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZVxuICAgKiBAcmV0dXJuIHt0aGlzfVxuICAgKi9cbiAgcmVtb3ZlOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBtZS5vYmplY3RzLnJlbW92ZShvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5vYmplY3RzLnJlbW92ZShvYmoucHJvdG90eXBlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWU7XG4gIH0sIGFQcm90by5tYWtlRGlydHkpLFxuXG4gIC8qKlxuICAgKiBGb3JiaWRzIGEgbGlzdCBvZiBvYmplY3RzLCBpZiBgd2l0aFByb3RvdHlwZWAgaXMgdHJ1ZSB0aGVuXG4gICAqIGFsc28gdGhlIHByb3RvdHlwZSBpcyBmb3JiaWRkZW5cbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZVxuICAgKiBAcmV0dXJuIHt0aGlzfVxuICAgKi9cbiAgZm9yYmlkOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG1lLnJlbW92ZShvYmplY3RzLCB3aXRoUHJvdG90eXBlKTtcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnB1dChvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5mb3JiaWRkZW4ucHV0KG9iai5wcm90b3R5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBhUHJvdG8ubWFrZURpcnR5KSxcblxuICAvKipcbiAgICogVW5mb3JiaWRzIGEgbGlzdCBvZiBvYmplY3RzLCBpZiBgd2l0aFByb3RvdHlwZWAgaXMgdHJ1ZSB0aGVuXG4gICAqIGFsc28gdGhlIHByb3RvdHlwZSBpcyB1bmZvcmJpZGRlblxuICAgKiBAcGFyYW0gIHtBcnJheTxPYmplY3RzPn0gb2JqZWN0c1xuICAgKiBAcGFyYW0gIHtib29sZWFufSB3aXRoUHJvdG90eXBlXG4gICAqIEByZXR1cm4ge3RoaXN9XG4gICAqL1xuICB1bmZvcmJpZDogd3JhcEZuKGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnJlbW92ZShvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5mb3JiaWRkZW4ucmVtb3ZlKG9iai5wcm90b3R5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBhUHJvdG8ubWFrZURpcnR5KVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQW5hbHl6ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIEdlbmVyaWMgPSByZXF1aXJlKCcuL2FuYWx5emVyL0dlbmVyaWNBbmFseXplcicpLFxuICBBbmd1bGFyID0gcmVxdWlyZSgnLi9hbmFseXplci9Bbmd1bGFyJyksXG4gIFdpbmRvdyA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvV2luZG93JyksXG4gIFBPYmplY3QgPSByZXF1aXJlKCcuL2FuYWx5emVyL09iamVjdCcpLFxuICBCdWlsdEluID0gcmVxdWlyZSgnLi9hbmFseXplci9CdWlsdEluJyk7XG5cbnZhciBsaWJyYXJpZXM7XG5cbnZhciBwcm90byA9IHtcbiAgY3JlYXRlTmV3OiBmdW5jdGlvbiAoZ2xvYmFsLCBvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIGEgZ2VuZXJpYyBjb250YWluZXIgZm9yOiAnICsgZ2xvYmFsLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKGxpYnJhcmllc1tnbG9iYWxdID0gbmV3IEdlbmVyaWMob3B0aW9ucykpO1xuICB9LFxuICBhbGw6IGZ1bmN0aW9uIChmbikge1xuICAgIF8uZm9yT3duKGxpYnJhcmllcywgZm4pO1xuICB9LFxuICBtYXJrRGlydHk6IGZ1bmN0aW9uICgpIHtcbiAgICBwcm90by5hbGwoZnVuY3Rpb24gKHYpIHtcbiAgICAgIHYubWFya0RpcnR5KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9LFxuICBzZXRGdW5jdGlvbkNvbnN0cnVjdG9yczogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgcHJvdG8uYWxsKGZ1bmN0aW9uICh2KSB7XG4gICAgICAvLyB0aGlzIG9ubHkgd29ya3Mgb24gdGhlIGdlbmVyaWMgYW5hbHl6ZXJzXG4gICAgICBpZiAoIXYuX2hhc2ZjKSB7XG4gICAgICAgIHYuYW5hbHl6ZXIuc2V0RnVuY3Rpb25Db25zdHJ1Y3RvcnMobmV3VmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwcm90bztcbiAgfVxufTtcblxubGlicmFyaWVzID0gT2JqZWN0LmNyZWF0ZShwcm90byk7XG5fLm1lcmdlKGxpYnJhcmllcywge1xuICBvYmplY3Q6IG5ldyBQT2JqZWN0KCksXG4gIGJ1aWx0SW46IG5ldyBCdWlsdEluKCksXG4gIHdpbmRvdzogbmV3IFdpbmRvdygpLFxuICAvLyBwb3B1bGFyXG4gIGFuZ3VsYXI6IG5ldyBBbmd1bGFyKCksXG4gIC8vIG1pbmVcbiAgLy8gdDM6IG5ldyBHZW5lcmljKHsgZ2xvYmFsOiAndDMnIH0pLFxuICAvLyBodWdlXG4gIHRocmVlOiBuZXcgR2VuZXJpYyh7XG4gICAgZ2xvYmFsOiAnVEhSRUUnLFxuICAgIHJlbmRlcmVhY2h0aW1lOiB0cnVlXG4gIH0pXG59KTtcblxuLy8gY29uc29sZS5sb2cobGlicmFyaWVzKTtcbm1vZHVsZS5leHBvcnRzID0gbGlicmFyaWVzOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vR2VuZXJpY0FuYWx5emVyJyksXG4gIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKTtcblxuZnVuY3Rpb24gQW5ndWxhcigpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcywge1xuICAgIGdsb2JhbDogJ2FuZ3VsYXInLFxuICAgIGRpc3BsYXluYW1lOiAnQW5ndWxhckpTJyxcbiAgICByZW5kZXJlYWNodGltZTogdHJ1ZVxuICB9KTtcblxuICB0aGlzLnNlcnZpY2VzID0gW1xuICAgICckYW5pbWF0ZScsXG4gICAgJyRjYWNoZUZhY3RvcnknLFxuICAgICckY29tcGlsZScsXG4gICAgJyRjb250cm9sbGVyJyxcbiAgICAvLyAnJGRvY3VtZW50JyxcbiAgICAnJGV4Y2VwdGlvbkhhbmRsZXInLFxuICAgICckZmlsdGVyJyxcbiAgICAnJGh0dHAnLFxuICAgICckaHR0cEJhY2tlbmQnLFxuICAgICckaW50ZXJwb2xhdGUnLFxuICAgICckaW50ZXJ2YWwnLFxuICAgICckbG9jYWxlJyxcbiAgICAnJGxvZycsXG4gICAgJyRwYXJzZScsXG4gICAgJyRxJyxcbiAgICAnJHJvb3RTY29wZScsXG4gICAgJyRzY2UnLFxuICAgICckc2NlRGVsZWdhdGUnLFxuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJyR0aW1lb3V0JyxcbiAgICAvLyAnJHdpbmRvdydcbiAgXS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlLCBuYW1lOiB2IH07XG4gIH0pO1xufVxuXG5Bbmd1bGFyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cbkFuZ3VsYXIucHJvdG90eXBlLmdldFNlbGVjdGVkU2VydmljZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgdG9BbmFseXplID0gW107XG5cbiAgd2luZG93LmFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nJ10pO1xuICB0aGlzLmluamVjdG9yID0gd2luZG93LmFuZ3VsYXIuaW5qZWN0b3IoWydhcHAnXSk7XG5cbiAgbWUuc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIGlmIChzLmNoZWNrZWQpIHtcbiAgICAgIHZhciBvYmogPSBtZS5pbmplY3Rvci5nZXQocy5uYW1lKTtcbiAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBzLm5hbWUpO1xuICAgICAgdG9BbmFseXplLnB1c2gob2JqKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9BbmFseXplO1xufTtcblxuQW5ndWxhci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGFuZ3VsYXInKTtcbiAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0Zvcih3aW5kb3cuYW5ndWxhciwgJ2FuZ3VsYXInKTtcbiAgdGhpcy5hbmFseXplci5nZXRPYmplY3RzKCkuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5hZGQoXG4gICAgW3dpbmRvdy5hbmd1bGFyXS5jb25jYXQodGhpcy5nZXRTZWxlY3RlZFNlcnZpY2VzKCkpXG4gICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuZ3VsYXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9HZW5lcmljQW5hbHl6ZXInKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbnZhciB0b0luc3BlY3QgPSBbXG4gIE9iamVjdCwgRnVuY3Rpb24sXG4gIEFycmF5LCBEYXRlLCBCb29sZWFuLCBOdW1iZXIsIE1hdGgsIFN0cmluZywgUmVnRXhwLCBKU09OLFxuICBFcnJvclxuXTtcblxuZnVuY3Rpb24gQnVpbHRJbigpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcyk7XG59XG5cbkJ1aWx0SW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShHZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlKTtcblxuQnVpbHRJbi5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGJ1aWx0SW4gb2JqZWN0cycpO1xuICB0aGlzLmFuYWx5emVyLmFkZCh0aGlzLmdldE9iamVjdHMoKSk7XG59O1xuXG5CdWlsdEluLnByb3RvdHlwZS5nZXRPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoPycgK1xuICAgIHV0aWxzLnRvUXVlcnlTdHJpbmcoe1xuICAgICAgcTogZW5jb2RlVVJJQ29tcG9uZW50KG5vZGVOYW1lICsgJyAnICsgbm9kZVByb3BlcnR5KSxcbiAgICB9KTtcbiAgd2luZG93Lm9wZW4odXJsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnVpbHRJbjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC8nKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4uL3V0aWwvaGFzaEtleScpLFxuICBhbmFseXplciA9IHJlcXVpcmUoJy4uL09iamVjdEFuYWx5emVyJyk7XG5cbnZhciBzZWFyY2hFbmdpbmUgPSAnaHR0cHM6Ly9kdWNrZHVja2dvLmNvbS8/cT0nO1xuXG4vKipcbiAqIFRPRE9cbiAqIFtHZW5lcmljQW5hbHl6ZXIgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge1t0eXBlXX0gb3B0aW9ucyBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIEdlbmVyaWNBbmFseXplcihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBfLm1lcmdlKHtcbiAgICBsZXZlbHM6IDEwLFxuICAgIGZvcmJpZGRlbjogW10sXG4gICAgc3JjOiAnJyxcbiAgICBmdW5jdGlvbkNvbnN0cnVjdG9yczogR2VuZXJpY0FuYWx5emVyLlNIT1dfRlVOQ1RJT05fQ09OU1RSVUNUT1JTLFxuICAgIHJlbmRlckVhY2hUaW1lOiBmYWxzZSxcbiAgICBhbGxGdW5jdGlvbnM6IGZhbHNlXG4gIH0sIG9wdGlvbnMpO1xuICAvKipcbiAgICpcbiAgICogQHR5cGUge1t0eXBlXX1cbiAgICovXG4gIHRoaXMuZ2xvYmFsID0gb3B0aW9ucy5nbG9iYWw7XG4gIHRoaXMuZGlzcGxheW5hbWUgPSBvcHRpb25zLmRpc3BsYXluYW1lO1xuICAvKipcbiAgICogIyBvZiB1bmlxdWUgb2JqZWN0cyB0byBiZSBhbmFseXplZCBkdXJpbmcgdGhlIGBpbnNwZWN0YCBwaGFzZVxuICAgKiBAdHlwZSB7bnVtYmVyfSBbbGV2ZWxzPTEwXVxuICAgKi9cbiAgdGhpcy5sZXZlbHMgPSBvcHRpb25zLmhhc093blByb3BlcnR5KCdsZXZlbHMnKSA/IG9wdGlvbnMubGV2ZWxzIDogMTA7XG4gIC8qKlxuICAgKiBPYmplY3RzIHdoaWNoIGFyZSBmb3JiaWRkZW5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMuZm9yYmlkZGVuID0gb3B0aW9ucy5mb3JiaWRkZW4gfHwgW107XG4gIHRoaXMuc3JjID0gb3B0aW9ucy5zcmM7XG4gIHRoaXMuX2hhc2ZjID0gb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnZnVuY3Rpb25jb25zdHJ1Y3RvcnMnKTtcbiAgdGhpcy5mdW5jdGlvbmNvbnN0cnVjdG9ycyA9IHRoaXMuX2hhc2ZjID9cbiAgICBvcHRpb25zLmZ1bmN0aW9uY29uc3RydWN0b3JzIDogR2VuZXJpY0FuYWx5emVyLlNIT1dfRlVOQ1RJT05fQ09OU1RSVUNUT1JTO1xuICB0aGlzLnJlbmRlcmVhY2h0aW1lID0gb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgncmVuZGVyZWFjaHRpbWUnKSA/XG4gICAgb3B0aW9ucy5yZW5kZXJlYWNodGltZSA6IGZhbHNlO1xuICB0aGlzLmFsbGZ1bmN0aW9ucyA9IG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2FsbGZ1bmN0aW9ucycpID9cbiAgICBvcHRpb25zLmFsbGZ1bmN0aW9ucyA6IGZhbHNlO1xuXG4gIHRoaXMuaW5zcGVjdGVkID0gZmFsc2U7XG5cbiAgLy8gcGFyc2UgZm9yYmlkIHN0cmluZyB0byBhcnJheVxuICB0aGlzLnBhcnNlKCk7XG5cbiAgdGhpcy5hbmFseXplciA9IGFuYWx5emVyKHtcbiAgICBmdW5jdGlvbkNvbnN0cnVjdG9yczogdGhpcy5mdW5jdGlvbmNvbnN0cnVjdG9ycyxcbiAgICBhbGxGdW5jdGlvbnM6IHRoaXMuYWxsZnVuY3Rpb25zXG4gIH0pO1xufVxuXG5HZW5lcmljQW5hbHl6ZXIuU0hPV19CVUlMVElOID0gZmFsc2U7XG5HZW5lcmljQW5hbHl6ZXIuU0hPV19GVU5DVElPTl9DT05TVFJVQ1RPUlMgPSB0cnVlO1xuR2VuZXJpY0FuYWx5emVyLkZPUkJJRERFTiA9ICdwb2pvdml6OndpbmRvdyxwb2pvdml6OmJ1aWx0SW4sZG9jdW1lbnQnO1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIGNvbnNvbGUubG9nKCclY1Bvam9WaXonLCAnZm9udC1zaXplOiAxNXB4OyBjb2xvcjogJyk7XG4gIHJldHVybiBtZS5mZXRjaCgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG1lLnJlbmRlcmVhY2h0aW1lIHx8ICFtZS5pbnNwZWN0ZWQpIHtcbiAgICAgICAgbWUuaW5zcGVjdCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lO1xuICAgIH0pO1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiB0aGlzLmZvcmJpZGRlbiA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmZvcmJpZGRlbiA9IHRoaXMuZm9yYmlkZGVuLnNwbGl0KCcsJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiB0aGlzLmZ1bmN0aW9uY29uc3RydWN0b3JzID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMgPSB0aGlzLmZ1bmN0aW9uY29uc3RydWN0b3JzID09PSAndHJ1ZSc7XG4gIH1cbiAgaWYgKHR5cGVvZiB0aGlzLnJlbmRlcmVhY2h0aW1lID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMucmVuZGVyZWFjaHRpbWUgPSB0aGlzLnJlbmRlcmVhY2h0aW1lID09PSAndHJ1ZSc7XG4gIH1cbiAgaWYgKHR5cGVvZiB0aGlzLmFsbGZ1bmN0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmFsbGZ1bmN0aW9ucyA9IHRoaXMuYWxsZnVuY3Rpb25zID09PSAndHJ1ZSc7XG4gIH1cbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUubWFya0RpcnR5ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmluc3BlY3RlZCA9IGZhbHNlO1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ2FuYWx5emluZyB3aW5kb3cuJyArIHRoaXMuZ2xvYmFsKTtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICBhbmFseXplciA9IHRoaXMuYW5hbHl6ZXIsXG4gICAgZm9yYmlkZGVuID0gW10uY29uY2F0KHRoaXMuZm9yYmlkZGVuKTtcbiAgLy8gc2V0IGEgcHJlZGVmaWVkIGdsb2JhbFxuICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKHdpbmRvd1t0aGlzLmdsb2JhbF0sIHRoaXMuZ2xvYmFsKTtcbiAgLy8gY2xlYW5cbiAgYW5hbHl6ZXIuZ2V0T2JqZWN0cygpLmVtcHR5KCk7XG4gIGFuYWx5emVyLmZvcmJpZGRlbi5lbXB0eSgpO1xuICBhbmFseXplci5zZXRMZXZlbHModGhpcy5sZXZlbHMpO1xuXG4gIC8vIHNldHRpbmdzID4gc2hvdyBsaW5rcyB0byBidWlsdCBpbiBvYmplY3RzXG4gIGlmICghR2VuZXJpY0FuYWx5emVyLlNIT1dfQlVJTFRJTikge1xuICAgIGZvcmJpZGRlbiA9IGZvcmJpZGRlbi5jb25jYXQoXG4gICAgICBHZW5lcmljQW5hbHl6ZXIuRk9SQklEREVOLnNwbGl0KCcsJylcbiAgICApO1xuICB9XG5cbiAgZm9yYmlkZGVuLmZvckVhY2goZnVuY3Rpb24oZikge1xuICAgIHZhciBhcnIsXG4gICAgICB0b2tlbnM7XG4gICAgaWYgKCFmLmluZGV4T2YoJ3Bvam92aXo6JykpIHtcbiAgICAgIHRva2VucyA9IGYuc3BsaXQoJzonKTtcbiAgICAgIGFyciA9IHJlcXVpcmUoJy4uL09iamVjdEhhc2hlcycpW3Rva2Vuc1sxXV0uZ2V0T2JqZWN0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcnIgPSBbd2luZG93W2ZdXTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2ZvcmJpZGRpbmc6ICcsIGFycik7XG4gICAgYW5hbHl6ZXIuZm9yYmlkKGFyciwgdHJ1ZSk7XG4gIH0pO1xuXG4gIGFuYWx5emVyLmFkZChbd2luZG93W3RoaXMuZ2xvYmFsXV0pO1xuXG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLm1hcmtJbnNwZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIG1hcmsgdGhpcyBjb250YWluZXIgYXMgaW5zcGVjdGVkXG4gIHRoaXMuaW5zcGVjdGVkID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXNcbiAgICAubWFya0luc3BlY3RlZCgpXG4gICAgLmluc3BlY3RTZWxmKCk7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLnByZVJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgc2NyaXB0O1xuXG4gIGZ1bmN0aW9uIGdldFZhbHVlKCkge1xuICAgIHJldHVybiB3aW5kb3dbbWUuZ2xvYmFsXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb21pc2lmeSh2KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbignZmV0Y2hpbmcgc2NyaXB0ICcgKyB2LCB0cnVlKTtcbiAgICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICAgIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0LnNyYyA9IHY7XG4gICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlZCBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGdldFZhbHVlKCkpO1xuICAgICAgfTtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH1cblxuICBpZiAodGhpcy5zcmMpIHtcbiAgICBpZiAoZ2V0VmFsdWUoKSkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc291cmNlIGFscmVhZHkgZmV0Y2hlZCAnICsgdGhpcy5zcmMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3JjcyA9IHRoaXMuc3JjLnNwbGl0KCd8Jyk7XG4gICAgICByZXR1cm4gc3Jjcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHByZXYudGhlbihwcm9taXNpZnkoY3VycmVudCkpO1xuICAgICAgfSwgUSgncmVkdWNlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBRKHRydWUpO1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5zaG93U2VhcmNoID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBub2RlUHJvcGVydHkpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgd2luZG93Lm9wZW4oXG4gICAgXy50ZW1wbGF0ZSgnJHtzZWFyY2hFbmdpbmV9JHtsdWNreX0ke2xpYnJhcnlOYW1lfSAke25vZGVOYW1lfSAke25vZGVQcm9wZXJ0eX0nLCB7XG4gICAgICBzZWFyY2hFbmdpbmU6IHNlYXJjaEVuZ2luZSxcbiAgICAgIGx1Y2t5OiBHZW5lcmljQW5hbHl6ZXIubHVja3kgPyAnIWR1Y2t5JyA6ICcnLFxuICAgICAgbGlicmFyeU5hbWU6IG1lLmRpc3BsYXluYW1lIHx8IG1lLmdsb2JhbCxcbiAgICAgIG5vZGVOYW1lOiBub2RlTmFtZSxcbiAgICAgIG5vZGVQcm9wZXJ0eTogbm9kZVByb3BlcnR5XG4gICAgfSlcbiAgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2VuZXJpY0FuYWx5emVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vR2VuZXJpY0FuYWx5emVyJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5mdW5jdGlvbiBQT2JqZWN0KCkge1xuICBHZW5lcmljQW5hbHl6ZXIuY2FsbCh0aGlzKTtcbn1cblxuUE9iamVjdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG5QT2JqZWN0LnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ2luc3BlY3RpbmcgT2JqZWN0IG9iamVjdHMnKTtcbiAgdGhpcy5hbmFseXplci5hZGQodGhpcy5nZXRPYmplY3RzKCkpO1xufTtcblxuUE9iamVjdC5wcm90b3R5cGUuZ2V0T2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFtPYmplY3RdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQT2JqZWN0OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4uL3V0aWwvaGFzaEtleScpLFxuICBHZW5lcmljQW5hbHl6ZXIgPSByZXF1aXJlKCcuL0dlbmVyaWNBbmFseXplcicpO1xuXG52YXIgdG9JbnNwZWN0ID0gW3dpbmRvd107XG5cbmZ1bmN0aW9uIFdpbmRvdygpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcywge1xuICAgIGxldmVsczogMSxcbiAgICByZW5kZXJlYWNodGltZTogdHJ1ZSxcbiAgICBmdW5jdGlvbmNvbnN0cnVjdG9yczogZmFsc2VcbiAgfSk7XG59XG5cbldpbmRvdy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG5XaW5kb3cucHJvdG90eXBlLmdldE9iamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0b0luc3BlY3Q7XG59O1xuXG5XaW5kb3cucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnaW5zcGVjdGluZyB3aW5kb3cnKTtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICBoYXNoZXMgPSByZXF1aXJlKCcuLi9PYmplY3RIYXNoZXMnKTtcblxuICBfLmZvck93bihoYXNoZXMsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgaWYgKHYuZ2xvYmFsICYmIHdpbmRvd1t2Lmdsb2JhbF0pIHtcbiAgICAgIG1lLmFuYWx5emVyLmZvcmJpZChbd2luZG93W3YuZ2xvYmFsXV0sIHRydWUpO1xuICAgIH1cbiAgfSk7XG4gIHRoaXMuYW5hbHl6ZXIuZ2V0T2JqZWN0cygpLmVtcHR5KCk7XG4gIHRoaXMuYW5hbHl6ZXIuc2V0TGV2ZWxzKHRoaXMubGV2ZWxzKTtcbiAgdGhpcy5hbmFseXplci5hZGQobWUuZ2V0T2JqZWN0cygpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2luZG93OyIsInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIFEgPSByZXF1aXJlKCdxJyksXG4gIGRhZ3JlID0gcmVxdWlyZSgnZGFncmUnKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWwvJyksXG4gIE9iamVjdEhhc2hlcyA9IHJlcXVpcmUoJy4vT2JqZWN0SGFzaGVzJyk7XG5cbi8vIGVuYWJsZSBwcm9taXNlIGNoYWluIGRlYnVnXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgY29udGFpbmVyLCBvbGRDb250YWluZXI7XG52YXIgcmVuZGVyZXIsIG9sZFJlbmRlcmVyO1xudmFyIHBvam92aXo7XG5cbi8qKlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBwcm9jZXNzKGNvbnRhaW5lcikge1xuICB2YXIgZyA9IG5ldyBkYWdyZS5EaWdyYXBoKCksXG4gICAgICBwcm9wZXJ0aWVzLFxuICAgICAgbm9kZSxcbiAgICAgIGxpYnJhcnkgPSBjb250YWluZXIuYW5hbHl6ZXIsXG4gICAgICBzdHIgPSBsaWJyYXJ5LnN0cmluZ2lmeSgpLFxuICAgICAgbGlicmFyeU5vZGVzID0gc3RyLm5vZGVzLFxuICAgICAgbGlicmFyeUVkZ2VzID0gc3RyLmVkZ2VzO1xuXG4gIC8vIGNyZWF0ZSB0aGUgZ3JhcGhcbiAgLy8gZWFjaCBlbGVtZW50IG9mIHRoZSBncmFwaCBoYXNcbiAgLy8gLSBsYWJlbFxuICAvLyAtIHdpZHRoXG4gIC8vIC0gaGVpZ2h0XG4gIC8vIC0gcHJvcGVydGllc1xuICBfLmZvck93bihsaWJyYXJ5Tm9kZXMsIGZ1bmN0aW9uIChwcm9wZXJ0aWVzLCBrKSB7XG4gICAgdmFyIGxhYmVsID0gay5tYXRjaCgvXFxTKj8tKC4qKS8pWzFdO1xuICAgIC8vIGNvbnNvbGUubG9nKGssIGxhYmVsLmxlbmd0aCk7XG4gICAgbm9kZSA9IHtcbiAgICAgIGxhYmVsOiBrLFxuICAgICAgd2lkdGg6IGxhYmVsLmxlbmd0aCAqIDEwXG4gICAgfTtcbiAgICAvLyBsaW5lcyArIGhlYWRlciArIHBhZGRpbmcgYm90dG9tXG4gICAgbm9kZS5oZWlnaHQgPSBwcm9wZXJ0aWVzLmxlbmd0aCAqIDE1ICsgNTA7XG4gICAgbm9kZS5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgIG5vZGUud2lkdGggPSBNYXRoLm1heChub2RlLndpZHRoLCB2Lm5hbWUubGVuZ3RoICogMTApO1xuICAgIH0pO1xuICAgIGcuYWRkTm9kZShrLCBub2RlKTtcbiAgfSk7XG5cbiAgLy8gYnVpbGQgdGhlIGVkZ2VzIGZyb20gbm9kZSB0byBub2RlXG4gIF8uZm9yT3duKGxpYnJhcnlFZGdlcywgZnVuY3Rpb24gKGxpbmtzKSB7XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobGluaykge1xuICAgICAgaWYgKGcuaGFzTm9kZShsaW5rLmZyb20pICYmIGcuaGFzTm9kZShsaW5rLnRvKSkge1xuICAgICAgICBnLmFkZEVkZ2UobnVsbCwgbGluay5mcm9tLCBsaW5rLnRvKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gbGF5b3V0IG9mIHRoZSBncmFwaFxuICB2YXIgbGF5b3V0ID0gZGFncmUubGF5b3V0KClcbiAgICAubm9kZVNlcCgzMClcbiAgICAvLyAucmFua1NlcCg3MClcbiAgICAvLyAucmFua0RpcignVEInKVxuICAgIC5ydW4oZyk7XG5cbiAgdmFyIG5vZGVzID0gW10sXG4gICAgICBlZGdlcyA9IFtdLFxuICAgICAgY2VudGVyID0ge3g6IDAsIHk6IDB9LFxuICAgICAgbW4gPSB7eDogSW5maW5pdHksIHk6IEluZmluaXR5fSxcbiAgICAgIG14ID0ge3g6IC1JbmZpbml0eSwgeTogLUluZmluaXR5fSxcbiAgICAgIHRvdGFsID0gZy5ub2RlcygpLmxlbmd0aDtcblxuICAvLyB1cGRhdGUgdGhlIG5vZGUgaW5mbyBvZiB0aGUgbm9kZSBhZGRpbmc6XG4gIC8vIC0geFxuICAvLyAtIHlcbiAgLy8gLSBwcmVkZWNlc3NvcnNcbiAgLy8gLSBzdWNjZXNzb3JzXG4gIGxheW91dC5lYWNoTm9kZShmdW5jdGlvbiAoaywgbGF5b3V0SW5mbykge1xuICAgIHZhciB4ID0gbGF5b3V0SW5mby54O1xuICAgIHZhciB5ID0gbGF5b3V0SW5mby55O1xuXG4gICAgbm9kZSA9IGcubm9kZShrKTtcbiAgICBub2RlLnggPSB4O1xuICAgIG5vZGUueSA9IHk7XG4gICAgbm9kZS5wcmVkZWNlc3NvcnMgPSBnLnByZWRlY2Vzc29ycyhrKTtcbiAgICBub2RlLnN1Y2Nlc3NvcnMgPSBnLnN1Y2Nlc3NvcnMoayk7XG4gICAgbm9kZXMucHVzaChub2RlKTtcblxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgYmJveCBvZiB0aGUgZ3JhcGggdG8gY2VudGVyIHRoZSBncmFwaFxuICAgIHZhciBtbnggPSB4IC0gbm9kZS53aWR0aCAvIDI7XG4gICAgdmFyIG1ueSA9IHkgLSBub2RlLmhlaWdodCAvIDI7XG4gICAgdmFyIG14eCA9IHggKyBub2RlLndpZHRoIC8gMjtcbiAgICB2YXIgbXh5ID0geSArIG5vZGUuaGVpZ2h0IC8gMjtcblxuICAgIGNlbnRlci54ICs9IHg7XG4gICAgY2VudGVyLnkgKz0geTtcbiAgICBtbi54ID0gTWF0aC5taW4obW4ueCwgbW54KTtcbiAgICBtbi55ID0gTWF0aC5taW4obW4ueSwgbW55KTtcbiAgICAvLyBjb25zb2xlLmxvZyh4LCB5LCAnIGRpbSAnLCBub2RlLndpZHRoLCBub2RlLmhlaWdodCk7XG4gICAgbXgueCA9IE1hdGgubWF4KG14LngsIG14eCk7XG4gICAgbXgueSA9IE1hdGgubWF4KG14LnksIG14eSk7XG4gIH0pO1xuXG4gIGNlbnRlci54IC89ICh0b3RhbCB8fCAxKTtcbiAgY2VudGVyLnkgLz0gKHRvdGFsIHx8IDEpO1xuXG4gIC8vIGNyZWF0ZSB0aGUgZWRnZXMgZnJvbSBwcm9wZXJ0eSB0byBub2RlXG4gIF8obGlicmFyeUVkZ2VzKS5mb3JPd24oZnVuY3Rpb24gKGxpbmtzKSB7XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobGluaykge1xuICAgICAgaWYgKGcuaGFzTm9kZShsaW5rLmZyb20pICYmIGcuaGFzTm9kZShsaW5rLnRvKSkge1xuICAgICAgICBlZGdlcy5wdXNoKGxpbmspO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGVkZ2VzOiBlZGdlcyxcbiAgICBub2Rlczogbm9kZXMsXG4gICAgY2VudGVyOiBjZW50ZXIsXG4gICAgbW46IG1uLFxuICAgIG14OiBteFxuICB9O1xufVxuXG4vLyByZW5kZXJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgdmFyIGRhdGE7XG5cbiAgaWYgKGNvbnRhaW5lciA9PT0gb2xkQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdXRpbHMubm90aWZpY2F0aW9uKCdwcm9jZXNzaW5nICcgKyBjb250YWluZXIuZ2xvYmFsKTtcblxuICAvLyBwcmUgcmVuZGVyXG4gIG9sZFJlbmRlcmVyICYmIG9sZFJlbmRlcmVyLmNsZWFuKCk7XG4gIHJlbmRlcmVyLmNsZWFuKCk7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY29udGFpbmVyLnByZVJlbmRlcigpO1xuICAgIGNvbnNvbGUubG9nKCdwcm9jZXNzICYgcmVuZGVyIHN0YXJ0OiAnLCBuZXcgRGF0ZSgpKTtcbiAgICAvLyBkYXRhIGhhc1xuICAgIC8vIC0gZWRnZXMgKHByb3BlcnR5IC0+IG5vZGUpXG4gICAgLy8gLSBub2Rlc1xuICAgIC8vIC0gY2VudGVyXG4gICAgLy9cbiAgICBjb25zb2xlLnRpbWUoJ3Byb2Nlc3MnKTtcbiAgICBkYXRhID0gcHJvY2Vzcyhjb250YWluZXIpO1xuICAgIGNvbnNvbGUudGltZUVuZCgncHJvY2VzcycpO1xuXG4gICAgdXRpbHMubm90aWZpY2F0aW9uKCdyZW5kZXJpbmcgJyArIGNvbnRhaW5lci5nbG9iYWwpO1xuXG4gICAgY29uc29sZS50aW1lKCdyZW5kZXInKTtcbiAgICByZW5kZXJlci5yZW5kZXIoZGF0YSk7XG4gICAgY29uc29sZS50aW1lRW5kKCdyZW5kZXInKTtcblxuICAgIHV0aWxzLm5vdGlmaWNhdGlvbignY29tcGxldGUhJyk7XG4gIH0sIDApO1xufVxuXG4vLyBwdWJsaWMgYXBpXG5wb2pvdml6ID0ge1xuICByZW5kZXJlcnM6IHt9LFxuICBhZGRSZW5kZXJlcnM6IGZ1bmN0aW9uIChuZXdSZW5kZXJlcnMpIHtcbiAgICBfLm1lcmdlKHBvam92aXoucmVuZGVyZXJzLCBuZXdSZW5kZXJlcnMpO1xuICB9LFxuICBudWxsaWZ5Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgb2xkQ29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGNvbnRhaW5lciA9IG51bGw7XG4gIH0sXG4gIGdldENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjb250YWluZXI7XG4gIH0sXG4gIHNldENvbnRhaW5lcjogZnVuY3Rpb24gKGNvbnRhaW5lck5hbWUsIG9wdGlvbnMpIHtcbiAgICBvbGRDb250YWluZXIgPSBjb250YWluZXI7XG4gICAgY29udGFpbmVyID0gT2JqZWN0SGFzaGVzW2NvbnRhaW5lck5hbWVdO1xuXG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIGNvbnRhaW5lciA9IE9iamVjdEhhc2hlcy5jcmVhdGVOZXcoY29udGFpbmVyTmFtZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJlcXVpcmVkIHRvIGZldGNoIGV4dGVybmFsIHJlc291cmNlc1xuICAgICAgY29udGFpbmVyLnNyYyA9IG9wdGlvbnMuc3JjO1xuICAgIH1cblxuICAgIHJldHVybiBjb250YWluZXIuaW5pdCgpO1xuICB9LFxuICBzZXRSZW5kZXJlcjogZnVuY3Rpb24gKHIpIHtcbiAgICBvbGRSZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgIHJlbmRlcmVyID0gcG9qb3Zpei5yZW5kZXJlcnNbcl07XG4gIH0sXG4gIGdldFJlbmRlcmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9LFxuICByZW5kZXI6IHJlbmRlcixcblxuICAvLyBleHBvc2UgaW5uZXIgbW9kdWxlc1xuICBPYmplY3RIYXNoZXM6IHJlcXVpcmUoJy4vT2JqZWN0SGFzaGVzJyksXG4gIE9iamVjdEFuYWx5emVyOiByZXF1aXJlKCcuL09iamVjdEFuYWx5emVyJyksXG4gIGFuYWx5emVyOiB7XG4gICAgR2VuZXJpY0FuYWx5emVyOiByZXF1aXJlKCcuL2FuYWx5emVyL0dlbmVyaWNBbmFseXplcicpXG4gIH0sXG4gIHV0aWxzOiByZXF1aXJlKCcuL3V0aWwnKSxcblxuICAvLyB1c2VyIHZhcnNcbiAgdXNlclZhcmlhYmxlczogW11cbn07XG5cbi8vIGN1c3RvbSBldmVudHNcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb3BlcnR5LWNsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgdmFyIGRldGFpbCA9IGUuZGV0YWlsO1xuICBwb2pvdml6XG4gICAgLmdldENvbnRhaW5lcigpXG4gICAgLnNob3dTZWFyY2goZGV0YWlsLm5hbWUsIGRldGFpbC5wcm9wZXJ0eSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2pvdml6OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuL2hhc2hLZXknKTtcblxuZnVuY3Rpb24gSGFzaE1hcCgpIHtcbn1cblxuSGFzaE1hcC5wcm90b3R5cGUgPSB7XG4gIHB1dDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzW2hhc2hLZXkoa2V5KV0gPSAodmFsdWUgfHwga2V5KTtcbiAgfSxcbiAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXNbaGFzaEtleShrZXkpXTtcbiAgfSxcbiAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIHYgPSB0aGlzW2hhc2hLZXkoa2V5KV07XG4gICAgZGVsZXRlIHRoaXNbaGFzaEtleShrZXkpXTtcbiAgICByZXR1cm4gdjtcbiAgfSxcbiAgZW1wdHk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcCxcbiAgICAgICAgbWUgPSB0aGlzO1xuICAgIGZvciAocCBpbiBtZSkge1xuICAgICAgaWYgKG1lLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzW3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYXNoTWFwOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgYXNzZXJ0ID0gcmVxdWlyZSgnLi8nKS5hc3NlcnQsXG4gIG1lLCBoYXNoS2V5O1xuXG5mdW5jdGlvbiBpc09iamVjdE9yRnVuY3Rpb24odikge1xuICByZXR1cm4gdiAmJiAodHlwZW9mIHYgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBHZXRzIGEgc3RvcmUgaGFzaGtleSBvbmx5IGlmIGl0J3MgYW4gb2JqZWN0XG4gKiBAcGFyYW0gIHtbdHlwZV19IG9ialxuICogQHJldHVybiB7W3R5cGVdfVxuICovXG5mdW5jdGlvbiBnZXQob2JqKSB7XG4gIGFzc2VydChpc09iamVjdE9yRnVuY3Rpb24ob2JqKSwgJ29iaiBtdXN0IGJlIGFuIG9iamVjdHxmdW5jdGlvbicpO1xuICByZXR1cm4gb2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgb2JqLmhhc093blByb3BlcnR5KG1lLmhpZGRlbktleSkgJiZcbiAgICBvYmpbbWUuaGlkZGVuS2V5XTtcbn1cblxuLyoqXG4gKiBTZXRzIGEga2V5IG9uIGFuIG9iamVjdFxuICogQHBhcmFtIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge1t0eXBlXX0ga2V5IFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gc2V0KG9iaiwga2V5KSB7XG4gIGFzc2VydChpc09iamVjdE9yRnVuY3Rpb24ob2JqKSwgJ29iaiBtdXN0IGJlIGFuIG9iamVjdHxmdW5jdGlvbicpO1xuICBhc3NlcnQoXG4gICAga2V5ICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnLFxuICAgICdUaGUga2V5IG5lZWRzIHRvIGJlIGEgdmFsaWQgc3RyaW5nJ1xuICApO1xuICBpZiAoIWdldChvYmopKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbWUuaGlkZGVuS2V5LCB7XG4gICAgICB2YWx1ZTogdHlwZW9mIG9iaiArICctJyArIGtleVxuICAgIH0pO1xuICB9XG4gIHJldHVybiBtZTtcbn1cblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHZhbHVlID0gdixcbiAgICAgIHVpZCA9IHY7XG5cbiAgaWYgKGlzT2JqZWN0T3JGdW5jdGlvbih2KSkge1xuICAgIGlmICghZ2V0KHYpKSB7XG4gICAgICBtZS5jcmVhdGVIYXNoS2V5c0Zvcih2KTtcbiAgICB9XG4gICAgdWlkID0gZ2V0KHYpO1xuICAgIGlmICghdWlkKSB7XG4gICAgICBjb25zb2xlLmVycignbm8gaGFzaGtleSA6KCcsIHYpO1xuICAgIH1cbiAgICBhc3NlcnQodWlkLCAnZXJyb3IgZ2V0dGluZyB0aGUga2V5Jyk7XG4gICAgcmV0dXJuIHVpZDtcbiAgfVxuXG4gIC8vIHYgaXMgYSBwcmltaXRpdmVcbiAgcmV0dXJuIHR5cGVvZiB2ICsgJy0nICsgdWlkO1xufTtcbm1lLmhpZGRlbktleSA9ICdfX3Bvam9WaXpLZXlfXyc7XG5cbm1lLmNyZWF0ZUhhc2hLZXlzRm9yID0gZnVuY3Rpb24gKG9iaiwgbmFtZSkge1xuXG4gIGZ1bmN0aW9uIGxvY2FsVG9TdHJpbmcob2JqKSB7XG4gICAgdmFyIG1hdGNoO1xuICAgIHRyeSB7XG4gICAgICBtYXRjaCA9IHt9LnRvU3RyaW5nLmNhbGwob2JqKS5tYXRjaCgvXlxcW29iamVjdCAoXFxTKj8pXFxdLyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgdGhlIGludGVybmFsIHByb3BlcnR5IFtbQ2xhc3NdXSB0byBndWVzcyB0aGUgbmFtZVxuICAgKiBvZiB0aGlzIG9iamVjdCwgZS5nLiBbb2JqZWN0IERhdGVdLCBbb2JqZWN0IE1hdGhdXG4gICAqIE1hbnkgb2JqZWN0IHdpbGwgZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgKHRoZXkgd2lsbCBtYXRjaCBbb2JqZWN0IE9iamVjdF0pXG4gICAqIHNvIGxldCdzIGNvbnNpZGVyIE9iamVjdCBhcyB0aGUgbmFtZSBvbmx5IGlmIGl0J3MgZXF1YWwgdG9cbiAgICogT2JqZWN0LnByb3RvdHlwZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBvYmpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGZ1bmN0aW9uIGhhc0FDbGFzc05hbWUob2JqKSB7XG4gICAgdmFyIG1hdGNoID0gbG9jYWxUb1N0cmluZyhvYmopO1xuICAgIGlmIChtYXRjaCA9PT0gJ09iamVjdCcpIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdC5wcm90b3R5cGUgJiYgJ09iamVjdCc7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5hbWUob2JqKSB7XG4gICAgdmFyIG5hbWUsIGNsYXNzTmFtZTtcblxuICAgIC8vIHJldHVybiB0aGUgYWxyZWFkeSBnZW5lcmF0ZWQgaGFzaEtleVxuICAgIGlmIChnZXQob2JqKSkge1xuICAgICAgcmV0dXJuIGdldChvYmopO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGEgbmV3IGtleSBiYXNlZCBvblxuICAgIC8vIC0gdGhlIG5hbWUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gICAgLy8gLSBhIHVuaXF1ZSBpZFxuICAgIG5hbWUgPSB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmXG4gICAgICB0eXBlb2Ygb2JqLm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICBvYmoubmFtZTtcblxuICAgIGNsYXNzTmFtZSA9IGhhc0FDbGFzc05hbWUob2JqKTtcbiAgICBpZiAoIW5hbWUgJiYgY2xhc3NOYW1lKSB7XG4gICAgICBuYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cblxuICAgIG5hbWUgPSBuYW1lIHx8IF8udW5pcXVlSWQoKTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIHRoZSBuYW1lIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQgbmFtZSBvciB0aGVcbiAgLy8gZ2VuZXJhdGVkIG5hbWVcbiAgbmFtZSA9IG5hbWUgfHwgZ2V0TmFtZShvYmopO1xuICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFwuIF0vaW1nLCAnLScpO1xuXG4gIC8vIGlmIHRoZSBvYmogaXMgYSBwcm90b3R5cGUgdGhlbiB0cnkgdG8gYW5hbHl6ZVxuICAvLyB0aGUgY29uc3RydWN0b3IgZmlyc3Qgc28gdGhhdCB0aGUgcHJvdG90eXBlIGJlY29tZXNcbiAgLy8gW25hbWVdLnByb3RvdHlwZVxuICAvLyBzcGVjaWFsIGNhc2U6IG9iamVjdC5jb25zdHJ1Y3RvciA9IG9iamVjdFxuICBpZiAob2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3RvciAhPT0gb2JqKSB7XG4gICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iob2JqLmNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIC8vIHNldCBuYW1lIG9uIHNlbGZcbiAgc2V0KG9iaiwgbmFtZSk7XG5cbiAgLy8gc2V0IG5hbWUgb24gdGhlIHByb3RvdHlwZVxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgIHNldChvYmoucHJvdG90eXBlLCBuYW1lICsgJy1wcm90b3R5cGUnKTtcbiAgfVxufTtcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHYuaGFzT3duUHJvcGVydHkgJiZcbiAgICB2Lmhhc093blByb3BlcnR5KG1lLmhpZGRlbktleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvbiA9IHtcbiAgJ1tbUHJvdG90eXBlXV0nOiAnX19wcm90b19fJ1xufTtcblxudmFyIHV0aWxzID0ge1xuICBhc3NlcnQ6IGZ1bmN0aW9uICh2LCBtZXNzYWdlKSB7XG4gICAgaWYgKCF2KSB7XG4gICAgICB0aHJvdyBtZXNzYWdlIHx8ICdlcnJvcic7XG4gICAgfVxuICB9LFxuICB0cmFuc2xhdGU6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh4IHx8IDApICsgJywgJyArICh5IHx8IDApICsgJyknO1xuICB9LFxuICBzY2FsZTogZnVuY3Rpb24gKHMpIHtcbiAgICByZXR1cm4gJ3NjYWxlKCcgKyAocyB8fCAxKSArICcpJztcbiAgfSxcbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHQgPSBbXTtcbiAgICBfLmZvck93bihvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICB0LnB1c2godXRpbHNba10uYXBwbHkodXRpbHMsIHYpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdC5qb2luKCcgJyk7XG4gIH0sXG4gIHByZWZpeGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KCdwdicpO1xuICAgIHJldHVybiBhcmdzLmpvaW4oJy0nKTtcbiAgfSxcbiAgdHJhbnNmb3JtUHJvcGVydHk6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvbi5oYXNPd25Qcm9wZXJ0eSh2KSkge1xuICAgICAgcmV0dXJuIHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvblt2XTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH0sXG4gIGVzY2FwZUNsczogZnVuY3Rpb24odikge1xuICAgIHJldHVybiB2LnJlcGxhY2UoL1xcJC9nLCAnXycpO1xuICB9LFxuICB0b1F1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHMgPSAnJyxcbiAgICAgICAgaSA9IDA7XG4gICAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgaWYgKGkpIHtcbiAgICAgICAgcyArPSAnJic7XG4gICAgICB9XG4gICAgICBzICs9IGsgKyAnPScgKyB2O1xuICAgICAgaSArPSAxO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9LFxuICBjcmVhdGVFdmVudDogZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICBkZXRhaWw6IGRldGFpbHNcbiAgICB9KTtcbiAgfSxcbiAgbm90aWZpY2F0aW9uOiBmdW5jdGlvbiAobWVzc2FnZSwgY29uc29sZVRvbykge1xuICAgIHZhciBldiA9IHV0aWxzLmNyZWF0ZUV2ZW50KCdwb2pvdml6LW5vdGlmaWNhdGlvbicsIG1lc3NhZ2UpO1xuICAgIGNvbnNvbGVUb28gJiYgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG4gIH0sXG4gIGNyZWF0ZUpzb25wQ2FsbGJhY2s6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7Il19
(11)
});
