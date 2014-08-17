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

},{"./util/HashMap":12,"./util/hashKey":13,"lodash":"K2RcUv"}],5:[function(_dereq_,module,exports){
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
},{"./analyzer/Angular":6,"./analyzer/BuiltIn":7,"./analyzer/GenericAnalyzer":8,"./analyzer/Object":9,"./analyzer/Window":10,"lodash":"K2RcUv"}],6:[function(_dereq_,module,exports){
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
},{"../util/hashKey":13,"./GenericAnalyzer":8}],7:[function(_dereq_,module,exports){
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
},{"../util":14,"./GenericAnalyzer":8}],8:[function(_dereq_,module,exports){
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
},{"../ObjectAnalyzer":4,"../ObjectHashes":5,"../util/":14,"../util/hashKey":13,"lodash":"K2RcUv","q":"qLuPo1"}],9:[function(_dereq_,module,exports){
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
},{"../util":14,"./GenericAnalyzer":8}],10:[function(_dereq_,module,exports){
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
},{"../ObjectHashes":5,"../util/hashKey":13,"./GenericAnalyzer":8,"lodash":"K2RcUv"}],11:[function(_dereq_,module,exports){
var _ = _dereq_('lodash'),
  Q = _dereq_('q'),
  dagre = _dereq_('dagre'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9PYmplY3RBbmFseXplci5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvT2JqZWN0SGFzaGVzLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9Bbmd1bGFyLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9CdWlsdEluLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9hbmFseXplci9HZW5lcmljQW5hbHl6ZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL2FuYWx5emVyL09iamVjdC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvYW5hbHl6ZXIvV2luZG93LmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9zcmMvdXRpbC9IYXNoTWFwLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L3NyYy91dGlsL2hhc2hLZXkuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovc3JjL3V0aWwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBIYXNoTWFwID0gcmVxdWlyZSgnLi91dGlsL0hhc2hNYXAnKSxcbiAgaGFzaEtleSA9IHJlcXVpcmUoJy4vdXRpbC9oYXNoS2V5JyksXG4gIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuLy8gdXRpbHNcbmZ1bmN0aW9uIGVhY2hPYmplY3RBbmRQcm90b3R5cGUob2JqLCBmbikge1xuICBmbihvYmopO1xuICBpZiAob2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgIGZuKG9iai5wcm90b3R5cGUpO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYSBmdW5jdGlvbiB3aXRoIGFub3RoZXJcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtICB7RnVuY3Rpb259ICAgd3JhcHBlclxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gd3JhcEZuKGZuLCB3cmFwcGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTk9URTogYHRoaXNgIHdpbGwgYmUgdGhlIGluc3RhbmNlXG4gICAgd3JhcHBlci5jYWxsKHRoaXMpO1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNPYmplY3RPckZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICEhKHYgJiYgKHR5cGVvZiB2ID09PSAnb2JqZWN0JyB8fFxuICAgIHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nKSk7XG59XG5cbi8qKlxuICogUHJvcGVydGllcyBmb3JiaWRkZW4gaW4gc3RyaWN0IG1vZGVcbiAqIEB0eXBlIHtBcnJheX1cbiAqL1xudmFyIGZvcmJpZGRlbkluU3RyaWN0TW9kZSA9IFtcbiAgJ2NhbGxlZScsICdjYWxsZXInLCAnYXJndW1lbnRzJ1xuXTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIE9iamVjdCBhbmFseXpcbiAqIEBwYXJhbSB7W3R5cGVdfSBjb25maWcgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBBbmFseXplcihjb25maWcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEFuYWx5emVyKSkge1xuICAgIHJldHVybiBuZXcgQW5hbHl6ZXIoY29uZmlnKTtcbiAgfVxuICBjb25maWcgPSBjb25maWcgfHwge307XG5cbiAgLyoqXG4gICAqIE9iamVjdHMgcmVnaXN0ZXJlZCBpbiB0aGlzIGluc3RhbmNlXG4gICAqIEB0eXBlIHtIYXNoTWFwfVxuICAgKi9cbiAgdGhpcy5vYmplY3RzID0gY29uZmlnLm9iamVjdHMgfHwgbmV3IEhhc2hNYXAoKTtcbiAgLyoqXG4gICAqIEZvcmJpZGRlbiBvYmplY3RzXG4gICAqIEB0eXBlIHtIYXNoTWFwfVxuICAgKi9cbiAgdGhpcy5mb3JiaWRkZW4gPSBjb25maWcuZm9yYmlkZGVuIHx8IG5ldyBIYXNoTWFwKCk7XG5cbiAgLyoqXG4gICAqIENhY2hlIG9mIHByb3BlcnRpZXNcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMuX19jYWNoZU9iamVjdHMgPSB7fTtcblxuICAvKipcbiAgICogQ2FjaGUgb2YgbGlua3NcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMuX19jYWNoZUxpbmtzID0ge307XG5cbiAgLyoqXG4gICAqIERmcyBsZXZlbHNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMubGV2ZWxzID0gSW5maW5pdHk7XG4gIC8qKlxuICAgKiBJZiB0aGUgYW5hbHl6ZXIgaXMgZGlydHkgdGhlbiBpdCBoYXMgc29tZSBwZW5kaW5nIHdvcmtcbiAgICogdG8gZG9cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuICAvKipcbiAgICogVHJ1ZSB0byBzYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3RzIGFuYWx5emVkIGluIGFuXG4gICAqIGludGVybmFsIGNhY2hlXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdGhpcy5jYWNoZSA9XG4gICAgY29uZmlnLmhhc093blByb3BlcnR5KCdjYWNoZScpID9cbiAgICBjb25maWcuY2FjaGUgOiB0cnVlO1xuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGZ1bmN0aW9uIGNvbnN0cnVjdG9ycyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGhcbiAgICogaS5lLiB0aGUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhIHByb3RvdHlwZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZnVuY3Rpb25Db25zdHJ1Y3RvcnMgPVxuICAgIGNvbmZpZy5oYXNPd25Qcm9wZXJ0eSgnZnVuY3Rpb25Db25zdHJ1Y3RvcnMnKSA/XG4gICAgY29uZmlnLmZ1bmN0aW9uQ29uc3RydWN0b3JzIDogZmFsc2U7XG4gIC8qKlxuICAgKiBUcnVlIHRvIGluY2x1ZGUgYWxsIHRoZSBmdW5jdGlvbnMgaW4gdGhlIGFuYWx5c2lzIGdyYXBoXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5hbGxGdW5jdGlvbnMgPVxuICAgIGNvbmZpZy5oYXNPd25Qcm9wZXJ0eSgnYWxsRnVuY3Rpb25zJykgP1xuICAgIGNvbmZpZy5hbGxGdW5jdGlvbnMgOiBmYWxzZTtcbiAgLyoqXG4gICAqIFRydWUgdG8gYWxsb3cgSFRNTCBub2Rlc1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuaHRtbE5vZGUgPVxuICAgIGNvbmZpZy5oYXNPd25Qcm9wZXJ0eSgnaHRtbE5vZGUnKSA/XG4gICAgY29uZmlnLmh0bWxOb2RlIDogZmFsc2U7XG59XG5cbkFuYWx5emVyLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEFuYWx5emVyLFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYW4gb2JqZWN0IGlzIGluIHRoZSBmb3JiaWRkZW4gaGFzaFxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBvYmpcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGlzRm9yYmlkZGVuOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9yYmlkZGVuLmdldChvYmopO1xuICB9LFxuXG4gIGlzTGlua2FibGU6IGZ1bmN0aW9uIChrZXksIG9iaikge1xuICAgIGlmICghb2JqKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHYgPSB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JztcblxuICAgIC8vIGlmICh2KSB7XG4gICAgLy8gICBpZiAoIXRoaXMuaHRtbE5vZGUgJiYgdiBpbnN0YW5jZW9mIE5vZGUpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgLy8gICByZXR1cm4gdHJ1ZTtcbiAgICAvLyB9XG5cbiAgICAvLyBpZiAoIXRoaXMuaHRtbE5vZGUpIHtcbiAgICAvLyAgIHYgPSB2ICYmICEodiBpbnN0YW5jZW9mIE5vZGUpO1xuICAgIC8vIH1mZGVxMWBcblxuICAgIC8vIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiZcbiAgICAvLyAgIGNvbnNvbGUubG9nKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikpO1xuICAgIGlmICghdiAmJiB0aGlzLmFsbEZ1bmN0aW9ucykge1xuICAgICAgLy8gbWluaW1pemUgdGhlIG5vZGVzIGNyZWF0ZWQgYnkgY29uc2lkZXJpbmcgZnVuY3Rpb25zXG4gICAgICAvLyB3aXRoIG1vcmUgcHJvcGVydGllcyB0aGFuIHRoZSB1c3VhbCBvbmVzXG4gICAgICB2ID0gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgIHYgPSB2ICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikubGVuZ3RoID4gNTtcbiAgICB9XG4gICAgaWYgKCF2ICYmIHRoaXMuZnVuY3Rpb25Db25zdHJ1Y3RvcnMpIHtcbiAgICAgIHYgPSB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgICAgdiA9IHYgJiYgKFxuICAgICAgICBvYmoubmFtZSAmJlxuICAgICAgICBvYmoubmFtZVswXS5tYXRjaCgvXltBLVpdLykgfHxcbiAgICAgICAga2V5WzBdLm1hdGNoKC9eW0EtWl0vKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudW1lcmFibGUgcHJvcGVydGllcyBhbiBvYmplY3QgZGlzY2FyZGluZ1xuICAgKiBmb3JiaWRkZW4gb25lc1xuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvYmplY3QgaGFzIHRoZSBmb2xsb3dpbmdcbiAgICogcHJvcGVydGllczpcbiAgICpcbiAgICogLSBuYW1lXG4gICAqIC0gY2xzXG4gICAqIC0gdHlwZVxuICAgKiAtIGxpbmtlYWJsZSAoaWYgaXQncyBhbiBvYmplY3QgdGhpcyBwcm9wZXJ0eSBpcyBzZXQgdG8gdHJ1ZSlcbiAgICovXG4gIGdldFByb3BlcnRpZXM6IGZ1bmN0aW9uIChvYmosIGxpbmthYmxlT25seSkge1xuICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICBoayA9IGhhc2hLZXkob2JqKSxcbiAgICAgIHByb3BlcnRpZXM7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgdGhyb3cgJ3RoaXMgbWV0aG9kIG5lZWRzIGFuIG9iamVjdCB0byBhbmFseXplJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jYWNoZSkge1xuICAgICAgaWYgKCFsaW5rYWJsZU9ubHkgJiYgdGhpcy5fX2NhY2hlT2JqZWN0c1toa10pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ29iamVjdHMgZnJvbSBjYWNoZSA6KScpO1xuICAgICAgICByZXR1cm4gdGhpcy5fX2NhY2hlT2JqZWN0c1toa107XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaik7XG5cbiAgICBmdW5jdGlvbiBmb3JiaWRkZW5LZXkodikge1xuICAgICAgLy8gZm9yYmlkZGVuIGluIHN0cmljdCBtb2RlXG4gICAgICByZXR1cm4gfmZvcmJpZGRlbkluU3RyaWN0TW9kZS5pbmRleE9mKHYpIHx8XG4gICAgICAgIHYubWF0Y2goL15fXy4qP19fJC8pIHx8XG4gICAgICAgIHYubWF0Y2goL15cXCRcXCQuKj9cXCRcXCQkLykgfHxcbiAgICAgICAgdi5tYXRjaCgvWzorfiE+PD0vL1xcW1xcXUAgXS8pO1xuICAgIH1cblxuICAgIHByb3BlcnRpZXMgPSBfLmZpbHRlcihwcm9wZXJ0aWVzLCBmdW5jdGlvbiAodikge1xuICAgICAgdmFyIGdvb2QgPSB0eXBlb2YgdiA9PT0gJ3N0cmluZycgJiYgIWZvcmJpZGRlbktleSh2KSxcbiAgICAgICAgICByO1xuICAgICAgaWYgKGxpbmthYmxlT25seSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHIgPSBnb29kICYmIG1lLmlzTGlua2FibGUodiwgb2JqW3ZdKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHIgPSBmYWxzZTtcbiAgICAgICAgICAvLyB1bmNvbW1lbnQgdG8gc2VlIHdoeSBvYmpbdl0gaXMgbm90IGFsbG93ZWRcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGdvb2Q7XG4gICAgfSkubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgdHlwZSxcbiAgICAgICAgbGlua2VhYmxlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gdHlwZSA9IG51bGx8c3RyaW5nfHVuZGVmaW5lZHxudW1iZXJ8b2JqZWN0XG4gICAgICAgIHR5cGUgPSB0eXBlb2Ygb2JqW3ZdO1xuICAgICAgICBsaW5rZWFibGUgPSBpc09iamVjdE9yRnVuY3Rpb24ob2JqW3ZdKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB0eXBlID0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIGxpbmtlYWJsZSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAvLyBwYXJlbnQ6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgbmFtZTogdixcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgbGlua2VhYmxlOiBsaW5rZWFibGVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBzcGVjaWFsIHByb3BlcnRpZXNcbiAgICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICBpZiAocHJvdG8pIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdbW1Byb3RvdHlwZV1dJyxcbiAgICAgICAgLy8gY2xzOiBoYXNoS2V5KG9iaiksXG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBsaW5rZWFibGU6IHRydWUsXG4gICAgICAgIGhpZGRlbjogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBjb25zdHJ1Y3RvciA9IG9iai5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nO1xuICAgIGlmIChjb25zdHJ1Y3RvciAmJlxuICAgICAgICBfLmZpbmRJbmRleChwcm9wZXJ0aWVzLCB7IG5hbWU6ICdjb25zdHJ1Y3RvcicgfSkgPT09IC0xKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICAvLyBjbHM6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgbmFtZTogJ2NvbnN0cnVjdG9yJyxcbiAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICAgICAgbGlua2VhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jYWNoZSAmJiAhbGlua2FibGVPbmx5KSB7XG4gICAgICB0aGlzLl9fY2FjaGVPYmplY3RzW2hrXSA9IHByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2cocHJvcGVydGllcyk7XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFuYWx5emVzIGEgbGlzdCBvZiBvYmplY3RzIHJlY3Vyc2l2ZWx5XG4gICAqIEBwYXJhbSAge0FycmF5fSBvYmplY3RzICAgICAgQXJyYXkgb2Ygb2JqZWN0c1xuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGN1cnJlbnRMZXZlbCBDdXJyZW50IGRmcyBsZXZlbFxuICAgKi9cbiAgYW5hbHl6ZU9iamVjdHM6IGZ1bmN0aW9uIChvYmplY3RzLCBjdXJyZW50TGV2ZWwpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBtZS5sZXZlbHMgJiYgICAgLy8gZGZzIGxldmVsXG4gICAgICAgICAgIW1lLm9iamVjdHMuZ2V0KHYpICYmICAgICAgICAgLy8gYWxyZWFkeSByZWdpc3RlcmVkXG4gICAgICAgICAgIW1lLmlzRm9yYmlkZGVuKHYpICAgICAgICAgICAgICAvLyBmb3JiaWRkZW4gY2hlY2tcbiAgICAgICAgICApIHtcblxuICAgICAgICAvLyBpZiAodi5oYXNPd25Qcm9wZXJ0eSgnX19wcm9jZXNzZWRfXycpKSB7XG4gICAgICAgIC8vICAgZGVidWdnZXI7XG4gICAgICAgIC8vICAgdGhyb3cgJ3d0Zic7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5KHYsICdfX3Byb2Nlc3NlZF9fJywge1xuICAgICAgICAvLyAgIHZhbHVlOiAncHJvY2Vzc3NlZCdcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gYWRkIHRvIHRoZSByZWdpc3RlcmVkIG9iamVjdCBwb29sXG4gICAgICAgIG1lLm9iamVjdHMucHV0KHYpO1xuXG4gICAgICAgIC8vIGRmcyB0byB0aGUgbmV4dCBsZXZlbFxuICAgICAgICBtZS5hbmFseXplT2JqZWN0cyhcbiAgICAgICAgICBtZS5nZXRPd25MaW5rcyh2KS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgICAgIHJldHVybiBsaW5rLnRvO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIGN1cnJlbnRMZXZlbCArIDFcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGxpc3Qgb2YgbGlua3MsIGVhY2ggbGluayBpcyBhbiBvYmplY3Qgd2hpY2ggaGFzIHRoZVxuICAgKiBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogLSBmcm9tXG4gICAqIC0gdG9cbiAgICogLSBwcm9wZXJ0eSAoc3RyaW5nKVxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIGdldE93bkxpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgbGlua3MgPSBbXSxcbiAgICAgICAgcHJvcGVydGllcyxcbiAgICAgICAgbmFtZSA9IGhhc2hLZXkob2JqKTtcblxuICAgIGlmICh0aGlzLl9fY2FjaGVMaW5rc1tuYW1lXSkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ2xpbmtzIGZyb20gY2FjaGUgOiknKTtcbiAgICAgIHJldHVybiB0aGlzLl9fY2FjaGVMaW5rc1tuYW1lXTtcbiAgICB9XG5cbiAgICBwcm9wZXJ0aWVzID0gbWUuZ2V0UHJvcGVydGllcyhvYmosIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gZ2V0QXVnbWVudGVkSGFzaChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghaGFzaEtleS5oYXMob2JqKSAmJlxuICAgICAgICAgIG5hbWUgIT09ICdwcm90b3R5cGUnICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKG9iaiwgbmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzaEtleShvYmopO1xuICAgIH1cblxuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgJ3RoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSBhIGhhc2hrZXknO1xuICAgIH1cblxuICAgIF8uZm9yRWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbiAodikge1xuICAgICAgdmFyIHJlZiA9IG9ialt2Lm5hbWVdO1xuICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgbGV2ZWxzIGEgcmVmZXJlbmNlIG1pZ2h0IG5vdCBleGlzdFxuICAgICAgaWYgKCFyZWYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb2JqZWN0IGRvZXNuJ3QgaGF2ZSBhIGhhc2hrZXlcbiAgICAgIC8vIGxldCdzIGdpdmUgaXQgYSBuYW1lIGVxdWFsIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgLy8gYmVpbmcgYW5hbHl6ZWRcbiAgICAgIGdldEF1Z21lbnRlZEhhc2gocmVmLCB2Lm5hbWUpO1xuXG4gICAgICBpZiAoIW1lLmlzRm9yYmlkZGVuKHJlZikpIHtcbiAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgICAgdG86IHJlZixcbiAgICAgICAgICB0b0hhc2g6IGhhc2hLZXkocmVmKSxcbiAgICAgICAgICBwcm9wZXJ0eTogdi5uYW1lXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvICYmICFtZS5pc0ZvcmJpZGRlbihwcm90bykpIHtcbiAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICBmcm9tOiBvYmosXG4gICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgIHRvOiBwcm90byxcbiAgICAgICAgdG9IYXNoOiBoYXNoS2V5KHByb3RvKSxcbiAgICAgICAgcHJvcGVydHk6ICdbW1Byb3RvdHlwZV1dJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIHRoaXMuX19jYWNoZUxpbmtzW25hbWVdID0gbGlua3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmtzO1xuICB9LFxuXG4gIG1ha2VEaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICB9LFxuXG4gIHNldExldmVsczogZnVuY3Rpb24gKGwpIHtcbiAgICB0aGlzLmxldmVscyA9IGw7XG4gIH0sXG5cbiAgc2V0RGlydHk6IGZ1bmN0aW9uIChkKSB7XG4gICAgdGhpcy5kaXJ0eSA9IGQ7XG4gIH0sXG5cbiAgc2V0RnVuY3Rpb25Db25zdHJ1Y3RvcnM6IGZ1bmN0aW9uICh2KSB7XG4gICAgdGhpcy5mdW5jdGlvbkNvbnN0cnVjdG9ycyA9IHY7XG4gIH0sXG5cbiAgZ2V0T2JqZWN0czogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9iamVjdHM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIGFuIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEBwYXJhbSAgdG9TdHJpbmdcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvcGVydGllcyhvYmopO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVwcmVzZW50YXRpb24gb2YgdGhlIGxpbmtzIG9mXG4gICAqIGFuIG9iamVjdFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdExpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICByZXR1cm4gbWUuZ2V0T3duTGlua3Mob2JqKS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIC8vIGRpc2NhcmRlZDogZnJvbSwgdG9cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZyb206IGxpbmsuZnJvbUhhc2gsXG4gICAgICAgIHRvOiBsaW5rLnRvSGFzaCxcbiAgICAgICAgcHJvcGVydHk6IGxpbmsucHJvcGVydHlcbiAgICAgIH07XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIHRoZSBvYmplY3RzIHNhdmVkIGluIHRoaXMgYW5hbHl6ZXJcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgIG5vZGVzID0ge30sXG4gICAgICBlZGdlcyA9IHt9O1xuICAgIGNvbnNvbGUudGltZSgnc3RyaW5naWZ5Jyk7XG4gICAgXyh0aGlzLm9iamVjdHMpLmZvck93bihmdW5jdGlvbiAodikge1xuICAgICAgbm9kZXNbaGFzaEtleSh2KV0gPSBtZS5zdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzKHYpO1xuICAgICAgZWRnZXNbaGFzaEtleSh2KV0gPSBtZS5zdHJpbmdpZnlPYmplY3RMaW5rcyh2KTtcbiAgICB9KTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ3N0cmluZ2lmeScpO1xuICAgIHJldHVybiB7XG4gICAgICBub2Rlczogbm9kZXMsXG4gICAgICBlZGdlczogZWRnZXNcbiAgICB9O1xuICB9XG59O1xuXG4vLyBhZGl0aW9uYWwgb2JqZWN0cyB0aGF0IG5lZWQgdGhlIHByb3RvdHlwZSB0byBleGlzdFxudmFyIGFQcm90byA9IEFuYWx5emVyLnByb3RvdHlwZTtcbl8ubWVyZ2UoYVByb3RvLCB7XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBsaXN0IG9mIG9iamVjdHMgdG8gYW5hbHl6ZSBhbmQgbWFrZSB0aGUgYW5hbHl6ZXIgZGlydHlcbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHJldHVybiB7dGhpc31cbiAgICovXG4gIGFkZDogd3JhcEZuKGZ1bmN0aW9uIChvYmplY3RzKSB7XG4gICAgY29uc29sZS50aW1lKCdhbmFseXplJyk7XG4gICAgdGhpcy5hbmFseXplT2JqZWN0cyhvYmplY3RzLCAwKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ2FuYWx5emUnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSwgYVByb3RvLm1ha2VEaXJ0eSksXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBsaXN0IG9mIG9iamVjdHMsIGlmIGB3aXRoUHJvdG90eXBlYCBpcyB0cnVlIHRoZW5cbiAgICogYWxzbyB0aGUgcHJvdG90eXBlIGlzIHJlbW92ZWRcbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZVxuICAgKiBAcmV0dXJuIHt0aGlzfVxuICAgKi9cbiAgcmVtb3ZlOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBtZS5vYmplY3RzLnJlbW92ZShvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5vYmplY3RzLnJlbW92ZShvYmoucHJvdG90eXBlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWU7XG4gIH0sIGFQcm90by5tYWtlRGlydHkpLFxuXG4gIC8qKlxuICAgKiBGb3JiaWRzIGEgbGlzdCBvZiBvYmplY3RzLCBpZiBgd2l0aFByb3RvdHlwZWAgaXMgdHJ1ZSB0aGVuXG4gICAqIGFsc28gdGhlIHByb3RvdHlwZSBpcyBmb3JiaWRkZW5cbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0cz59IG9iamVjdHNcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZVxuICAgKiBAcmV0dXJuIHt0aGlzfVxuICAgKi9cbiAgZm9yYmlkOiB3cmFwRm4oZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIG1lLnJlbW92ZShvYmplY3RzLCB3aXRoUHJvdG90eXBlKTtcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnB1dChvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5mb3JiaWRkZW4ucHV0KG9iai5wcm90b3R5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBhUHJvdG8ubWFrZURpcnR5KSxcblxuICAvKipcbiAgICogVW5mb3JiaWRzIGEgbGlzdCBvZiBvYmplY3RzLCBpZiBgd2l0aFByb3RvdHlwZWAgaXMgdHJ1ZSB0aGVuXG4gICAqIGFsc28gdGhlIHByb3RvdHlwZSBpcyB1bmZvcmJpZGRlblxuICAgKiBAcGFyYW0gIHtBcnJheTxPYmplY3RzPn0gb2JqZWN0c1xuICAgKiBAcGFyYW0gIHtib29sZWFufSB3aXRoUHJvdG90eXBlXG4gICAqIEByZXR1cm4ge3RoaXN9XG4gICAqL1xuICB1bmZvcmJpZDogd3JhcEZuKGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgbWUuZm9yYmlkZGVuLnJlbW92ZShvYmopO1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUgJiYgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgICAgICBtZS5mb3JiaWRkZW4ucmVtb3ZlKG9iai5wcm90b3R5cGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBhUHJvdG8ubWFrZURpcnR5KVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQW5hbHl6ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIEdlbmVyaWMgPSByZXF1aXJlKCcuL2FuYWx5emVyL0dlbmVyaWNBbmFseXplcicpLFxuICBBbmd1bGFyID0gcmVxdWlyZSgnLi9hbmFseXplci9Bbmd1bGFyJyksXG4gIFdpbmRvdyA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvV2luZG93JyksXG4gIFBPYmplY3QgPSByZXF1aXJlKCcuL2FuYWx5emVyL09iamVjdCcpLFxuICBCdWlsdEluID0gcmVxdWlyZSgnLi9hbmFseXplci9CdWlsdEluJyk7XG5cbnZhciBsaWJyYXJpZXM7XG5cbnZhciBwcm90byA9IHtcbiAgY3JlYXRlTmV3OiBmdW5jdGlvbiAoZ2xvYmFsLCBvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIGEgZ2VuZXJpYyBjb250YWluZXIgZm9yOiAnICsgZ2xvYmFsLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKGxpYnJhcmllc1tnbG9iYWxdID0gbmV3IEdlbmVyaWMob3B0aW9ucykpO1xuICB9LFxuICBhbGw6IGZ1bmN0aW9uIChmbikge1xuICAgIF8uZm9yT3duKGxpYnJhcmllcywgZm4pO1xuICB9LFxuICBtYXJrRGlydHk6IGZ1bmN0aW9uICgpIHtcbiAgICBwcm90by5hbGwoZnVuY3Rpb24gKHYpIHtcbiAgICAgIHYubWFya0RpcnR5KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9LFxuICBzZXRGdW5jdGlvbkNvbnN0cnVjdG9yczogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgcHJvdG8uYWxsKGZ1bmN0aW9uICh2KSB7XG4gICAgICAvLyB0aGlzIG9ubHkgd29ya3Mgb24gdGhlIGdlbmVyaWMgYW5hbHl6ZXJzXG4gICAgICBpZiAoIXYuX2hhc2ZjKSB7XG4gICAgICAgIHYuYW5hbHl6ZXIuc2V0RnVuY3Rpb25Db25zdHJ1Y3RvcnMobmV3VmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwcm90bztcbiAgfVxufTtcblxubGlicmFyaWVzID0gT2JqZWN0LmNyZWF0ZShwcm90byk7XG5fLm1lcmdlKGxpYnJhcmllcywge1xuICBvYmplY3Q6IG5ldyBQT2JqZWN0KCksXG4gIGJ1aWx0SW46IG5ldyBCdWlsdEluKCksXG4gIHdpbmRvdzogbmV3IFdpbmRvdygpLFxuICAvLyBwb3B1bGFyXG4gIGFuZ3VsYXI6IG5ldyBBbmd1bGFyKCksXG4gIC8vIG1pbmVcbiAgLy8gdDM6IG5ldyBHZW5lcmljKHsgZ2xvYmFsOiAndDMnIH0pLFxuICAvLyBodWdlXG4gIHRocmVlOiBuZXcgR2VuZXJpYyh7XG4gICAgZ2xvYmFsOiAnVEhSRUUnLFxuICAgIHJlbmRlcmVhY2h0aW1lOiB0cnVlXG4gIH0pLFxufSk7XG5cbi8vIGNvbnNvbGUubG9nKGxpYnJhcmllcyk7XG5cbi8vIHdpbiBtYXggbGV2ZWwgaW5pdGlhbGx5IGlzIDBcbi8vIGxpYnJhcmllcy53aW4ucHJlUmVuZGVyID0gZnVuY3Rpb24gKCkge1xuLy8gICBsaWJyYXJpZXMud2luLmdldE9iamVjdHMoKS5lbXB0eSgpO1xuLy8gICBsaWJyYXJpZXMud2luLmFuYWx5emVPYmplY3RzKFt3aW5kb3ddLCAwKTtcbi8vIH07XG5cbi8vIGNvbnNvbGUubG9nKGJ1aWx0SW4uZ2V0T2JqZWN0cygpKTtcbi8vIGNvbnNvbGUubG9nKHdpbi5nZXRPYmplY3RzKCkpO1xuLy8gY29uc29sZS5sb2codXNlci5nZXRPYmplY3RzKCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpYnJhcmllczsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZW5lcmljQW5hbHl6ZXIgPSByZXF1aXJlKCcuL0dlbmVyaWNBbmFseXplcicpLFxuICBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIEFuZ3VsYXIoKSB7XG4gIEdlbmVyaWNBbmFseXplci5jYWxsKHRoaXMsIHtcbiAgICBnbG9iYWw6ICdhbmd1bGFyJyxcbiAgICBkaXNwbGF5bmFtZTogJ0FuZ3VsYXJKUycsXG4gICAgcmVuZGVyZWFjaHRpbWU6IHRydWVcbiAgfSk7XG5cbiAgdGhpcy5zZXJ2aWNlcyA9IFtcbiAgICAnJGFuaW1hdGUnLFxuICAgICckY2FjaGVGYWN0b3J5JyxcbiAgICAnJGNvbXBpbGUnLFxuICAgICckY29udHJvbGxlcicsXG4gICAgLy8gJyRkb2N1bWVudCcsXG4gICAgJyRleGNlcHRpb25IYW5kbGVyJyxcbiAgICAnJGZpbHRlcicsXG4gICAgJyRodHRwJyxcbiAgICAnJGh0dHBCYWNrZW5kJyxcbiAgICAnJGludGVycG9sYXRlJyxcbiAgICAnJGludGVydmFsJyxcbiAgICAnJGxvY2FsZScsXG4gICAgJyRsb2cnLFxuICAgICckcGFyc2UnLFxuICAgICckcScsXG4gICAgJyRyb290U2NvcGUnLFxuICAgICckc2NlJyxcbiAgICAnJHNjZURlbGVnYXRlJyxcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgICckdGltZW91dCcsXG4gICAgLy8gJyR3aW5kb3cnXG4gIF0ubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSwgbmFtZTogdiB9O1xuICB9KTtcbn1cblxuQW5ndWxhci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG5Bbmd1bGFyLnByb3RvdHlwZS5nZXRTZWxlY3RlZFNlcnZpY2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIHRvQW5hbHl6ZSA9IFtdO1xuXG4gIHdpbmRvdy5hbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZyddKTtcbiAgdGhpcy5pbmplY3RvciA9IHdpbmRvdy5hbmd1bGFyLmluamVjdG9yKFsnYXBwJ10pO1xuXG4gIG1lLnNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICBpZiAocy5jaGVja2VkKSB7XG4gICAgICB2YXIgb2JqID0gbWUuaW5qZWN0b3IuZ2V0KHMubmFtZSk7XG4gICAgICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKG9iaiwgcy5uYW1lKTtcbiAgICAgIHRvQW5hbHl6ZS5wdXNoKG9iaik7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRvQW5hbHl6ZTtcbn07XG5cbkFuZ3VsYXIucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBhbmd1bGFyJyk7XG4gIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iod2luZG93LmFuZ3VsYXIsICdhbmd1bGFyJyk7XG4gIHRoaXMuYW5hbHl6ZXIuZ2V0T2JqZWN0cygpLmVtcHR5KCk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKFxuICAgIFt3aW5kb3cuYW5ndWxhcl0uY29uY2F0KHRoaXMuZ2V0U2VsZWN0ZWRTZXJ2aWNlcygpKVxuICApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmd1bGFyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vR2VuZXJpY0FuYWx5emVyJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgdG9JbnNwZWN0ID0gW1xuICBPYmplY3QsIEZ1bmN0aW9uLFxuICBBcnJheSwgRGF0ZSwgQm9vbGVhbiwgTnVtYmVyLCBNYXRoLCBTdHJpbmcsIFJlZ0V4cCwgSlNPTixcbiAgRXJyb3Jcbl07XG5cbmZ1bmN0aW9uIEJ1aWx0SW4oKSB7XG4gIEdlbmVyaWNBbmFseXplci5jYWxsKHRoaXMpO1xufVxuXG5CdWlsdEluLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cbkJ1aWx0SW4ucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBidWlsdEluIG9iamVjdHMnKTtcbiAgdGhpcy5hbmFseXplci5hZGQodGhpcy5nZXRPYmplY3RzKCkpO1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuZ2V0T2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRvSW5zcGVjdDtcbn07XG5cbkJ1aWx0SW4ucHJvdG90eXBlLnNob3dTZWFyY2ggPSBmdW5jdGlvbiAobm9kZU5hbWUsIG5vZGVQcm9wZXJ0eSkge1xuICB2YXIgdXJsID0gJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL3NlYXJjaD8nICtcbiAgICB1dGlscy50b1F1ZXJ5U3RyaW5nKHtcbiAgICAgIHE6IGVuY29kZVVSSUNvbXBvbmVudChub2RlTmFtZSArICcgJyArIG5vZGVQcm9wZXJ0eSksXG4gICAgfSk7XG4gIHdpbmRvdy5vcGVuKHVybCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1aWx0SW47IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUSA9IHJlcXVpcmUoJ3EnKSxcbiAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvJyksXG4gIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKSxcbiAgYW5hbHl6ZXIgPSByZXF1aXJlKCcuLi9PYmplY3RBbmFseXplcicpO1xuXG52YXIgc2VhcmNoRW5naW5lID0gJ2h0dHBzOi8vZHVja2R1Y2tnby5jb20vP3E9JztcblxuZnVuY3Rpb24gR2VuZXJpY0FuYWx5emVyKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIC8vIGlmICghbmFtZSkge1xuICAvLyAgIHRocm93ICduYW1lIG5lZWRzIHRvIGJlIGRlZmluZWQnO1xuICAvLyB9XG4gIHRoaXMuZ2xvYmFsID0gb3B0aW9ucy5nbG9iYWw7XG4gIHRoaXMuZGlzcGxheW5hbWUgPSBvcHRpb25zLmRpc3BsYXluYW1lO1xuICB0aGlzLmxldmVscyA9IG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xldmVscycpID8gb3B0aW9ucy5sZXZlbHMgOiAxMDtcbiAgdGhpcy5mb3JiaWRkZW4gPSBvcHRpb25zLmZvcmJpZGRlbiB8fCBbXTtcbiAgdGhpcy5zcmMgPSBvcHRpb25zLnNyYztcbiAgdGhpcy5faGFzZmMgPSBvcHRpb25zLmhhc093blByb3BlcnR5KCdmdW5jdGlvbmNvbnN0cnVjdG9ycycpO1xuICB0aGlzLmZ1bmN0aW9uY29uc3RydWN0b3JzID0gdGhpcy5faGFzZmMgP1xuICAgIG9wdGlvbnMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMgOiBHZW5lcmljQW5hbHl6ZXIuU0hPV19GVU5DVElPTl9DT05TVFJVQ1RPUlM7XG4gIHRoaXMucmVuZGVyZWFjaHRpbWUgPSBvcHRpb25zLmhhc093blByb3BlcnR5KCdyZW5kZXJlYWNodGltZScpID9cbiAgICBvcHRpb25zLnJlbmRlcmVhY2h0aW1lIDogZmFsc2U7XG4gIHRoaXMuYWxsZnVuY3Rpb25zID0gb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnYWxsZnVuY3Rpb25zJykgP1xuICAgIG9wdGlvbnMuYWxsZnVuY3Rpb25zIDogZmFsc2U7XG5cbiAgdGhpcy5pbnNwZWN0ZWQgPSBmYWxzZTtcblxuICAvLyBwYXJzZSBmb3JiaWQgc3RyaW5nIHRvIGFycmF5XG4gIHRoaXMucGFyc2UoKTtcblxuICB0aGlzLmFuYWx5emVyID0gYW5hbHl6ZXIoe1xuICAgIGZ1bmN0aW9uQ29uc3RydWN0b3JzOiB0aGlzLmZ1bmN0aW9uY29uc3RydWN0b3JzLFxuICAgIGFsbEZ1bmN0aW9uczogdGhpcy5hbGxmdW5jdGlvbnNcbiAgfSk7XG59XG5cbkdlbmVyaWNBbmFseXplci5TSE9XX0JVSUxUSU4gPSBmYWxzZTtcbkdlbmVyaWNBbmFseXplci5TSE9XX0ZVTkNUSU9OX0NPTlNUUlVDVE9SUyA9IHRydWU7XG5HZW5lcmljQW5hbHl6ZXIuRk9SQklEREVOID0gJ3Bvam92aXo6d2luZG93LHBvam92aXo6YnVpbHRJbixkb2N1bWVudCc7XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgY29uc29sZS5sb2coJyVjUG9qb1ZpeicsICdmb250LXNpemU6IDE1cHg7IGNvbG9yOiAnKTtcbiAgcmV0dXJuIG1lLmZldGNoKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAobWUucmVuZGVyZWFjaHRpbWUgfHwgIW1lLmluc3BlY3RlZCkge1xuICAgICAgICBtZS5pbnNwZWN0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWU7XG4gICAgfSk7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIHRoaXMuZm9yYmlkZGVuID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZm9yYmlkZGVuID0gdGhpcy5mb3JiaWRkZW4uc3BsaXQoJywnKTtcbiAgfVxuICBpZiAodHlwZW9mIHRoaXMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5mdW5jdGlvbmNvbnN0cnVjdG9ycyA9IHRoaXMuZnVuY3Rpb25jb25zdHJ1Y3RvcnMgPT09ICd0cnVlJztcbiAgfVxuICBpZiAodHlwZW9mIHRoaXMucmVuZGVyZWFjaHRpbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5yZW5kZXJlYWNodGltZSA9IHRoaXMucmVuZGVyZWFjaHRpbWUgPT09ICd0cnVlJztcbiAgfVxuICBpZiAodHlwZW9mIHRoaXMuYWxsZnVuY3Rpb25zID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuYWxsZnVuY3Rpb25zID0gdGhpcy5hbGxmdW5jdGlvbnMgPT09ICd0cnVlJztcbiAgfVxufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5tYXJrRGlydHkgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuaW5zcGVjdGVkID0gZmFsc2U7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnYW5hbHl6aW5nIHdpbmRvdy4nICsgdGhpcy5nbG9iYWwpO1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIGFuYWx5emVyID0gdGhpcy5hbmFseXplcixcbiAgICBmb3JiaWRkZW4gPSBbXS5jb25jYXQodGhpcy5mb3JiaWRkZW4pO1xuICAvLyBzZXQgYSBwcmVkZWZpZWQgZ2xvYmFsXG4gIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iod2luZG93W3RoaXMuZ2xvYmFsXSwgdGhpcy5nbG9iYWwpO1xuICAvLyBjbGVhblxuICBhbmFseXplci5nZXRPYmplY3RzKCkuZW1wdHkoKTtcbiAgYW5hbHl6ZXIuZm9yYmlkZGVuLmVtcHR5KCk7XG4gIGFuYWx5emVyLnNldExldmVscyh0aGlzLmxldmVscyk7XG5cbiAgLy8gc2V0dGluZ3MgPiBzaG93IGxpbmtzIHRvIGJ1aWx0IGluIG9iamVjdHNcbiAgaWYgKCFHZW5lcmljQW5hbHl6ZXIuU0hPV19CVUlMVElOKSB7XG4gICAgZm9yYmlkZGVuID0gZm9yYmlkZGVuLmNvbmNhdChcbiAgICAgIEdlbmVyaWNBbmFseXplci5GT1JCSURERU4uc3BsaXQoJywnKVxuICAgICk7XG4gIH1cblxuICBmb3JiaWRkZW4uZm9yRWFjaChmdW5jdGlvbihmKSB7XG4gICAgdmFyIGFycixcbiAgICAgIHRva2VucztcbiAgICBpZiAoIWYuaW5kZXhPZigncG9qb3ZpejonKSkge1xuICAgICAgdG9rZW5zID0gZi5zcGxpdCgnOicpO1xuICAgICAgYXJyID0gcmVxdWlyZSgnLi4vT2JqZWN0SGFzaGVzJylbdG9rZW5zWzFdXS5nZXRPYmplY3RzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyciA9IFt3aW5kb3dbZl1dO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnZm9yYmlkZGluZzogJywgYXJyKTtcbiAgICBhbmFseXplci5mb3JiaWQoYXJyLCB0cnVlKTtcbiAgfSk7XG5cbiAgYW5hbHl6ZXIuYWRkKFt3aW5kb3dbdGhpcy5nbG9iYWxdXSk7XG5cbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUubWFya0luc3BlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gbWFyayB0aGlzIGNvbnRhaW5lciBhcyBpbnNwZWN0ZWRcbiAgdGhpcy5pbnNwZWN0ZWQgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpc1xuICAgIC5tYXJrSW5zcGVjdGVkKClcbiAgICAuaW5zcGVjdFNlbGYoKTtcbn07XG5cbkdlbmVyaWNBbmFseXplci5wcm90b3R5cGUucHJlUmVuZGVyID0gZnVuY3Rpb24gKCkge1xufTtcblxuR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICBzY3JpcHQ7XG5cbiAgZnVuY3Rpb24gZ2V0VmFsdWUoKSB7XG4gICAgcmV0dXJuIHdpbmRvd1ttZS5nbG9iYWxdO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5KHYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdmZXRjaGluZyBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICBzY3JpcHQuc3JjID0gdjtcbiAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbignY29tcGxldGVkIHNjcmlwdCAnICsgdiwgdHJ1ZSk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZ2V0VmFsdWUoKSk7XG4gICAgICB9O1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh0aGlzLnNyYykge1xuICAgIGlmIChnZXRWYWx1ZSgpKSB7XG4gICAgICBjb25zb2xlLmxvZygncmVzb3VyY2UgYWxyZWFkeSBmZXRjaGVkICcgKyB0aGlzLnNyYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzcmNzID0gdGhpcy5zcmMuc3BsaXQoJ3wnKTtcbiAgICAgIHJldHVybiBzcmNzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VycmVudCkge1xuICAgICAgICByZXR1cm4gcHJldi50aGVuKHByb21pc2lmeShjdXJyZW50KSk7XG4gICAgICB9LCBRKCdyZWR1Y2UnKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFEodHJ1ZSk7XG59O1xuXG5HZW5lcmljQW5hbHl6ZXIucHJvdG90eXBlLnNob3dTZWFyY2ggPSBmdW5jdGlvbiAobm9kZU5hbWUsIG5vZGVQcm9wZXJ0eSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB3aW5kb3cub3BlbihcbiAgICBfLnRlbXBsYXRlKCcke3NlYXJjaEVuZ2luZX0ke2x1Y2t5fSR7bGlicmFyeU5hbWV9ICR7bm9kZU5hbWV9ICR7bm9kZVByb3BlcnR5fScsIHtcbiAgICAgIHNlYXJjaEVuZ2luZTogc2VhcmNoRW5naW5lLFxuICAgICAgbHVja3k6IEdlbmVyaWNBbmFseXplci5sdWNreSA/ICchZHVja3knIDogJycsXG4gICAgICBsaWJyYXJ5TmFtZTogbWUuZGlzcGxheW5hbWUgfHwgbWUuZ2xvYmFsLFxuICAgICAgbm9kZU5hbWU6IG5vZGVOYW1lLFxuICAgICAgbm9kZVByb3BlcnR5OiBub2RlUHJvcGVydHlcbiAgICB9KVxuICApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHZW5lcmljQW5hbHl6ZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9HZW5lcmljQW5hbHl6ZXInKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIFBPYmplY3QoKSB7XG4gIEdlbmVyaWNBbmFseXplci5jYWxsKHRoaXMpO1xufVxuXG5QT2JqZWN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cblBPYmplY3QucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBPYmplY3Qgb2JqZWN0cycpO1xuICB0aGlzLmFuYWx5emVyLmFkZCh0aGlzLmdldE9iamVjdHMoKSk7XG59O1xuXG5QT2JqZWN0LnByb3RvdHlwZS5nZXRPYmplY3RzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gW09iamVjdF07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBPYmplY3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpLFxuICBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5JyksXG4gIEdlbmVyaWNBbmFseXplciA9IHJlcXVpcmUoJy4vR2VuZXJpY0FuYWx5emVyJyk7XG5cbnZhciB0b0luc3BlY3QgPSBbd2luZG93XTtcblxuZnVuY3Rpb24gV2luZG93KCkge1xuICBHZW5lcmljQW5hbHl6ZXIuY2FsbCh0aGlzLCB7XG4gICAgbGV2ZWxzOiAxLFxuICAgIHJlbmRlcmVhY2h0aW1lOiB0cnVlLFxuICAgIGZ1bmN0aW9uY29uc3RydWN0b3JzOiBmYWxzZVxuICB9KTtcbn1cblxuV2luZG93LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cbldpbmRvdy5wcm90b3R5cGUuZ2V0T2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRvSW5zcGVjdDtcbn07XG5cbldpbmRvdy5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIHdpbmRvdycpO1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIGhhc2hlcyA9IHJlcXVpcmUoJy4uL09iamVjdEhhc2hlcycpO1xuXG4gIF8uZm9yT3duKGhhc2hlcywgZnVuY3Rpb24gKHYsIGspIHtcbiAgICBpZiAodi5nbG9iYWwgJiYgd2luZG93W3YuZ2xvYmFsXSkge1xuICAgICAgbWUuYW5hbHl6ZXIuZm9yYmlkKFt3aW5kb3dbdi5nbG9iYWxdXSwgdHJ1ZSk7XG4gICAgfVxuICB9KTtcbiAgdGhpcy5hbmFseXplci5nZXRPYmplY3RzKCkuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5zZXRMZXZlbHModGhpcy5sZXZlbHMpO1xuICB0aGlzLmFuYWx5emVyLmFkZChtZS5nZXRPYmplY3RzKCkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3c7IiwidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKSxcbiAgUSA9IHJlcXVpcmUoJ3EnKSxcbiAgZGFncmUgPSByZXF1aXJlKCdkYWdyZScpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbC8nKSxcbiAgT2JqZWN0SGFzaGVzID0gcmVxdWlyZSgnLi9PYmplY3RIYXNoZXMnKTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgY29udGFpbmVyLFxuICBvbGRDb250YWluZXIsXG4gIG9sZFJlbmRlcmVyLFxuICByZW5kZXJlcixcbiAgcG9qb3ZpejsgICAgICAvLyBuYW1lc3BhY2VcblxuZnVuY3Rpb24gcHJvY2VzcygpIHtcbiAgdmFyIGcgPSBuZXcgZGFncmUuRGlncmFwaCgpLFxuICAgICAgcHJvcGVydGllcyxcbiAgICAgIG5vZGUsXG4gICAgICBsaWJyYXJ5ID0gY29udGFpbmVyLmFuYWx5emVyLFxuICAgICAgc3RyID0gbGlicmFyeS5zdHJpbmdpZnkoKSxcbiAgICAgIGxpYnJhcnlOb2RlcyA9IHN0ci5ub2RlcyxcbiAgICAgIGxpYnJhcnlFZGdlcyA9IHN0ci5lZGdlcztcblxuICAvLyBjcmVhdGUgdGhlIGdyYXBoXG4gIC8vIGVhY2ggZWxlbWVudCBvZiB0aGUgZ3JhcGggaGFzXG4gIC8vIC0gbGFiZWxcbiAgLy8gLSB3aWR0aFxuICAvLyAtIGhlaWdodFxuICAvLyAtIHByb3BlcnRpZXNcbiAgXy5mb3JPd24obGlicmFyeU5vZGVzLCBmdW5jdGlvbiAocHJvcGVydGllcywgaykge1xuICAgIHZhciBsYWJlbCA9IGsubWF0Y2goL1xcUyo/LSguKikvKVsxXTtcbiAgICAvLyBjb25zb2xlLmxvZyhrLCBsYWJlbC5sZW5ndGgpO1xuICAgIG5vZGUgPSB7XG4gICAgICBsYWJlbDogayxcbiAgICAgIHdpZHRoOiBsYWJlbC5sZW5ndGggKiAxMFxuICAgIH07XG4gICAgLy8gbGluZXMgKyBoZWFkZXIgKyBwYWRkaW5nIGJvdHRvbVxuICAgIG5vZGUuaGVpZ2h0ID0gcHJvcGVydGllcy5sZW5ndGggKiAxNSArIDUwO1xuICAgIG5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgcHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBub2RlLndpZHRoID0gTWF0aC5tYXgobm9kZS53aWR0aCwgdi5uYW1lLmxlbmd0aCAqIDEwKTtcbiAgICB9KTtcbiAgICBnLmFkZE5vZGUoaywgbm9kZSk7XG4gIH0pO1xuXG4gIC8vIGJ1aWxkIHRoZSBlZGdlcyBmcm9tIG5vZGUgdG8gbm9kZVxuICBfLmZvck93bihsaWJyYXJ5RWRnZXMsIGZ1bmN0aW9uIChsaW5rcykge1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgZy5hZGRFZGdlKG51bGwsIGxpbmsuZnJvbSwgbGluay50byk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIGxheW91dCBvZiB0aGUgZ3JhcGhcbiAgdmFyIGxheW91dCA9IGRhZ3JlLmxheW91dCgpXG4gICAgLm5vZGVTZXAoMzApXG4gICAgLy8gLnJhbmtTZXAoNzApXG4gICAgLy8gLnJhbmtEaXIoJ1RCJylcbiAgICAucnVuKGcpO1xuXG4gIHZhciBub2RlcyA9IFtdLFxuICAgICAgZWRnZXMgPSBbXSxcbiAgICAgIGNlbnRlciA9IHt4OiAwLCB5OiAwfSxcbiAgICAgIG1uID0ge3g6IEluZmluaXR5LCB5OiBJbmZpbml0eX0sXG4gICAgICBteCA9IHt4OiAtSW5maW5pdHksIHk6IC1JbmZpbml0eX0sXG4gICAgICB0b3RhbCA9IGcubm9kZXMoKS5sZW5ndGg7XG5cbiAgLy8gdXBkYXRlIHRoZSBub2RlIGluZm8gb2YgdGhlIG5vZGUgYWRkaW5nOlxuICAvLyAtIHhcbiAgLy8gLSB5XG4gIC8vIC0gcHJlZGVjZXNzb3JzXG4gIC8vIC0gc3VjY2Vzc29yc1xuICBsYXlvdXQuZWFjaE5vZGUoZnVuY3Rpb24gKGssIGxheW91dEluZm8pIHtcbiAgICB2YXIgeCA9IGxheW91dEluZm8ueDtcbiAgICB2YXIgeSA9IGxheW91dEluZm8ueTtcblxuICAgIG5vZGUgPSBnLm5vZGUoayk7XG4gICAgbm9kZS54ID0geDtcbiAgICBub2RlLnkgPSB5O1xuICAgIG5vZGUucHJlZGVjZXNzb3JzID0gZy5wcmVkZWNlc3NvcnMoayk7XG4gICAgbm9kZS5zdWNjZXNzb3JzID0gZy5zdWNjZXNzb3JzKGspO1xuICAgIG5vZGVzLnB1c2gobm9kZSk7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGJib3ggb2YgdGhlIGdyYXBoIHRvIGNlbnRlciB0aGUgZ3JhcGhcbiAgICB2YXIgbW54ID0geCAtIG5vZGUud2lkdGggLyAyO1xuICAgIHZhciBtbnkgPSB5IC0gbm9kZS5oZWlnaHQgLyAyO1xuICAgIHZhciBteHggPSB4ICsgbm9kZS53aWR0aCAvIDI7XG4gICAgdmFyIG14eSA9IHkgKyBub2RlLmhlaWdodCAvIDI7XG5cbiAgICBjZW50ZXIueCArPSB4O1xuICAgIGNlbnRlci55ICs9IHk7XG4gICAgbW4ueCA9IE1hdGgubWluKG1uLngsIG1ueCk7XG4gICAgbW4ueSA9IE1hdGgubWluKG1uLnksIG1ueSk7XG4gICAgLy8gY29uc29sZS5sb2coeCwgeSwgJyBkaW0gJywgbm9kZS53aWR0aCwgbm9kZS5oZWlnaHQpO1xuICAgIG14LnggPSBNYXRoLm1heChteC54LCBteHgpO1xuICAgIG14LnkgPSBNYXRoLm1heChteC55LCBteHkpO1xuICB9KTtcblxuICBjZW50ZXIueCAvPSAodG90YWwgfHwgMSk7XG4gIGNlbnRlci55IC89ICh0b3RhbCB8fCAxKTtcblxuICAvLyBjcmVhdGUgdGhlIGVkZ2VzIGZyb20gcHJvcGVydHkgdG8gbm9kZVxuICBfKGxpYnJhcnlFZGdlcykuZm9yT3duKGZ1bmN0aW9uIChsaW5rcykge1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIGlmIChnLmhhc05vZGUobGluay5mcm9tKSAmJiBnLmhhc05vZGUobGluay50bykpIHtcbiAgICAgICAgZWRnZXMucHVzaChsaW5rKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBlZGdlczogZWRnZXMsXG4gICAgbm9kZXM6IG5vZGVzLFxuICAgIGNlbnRlcjogY2VudGVyLFxuICAgIG1uOiBtbixcbiAgICBteDogbXhcbiAgfTtcbn1cblxuLy8gcmVuZGVyXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIHZhciBkYXRhO1xuXG4gIGlmIChjb250YWluZXIgPT09IG9sZENvbnRhaW5lcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHV0aWxzLm5vdGlmaWNhdGlvbigncHJvY2Vzc2luZyAnICsgY29udGFpbmVyLmdsb2JhbCk7XG5cbiAgLy8gcHJlIHJlbmRlclxuICBvbGRSZW5kZXJlciAmJiBvbGRSZW5kZXJlci5jbGVhbigpO1xuICByZW5kZXJlci5jbGVhbigpO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIGNvbnRhaW5lci5wcmVSZW5kZXIoKTtcbiAgICBjb25zb2xlLmxvZygncHJvY2VzcyAmIHJlbmRlciBzdGFydDogJywgbmV3IERhdGUoKSk7XG4gICAgLy8gZGF0YSBoYXNcbiAgICAvLyAtIGVkZ2VzIChwcm9wZXJ0eSAtPiBub2RlKVxuICAgIC8vIC0gbm9kZXNcbiAgICAvLyAtIGNlbnRlclxuICAgIC8vXG4gICAgY29uc29sZS50aW1lKCdwcm9jZXNzJyk7XG4gICAgZGF0YSA9IHByb2Nlc3MoKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoJ3Byb2Nlc3MnKTtcblxuICAgIHV0aWxzLm5vdGlmaWNhdGlvbigncmVuZGVyaW5nICcgKyBjb250YWluZXIuZ2xvYmFsKTtcblxuICAgIGNvbnNvbGUudGltZSgncmVuZGVyJyk7XG4gICAgcmVuZGVyZXIucmVuZGVyKGRhdGEpO1xuICAgIGNvbnNvbGUudGltZUVuZCgncmVuZGVyJyk7XG5cbiAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlIScpO1xuICB9LCAwKTtcbn1cblxuLy8gcHVibGljIGFwaVxucG9qb3ZpeiA9IHtcbiAgcmVuZGVyZXJzOiB7fSxcbiAgYWRkUmVuZGVyZXJzOiBmdW5jdGlvbiAobmV3UmVuZGVyZXJzKSB7XG4gICAgXy5tZXJnZShwb2pvdml6LnJlbmRlcmVycywgbmV3UmVuZGVyZXJzKTtcbiAgfSxcbiAgbnVsbGlmeUNvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xuICAgIG9sZENvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICBjb250YWluZXIgPSBudWxsO1xuICB9LFxuICBnZXRDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9LFxuICBzZXRDb250YWluZXI6IGZ1bmN0aW9uIChjb250YWluZXJOYW1lLCBvcHRpb25zKSB7XG4gICAgb2xkQ29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGNvbnRhaW5lciA9IE9iamVjdEhhc2hlc1tjb250YWluZXJOYW1lXTtcblxuICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICBjb250YWluZXIgPSBPYmplY3RIYXNoZXMuY3JlYXRlTmV3KGNvbnRhaW5lck5hbWUsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZXF1aXJlZCB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXNcbiAgICAgIGNvbnRhaW5lci5zcmMgPSBvcHRpb25zLnNyYztcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFpbmVyLmluaXQoKTtcbiAgfSxcbiAgc2V0UmVuZGVyZXI6IGZ1bmN0aW9uIChyKSB7XG4gICAgb2xkUmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICByZW5kZXJlciA9IHBvam92aXoucmVuZGVyZXJzW3JdO1xuICB9LFxuICBnZXRSZW5kZXJlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByZW5kZXJlcjtcbiAgfSxcbiAgcmVuZGVyOiByZW5kZXIsXG5cbiAgLy8gZXhwb3NlIGlubmVyIG1vZHVsZXNcbiAgT2JqZWN0SGFzaGVzOiByZXF1aXJlKCcuL09iamVjdEhhc2hlcycpLFxuICBPYmplY3RBbmFseXplcjogcmVxdWlyZSgnLi9PYmplY3RBbmFseXplcicpLFxuICBhbmFseXplcjoge1xuICAgIEdlbmVyaWNBbmFseXplcjogcmVxdWlyZSgnLi9hbmFseXplci9HZW5lcmljQW5hbHl6ZXInKVxuICB9LFxuICB1dGlsczogcmVxdWlyZSgnLi91dGlsJyksXG5cbiAgLy8gdXNlciB2YXJzXG4gIHVzZXJWYXJpYWJsZXM6IFtdXG59O1xuXG4vLyBjdXN0b20gZXZlbnRzXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwcm9wZXJ0eS1jbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gIHZhciBkZXRhaWwgPSBlLmRldGFpbDtcbiAgcG9qb3ZpelxuICAgIC5nZXRDb250YWluZXIoKVxuICAgIC5zaG93U2VhcmNoKGRldGFpbC5uYW1lLCBkZXRhaWwucHJvcGVydHkpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3ZpejsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIEhhc2hNYXAoKSB7XG59XG5cbkhhc2hNYXAucHJvdG90eXBlID0ge1xuICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdGhpc1toYXNoS2V5KGtleSldID0gKHZhbHVlIHx8IGtleSk7XG4gIH0sXG4gIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzW2hhc2hLZXkoa2V5KV07XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciB2ID0gdGhpc1toYXNoS2V5KGtleSldO1xuICAgIGRlbGV0ZSB0aGlzW2hhc2hLZXkoa2V5KV07XG4gICAgcmV0dXJuIHY7XG4gIH0sXG4gIGVtcHR5OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHAsXG4gICAgICAgIG1lID0gdGhpcztcbiAgICBmb3IgKHAgaW4gbWUpIHtcbiAgICAgIGlmIChtZS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICBkZWxldGUgdGhpc1twXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGFzaE1hcDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyksXG4gIGFzc2VydCA9IHJlcXVpcmUoJy4vJykuYXNzZXJ0LFxuICBtZSwgaGFzaEtleTtcblxuZnVuY3Rpb24gaXNPYmplY3RPckZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHYgJiYgKHR5cGVvZiB2ID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogR2V0cyBhIHN0b3JlIGhhc2hrZXkgb25seSBpZiBpdCdzIGFuIG9iamVjdFxuICogQHBhcmFtICB7W3R5cGVdfSBvYmpcbiAqIEByZXR1cm4ge1t0eXBlXX1cbiAqL1xuZnVuY3Rpb24gZ2V0KG9iaikge1xuICBhc3NlcnQoaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgcmV0dXJuIG9iai5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgIG9iai5oYXNPd25Qcm9wZXJ0eShtZS5oaWRkZW5LZXkpICYmXG4gICAgb2JqW21lLmhpZGRlbktleV07XG59XG5cbi8qKlxuICogU2V0cyBhIGtleSBvbiBhbiBvYmplY3RcbiAqIEBwYXJhbSB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtbdHlwZV19IGtleSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIHNldChvYmosIGtleSkge1xuICBhc3NlcnQoaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgYXNzZXJ0KFxuICAgIGtleSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyxcbiAgICAnVGhlIGtleSBuZWVkcyB0byBiZSBhIHZhbGlkIHN0cmluZydcbiAgKTtcbiAgaWYgKCFnZXQob2JqKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG1lLmhpZGRlbktleSwge1xuICAgICAgdmFsdWU6IHR5cGVvZiBvYmogKyAnLScgKyBrZXlcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbWU7XG59XG5cbm1lID0gaGFzaEtleSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciB2YWx1ZSA9IHYsXG4gICAgICB1aWQgPSB2O1xuXG4gIGlmIChpc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIWdldCh2KSkge1xuICAgICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iodik7XG4gICAgfVxuICAgIHVpZCA9IGdldCh2KTtcbiAgICBpZiAoIXVpZCkge1xuICAgICAgY29uc29sZS5lcnIoJ25vIGhhc2hrZXkgOignLCB2KTtcbiAgICB9XG4gICAgYXNzZXJ0KHVpZCwgJ2Vycm9yIGdldHRpbmcgdGhlIGtleScpO1xuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5tZS5oaWRkZW5LZXkgPSAnX19wb2pvVml6S2V5X18nO1xuXG5tZS5jcmVhdGVIYXNoS2V5c0ZvciA9IGZ1bmN0aW9uIChvYmosIG5hbWUpIHtcblxuICBmdW5jdGlvbiBsb2NhbFRvU3RyaW5nKG9iaikge1xuICAgIHZhciBtYXRjaDtcbiAgICB0cnkge1xuICAgICAgbWF0Y2ggPSBvYmoudG9TdHJpbmcoKS5tYXRjaCgvXlxcW29iamVjdCAoXFxTKj8pXFxdLyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgdGhlIGludGVybmFsIHByb3BlcnR5IFtbQ2xhc3NdXSB0byBndWVzcyB0aGUgbmFtZVxuICAgKiBvZiB0aGlzIG9iamVjdCwgZS5nLiBbb2JqZWN0IERhdGVdLCBbb2JqZWN0IE1hdGhdXG4gICAqIE1hbnkgb2JqZWN0IHdpbGwgZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgKHRoZXkgd2lsbCBtYXRjaCBbb2JqZWN0IE9iamVjdF0pXG4gICAqIHNvIGxldCdzIGNvbnNpZGVyIE9iamVjdCBhcyB0aGUgbmFtZSBvbmx5IGlmIGl0J3MgZXF1YWwgdG9cbiAgICogT2JqZWN0LnByb3RvdHlwZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBvYmpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGZ1bmN0aW9uIGhhc0FDbGFzc05hbWUob2JqKSB7XG4gICAgdmFyIG1hdGNoID0gbG9jYWxUb1N0cmluZyhvYmopO1xuICAgIGlmIChtYXRjaCA9PT0gJ09iamVjdCcpIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdC5wcm90b3R5cGUgJiYgJ09iamVjdCc7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5hbWUob2JqKSB7XG4gICAgdmFyIG5hbWUsIGNsYXNzTmFtZTtcblxuICAgIC8vIHJldHVybiB0aGUgYWxyZWFkeSBnZW5lcmF0ZWQgaGFzaEtleVxuICAgIGlmIChnZXQob2JqKSkge1xuICAgICAgcmV0dXJuIGdldChvYmopO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGEgbmV3IGtleSBiYXNlZCBvblxuICAgIC8vIC0gdGhlIG5hbWUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gICAgLy8gLSBhIHVuaXF1ZSBpZFxuICAgIG5hbWUgPSB0eXBlb2Ygb2JqLm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICBvYmoubmFtZTtcblxuICAgIGNsYXNzTmFtZSA9IGhhc0FDbGFzc05hbWUob2JqKTtcbiAgICBpZiAoIW5hbWUgJiYgY2xhc3NOYW1lKSB7XG4gICAgICBuYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cblxuICAgIG5hbWUgPSBuYW1lIHx8IF8udW5pcXVlSWQoKTtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFwuIF0vaW1nLCAnLScpO1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgLy8gdGhlIG5hbWUgaXMgZXF1YWwgdG8gdGhlIHBhc3NlZCBuYW1lIG9yIHRoZVxuICAvLyBnZW5lcmF0ZWQgbmFtZVxuICBuYW1lID0gbmFtZSB8fCBnZXROYW1lKG9iaik7XG5cbiAgLy8gaWYgdGhlIG9iaiBpcyBhIHByb3RvdHlwZSB0aGVuIHRyeSB0byBhbmFseXplXG4gIC8vIHRoZSBjb25zdHJ1Y3RvciBmaXJzdCBzbyB0aGF0IHRoZSBwcm90b3R5cGUgYmVjb21lc1xuICAvLyBbbmFtZV0ucHJvdG90eXBlXG4gIC8vIHNwZWNpYWwgY2FzZTogb2JqZWN0LmNvbnN0cnVjdG9yID0gb2JqZWN0XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkgJiZcbiAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSAmJlxuICAgICAgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yICE9PSBvYmopIHtcbiAgICByZXR1cm4gbWUuY3JlYXRlSGFzaEtleXNGb3Iob2JqLmNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIC8vIHNldCBuYW1lIG9uIHNlbGZcbiAgc2V0KG9iaiwgbmFtZSk7XG5cbiAgLy8gc2V0IG5hbWUgb24gdGhlIHByb3RvdHlwZVxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgIHNldChvYmoucHJvdG90eXBlLCBuYW1lICsgJy1wcm90b3R5cGUnKTtcbiAgfVxufTtcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHYuaGFzT3duUHJvcGVydHkgJiZcbiAgICB2Lmhhc093blByb3BlcnR5KG1lLmhpZGRlbktleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxudmFyIHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvbiA9IHtcbiAgJ1tbUHJvdG90eXBlXV0nOiAnX19wcm90b19fJ1xufTtcblxudmFyIHV0aWxzID0ge1xuICBhc3NlcnQ6IGZ1bmN0aW9uICh2LCBtZXNzYWdlKSB7XG4gICAgaWYgKCF2KSB7XG4gICAgICB0aHJvdyBtZXNzYWdlIHx8ICdlcnJvcic7XG4gICAgfVxuICB9LFxuICB0cmFuc2xhdGU6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh4IHx8IDApICsgJywgJyArICh5IHx8IDApICsgJyknO1xuICB9LFxuICBzY2FsZTogZnVuY3Rpb24gKHMpIHtcbiAgICByZXR1cm4gJ3NjYWxlKCcgKyAocyB8fCAxKSArICcpJztcbiAgfSxcbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHQgPSBbXTtcbiAgICBfLmZvck93bihvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICB0LnB1c2godXRpbHNba10uYXBwbHkodXRpbHMsIHYpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdC5qb2luKCcgJyk7XG4gIH0sXG4gIHByZWZpeGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KCdwdicpO1xuICAgIHJldHVybiBhcmdzLmpvaW4oJy0nKTtcbiAgfSxcbiAgdHJhbnNmb3JtUHJvcGVydHk6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvbi5oYXNPd25Qcm9wZXJ0eSh2KSkge1xuICAgICAgcmV0dXJuIHByb3BlcnRpZXNUcmFuc2Zvcm1hdGlvblt2XTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH0sXG4gIGVzY2FwZUNsczogZnVuY3Rpb24odikge1xuICAgIHJldHVybiB2LnJlcGxhY2UoL1xcJC9nLCAnXycpO1xuICB9LFxuICB0b1F1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHMgPSAnJyxcbiAgICAgICAgaSA9IDA7XG4gICAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgaWYgKGkpIHtcbiAgICAgICAgcyArPSAnJic7XG4gICAgICB9XG4gICAgICBzICs9IGsgKyAnPScgKyB2O1xuICAgICAgaSArPSAxO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9LFxuICBjcmVhdGVFdmVudDogZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICBkZXRhaWw6IGRldGFpbHNcbiAgICB9KTtcbiAgfSxcbiAgbm90aWZpY2F0aW9uOiBmdW5jdGlvbiAobWVzc2FnZSwgY29uc29sZVRvbykge1xuICAgIHZhciBldiA9IHV0aWxzLmNyZWF0ZUV2ZW50KCdwb2pvdml6LW5vdGlmaWNhdGlvbicsIG1lc3NhZ2UpO1xuICAgIGNvbnNvbGVUb28gJiYgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG4gIH0sXG4gIGNyZWF0ZUpzb25wQ2FsbGJhY2s6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7Il19
(11)
});
