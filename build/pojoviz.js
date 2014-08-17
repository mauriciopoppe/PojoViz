!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.pojoviz=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"lodash":[function(_dereq_,module,exports){
module.exports=_dereq_('K2RcUv');
},{}],"q":[function(_dereq_,module,exports){
module.exports=_dereq_('qLuPo1');
},{}],3:[function(_dereq_,module,exports){
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
        v.match(/[:+~!><=//\[\]@ ]/);
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

        // if (v.hasOwnProperty('__processed__')) {
        //   debugger;
        //   throw 'wtf';
        // }
        // Object.defineProperty(v, '__processed__', {
        //   value: 'processsed'
        // });

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

},{"./util/HashMap":11,"./util/hashKey":12,"lodash":"K2RcUv"}],4:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash'),
  Generic = _dereq_('./analyzer/GenericAnalyzer'),
  Angular = _dereq_('./analyzer/Angular'),
  Window = _dereq_('./analyzer/Window'),
  PObject = _dereq_('./analyzer/Object'),
  BuiltIn = _dereq_('./analyzer/BuiltIn');

var libraries;

var proto = {
  createNew: function (global, options) {
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
  }),
});

// console.log(libraries);

// win max level initially is 0
// libraries.win.preRender = function () {
//   libraries.win.getObjects().empty();
//   libraries.win.analyzeObjects([window], 0);
// };

// console.log(builtIn.getObjects());
// console.log(win.getObjects());
// console.log(user.getObjects());

module.exports = libraries;
},{"./analyzer/Angular":5,"./analyzer/BuiltIn":6,"./analyzer/GenericAnalyzer":7,"./analyzer/Object":8,"./analyzer/Window":9,"lodash":"K2RcUv"}],5:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./GenericAnalyzer'),
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
  this.analyzer.getObjects().empty();
  this.analyzer.add(
    [window.angular].concat(this.getSelectedServices())
  );
};

module.exports = Angular;
},{"../util/hashKey":12,"./GenericAnalyzer":7}],6:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./GenericAnalyzer'),
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

BuiltIn.prototype.getObjects = function () {
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
},{"../util":13,"./GenericAnalyzer":7}],7:[function(_dereq_,module,exports){
'use strict';

var Q = _dereq_('q'),
  _ = _dereq_('lodash'),
  utils = _dereq_('../util/'),
  hashKey = _dereq_('../util/hashKey'),
  analyzer = _dereq_('../ObjectAnalyzer');

var searchEngine = 'https://duckduckgo.com/?q=';

function GenericAnalyzer(options) {
  options = options || {};
  // if (!name) {
  //   throw 'name needs to be defined';
  // }
  this.global = options.global;
  this.displayname = options.displayname;
  this.levels = options.hasOwnProperty('levels') ? options.levels : 10;
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
  analyzer.getObjects().empty();
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
      arr = _dereq_('../ObjectHashes')[tokens[1]].getObjects();
    } else {
      arr = [window[f]];
    }
    console.log('forbidding: ', arr);
    analyzer.forbid(arr, true);
  });

  analyzer.add([window[this.global]]);

};

GenericAnalyzer.prototype.markInspected = function () {
  // mark this container as inspected
  this.inspected = true;
  return this;
};

GenericAnalyzer.prototype.inspect = function () {
  this
    .markInspected()
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
},{"../ObjectAnalyzer":3,"../ObjectHashes":4,"../util/":13,"../util/hashKey":12,"lodash":"K2RcUv","q":"qLuPo1"}],8:[function(_dereq_,module,exports){
'use strict';

var GenericAnalyzer = _dereq_('./GenericAnalyzer'),
  utils = _dereq_('../util');

function PObject() {
  GenericAnalyzer.call(this);
}

PObject.prototype = Object.create(GenericAnalyzer.prototype);

PObject.prototype.inspectSelf = function () {
  console.log('inspecting Object objects');
  this.analyzer.add(this.getObjects());
};

PObject.prototype.getObjects = function () {
  return [Object];
};

module.exports = PObject;
},{"../util":13,"./GenericAnalyzer":7}],9:[function(_dereq_,module,exports){
'use strict';

var _ = _dereq_('lodash'),
  hashKey = _dereq_('../util/hashKey'),
  GenericAnalyzer = _dereq_('./GenericAnalyzer');

var toInspect = [window];

function Window() {
  GenericAnalyzer.call(this, {
    levels: 1,
    rendereachtime: true,
    functionconstructors: false
  });
}

Window.prototype = Object.create(GenericAnalyzer.prototype);

Window.prototype.getObjects = function () {
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
  this.analyzer.getObjects().empty();
  this.analyzer.setLevels(this.levels);
  this.analyzer.add(me.getObjects());
};

module.exports = Window;
},{"../ObjectHashes":4,"../util/hashKey":12,"./GenericAnalyzer":7,"lodash":"K2RcUv"}],10:[function(_dereq_,module,exports){
(function (global){
var _ = _dereq_('lodash'),
  Q = _dereq_('q'),
  dagre = (typeof window !== "undefined" ? window.dagre : typeof global !== "undefined" ? global.dagre : null),
  utils = _dereq_('./util/'),
  ObjectHashes = _dereq_('./ObjectHashes');

// enable long stacks
Q.longStackSupport = true;

var container,
  oldContainer,
  oldRenderer,
  renderer,
  pojoviz;      // namespace

function process() {
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
    data = process();
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
      container = ObjectHashes.createNew(containerName, options);
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
    GenericAnalyzer: _dereq_('./analyzer/GenericAnalyzer')
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
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ObjectAnalyzer":3,"./ObjectHashes":4,"./analyzer/GenericAnalyzer":7,"./util":13,"./util/":13,"lodash":"K2RcUv","q":"qLuPo1"}],11:[function(_dereq_,module,exports){
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
},{"./hashKey":12}],12:[function(_dereq_,module,exports){
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

    // return the already generated hashKey
    if (get(obj)) {
      return get(obj);
    }

    // generate a new key based on
    // - the name if it's a function
    // - a unique id
    name = typeof obj.name === 'string' &&
      obj.name;

    className = hasAClassName(obj);
    if (!name && className) {
      name = className;
    }

    name = name || _.uniqueId();
    name = name.replace(/[\. ]/img, '-');
    return name;
  }

  // the name is equal to the passed name or the
  // generated name
  name = name || getName(obj);

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
},{"./":13,"lodash":"K2RcUv"}],13:[function(_dereq_,module,exports){
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
},{"lodash":"K2RcUv"}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9PYmplY3RBbmFseXplci5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvT2JqZWN0SGFzaGVzLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9Bbmd1bGFyLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9CdWlsdEluLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9HZW5lcmljQW5hbHl6ZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL2FuYWx5emVyL09iamVjdC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvV2luZG93LmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvdXRpbC9IYXNoTWFwLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy91dGlsL2hhc2hLZXkuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL3V0aWwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEhhc2hNYXAgPSByZXF1aXJlKCcuL3V0aWwvSGFzaE1hcCcpLFxuICBoYXNoS2V5ID0gcmVxdWlyZSgnLi91dGlsL2hhc2hLZXknKSxcbiAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG4vLyB1dGlsc1xuZnVuY3Rpb24gZWFjaE9iamVjdEFuZFByb3RvdHlwZShvYmosIGZuKSB7XG4gIGZuKG9iaik7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoJ3Byb3RvdHlwZScpKSB7XG4gICAgZm4ob2JqLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHdpdGggYW5vdGhlclxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gICB3cmFwcGVyXG4gKiBAcmV0dXJuIHsqfVxuICovXG5mdW5jdGlvbiB3cmFwRm4oZm4sIHdyYXBwZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBOT1RFOiBgdGhpc2Agd2lsbCBiZSB0aGUgaW5zdGFuY2VcbiAgICB3cmFwcGVyLmNhbGwodGhpcyk7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpc09iamVjdE9yRnVuY3Rpb24odikge1xuICByZXR1cm4gISEodiAmJiAodHlwZW9mIHYgPT09ICdvYmplY3QnIHx8XG4gICAgdHlwZW9mIHYgPT09ICdmdW5jdGlvbicpKTtcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvcmJpZGRlbiBpbiBzdHJpY3QgbW9kZVxuICogQHR5cGUge0FycmF5fVxuICovXG52YXIgZm9yYmlkZGVuSW5TdHJpY3RNb2RlID0gW1xuICAnY2FsbGVlJywgJ2NhbGxlcicsICdhcmd1bWVudHMnXG5dO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogT2JqZWN0IGFuYWx5elxuICogQHBhcmFtIHtbdHlwZV19IGNvbmZpZyBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIEFuYWx5emVyKGNvbmZpZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQW5hbHl6ZXIpKSB7XG4gICAgcmV0dXJuIG5ldyBBbmFseXplcihjb25maWcpO1xuICB9XG4gIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblxuICAvKipcbiAgICogT2JqZWN0cyByZWdpc3RlcmVkIGluIHRoaXMgaW5zdGFuY2VcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLm9iamVjdHMgPSBjb25maWcub2JqZWN0cyB8fCBuZXcgSGFzaE1hcCgpO1xuICAvKipcbiAgICogRm9yYmlkZGVuIG9iamVjdHNcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlbiA9IGNvbmZpZy5mb3JiaWRkZW4gfHwgbmV3IEhhc2hNYXAoKTtcblxuICAvKipcbiAgICogQ2FjaGUgb2YgcHJvcGVydGllc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5fX2NhY2hlT2JqZWN0cyA9IHt9O1xuXG4gIC8qKlxuICAgKiBDYWNoZSBvZiBsaW5rc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5fX2NhY2hlTGlua3MgPSB7fTtcblxuICAvKipcbiAgICogRGZzIGxldmVsc1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5sZXZlbHMgPSBJbmZpbml0eTtcbiAgLyoqXG4gICAqIElmIHRoZSBhbmFseXplciBpcyBkaXJ0eSB0aGVuIGl0IGhhcyBzb21lIHBlbmRpbmcgd29ya1xuICAgKiB0byBkb1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGlydHkgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUcnVlIHRvIHNhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdHMgYW5hbHl6ZWQgaW4gYW5cbiAgICogaW50ZXJuYWwgY2FjaGVcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmNhY2hlID1cbiAgICBjb25maWcuaGFzT3duUHJvcGVydHkoJ2NhY2hlJykgP1xuICAgIGNvbmZpZy5jYWNoZSA6IHRydWU7XG4gIC8qKlxuICAgKiBUcnVlIHRvIGluY2x1ZGUgZnVuY3Rpb24gY29uc3RydWN0b3JzIGluIHRoZSBhbmFseXNpcyBncmFwaFxuICAgKiBpLmUuIHRoZSBmdW5jdGlvbnMgdGhhdCBoYXZlIGEgcHJvdG90eXBlXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5mdW5jdGlvbkNvbnN0cnVjdG9ycyA9XG4gICAgY29uZmlnLmhhc093blByb3BlcnR5KCdmdW5jdGlvbkNvbnN0cnVjdG9ycycpID9cbiAgICBjb25maWcuZnVuY3Rpb25Db25zdHJ1Y3RvcnMgOiBmYWxzZTtcbiAgLyoqXG4gICAqIFRydWUgdG8gaW5jbHVkZSBhbGwgdGhlIGZ1bmN0aW9ucyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGhcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmFsbEZ1bmN0aW9ucyA9XG4gICAgY29uZmlnLmhhc093blByb3BlcnR5KCdhbGxGdW5jdGlvbnMnKSA/XG4gICAgY29uZmlnLmFsbEZ1bmN0aW9ucyA6IGZhbHNlO1xuICAvKipcbiAgICogVHJ1ZSB0byBhbGxvdyBIVE1MIG5vZGVzXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5odG1sTm9kZSA9XG4gICAgY29uZmlnLmhhc093blByb3BlcnR5KCdodG1sTm9kZScpID9cbiAgICBjb25maWcuaHRtbE5vZGUgOiBmYWxzZTtcbn1cblxuQW5hbHl6ZXIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQW5hbHl6ZXIsXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgaW4gdGhlIGZvcmJpZGRlbiBoYXNoXG4gICAqIEBwYXJhbSAge09iamVjdH0gIG9ialxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNGb3JiaWRkZW46IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gdGhpcy5mb3JiaWRkZW4uZ2V0KG9iaik7XG4gIH0sXG5cbiAgaXNMaW5rYWJsZTogZnVuY3Rpb24gKGtleSwgb2JqKSB7XG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgdiA9IHR5cGVvZiBvYmogPT09ICdvYmplY3QnO1xuXG4gICAgLy8gaWYgKHYpIHtcbiAgICAvLyAgIGlmICghdGhpcy5odG1sTm9kZSAmJiB2IGluc3RhbmNlb2YgTm9kZSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAvLyAgIHJldHVybiB0cnVlO1xuICAgIC8vIH1cblxuICAgIC8vIGlmICghdGhpcy5odG1sTm9kZSkge1xuICAgIC8vICAgdiA9IHYgJiYgISh2IGluc3RhbmNlb2YgTm9kZSk7XG4gICAgLy8gfWZkZXExYFxuXG4gICAgLy8gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIC8vICAgY29uc29sZS5sb2coT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKSk7XG4gICAgaWYgKCF2ICYmIHRoaXMuYWxsRnVuY3Rpb25zKSB7XG4gICAgICAvLyBtaW5pbWl6ZSB0aGUgbm9kZXMgY3JlYXRlZCBieSBjb25zaWRlcmluZyBmdW5jdGlvbnNcbiAgICAgIC8vIHdpdGggbW9yZSBwcm9wZXJ0aWVzIHRoYW4gdGhlIHVzdWFsIG9uZXNcbiAgICAgIHYgPSB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgICAgdiA9IHYgJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5sZW5ndGggPiA1O1xuICAgIH1cbiAgICBpZiAoIXYgJiYgdGhpcy5mdW5jdGlvbkNvbnN0cnVjdG9ycykge1xuICAgICAgdiA9IHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgICB2ID0gdiAmJiAoXG4gICAgICAgIG9iai5uYW1lICYmXG4gICAgICAgIG9iai5uYW1lWzBdLm1hdGNoKC9eW0EtWl0vKSB8fFxuICAgICAgICBrZXlbMF0ubWF0Y2goL15bQS1aXS8pXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFuIG9iamVjdCBkaXNjYXJkaW5nXG4gICAqIGZvcmJpZGRlbiBvbmVzXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBvZiBvYmplY3RzLCBlYWNoIG9iamVjdCBoYXMgdGhlIGZvbGxvd2luZ1xuICAgKiBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAtIG5hbWVcbiAgICogLSBjbHNcbiAgICogLSB0eXBlXG4gICAqIC0gbGlua2VhYmxlIChpZiBpdCdzIGFuIG9iamVjdCB0aGlzIHByb3BlcnR5IGlzIHNldCB0byB0cnVlKVxuICAgKi9cbiAgZ2V0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgbGlua2FibGVPbmx5KSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgIGhrID0gaGFzaEtleShvYmopLFxuICAgICAgcHJvcGVydGllcztcblxuICAgIGlmICghb2JqKSB7XG4gICAgICB0aHJvdyAndGhpcyBtZXRob2QgbmVlZHMgYW4gb2JqZWN0IHRvIGFuYWx5emUnO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlKSB7XG4gICAgICBpZiAoIWxpbmthYmxlT25seSAmJiB0aGlzLl9fY2FjaGVPYmplY3RzW2hrXSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnb2JqZWN0cyBmcm9tIGNhY2hlIDopJyk7XG4gICAgICAgIHJldHVybiB0aGlzLl9fY2FjaGVPYmplY3RzW2hrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKTtcblxuICAgIGZ1bmN0aW9uIGZvcmJpZGRlbktleSh2KSB7XG4gICAgICAvLyBmb3JiaWRkZW4gaW4gc3RyaWN0IG1vZGVcbiAgICAgIHJldHVybiB+Zm9yYmlkZGVuSW5TdHJpY3RNb2RlLmluZGV4T2YodikgfHxcbiAgICAgICAgdi5tYXRjaCgvXl9fLio/X18kLykgfHxcbiAgICAgICAgdi5tYXRjaCgvXlxcJFxcJC4qP1xcJFxcJCQvKSB8fFxuICAgICAgICB2Lm1hdGNoKC9bOit+IT48PS8vXFxbXFxdQCBdLyk7XG4gICAgfVxuXG4gICAgcHJvcGVydGllcyA9IF8uZmlsdGVyKHByb3BlcnRpZXMsIGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgZ29vZCA9IHR5cGVvZiB2ID09PSAnc3RyaW5nJyAmJiAhZm9yYmlkZGVuS2V5KHYpLFxuICAgICAgICAgIHI7XG4gICAgICBpZiAobGlua2FibGVPbmx5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgciA9IGdvb2QgJiYgbWUuaXNMaW5rYWJsZSh2LCBvYmpbdl0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgciA9IGZhbHNlO1xuICAgICAgICAgIC8vIHVuY29tbWVudCB0byBzZWUgd2h5IG9ialt2XSBpcyBub3QgYWxsb3dlZFxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZ29vZDtcbiAgICB9KS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgIHZhciB0eXBlLFxuICAgICAgICBsaW5rZWFibGU7XG4gICAgICB0cnkge1xuICAgICAgICAvLyB0eXBlID0gbnVsbHxzdHJpbmd8dW5kZWZpbmVkfG51bWJlcnxvYmplY3RcbiAgICAgICAgdHlwZSA9IHR5cGVvZiBvYmpbdl07XG4gICAgICAgIGxpbmtlYWJsZSA9IGlzT2JqZWN0T3JGdW5jdGlvbihvYmpbdl0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHR5cGUgPSAndW5kZWZpbmVkJztcbiAgICAgICAgbGlua2VhYmxlID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC8vIHBhcmVudDogaGFzaEtleShvYmopLFxuICAgICAgICBuYW1lOiB2LFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBsaW5rZWFibGU6IGxpbmtlYWJsZVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vIHNwZWNpYWwgcHJvcGVydGllc1xuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIGlmIChwcm90bykge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgbmFtZTogJ1tbUHJvdG90eXBlXV0nLFxuICAgICAgICAvLyBjbHM6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIGxpbmtlYWJsZTogdHJ1ZSxcbiAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGNvbnN0cnVjdG9yID0gb2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbic7XG4gICAgaWYgKGNvbnN0cnVjdG9yICYmXG4gICAgICAgIF8uZmluZEluZGV4KHByb3BlcnRpZXMsIHsgbmFtZTogJ2NvbnN0cnVjdG9yJyB9KSA9PT0gLTEpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIC8vIGNsczogaGFzaEtleShvYmopLFxuICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgICAgICBsaW5rZWFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlICYmICFsaW5rYWJsZU9ubHkpIHtcbiAgICAgIHRoaXMuX19jYWNoZU9iamVjdHNbaGtdID0gcHJvcGVydGllcztcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhwcm9wZXJ0aWVzKTtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfSxcblxuICAvKipcbiAgICogQW5hbHl6ZXMgYSBsaXN0IG9mIG9iamVjdHMgcmVjdXJzaXZlbHlcbiAgICogQHBhcmFtICB7QXJyYXl9IG9iamVjdHMgICAgICBBcnJheSBvZiBvYmplY3RzXG4gICAqIEBwYXJhbSAge251bWJlcn0gY3VycmVudExldmVsIEN1cnJlbnQgZGZzIGxldmVsXG4gICAqL1xuICBhbmFseXplT2JqZWN0czogZnVuY3Rpb24gKG9iamVjdHMsIGN1cnJlbnRMZXZlbCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBpZiAoY3VycmVudExldmVsIDw9IG1lLmxldmVscyAmJiAgICAvLyBkZnMgbGV2ZWxcbiAgICAgICAgICAhbWUub2JqZWN0cy5nZXQodikgJiYgICAgICAgICAvLyBhbHJlYWR5IHJlZ2lzdGVyZWRcbiAgICAgICAgICAhbWUuaXNGb3JiaWRkZW4odikgICAgICAgICAgICAgIC8vIGZvcmJpZGRlbiBjaGVja1xuICAgICAgICAgICkge1xuXG4gICAgICAgIC8vIGlmICh2Lmhhc093blByb3BlcnR5KCdfX3Byb2Nlc3NlZF9fJykpIHtcbiAgICAgICAgLy8gICBkZWJ1Z2dlcjtcbiAgICAgICAgLy8gICB0aHJvdyAnd3RmJztcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkodiwgJ19fcHJvY2Vzc2VkX18nLCB7XG4gICAgICAgIC8vICAgdmFsdWU6ICdwcm9jZXNzc2VkJ1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBhZGQgdG8gdGhlIHJlZ2lzdGVyZWQgb2JqZWN0IHBvb2xcbiAgICAgICAgbWUub2JqZWN0cy5wdXQodik7XG5cbiAgICAgICAgLy8gZGZzIHRvIHRoZSBuZXh0IGxldmVsXG4gICAgICAgIG1lLmFuYWx5emVPYmplY3RzKFxuICAgICAgICAgIG1lLmdldE93bkxpbmtzKHYpLm1hcChmdW5jdGlvbiAobGluaykge1xuICAgICAgICAgICAgcmV0dXJuIGxpbmsudG87XG4gICAgICAgICAgfSksXG4gICAgICAgICAgY3VycmVudExldmVsICsgMVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBsaW5rcywgZWFjaCBsaW5rIGlzIGFuIG9iamVjdCB3aGljaCBoYXMgdGhlXG4gICAqIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAtIGZyb21cbiAgICogLSB0b1xuICAgKiAtIHByb3BlcnR5IChzdHJpbmcpXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgZ2V0T3duTGlua3M6IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBsaW5rcyA9IFtdLFxuICAgICAgICBwcm9wZXJ0aWVzLFxuICAgICAgICBuYW1lID0gaGFzaEtleShvYmopO1xuXG4gICAgaWYgKHRoaXMuX19jYWNoZUxpbmtzW25hbWVdKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnbGlua3MgZnJvbSBjYWNoZSA6KScpO1xuICAgICAgcmV0dXJuIHRoaXMuX19jYWNoZUxpbmtzW25hbWVdO1xuICAgIH1cblxuICAgIHByb3BlcnRpZXMgPSBtZS5nZXRQcm9wZXJ0aWVzKG9iaiwgdHJ1ZSk7XG5cbiAgICBmdW5jdGlvbiBnZXRBdWdtZW50ZWRIYXNoKG9iaiwgbmFtZSkge1xuICAgICAgaWYgKCFoYXNoS2V5LmhhcyhvYmopICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ3Byb3RvdHlwZScgJiZcbiAgICAgICAgICBuYW1lICE9PSAnY29uc3RydWN0b3InKSB7XG4gICAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNoS2V5KG9iaik7XG4gICAgfVxuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyAndGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIGEgaGFzaGtleSc7XG4gICAgfVxuXG4gICAgXy5mb3JFYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgcmVmID0gb2JqW3YubmFtZV07XG4gICAgICAvLyBiZWNhdXNlIG9mIHRoZSBsZXZlbHMgYSByZWZlcmVuY2UgbWlnaHQgbm90IGV4aXN0XG4gICAgICBpZiAoIXJlZikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZSBvYmplY3QgZG9lc24ndCBoYXZlIGEgaGFzaGtleVxuICAgICAgLy8gbGV0J3MgZ2l2ZSBpdCBhIG5hbWUgZXF1YWwgdG8gdGhlIHByb3BlcnR5XG4gICAgICAvLyBiZWluZyBhbmFseXplZFxuICAgICAgZ2V0QXVnbWVudGVkSGFzaChyZWYsIHYubmFtZSk7XG5cbiAgICAgIGlmICghbWUuaXNGb3JiaWRkZW4ocmVmKSkge1xuICAgICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgICBmcm9tOiBvYmosXG4gICAgICAgICAgZnJvbUhhc2g6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgICB0bzogcmVmLFxuICAgICAgICAgIHRvSGFzaDogaGFzaEtleShyZWYpLFxuICAgICAgICAgIHByb3BlcnR5OiB2Lm5hbWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICBpZiAocHJvdG8gJiYgIW1lLmlzRm9yYmlkZGVuKHByb3RvKSkge1xuICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgIGZyb206IG9iaixcbiAgICAgICAgZnJvbUhhc2g6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgdG86IHByb3RvLFxuICAgICAgICB0b0hhc2g6IGhhc2hLZXkocHJvdG8pLFxuICAgICAgICBwcm9wZXJ0eTogJ1tbUHJvdG90eXBlXV0nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jYWNoZSkge1xuICAgICAgdGhpcy5fX2NhY2hlTGlua3NbbmFtZV0gPSBsaW5rcztcbiAgICB9XG5cbiAgICByZXR1cm4gbGlua3M7XG4gIH0sXG5cbiAgbWFrZURpcnR5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH0sXG5cbiAgc2V0TGV2ZWxzOiBmdW5jdGlvbiAobCkge1xuICAgIHRoaXMubGV2ZWxzID0gbDtcbiAgfSxcblxuICBzZXREaXJ0eTogZnVuY3Rpb24gKGQpIHtcbiAgICB0aGlzLmRpcnR5ID0gZDtcbiAgfSxcblxuICBzZXRGdW5jdGlvbkNvbnN0cnVjdG9yczogZnVuY3Rpb24gKHYpIHtcbiAgICB0aGlzLmZ1bmN0aW9uQ29uc3RydWN0b3JzID0gdjtcbiAgfSxcblxuICBnZXRPYmplY3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub2JqZWN0cztcbiAgfSxcblxuICAvKipcbiAgICogU3RyaW5naWZpZXMgYW4gb2JqZWN0IHByb3BlcnRpZXNcbiAgICogQHBhcmFtICBvYmpcbiAgICogQHBhcmFtICB0b1N0cmluZ1xuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdFByb3BlcnRpZXM6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9wZXJ0aWVzKG9iaik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZXByZXNlbnRhdGlvbiBvZiB0aGUgbGlua3Mgb2ZcbiAgICogYW4gb2JqZWN0XG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0TGlua3M6IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHJldHVybiBtZS5nZXRPd25MaW5rcyhvYmopLm1hcChmdW5jdGlvbiAobGluaykge1xuICAgICAgLy8gZGlzY2FyZGVkOiBmcm9tLCB0b1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogbGluay5mcm9tSGFzaCxcbiAgICAgICAgdG86IGxpbmsudG9IYXNoLFxuICAgICAgICBwcm9wZXJ0eTogbGluay5wcm9wZXJ0eVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogU3RyaW5naWZpZXMgdGhlIG9iamVjdHMgc2F2ZWQgaW4gdGhpcyBhbmFseXplclxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgbm9kZXMgPSB7fSxcbiAgICAgIGVkZ2VzID0ge307XG4gICAgY29uc29sZS50aW1lKCdzdHJpbmdpZnknKTtcbiAgICBfKHRoaXMub2JqZWN0cykuZm9yT3duKGZ1bmN0aW9uICh2KSB7XG4gICAgICBub2Rlc1toYXNoS2V5KHYpXSA9IG1lLnN0cmluZ2lmeU9iamVjdFByb3BlcnRpZXModik7XG4gICAgICBlZGdlc1toYXNoS2V5KHYpXSA9IG1lLnN0cmluZ2lmeU9iamVjdExpbmtzKHYpO1xuICAgIH0pO1xuICAgIGNvbnNvbGUudGltZUVuZCgnc3RyaW5naWZ5Jyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGVzOiBub2RlcyxcbiAgICAgIGVkZ2VzOiBlZGdlc1xuICAgIH07XG4gIH1cbn07XG5cbi8vIGFkaXRpb25hbCBvYmplY3RzIHRoYXQgbmVlZCB0aGUgcHJvdG90eXBlIHRvIGV4aXN0XG52YXIgYVByb3RvID0gQW5hbHl6ZXIucHJvdG90eXBlO1xuXy5tZXJnZShhUHJvdG8sIHtcblxuICAvKipcbiAgICogQWRkcyBhIGxpc3Qgb2Ygb2JqZWN0cyB0byBhbmFseXplIGFuZCBtYWtlIHRoZSBhbmFseXplciBkaXJ0eVxuICAgKiBAcGFyYW0gIHtBcnJheTxPYmplY3RzPn0gb2JqZWN0c1xuICAgKiBAcmV0dXJuIHt0aGlzfVxuICAgKi9cbiAgYWRkOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMpIHtcbiAgICBjb25zb2xlLnRpbWUoJ2FuYWx5emUnKTtcbiAgICB0aGlzLmFuYWx5emVPYmplY3RzKG9iamVjdHMsIDApO1xuICAgIGNvbnNvbGUudGltZUVuZCgnYW5hbHl6ZScpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LCBhUHJvdG8ubWFrZURpcnR5KSxcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGxpc3Qgb2Ygb2JqZWN0cywgaWYgYHdpdGhQcm90b3R5cGVgIGlzIHRydWUgdGhlblxuICAgKiBhbHNvIHRoZSBwcm90b3R5cGUgaXMgcmVtb3ZlZFxuICAgKiBAcGFyYW0gIHtBcnJheTxPYmplY3RzPn0gb2JqZWN0c1xuICAgKiBAcGFyYW0gIHtib29sZWFufSB3aXRoUHJvdG90eXBlXG4gICAqIEByZXR1cm4ge3RoaXN9XG4gICAqL1xuICByZW1vdmU6IHdyYXBGbihmdW5jdGlvbiAob2JqZWN0cywgd2l0aFByb3RvdHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIG1lLm9iamVjdHMucmVtb3ZlKG9iaik7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSAmJiBvYmouaGFzT3duUHJvcGVydHkoJ3Byb3RvdHlwZScpKSB7XG4gICAgICAgIG1lLm9iamVjdHMucmVtb3ZlKG9iai5wcm90b3R5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBtZTtcbiAgfSwgYVByb3RvLm1ha2VEaXJ0eSksXG5cbiAgLyoqXG4gICAqIEZvcmJpZHMgYSBsaXN0IG9mIG9iamVjdHMsIGlmIGB3aXRoUHJvdG90eXBlYCBpcyB0cnVlIHRoZW5cbiAgICogYWxzbyB0aGUgcHJvdG90eXBlIGlzIGZvcmJpZGRlblxuICAgKiBAcGFyYW0gIHtBcnJheTxPYmplY3RzPn0gb2JqZWN0c1xuICAgKiBAcGFyYW0gIHtib29sZWFufSB3aXRoUHJvdG90eXBlXG4gICAqIEByZXR1cm4ge3RoaXN9XG4gICAqL1xuICBmb3JiaWQ6IHdyYXBGbihmdW5jdGlvbiAob2JqZWN0cywgd2l0aFByb3RvdHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgbWUucmVtb3ZlKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBtZS5mb3JiaWRkZW4ucHV0KG9iaik7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSAmJiBvYmouaGFzT3duUHJvcGVydHkoJ3Byb3RvdHlwZScpKSB7XG4gICAgICAgIG1lLmZvcmJpZGRlbi5wdXQob2JqLnByb3RvdHlwZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIGFQcm90by5tYWtlRGlydHkpLFxuXG4gIC8qKlxuICAgKiBVbmZvcmJpZHMgYSBsaXN0IG9mIG9iamVjdHMsIGlmIGB3aXRoUHJvdG90eXBlYCBpcyB0cnVlIHRoZW5cbiAgICogYWxzbyB0aGUgcHJvdG90eXBlIGlzIHVuZm9yYmlkZGVuXG4gICAqIEBwYXJhbSAge0FycmF5PE9iamVjdHM+fSBvYmplY3RzXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IHdpdGhQcm90b3R5cGVcbiAgICogQHJldHVybiB7dGhpc31cbiAgICovXG4gIHVuZm9yYmlkOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBtZS5mb3JiaWRkZW4ucmVtb3ZlKG9iaik7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSAmJiBvYmouaGFzT3duUHJvcGVydHkoJ3Byb3RvdHlwZScpKSB7XG4gICAgICAgIG1lLmZvcmJpZGRlbi5yZW1vdmUob2JqLnByb3RvdHlwZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIGFQcm90by5tYWtlRGlydHkpXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmFseXplcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgR2VuZXJpYyA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvR2VuZXJpY0FuYWx5emVyJyksXG4gIEFuZ3VsYXIgPSByZXF1aXJlKCcuL2FuYWx5emVyL0FuZ3VsYXInKSxcbiAgV2luZG93ID0gcmVxdWlyZSgnLi9hbmFseXplci9XaW5kb3cnKSxcbiAgUE9iamVjdCA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvT2JqZWN0JyksXG4gIEJ1aWx0SW4gPSByZXF1aXJlKCcuL2FuYWx5emVyL0J1aWx0SW4nKTtcblxudmFyIGxpYnJhcmllcztcblxudmFyIHByb3RvID0ge1xuICBjcmVhdGVOZXc6IGZ1bmN0aW9uIChnbG9iYWwsIG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY3JlYXRpbmcgYSBnZW5lcmljIGNvbnRhaW5lciBmb3I6ICcgKyBnbG9iYWwsIG9wdGlvbnMpO1xuICAgIHJldHVybiAobGlicmFyaWVzW2dsb2JhbF0gPSBuZXcgR2VuZXJpYyhvcHRpb25zKSk7XG4gIH0sXG4gIGFsbDogZnVuY3Rpb24gKGZuKSB7XG4gICAgXy5mb3JPd24obGlicmFyaWVzLCBmbik7XG4gIH0sXG4gIG1hcmtEaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHByb3RvLmFsbChmdW5jdGlvbiAodikge1xuICAgICAgdi5tYXJrRGlydHkoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH0sXG4gIHNldEZ1bmN0aW9uQ29uc3RydWN0b3JzOiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICBwcm90by5hbGwoZnVuY3Rpb24gKHYpIHtcbiAgICAgIC8vIHRoaXMgb25seSB3b3JrcyBvbiB0aGUgZ2VuZXJpYyBhbmFseXplcnNcbiAgICAgIGlmICghdi5faGFzZmMpIHtcbiAgICAgICAgdi5hbmFseXplci5zZXRGdW5jdGlvbkNvbnN0cnVjdG9ycyhuZXdWYWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG59O1xuXG5saWJyYXJpZXMgPSBPYmplY3QuY3JlYXRlKHByb3RvKTtcbl8ubWVyZ2UobGlicmFyaWVzLCB7XG4gIG9iamVjdDogbmV3IFBPYmplY3QoKSxcbiAgYnVpbHRJbjogbmV3IEJ1aWx0SW4oKSxcbiAgd2luZG93OiBuZXcgV2luZG93KCksXG4gIC8vIHBvcHVsYXJcbiAgYW5ndWxhcjogbmV3IEFuZ3VsYXIoKSxcbiAgLy8gbWluZVxuICAvLyB0MzogbmV3IEdlbmVyaWMoeyBnbG9iYWw6ICd0MycgfSksXG4gIC8vIGh1Z2VcbiAgdGhyZWU6IG5ldyBHZW5lcmljKHtcbiAgICBnbG9iYWw6ICdUSFJFRScsXG4gICAgcmVuZGVyZWFjaHRpbWU6IHRydWVcbiAgfSksXG59KTtcblxuLy8gY29uc29sZS5sb2cobGlicmFyaWVzKTtcblxuLy8gd2luIG1heCBsZXZlbCBpbml0aWFsbHkgaXMgMFxuLy8gbGlicmFyaWVzLndpbi5wcmVSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4vLyAgIGxpYnJhcmllcy53aW4uZ2V0T2JqZWN0cygpLmVtcHR5KCk7XG4vLyAgIGxpYnJhcmllcy53aW4uYW5hbHl6ZU9iamVjdHMoW3dpbmRvd10sIDApO1xuLy8gfTtcblxuLy8gY29uc29sZS5sb2coYnVpbHRJbi5nZXRPYmplY3RzKCkpO1xuLy8gY29uc29sZS5sb2cod2luLmdldE9iamVjdHMoKSk7XG4vLyBjb25zb2xlLmxvZyh1c2VyLmdldE9iamVjdHMoKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbGlicmFyaWVzOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vR2VuZXJpY0FuYWx5emVyJyksXG4gIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKTtcblxuZnVuY3Rpb24gQW5ndWxhcigpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcywge1xuICAgIGdsb2JhbDogJ2FuZ3VsYXInLFxuICAgIGRpc3BsYXluYW1lOiAnQW5ndWxhckpTJyxcbiAgICByZW5kZXJlYWNodGltZTogdHJ1ZVxuICB9KTtcblxuICB0aGlzLnNlcnZpY2VzID0gW1xuICAgICckYW5pbWF0ZScsXG4gICAgJyRjYWNoZUZhY3RvcnknLFxuICAgICckY29tcGlsZScsXG4gICAgJyRjb250cm9sbGVyJyxcbiAgICAvLyAnJGRvY3VtZW50JyxcbiAgICAnJGV4Y2VwdGlvbkhhbmRsZXInLFxuICAgICckZmlsdGVyJyxcbiAgICAnJGh0dHAnLFxuICAgICckaHR0cEJhY2tlbmQnLFxuICAgICckaW50ZXJwb2xhdGUnLFxuICAgICckaW50ZXJ2YWwnLFxuICAgICckbG9jYWxlJyxcbiAgICAnJGxvZycsXG4gICAgJyRwYXJzZScsXG4gICAgJyRxJyxcbiAgICAnJHJvb3RTY29wZScsXG4gICAgJyRzY2UnLFxuICAgICckc2NlRGVsZWdhdGUnLFxuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJyR0aW1lb3V0JyxcbiAgICAvLyAnJHdpbmRvdydcbiAgXS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlLCBuYW1lOiB2IH07XG4gIH0pO1xufVxuXG5Bbmd1bGFyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cbkFuZ3VsYXIucHJvdG90eXBlLmdldFNlbGVjdGVkU2VydmljZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgdG9BbmFseXplID0gW107XG5cbiAgd2luZG93LmFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nJ10pO1xuICB0aGlzLmluamVjdG9yID0gd2luZG93LmFuZ3VsYXIuaW5qZWN0b3IoWydhcHAnXSk7XG5cbiAgbWUuc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIGlmIChzLmNoZWNrZWQpIHtcbiAgICAgIHZhciBvYmogPSBtZS5pbmplY3Rvci5nZXQocy5uYW1lKTtcbiAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBzLm5hbWUpO1xuICAgICAgdG9BbmFseXplLnB1c2gob2JqKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9BbmFseXplO1xufTtcblxuQW5ndWxhci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGFuZ3VsYXInKTtcbiAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0Zvcih3aW5kb3cuYW5ndWxhciwgJ2FuZ3VsYXInKTtcbiAgdGhpcy5hbmFseXplci5nZXRPYmplY3RzKCkuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5hZGQoXG4gICAgW3dpbmRvdy5hbmd1bGFyXS5jb25jYXQodGhpcy5nZXRTZWxlY3RlZFNlcnZpY2VzKCkpXG4gICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuZ3VsYXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9HZW5lcmljQW5hbHl6ZXInKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbnZhciB0b0luc3BlY3QgPSBbXG4gIE9iamVjdCwgRnVuY3Rpb24sXG4gIEFycmF5LCBEYXRlLCBCb29sZWFuLCBOdW1iZXIsIE1hdGgsIFN0cmluZywgUmVnRXhwLCBKU09OLFxuICBFcnJvclxuXTtcblxuZnVuY3Rpb24gQnVpbHRJbigpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcyk7XG59XG5cbkJ1aWx0SW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShHZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlKTtcblxuQnVpbHRJbi5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGJ1aWx0SW4gb2JqZWN0cycpO1xuICB0aGlzLmFuYWx5emVyLmFkZCh0aGlzLmdldE9iamVjdHMoKSk7XG59O1xuXG5CdWlsdEluLnByb3RvdHlwZS5nZXRPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoPycgK1xuICAgIHV0aWxzLnRvUXVlcnlTdHJpbmcoe1xuICAgICAgcTogZW5jb2RlVVJJQ29tcG9uZW50KG5vZGVOYW1lICsgJyAnICsgbm9kZVByb3BlcnR5KSxcbiAgICB9KTtcbiAgd2luZG93Lm9wZW4odXJsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnVpbHRJbjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC8nKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4uL3V0aWwvaGFzaEtleScpLFxuICBhbmFseXplciA9IHJlcXVpcmUoJy4uL09iamVjdEFuYWx5emVyJyk7XG5cbnZhciBzZWFyY2hFbmdpbmUgPSAnaHR0cHM6Ly9kdWNrZHVja2dvLmNvbS8/cT0nO1xuXG5mdW5jdGlvbiBHZW5lcmljQW5hbHl6ZXIob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgLy8gaWYgKCFuYW1lKSB7XG4gIC8vICAgdGhyb3cgJ25hbWUgbmVlZHMgdG8gYmUgZGVmaW5lZCc7XG4gIC8vIH1cbiAgdGhpcy5nbG9iYWwgPSBvcHRpb25zLmdsb2JhbDtcbiAgdGhpcy5kaXNwbGF5bmFtZSA9IG9wdGlvbnMuZGlzcGxheW5hbWU7XG4gIHRoaXMubGV2ZWxzID0gb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbGV2ZWxzJykgPyBvcHRpb25zLmxldmVscyA6IDEwO1xuICB0aGlzLmZvcmJpZGRlbiA9IG9wdGlvbnMuZm9yYmlkZGVuIHx8IFtdO1xuICB0aGlzLnNyYyA9IG9wdGlvbnMuc3JjO1xuICB0aGlzLl9oYXNmYyA9IG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2Z1bmN0aW9uY29uc3RydWN0b3JzJyk7XG4gIHRoaXMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMgPSB0aGlzLl9oYXNmYyA/XG4gICAgb3B0aW9ucy5mdW5jdGlvbmNvbnN0cnVjdG9ycyA6IEdlbmVyaWNBbmFseXplci5TSE9XX0ZVTkNUSU9OX0NPTlNUUlVDVE9SUztcbiAgdGhpcy5yZW5kZXJlYWNodGltZSA9IG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ3JlbmRlcmVhY2h0aW1lJykgP1xuICAgIG9wdGlvbnMucmVuZGVyZWFjaHRpbWUgOiBmYWxzZTtcbiAgdGhpcy5hbGxmdW5jdGlvbnMgPSBvcHRpb25zLmhhc093blByb3BlcnR5KCdhbGxmdW5jdGlvbnMnKSA/XG4gICAgb3B0aW9ucy5hbGxmdW5jdGlvbnMgOiBmYWxzZTtcblxuICB0aGlzLmluc3BlY3RlZCA9IGZhbHNlO1xuXG4gIC8vIHBhcnNlIGZvcmJpZCBzdHJpbmcgdG8gYXJyYXlcbiAgdGhpcy5wYXJzZSgpO1xuXG4gIHRoaXMuYW5hbHl6ZXIgPSBhbmFseXplcih7XG4gICAgZnVuY3Rpb25Db25zdHJ1Y3RvcnM6IHRoaXMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMsXG4gICAgYWxsRnVuY3Rpb25zOiB0aGlzLmFsbGZ1bmN0aW9uc1xuICB9KTtcbn1cblxuR2VuZXJpY0FuYWx5emVyLlNIT1dfQlVJTFRJTiA9IGZhbHNlO1xuR2VuZXJpY0FuYWx5emVyLlNIT1dfRlVOQ1RJT05fQ09OU1RSVUNUT1JTID0gdHJ1ZTtcbkdlbmVyaWNBbmFseXplci5GT1JCSURERU4gPSAncG9qb3Zpejp3aW5kb3cscG9qb3ZpejpidWlsdEluLGRvY3VtZW50JztcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICBjb25zb2xlLmxvZygnJWNQb2pvVml6JywgJ2ZvbnQtc2l6ZTogMTVweDsgY29sb3I6ICcpO1xuICByZXR1cm4gbWUuZmV0Y2goKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChtZS5yZW5kZXJlYWNodGltZSB8fCAhbWUuaW5zcGVjdGVkKSB7XG4gICAgICAgIG1lLmluc3BlY3QoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZTtcbiAgICB9KTtcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgdGhpcy5mb3JiaWRkZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5mb3JiaWRkZW4gPSB0aGlzLmZvcmJpZGRlbi5zcGxpdCgnLCcpO1xuICB9XG4gIGlmICh0eXBlb2YgdGhpcy5mdW5jdGlvbmNvbnN0cnVjdG9ycyA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmZ1bmN0aW9uY29uc3RydWN0b3JzID0gdGhpcy5mdW5jdGlvbmNvbnN0cnVjdG9ycyA9PT0gJ3RydWUnO1xuICB9XG4gIGlmICh0eXBlb2YgdGhpcy5yZW5kZXJlYWNodGltZSA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLnJlbmRlcmVhY2h0aW1lID0gdGhpcy5yZW5kZXJlYWNodGltZSA9PT0gJ3RydWUnO1xuICB9XG4gIGlmICh0eXBlb2YgdGhpcy5hbGxmdW5jdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5hbGxmdW5jdGlvbnMgPSB0aGlzLmFsbGZ1bmN0aW9ucyA9PT0gJ3RydWUnO1xuICB9XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLm1hcmtEaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5pbnNwZWN0ZWQgPSBmYWxzZTtcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdhbmFseXppbmcgd2luZG93LicgKyB0aGlzLmdsb2JhbCk7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgYW5hbHl6ZXIgPSB0aGlzLmFuYWx5emVyLFxuICAgIGZvcmJpZGRlbiA9IFtdLmNvbmNhdCh0aGlzLmZvcmJpZGRlbik7XG4gIC8vIHNldCBhIHByZWRlZmllZCBnbG9iYWxcbiAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0Zvcih3aW5kb3dbdGhpcy5nbG9iYWxdLCB0aGlzLmdsb2JhbCk7XG4gIC8vIGNsZWFuXG4gIGFuYWx5emVyLmdldE9iamVjdHMoKS5lbXB0eSgpO1xuICBhbmFseXplci5mb3JiaWRkZW4uZW1wdHkoKTtcbiAgYW5hbHl6ZXIuc2V0TGV2ZWxzKHRoaXMubGV2ZWxzKTtcblxuICAvLyBzZXR0aW5ncyA+IHNob3cgbGlua3MgdG8gYnVpbHQgaW4gb2JqZWN0c1xuICBpZiAoIUdlbmVyaWNBbmFseXplci5TSE9XX0JVSUxUSU4pIHtcbiAgICBmb3JiaWRkZW4gPSBmb3JiaWRkZW4uY29uY2F0KFxuICAgICAgR2VuZXJpY0FuYWx5emVyLkZPUkJJRERFTi5zcGxpdCgnLCcpXG4gICAgKTtcbiAgfVxuXG4gIGZvcmJpZGRlbi5mb3JFYWNoKGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgYXJyLFxuICAgICAgdG9rZW5zO1xuICAgIGlmICghZi5pbmRleE9mKCdwb2pvdml6OicpKSB7XG4gICAgICB0b2tlbnMgPSBmLnNwbGl0KCc6Jyk7XG4gICAgICBhcnIgPSByZXF1aXJlKCcuLi9PYmplY3RIYXNoZXMnKVt0b2tlbnNbMV1dLmdldE9iamVjdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXJyID0gW3dpbmRvd1tmXV07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdmb3JiaWRkaW5nOiAnLCBhcnIpO1xuICAgIGFuYWx5emVyLmZvcmJpZChhcnIsIHRydWUpO1xuICB9KTtcblxuICBhbmFseXplci5hZGQoW3dpbmRvd1t0aGlzLmdsb2JhbF1dKTtcblxufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5tYXJrSW5zcGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAvLyBtYXJrIHRoaXMgY29udGFpbmVyIGFzIGluc3BlY3RlZFxuICB0aGlzLmluc3BlY3RlZCA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzXG4gICAgLm1hcmtJbnNwZWN0ZWQoKVxuICAgIC5pbnNwZWN0U2VsZigpO1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5wcmVSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIHNjcmlwdDtcblxuICBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICByZXR1cm4gd2luZG93W21lLmdsb2JhbF07XG4gIH1cblxuICBmdW5jdGlvbiBwcm9taXNpZnkodikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2ZldGNoaW5nIHNjcmlwdCAnICsgdiwgdHJ1ZSk7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgICBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgIHNjcmlwdC5zcmMgPSB2O1xuICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdjb21wbGV0ZWQgc2NyaXB0ICcgKyB2LCB0cnVlKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShnZXRWYWx1ZSgpKTtcbiAgICAgIH07XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHRoaXMuc3JjKSB7XG4gICAgaWYgKGdldFZhbHVlKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdyZXNvdXJjZSBhbHJlYWR5IGZldGNoZWQgJyArIHRoaXMuc3JjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHNyY3MgPSB0aGlzLnNyYy5zcGxpdCgnfCcpO1xuICAgICAgcmV0dXJuIHNyY3MucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7XG4gICAgICAgIHJldHVybiBwcmV2LnRoZW4ocHJvbWlzaWZ5KGN1cnJlbnQpKTtcbiAgICAgIH0sIFEoJ3JlZHVjZScpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gUSh0cnVlKTtcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHdpbmRvdy5vcGVuKFxuICAgIF8udGVtcGxhdGUoJyR7c2VhcmNoRW5naW5lfSR7bHVja3l9JHtsaWJyYXJ5TmFtZX0gJHtub2RlTmFtZX0gJHtub2RlUHJvcGVydHl9Jywge1xuICAgICAgc2VhcmNoRW5naW5lOiBzZWFyY2hFbmdpbmUsXG4gICAgICBsdWNreTogR2VuZXJpY0FuYWx5emVyLmx1Y2t5ID8gJyFkdWNreScgOiAnJyxcbiAgICAgIGxpYnJhcnlOYW1lOiBtZS5kaXNwbGF5bmFtZSB8fCBtZS5nbG9iYWwsXG4gICAgICBub2RlTmFtZTogbm9kZU5hbWUsXG4gICAgICBub2RlUHJvcGVydHk6IG5vZGVQcm9wZXJ0eVxuICAgIH0pXG4gICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdlbmVyaWNBbmFseXplcjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZW5lcmljQW5hbHl6ZXIgPSByZXF1aXJlKCcuL0dlbmVyaWNBbmFseXplcicpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gUE9iamVjdCgpIHtcbiAgR2VuZXJpY0FuYWx5emVyLmNhbGwodGhpcyk7XG59XG5cblBPYmplY3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShHZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlKTtcblxuUE9iamVjdC5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIE9iamVjdCBvYmplY3RzJyk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKHRoaXMuZ2V0T2JqZWN0cygpKTtcbn07XG5cblBPYmplY3QucHJvdG90eXBlLmdldE9iamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbT2JqZWN0XTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUE9iamVjdDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKSxcbiAgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9HZW5lcmljQW5hbHl6ZXInKTtcblxudmFyIHRvSW5zcGVjdCA9IFt3aW5kb3ddO1xuXG5mdW5jdGlvbiBXaW5kb3coKSB7XG4gIEdlbmVyaWNBbmFseXplci5jYWxsKHRoaXMsIHtcbiAgICBsZXZlbHM6IDEsXG4gICAgcmVuZGVyZWFjaHRpbWU6IHRydWUsXG4gICAgZnVuY3Rpb25jb25zdHJ1Y3RvcnM6IGZhbHNlXG4gIH0pO1xufVxuXG5XaW5kb3cucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShHZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlKTtcblxuV2luZG93LnByb3RvdHlwZS5nZXRPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuV2luZG93LnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ2luc3BlY3Rpbmcgd2luZG93Jyk7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgaGFzaGVzID0gcmVxdWlyZSgnLi4vT2JqZWN0SGFzaGVzJyk7XG5cbiAgXy5mb3JPd24oaGFzaGVzLCBmdW5jdGlvbiAodiwgaykge1xuICAgIGlmICh2Lmdsb2JhbCAmJiB3aW5kb3dbdi5nbG9iYWxdKSB7XG4gICAgICBtZS5hbmFseXplci5mb3JiaWQoW3dpbmRvd1t2Lmdsb2JhbF1dLCB0cnVlKTtcbiAgICB9XG4gIH0pO1xuICB0aGlzLmFuYWx5emVyLmdldE9iamVjdHMoKS5lbXB0eSgpO1xuICB0aGlzLmFuYWx5emVyLnNldExldmVscyh0aGlzLmxldmVscyk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKG1lLmdldE9iamVjdHMoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvdzsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBRID0gcmVxdWlyZSgncScpLFxuICBkYWdyZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmRhZ3JlIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kYWdyZSA6IG51bGwpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbC8nKSxcbiAgT2JqZWN0SGFzaGVzID0gcmVxdWlyZSgnLi9PYmplY3RIYXNoZXMnKTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgY29udGFpbmVyLFxuICBvbGRDb250YWluZXIsXG4gIG9sZFJlbmRlcmVyLFxuICByZW5kZXJlcixcbiAgcG9qb3ZpejsgICAgICAvLyBuYW1lc3BhY2VcblxuZnVuY3Rpb24gcHJvY2VzcygpIHtcbiAgdmFyIGcgPSBuZXcgZGFncmUuRGlncmFwaCgpLFxuICAgICAgcHJvcGVydGllcyxcbiAgICAgIG5vZGUsXG4gICAgICBsaWJyYXJ5ID0gY29udGFpbmVyLmFuYWx5emVyLFxuICAgICAgc3RyID0gbGlicmFyeS5zdHJpbmdpZnkoKSxcbiAgICAgIGxpYnJhcnlOb2RlcyA9IHN0ci5ub2RlcyxcbiAgICAgIGxpYnJhcnlFZGdlcyA9IHN0ci5lZGdlcztcblxuICAvLyBjcmVhdGUgdGhlIGdyYXBoXG4gIC8vIGVhY2ggZWxlbWVudCBvZiB0aGUgZ3JhcGggaGFzXG4gIC8vIC0gbGFiZWxcbiAgLy8gLSB3aWR0aFxuICAvLyAtIGhlaWdodFxuICAvLyAtIHByb3BlcnRpZXNcbiAgXy5mb3JPd24obGlicmFyeU5vZGVzLCBmdW5jdGlvbiAocHJvcGVydGllcywgaykge1xuICAgIHZhciBsYWJlbCA9IGsubWF0Y2goL1xcUyo/LSguKikvKVsxXTtcbiAgICAvLyBjb25zb2xlLmxvZyhrLCBsYWJlbC5sZW5ndGgpO1xuICAgIG5vZGUgPSB7XG4gICAgICBsYWJlbDogayxcbiAgICAgIHdpZHRoOiBsYWJlbC5sZW5ndGggKiAxMFxuICAgIH07XG4gICAgLy8gbGluZXMgKyBoZWFkZXIgKyBwYWRkaW5nIGJvdHRvbVxuICAgIG5vZGUuaGVpZ2h0ID0gcHJvcGVydGllcy5sZW5ndGggKiAxNSArIDUwO1xuICAgIG5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBub2RlLndpZHRoID0gTWF0aC5tYXgobm9kZS53aWR0aCwgdi5uYW1lLmxlbmd0aCAqIDEwKTtcbiAgICB9KTtcbiAgICBnLmFkZE5vZGUoaywgbm9kZSk7XG4gIH0pO1xuXG4gIC8vIGJ1aWxkIHRoZSBlZGdlcyBmcm9tIG5vZGUgdG8gbm9kZVxuICBfLmZvck93bihsaWJyYXJ5RWRnZXMsIGZ1bmN0aW9uIChsaW5rcykge1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgZy5hZGRFZGdlKG51bGwsIGxpbmsuZnJvbSwgbGluay50byk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIGxheW91dCBvZiB0aGUgZ3JhcGhcbiAgdmFyIGxheW91dCA9IGRhZ3JlLmxheW91dCgpXG4gICAgLm5vZGVTZXAoMzApXG4gICAgLy8gLnJhbmtTZXAoNzApXG4gICAgLy8gLnJhbmtEaXIoJ1RCJylcbiAgICAucnVuKGcpO1xuXG4gIHZhciBub2RlcyA9IFtdLFxuICAgICAgZWRnZXMgPSBbXSxcbiAgICAgIGNlbnRlciA9IHt4OiAwLCB5OiAwfSxcbiAgICAgIG1uID0ge3g6IEluZmluaXR5LCB5OiBJbmZpbml0eX0sXG4gICAgICBteCA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eX0sXG4gICAgICB0b3RhbCA9IGcubm9kZXMoKS5sZW5ndGg7XG5cbiAgLy8gdXBkYXRlIHRoZSBub2RlIGluZm8gb2YgdGhlIG5vZGUgYWRkaW5nOlxuICAvLyAtIHhcbiAgLy8gLSB5XG4gIC8vIC0gcHJlZGVjZXNzb3JzXG4gIC8vIC0gc3VjY2Vzc29yc1xuICBsYXlvdXQuZWFjaE5vZGUoZnVuY3Rpb24gKGssIGxheW91dEluZm8pIHtcbiAgICB2YXIgeCA9IGxheW91dEluZm8ueDtcbiAgICB2YXIgeSA9IGxheW91dEluZm8ueTtcblxuICAgIG5vZGUgPSBnLm5vZGUoayk7XG4gICAgbm9kZS54ID0geDtcbiAgICBub2RlLnkgPSB5O1xuICAgIG5vZGUucHJlZGVjZXNzb3JzID0gZy5wcmVkZWNlc3NvcnMoayk7XG4gICAgbm9kZS5zdWNjZXNzb3JzID0gZy5zdWNjZXNzb3JzKGspO1xuICAgIG5vZGVzLnB1c2gobm9kZSk7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGJib3ggb2YgdGhlIGdyYXBoIHRvIGNlbnRlciB0aGUgZ3JhcGhcbiAgICB2YXIgbW54ID0geCAtIG5vZGUud2lkdGggLyAyO1xuICAgIHZhciBtbnkgPSB5IC0gbm9kZS5oZWlnaHQgLyAyO1xuICAgIHZhciBteHggPSB4ICsgbm9kZS53aWR0aCAvIDI7XG4gICAgdmFyIG14eSA9IHkgKyBub2RlLmhlaWdodCAvIDI7XG5cbiAgICBjZW50ZXIueCArPSB4O1xuICAgIGNlbnRlci55ICs9IHk7XG4gICAgbW4ueCA9IE1hdGgubWluKG1uLngsIG1ueCk7XG4gICAgbW4ueSA9IE1hdGgubWluKG1uLnksIG1ueSk7XG4gICAgLy8gY29uc29sZS5sb2coeCwgeSwgJyBkaW0gJywgbm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgIG14LnggPSBNYXRoLm1heChteC54LCBteHgpO1xuICAgIG14LnkgPSBNYXRoLm1heChteC55LCBteHkpO1xuICB9KTtcblxuICBjZW50ZXIueCAvPSAodG90YWwgfHwgMSk7XG4gIGNlbnRlci55IC89ICh0b3RhbCB8fCAxKTtcblxuICAvLyBjcmVhdGUgdGhlIGVkZ2VzIGZyb20gcHJvcGVydHkgdG8gbm9kZVxuICBfKGxpYnJhcnlFZGdlcykuZm9yT3duKGZ1bmN0aW9uIChsaW5rcykge1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgZWRnZXMucHVzaChsaW5rKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBlZGdlczogZWRnZXMsXG4gICAgbm9kZXM6IG5vZGVzLFxuICAgIGNlbnRlcjogY2VudGVyLFxuICAgIG1uOiBtbixcbiAgICBteDogbXhcbiAgfTtcbn1cblxuLy8gcmVuZGVyXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIHZhciBkYXRhO1xuXG4gIGlmIChjb250YWluZXIgPT09IG9sZENvbnRhaW5lcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHV0aWxzLm5vdGlmaWNhdGlvbigncHJvY2Vzc2luZyAnICsgY29udGFpbmVyLmdsb2JhbCk7XG5cbiAgLy8gcHJlIHJlbmRlclxuICBvbGRSZW5kZXJlciAmJiBvbGRSZW5kZXJlci5jbGVhbigpO1xuICByZW5kZXJlci5jbGVhbigpO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIGNvbnRhaW5lci5wcmVSZW5kZXIoKTtcbiAgICBjb25zb2xlLmxvZygncHJvY2VzcyAmIHJlbmRlciBzdGFydDogJywgbmV3IERhdGUoKSk7XG4gICAgLy8gZGF0YSBoYXNcbiAgICAvLyAtIGVkZ2VzIChwcm9wZXJ0eSAtPiBub2RlKVxuICAgIC8vIC0gbm9kZXNcbiAgICAvLyAtIGNlbnRlclxuICAgIC8vXG4gICAgY29uc29sZS50aW1lKCdwcm9jZXNzJyk7XG4gICAgZGF0YSA9IHByb2Nlc3MoKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ3Byb2Nlc3MnKTtcblxuICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncmVuZGVyaW5nICcgKyBjb250YWluZXIuZ2xvYmFsKTtcblxuICAgIGNvbnNvbGUudGltZSgncmVuZGVyJyk7XG4gICAgcmVuZGVyZXIucmVuZGVyKGRhdGEpO1xuICAgIGNvbnNvbGUudGltZUVuZCgncmVuZGVyJyk7XG5cbiAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlIScpO1xuICB9LCAwKTtcbn1cblxuLy8gcHVibGljIGFwaVxucG9qb3ZpeiA9IHtcbiAgcmVuZGVyZXJzOiB7fSxcbiAgYWRkUmVuZGVyZXJzOiBmdW5jdGlvbiAobmV3UmVuZGVyZXJzKSB7XG4gICAgXy5tZXJnZShwb2pvdml6LnJlbmRlcmVycywgbmV3UmVuZGVyZXJzKTtcbiAgfSxcbiAgbnVsbGlmeUNvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xuICAgIG9sZENvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICBjb250YWluZXIgPSBudWxsO1xuICB9LFxuICBnZXRDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9LFxuICBzZXRDb250YWluZXI6IGZ1bmN0aW9uIChjb250YWluZXJOYW1lLCBvcHRpb25zKSB7XG4gICAgb2xkQ29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGNvbnRhaW5lciA9IE9iamVjdEhhc2hlc1tjb250YWluZXJOYW1lXTtcblxuICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICBjb250YWluZXIgPSBPYmplY3RIYXNoZXMuY3JlYXRlTmV3KGNvbnRhaW5lck5hbWUsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZXF1aXJlZCB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXNcbiAgICAgIGNvbnRhaW5lci5zcmMgPSBvcHRpb25zLnNyYztcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFpbmVyLmluaXQoKTtcbiAgfSxcbiAgc2V0UmVuZGVyZXI6IGZ1bmN0aW9uIChyKSB7XG4gICAgb2xkUmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICByZW5kZXJlciA9IHBvam92aXoucmVuZGVyZXJzW3JdO1xuICB9LFxuICBnZXRSZW5kZXJlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByZW5kZXJlcjtcbiAgfSxcbiAgcmVuZGVyOiByZW5kZXIsXG5cbiAgLy8gZXhwb3NlIGlubmVyIG1vZHVsZXNcbiAgT2JqZWN0SGFzaGVzOiByZXF1aXJlKCcuL09iamVjdEhhc2hlcycpLFxuICBPYmplY3RBbmFseXplcjogcmVxdWlyZSgnLi9PYmplY3RBbmFseXplcicpLFxuICBhbmFseXplcjoge1xuICAgIEdlbmVyaWNBbmFseXplcjogcmVxdWlyZSgnLi9hbmFseXplci9HZW5lcmljQW5hbHl6ZXInKVxuICB9LFxuICB1dGlsczogcmVxdWlyZSgnLi91dGlsJyksXG5cbiAgLy8gdXNlciB2YXJzXG4gIHVzZXJWYXJpYWJsZXM6IFtdXG59O1xuXG4vLyBjdXN0b20gZXZlbnRzXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwcm9wZXJ0eS1jbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gIHZhciBkZXRhaWwgPSBlLmRldGFpbDtcbiAgcG9qb3ZpelxuICAgIC5nZXRDb250YWluZXIoKVxuICAgIC5zaG93U2VhcmNoKGRldGFpbC5uYW1lLCBkZXRhaWwucHJvcGVydHkpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3Zpejtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4vaGFzaEtleScpO1xuXG5mdW5jdGlvbiBIYXNoTWFwKCkge1xufVxuXG5IYXNoTWFwLnByb3RvdHlwZSA9IHtcbiAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXNbaGFzaEtleShrZXkpXSA9ICh2YWx1ZSB8fCBrZXkpO1xuICB9LFxuICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpc1toYXNoS2V5KGtleSldO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgdiA9IHRoaXNbaGFzaEtleShrZXkpXTtcbiAgICBkZWxldGUgdGhpc1toYXNoS2V5KGtleSldO1xuICAgIHJldHVybiB2O1xuICB9LFxuICBlbXB0eTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwLFxuICAgICAgICBtZSA9IHRoaXM7XG4gICAgZm9yIChwIGluIG1lKSB7XG4gICAgICBpZiAobWUuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhhc2hNYXA7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBhc3NlcnQgPSByZXF1aXJlKCcuLycpLmFzc2VydCxcbiAgbWUsIGhhc2hLZXk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0T3JGdW5jdGlvbih2KSB7XG4gIHJldHVybiB2ICYmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHYgPT09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIEdldHMgYSBzdG9yZSBoYXNoa2V5IG9ubHkgaWYgaXQncyBhbiBvYmplY3RcbiAqIEBwYXJhbSAge1t0eXBlXX0gb2JqXG4gKiBAcmV0dXJuIHtbdHlwZV19XG4gKi9cbmZ1bmN0aW9uIGdldChvYmopIHtcbiAgYXNzZXJ0KGlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIHJldHVybiBvYmouaGFzT3duUHJvcGVydHkgJiZcbiAgICBvYmouaGFzT3duUHJvcGVydHkobWUuaGlkZGVuS2V5KSAmJlxuICAgIG9ialttZS5oaWRkZW5LZXldO1xufVxuXG4vKipcbiAqIFNldHMgYSBrZXkgb24gYW4gb2JqZWN0XG4gKiBAcGFyYW0ge1t0eXBlXX0gb2JqIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7W3R5cGVdfSBrZXkgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBzZXQob2JqLCBrZXkpIHtcbiAgYXNzZXJ0KGlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIGFzc2VydChcbiAgICBrZXkgJiYgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycsXG4gICAgJ1RoZSBrZXkgbmVlZHMgdG8gYmUgYSB2YWxpZCBzdHJpbmcnXG4gICk7XG4gIGlmICghZ2V0KG9iaikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBtZS5oaWRkZW5LZXksIHtcbiAgICAgIHZhbHVlOiB0eXBlb2Ygb2JqICsgJy0nICsga2V5XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG1lO1xufVxuXG5tZSA9IGhhc2hLZXkgPSBmdW5jdGlvbiAodikge1xuICB2YXIgdmFsdWUgPSB2LFxuICAgICAgdWlkID0gdjtcblxuICBpZiAoaXNPYmplY3RPckZ1bmN0aW9uKHYpKSB7XG4gICAgaWYgKCFnZXQodikpIHtcbiAgICAgIG1lLmNyZWF0ZUhhc2hLZXlzRm9yKHYpO1xuICAgIH1cbiAgICB1aWQgPSBnZXQodik7XG4gICAgaWYgKCF1aWQpIHtcbiAgICAgIGNvbnNvbGUuZXJyKCdubyBoYXNoa2V5IDooJywgdik7XG4gICAgfVxuICAgIGFzc2VydCh1aWQsICdlcnJvciBnZXR0aW5nIHRoZSBrZXknKTtcbiAgICByZXR1cm4gdWlkO1xuICB9XG5cbiAgLy8gdiBpcyBhIHByaW1pdGl2ZVxuICByZXR1cm4gdHlwZW9mIHYgKyAnLScgKyB1aWQ7XG59O1xubWUuaGlkZGVuS2V5ID0gJ19fcG9qb1ZpektleV9fJztcblxubWUuY3JlYXRlSGFzaEtleXNGb3IgPSBmdW5jdGlvbiAob2JqLCBuYW1lKSB7XG5cbiAgZnVuY3Rpb24gbG9jYWxUb1N0cmluZyhvYmopIHtcbiAgICB2YXIgbWF0Y2g7XG4gICAgdHJ5IHtcbiAgICAgIG1hdGNoID0gb2JqLnRvU3RyaW5nKCkubWF0Y2goL15cXFtvYmplY3QgKFxcUyo/KVxcXS8pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbmFseXplIHRoZSBpbnRlcm5hbCBwcm9wZXJ0eSBbW0NsYXNzXV0gdG8gZ3Vlc3MgdGhlIG5hbWVcbiAgICogb2YgdGhpcyBvYmplY3QsIGUuZy4gW29iamVjdCBEYXRlXSwgW29iamVjdCBNYXRoXVxuICAgKiBNYW55IG9iamVjdCB3aWxsIGdpdmUgZmFsc2UgcG9zaXRpdmVzICh0aGV5IHdpbGwgbWF0Y2ggW29iamVjdCBPYmplY3RdKVxuICAgKiBzbyBsZXQncyBjb25zaWRlciBPYmplY3QgYXMgdGhlIG5hbWUgb25seSBpZiBpdCdzIGVxdWFsIHRvXG4gICAqIE9iamVjdC5wcm90b3R5cGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBmdW5jdGlvbiBoYXNBQ2xhc3NOYW1lKG9iaikge1xuICAgIHZhciBtYXRjaCA9IGxvY2FsVG9TdHJpbmcob2JqKTtcbiAgICBpZiAobWF0Y2ggPT09ICdPYmplY3QnKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBPYmplY3QucHJvdG90eXBlICYmICdPYmplY3QnO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROYW1lKG9iaikge1xuICAgIHZhciBuYW1lLCBjbGFzc05hbWU7XG5cbiAgICAvLyByZXR1cm4gdGhlIGFscmVhZHkgZ2VuZXJhdGVkIGhhc2hLZXlcbiAgICBpZiAoZ2V0KG9iaikpIHtcbiAgICAgIHJldHVybiBnZXQob2JqKTtcbiAgICB9XG5cbiAgICAvLyBnZW5lcmF0ZSBhIG5ldyBrZXkgYmFzZWQgb25cbiAgICAvLyAtIHRoZSBuYW1lIGlmIGl0J3MgYSBmdW5jdGlvblxuICAgIC8vIC0gYSB1bmlxdWUgaWRcbiAgICBuYW1lID0gdHlwZW9mIG9iai5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgb2JqLm5hbWU7XG5cbiAgICBjbGFzc05hbWUgPSBoYXNBQ2xhc3NOYW1lKG9iaik7XG4gICAgaWYgKCFuYW1lICYmIGNsYXNzTmFtZSkge1xuICAgICAgbmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9XG5cbiAgICBuYW1lID0gbmFtZSB8fCBfLnVuaXF1ZUlkKCk7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcLiBdL2ltZywgJy0nKTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIHRoZSBuYW1lIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQgbmFtZSBvciB0aGVcbiAgLy8gZ2VuZXJhdGVkIG5hbWVcbiAgbmFtZSA9IG5hbWUgfHwgZ2V0TmFtZShvYmopO1xuXG4gIC8vIGlmIHRoZSBvYmogaXMgYSBwcm90b3R5cGUgdGhlbiB0cnkgdG8gYW5hbHl6ZVxuICAvLyB0aGUgY29uc3RydWN0b3IgZmlyc3Qgc28gdGhhdCB0aGUgcHJvdG90eXBlIGJlY29tZXNcbiAgLy8gW25hbWVdLnByb3RvdHlwZVxuICAvLyBzcGVjaWFsIGNhc2U6IG9iamVjdC5jb25zdHJ1Y3RvciA9IG9iamVjdFxuICBpZiAob2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3RvciAhPT0gb2JqKSB7XG4gICAgcmV0dXJuIG1lLmNyZWF0ZUhhc2hLZXlzRm9yKG9iai5jb25zdHJ1Y3Rvcik7XG4gIH1cblxuICAvLyBzZXQgbmFtZSBvbiBzZWxmXG4gIHNldChvYmosIG5hbWUpO1xuXG4gIC8vIHNldCBuYW1lIG9uIHRoZSBwcm90b3R5cGVcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eSgncHJvdG90eXBlJykpIHtcbiAgICBzZXQob2JqLnByb3RvdHlwZSwgbmFtZSArICctcHJvdG90eXBlJyk7XG4gIH1cbn07XG5cbm1lLmhhcyA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB2Lmhhc093blByb3BlcnR5ICYmXG4gICAgdi5oYXNPd25Qcm9wZXJ0eShtZS5oaWRkZW5LZXkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBwcm9wZXJ0aWVzVHJhbnNmb3JtYXRpb24gPSB7XG4gICdbW1Byb3RvdHlwZV1dJzogJ19fcHJvdG9fXydcbn07XG5cbnZhciB1dGlscyA9IHtcbiAgYXNzZXJ0OiBmdW5jdGlvbiAodiwgbWVzc2FnZSkge1xuICAgIGlmICghdikge1xuICAgICAgdGhyb3cgbWVzc2FnZSB8fCAnZXJyb3InO1xuICAgIH1cbiAgfSxcbiAgdHJhbnNsYXRlOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeCB8fCAwKSArICcsICcgKyAoeSB8fCAwKSArICcpJztcbiAgfSxcbiAgc2NhbGU6IGZ1bmN0aW9uIChzKSB7XG4gICAgcmV0dXJuICdzY2FsZSgnICsgKHMgfHwgMSkgKyAnKSc7XG4gIH0sXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciB0ID0gW107XG4gICAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgdC5wdXNoKHV0aWxzW2tdLmFwcGx5KHV0aWxzLCB2KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHQuam9pbignICcpO1xuICB9LFxuICBwcmVmaXhlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCgncHYnKTtcbiAgICByZXR1cm4gYXJncy5qb2luKCctJyk7XG4gIH0sXG4gIHRyYW5zZm9ybVByb3BlcnR5OiBmdW5jdGlvbiAodikge1xuICAgIGlmIChwcm9wZXJ0aWVzVHJhbnNmb3JtYXRpb24uaGFzT3duUHJvcGVydHkodikpIHtcbiAgICAgIHJldHVybiBwcm9wZXJ0aWVzVHJhbnNmb3JtYXRpb25bdl07XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9LFxuICBlc2NhcGVDbHM6IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdi5yZXBsYWNlKC9cXCQvZywgJ18nKTtcbiAgfSxcbiAgdG9RdWVyeVN0cmluZzogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzID0gJycsXG4gICAgICAgIGkgPSAwO1xuICAgIF8uZm9yT3duKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgIGlmIChpKSB7XG4gICAgICAgIHMgKz0gJyYnO1xuICAgICAgfVxuICAgICAgcyArPSBrICsgJz0nICsgdjtcbiAgICAgIGkgKz0gMTtcbiAgICB9KTtcbiAgICByZXR1cm4gcztcbiAgfSxcbiAgY3JlYXRlRXZlbnQ6IGZ1bmN0aW9uIChldmVudE5hbWUsIGRldGFpbHMpIHtcbiAgICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgZGV0YWlsOiBkZXRhaWxzXG4gICAgfSk7XG4gIH0sXG4gIG5vdGlmaWNhdGlvbjogZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbnNvbGVUb28pIHtcbiAgICB2YXIgZXYgPSB1dGlscy5jcmVhdGVFdmVudCgncG9qb3Zpei1ub3RpZmljYXRpb24nLCBtZXNzYWdlKTtcbiAgICBjb25zb2xlVG9vICYmIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuICB9LFxuICBjcmVhdGVKc29ucENhbGxiYWNrOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyJdfQ==
(10)
});
