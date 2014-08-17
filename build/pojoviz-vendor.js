require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"K2RcUv":[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"lodash":[function(require,module,exports){
module.exports=require('K2RcUv');
},{}],"qLuPo1":[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require("FWaASH"))
},{"FWaASH":1}],"q":[function(require,module,exports){
module.exports=require('qLuPo1');
},{}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21hdXJpY2lvL0RvY3VtZW50cy93ZWIvbWF1cml6enppby5tZS9wb2pvdml6L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvbWF1cmljaW8vRG9jdW1lbnRzL3dlYi9tYXVyaXp6emlvLm1lL3Bvam92aXovbm9kZV9tb2R1bGVzL2xvZGFzaC9kaXN0L2xvZGFzaC5qcyIsIi9Vc2Vycy9tYXVyaWNpby9Eb2N1bWVudHMvd2ViL21hdXJpenp6aW8ubWUvcG9qb3Zpei9ub2RlX21vZHVsZXMvcS9xLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNub05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiAqIEBsaWNlbnNlXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gLW8gLi9kaXN0L2xvZGFzaC5qc2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG47KGZ1bmN0aW9uKCkge1xuXG4gIC8qKiBVc2VkIGFzIGEgc2FmZSByZWZlcmVuY2UgZm9yIGB1bmRlZmluZWRgIGluIHByZSBFUzUgZW52aXJvbm1lbnRzICovXG4gIHZhciB1bmRlZmluZWQ7XG5cbiAgLyoqIFVzZWQgdG8gcG9vbCBhcnJheXMgYW5kIG9iamVjdHMgdXNlZCBpbnRlcm5hbGx5ICovXG4gIHZhciBhcnJheVBvb2wgPSBbXSxcbiAgICAgIG9iamVjdFBvb2wgPSBbXTtcblxuICAvKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzICovXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuXG4gIC8qKiBVc2VkIHRvIHByZWZpeCBrZXlzIHRvIGF2b2lkIGlzc3VlcyB3aXRoIGBfX3Byb3RvX19gIGFuZCBwcm9wZXJ0aWVzIG9uIGBPYmplY3QucHJvdG90eXBlYCAqL1xuICB2YXIga2V5UHJlZml4ID0gK25ldyBEYXRlICsgJyc7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIHNpemUgd2hlbiBvcHRpbWl6YXRpb25zIGFyZSBlbmFibGVkIGZvciBsYXJnZSBhcnJheXMgKi9cbiAgdmFyIGxhcmdlQXJyYXlTaXplID0gNzU7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIG1heCBzaXplIG9mIHRoZSBgYXJyYXlQb29sYCBhbmQgYG9iamVjdFBvb2xgICovXG4gIHZhciBtYXhQb29sU2l6ZSA9IDQwO1xuXG4gIC8qKiBVc2VkIHRvIGRldGVjdCBhbmQgdGVzdCB3aGl0ZXNwYWNlICovXG4gIHZhciB3aGl0ZXNwYWNlID0gKFxuICAgIC8vIHdoaXRlc3BhY2VcbiAgICAnIFxcdFxceDBCXFxmXFx4QTBcXHVmZWZmJyArXG5cbiAgICAvLyBsaW5lIHRlcm1pbmF0b3JzXG4gICAgJ1xcblxcclxcdTIwMjhcXHUyMDI5JyArXG5cbiAgICAvLyB1bmljb2RlIGNhdGVnb3J5IFwiWnNcIiBzcGFjZSBzZXBhcmF0b3JzXG4gICAgJ1xcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDAnXG4gICk7XG5cbiAgLyoqIFVzZWQgdG8gbWF0Y2ggZW1wdHkgc3RyaW5nIGxpdGVyYWxzIGluIGNvbXBpbGVkIHRlbXBsYXRlIHNvdXJjZSAqL1xuICB2YXIgcmVFbXB0eVN0cmluZ0xlYWRpbmcgPSAvXFxiX19wIFxcKz0gJyc7L2csXG4gICAgICByZUVtcHR5U3RyaW5nTWlkZGxlID0gL1xcYihfX3AgXFwrPSkgJycgXFwrL2csXG4gICAgICByZUVtcHR5U3RyaW5nVHJhaWxpbmcgPSAvKF9fZVxcKC4qP1xcKXxcXGJfX3RcXCkpIFxcK1xcbicnOy9nO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIG1hdGNoIEVTNiB0ZW1wbGF0ZSBkZWxpbWl0ZXJzXG4gICAqIGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLWxpdGVyYWxzLXN0cmluZy1saXRlcmFsc1xuICAgKi9cbiAgdmFyIHJlRXNUZW1wbGF0ZSA9IC9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZztcblxuICAvKiogVXNlZCB0byBtYXRjaCByZWdleHAgZmxhZ3MgZnJvbSB0aGVpciBjb2VyY2VkIHN0cmluZyB2YWx1ZXMgKi9cbiAgdmFyIHJlRmxhZ3MgPSAvXFx3KiQvO1xuXG4gIC8qKiBVc2VkIHRvIGRldGVjdGVkIG5hbWVkIGZ1bmN0aW9ucyAqL1xuICB2YXIgcmVGdW5jTmFtZSA9IC9eXFxzKmZ1bmN0aW9uWyBcXG5cXHJcXHRdK1xcdy87XG5cbiAgLyoqIFVzZWQgdG8gbWF0Y2ggXCJpbnRlcnBvbGF0ZVwiIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlSW50ZXJwb2xhdGUgPSAvPCU9KFtcXHNcXFNdKz8pJT4vZztcblxuICAvKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIHdoaXRlc3BhY2UgYW5kIHplcm9zIHRvIGJlIHJlbW92ZWQgKi9cbiAgdmFyIHJlTGVhZGluZ1NwYWNlc0FuZFplcm9zID0gUmVnRXhwKCdeWycgKyB3aGl0ZXNwYWNlICsgJ10qMCsoPz0uJCknKTtcblxuICAvKiogVXNlZCB0byBlbnN1cmUgY2FwdHVyaW5nIG9yZGVyIG9mIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlTm9NYXRjaCA9IC8oJF4pLztcblxuICAvKiogVXNlZCB0byBkZXRlY3QgZnVuY3Rpb25zIGNvbnRhaW5pbmcgYSBgdGhpc2AgcmVmZXJlbmNlICovXG4gIHZhciByZVRoaXMgPSAvXFxidGhpc1xcYi87XG5cbiAgLyoqIFVzZWQgdG8gbWF0Y2ggdW5lc2NhcGVkIGNoYXJhY3RlcnMgaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzICovXG4gIHZhciByZVVuZXNjYXBlZFN0cmluZyA9IC9bJ1xcblxcclxcdFxcdTIwMjhcXHUyMDI5XFxcXF0vZztcblxuICAvKiogVXNlZCB0byBhc3NpZ24gZGVmYXVsdCBgY29udGV4dGAgb2JqZWN0IHByb3BlcnRpZXMgKi9cbiAgdmFyIGNvbnRleHRQcm9wcyA9IFtcbiAgICAnQXJyYXknLCAnQm9vbGVhbicsICdEYXRlJywgJ0Z1bmN0aW9uJywgJ01hdGgnLCAnTnVtYmVyJywgJ09iamVjdCcsXG4gICAgJ1JlZ0V4cCcsICdTdHJpbmcnLCAnXycsICdhdHRhY2hFdmVudCcsICdjbGVhclRpbWVvdXQnLCAnaXNGaW5pdGUnLCAnaXNOYU4nLFxuICAgICdwYXJzZUludCcsICdzZXRUaW1lb3V0J1xuICBdO1xuXG4gIC8qKiBVc2VkIHRvIG1ha2UgdGVtcGxhdGUgc291cmNlVVJMcyBlYXNpZXIgdG8gaWRlbnRpZnkgKi9cbiAgdmFyIHRlbXBsYXRlQ291bnRlciA9IDA7XG5cbiAgLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCBzaG9ydGN1dHMgKi9cbiAgdmFyIGFyZ3NDbGFzcyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgICAgYXJyYXlDbGFzcyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgICBib29sQ2xhc3MgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgICBkYXRlQ2xhc3MgPSAnW29iamVjdCBEYXRlXScsXG4gICAgICBmdW5jQ2xhc3MgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgICAgbnVtYmVyQ2xhc3MgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICAgIG9iamVjdENsYXNzID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgICByZWdleHBDbGFzcyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgICAgc3RyaW5nQ2xhc3MgPSAnW29iamVjdCBTdHJpbmddJztcblxuICAvKiogVXNlZCB0byBpZGVudGlmeSBvYmplY3QgY2xhc3NpZmljYXRpb25zIHRoYXQgYF8uY2xvbmVgIHN1cHBvcnRzICovXG4gIHZhciBjbG9uZWFibGVDbGFzc2VzID0ge307XG4gIGNsb25lYWJsZUNsYXNzZXNbZnVuY0NsYXNzXSA9IGZhbHNlO1xuICBjbG9uZWFibGVDbGFzc2VzW2FyZ3NDbGFzc10gPSBjbG9uZWFibGVDbGFzc2VzW2FycmF5Q2xhc3NdID1cbiAgY2xvbmVhYmxlQ2xhc3Nlc1tib29sQ2xhc3NdID0gY2xvbmVhYmxlQ2xhc3Nlc1tkYXRlQ2xhc3NdID1cbiAgY2xvbmVhYmxlQ2xhc3Nlc1tudW1iZXJDbGFzc10gPSBjbG9uZWFibGVDbGFzc2VzW29iamVjdENsYXNzXSA9XG4gIGNsb25lYWJsZUNsYXNzZXNbcmVnZXhwQ2xhc3NdID0gY2xvbmVhYmxlQ2xhc3Nlc1tzdHJpbmdDbGFzc10gPSB0cnVlO1xuXG4gIC8qKiBVc2VkIGFzIGFuIGludGVybmFsIGBfLmRlYm91bmNlYCBvcHRpb25zIG9iamVjdCAqL1xuICB2YXIgZGVib3VuY2VPcHRpb25zID0ge1xuICAgICdsZWFkaW5nJzogZmFsc2UsXG4gICAgJ21heFdhaXQnOiAwLFxuICAgICd0cmFpbGluZyc6IGZhbHNlXG4gIH07XG5cbiAgLyoqIFVzZWQgYXMgdGhlIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yIGBfX2JpbmREYXRhX19gICovXG4gIHZhciBkZXNjcmlwdG9yID0ge1xuICAgICdjb25maWd1cmFibGUnOiBmYWxzZSxcbiAgICAnZW51bWVyYWJsZSc6IGZhbHNlLFxuICAgICd2YWx1ZSc6IG51bGwsXG4gICAgJ3dyaXRhYmxlJzogZmFsc2VcbiAgfTtcblxuICAvKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBPYmplY3QgKi9cbiAgdmFyIG9iamVjdFR5cGVzID0ge1xuICAgICdib29sZWFuJzogZmFsc2UsXG4gICAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgICAnb2JqZWN0JzogdHJ1ZSxcbiAgICAnbnVtYmVyJzogZmFsc2UsXG4gICAgJ3N0cmluZyc6IGZhbHNlLFxuICAgICd1bmRlZmluZWQnOiBmYWxzZVxuICB9O1xuXG4gIC8qKiBVc2VkIHRvIGVzY2FwZSBjaGFyYWN0ZXJzIGZvciBpbmNsdXNpb24gaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzICovXG4gIHZhciBzdHJpbmdFc2NhcGVzID0ge1xuICAgICdcXFxcJzogJ1xcXFwnLFxuICAgIFwiJ1wiOiBcIidcIixcbiAgICAnXFxuJzogJ24nLFxuICAgICdcXHInOiAncicsXG4gICAgJ1xcdCc6ICd0JyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgLyoqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QgKi9cbiAgdmFyIHJvb3QgPSAob2JqZWN0VHlwZXNbdHlwZW9mIHdpbmRvd10gJiYgd2luZG93KSB8fCB0aGlzO1xuXG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AgKi9cbiAgdmFyIGZyZWVFeHBvcnRzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYG1vZHVsZWAgKi9cbiAgdmFyIGZyZWVNb2R1bGUgPSBvYmplY3RUeXBlc1t0eXBlb2YgbW9kdWxlXSAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cbiAgLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYCAqL1xuICB2YXIgbW9kdWxlRXhwb3J0cyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5leHBvcnRzID09PSBmcmVlRXhwb3J0cyAmJiBmcmVlRXhwb3J0cztcblxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzIG9yIEJyb3dzZXJpZmllZCBjb2RlIGFuZCB1c2UgaXQgYXMgYHJvb3RgICovXG4gIHZhciBmcmVlR2xvYmFsID0gb2JqZWN0VHlwZXNbdHlwZW9mIGdsb2JhbF0gJiYgZ2xvYmFsO1xuICBpZiAoZnJlZUdsb2JhbCAmJiAoZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbC53aW5kb3cgPT09IGZyZWVHbG9iYWwpKSB7XG4gICAgcm9vdCA9IGZyZWVHbG9iYWw7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaW5kZXhPZmAgd2l0aG91dCBzdXBwb3J0IGZvciBiaW5hcnkgc2VhcmNoZXNcbiAgICogb3IgYGZyb21JbmRleGAgY29uc3RyYWludHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZnJvbUluZGV4PTBdIFRoZSBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUgb3IgYC0xYC5cbiAgICovXG4gIGZ1bmN0aW9uIGJhc2VJbmRleE9mKGFycmF5LCB2YWx1ZSwgZnJvbUluZGV4KSB7XG4gICAgdmFyIGluZGV4ID0gKGZyb21JbmRleCB8fCAwKSAtIDEsXG4gICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jb250YWluc2AgZm9yIGNhY2hlIG9iamVjdHMgdGhhdCBtaW1pY3MgdGhlIHJldHVyblxuICAgKiBzaWduYXR1cmUgb2YgYF8uaW5kZXhPZmAgYnkgcmV0dXJuaW5nIGAwYCBpZiB0aGUgdmFsdWUgaXMgZm91bmQsIGVsc2UgYC0xYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNhY2hlIFRoZSBjYWNoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyBgMGAgaWYgYHZhbHVlYCBpcyBmb3VuZCwgZWxzZSBgLTFgLlxuICAgKi9cbiAgZnVuY3Rpb24gY2FjaGVJbmRleE9mKGNhY2hlLCB2YWx1ZSkge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICAgIGNhY2hlID0gY2FjaGUuY2FjaGU7XG5cbiAgICBpZiAodHlwZSA9PSAnYm9vbGVhbicgfHwgdmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGNhY2hlW3ZhbHVlXSA/IDAgOiAtMTtcbiAgICB9XG4gICAgaWYgKHR5cGUgIT0gJ251bWJlcicgJiYgdHlwZSAhPSAnc3RyaW5nJykge1xuICAgICAgdHlwZSA9ICdvYmplY3QnO1xuICAgIH1cbiAgICB2YXIga2V5ID0gdHlwZSA9PSAnbnVtYmVyJyA/IHZhbHVlIDoga2V5UHJlZml4ICsgdmFsdWU7XG4gICAgY2FjaGUgPSAoY2FjaGUgPSBjYWNoZVt0eXBlXSkgJiYgY2FjaGVba2V5XTtcblxuICAgIHJldHVybiB0eXBlID09ICdvYmplY3QnXG4gICAgICA/IChjYWNoZSAmJiBiYXNlSW5kZXhPZihjYWNoZSwgdmFsdWUpID4gLTEgPyAwIDogLTEpXG4gICAgICA6IChjYWNoZSA/IDAgOiAtMSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGdpdmVuIHZhbHVlIHRvIHRoZSBjb3JyZXNwb25kaW5nIGNhY2hlIG9iamVjdC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gYWRkIHRvIHRoZSBjYWNoZS5cbiAgICovXG4gIGZ1bmN0aW9uIGNhY2hlUHVzaCh2YWx1ZSkge1xuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGUsXG4gICAgICAgIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgICBpZiAodHlwZSA9PSAnYm9vbGVhbicgfHwgdmFsdWUgPT0gbnVsbCkge1xuICAgICAgY2FjaGVbdmFsdWVdID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHR5cGUgIT0gJ251bWJlcicgJiYgdHlwZSAhPSAnc3RyaW5nJykge1xuICAgICAgICB0eXBlID0gJ29iamVjdCc7XG4gICAgICB9XG4gICAgICB2YXIga2V5ID0gdHlwZSA9PSAnbnVtYmVyJyA/IHZhbHVlIDoga2V5UHJlZml4ICsgdmFsdWUsXG4gICAgICAgICAgdHlwZUNhY2hlID0gY2FjaGVbdHlwZV0gfHwgKGNhY2hlW3R5cGVdID0ge30pO1xuXG4gICAgICBpZiAodHlwZSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAodHlwZUNhY2hlW2tleV0gfHwgKHR5cGVDYWNoZVtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR5cGVDYWNoZVtrZXldID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlZCBieSBgXy5tYXhgIGFuZCBgXy5taW5gIGFzIHRoZSBkZWZhdWx0IGNhbGxiYWNrIHdoZW4gYSBnaXZlblxuICAgKiBjb2xsZWN0aW9uIGlzIGEgc3RyaW5nIHZhbHVlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIGNoYXJhY3RlciB0byBpbnNwZWN0LlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBjb2RlIHVuaXQgb2YgZ2l2ZW4gY2hhcmFjdGVyLlxuICAgKi9cbiAgZnVuY3Rpb24gY2hhckF0Q2FsbGJhY2sodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUuY2hhckNvZGVBdCgwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIGJ5IGBzb3J0QnlgIHRvIGNvbXBhcmUgdHJhbnNmb3JtZWQgYGNvbGxlY3Rpb25gIGVsZW1lbnRzLCBzdGFibGUgc29ydGluZ1xuICAgKiB0aGVtIGluIGFzY2VuZGluZyBvcmRlci5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGEgVGhlIG9iamVjdCB0byBjb21wYXJlIHRvIGBiYC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGIgVGhlIG9iamVjdCB0byBjb21wYXJlIHRvIGBhYC5cbiAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgc29ydCBvcmRlciBpbmRpY2F0b3Igb2YgYDFgIG9yIGAtMWAuXG4gICAqL1xuICBmdW5jdGlvbiBjb21wYXJlQXNjZW5kaW5nKGEsIGIpIHtcbiAgICB2YXIgYWMgPSBhLmNyaXRlcmlhLFxuICAgICAgICBiYyA9IGIuY3JpdGVyaWEsXG4gICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IGFjLmxlbmd0aDtcblxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICB2YXIgdmFsdWUgPSBhY1tpbmRleF0sXG4gICAgICAgICAgb3RoZXIgPSBiY1tpbmRleF07XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gb3RoZXIpIHtcbiAgICAgICAgaWYgKHZhbHVlID4gb3RoZXIgfHwgdHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlIDwgb3RoZXIgfHwgdHlwZW9mIG90aGVyID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEZpeGVzIGFuIGBBcnJheSNzb3J0YCBidWcgaW4gdGhlIEpTIGVuZ2luZSBlbWJlZGRlZCBpbiBBZG9iZSBhcHBsaWNhdGlvbnNcbiAgICAvLyB0aGF0IGNhdXNlcyBpdCwgdW5kZXIgY2VydGFpbiBjaXJjdW1zdGFuY2VzLCB0byByZXR1cm4gdGhlIHNhbWUgdmFsdWUgZm9yXG4gICAgLy8gYGFgIGFuZCBgYmAuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmUvcHVsbC8xMjQ3XG4gICAgLy9cbiAgICAvLyBUaGlzIGFsc28gZW5zdXJlcyBhIHN0YWJsZSBzb3J0IGluIFY4IGFuZCBvdGhlciBlbmdpbmVzLlxuICAgIC8vIFNlZSBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD05MFxuICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY2FjaGUgb2JqZWN0IHRvIG9wdGltaXplIGxpbmVhciBzZWFyY2hlcyBvZiBsYXJnZSBhcnJheXMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7QXJyYXl9IFthcnJheT1bXV0gVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICogQHJldHVybnMge251bGx8T2JqZWN0fSBSZXR1cm5zIHRoZSBjYWNoZSBvYmplY3Qgb3IgYG51bGxgIGlmIGNhY2hpbmcgc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlQ2FjaGUoYXJyYXkpIHtcbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgICBmaXJzdCA9IGFycmF5WzBdLFxuICAgICAgICBtaWQgPSBhcnJheVsobGVuZ3RoIC8gMikgfCAwXSxcbiAgICAgICAgbGFzdCA9IGFycmF5W2xlbmd0aCAtIDFdO1xuXG4gICAgaWYgKGZpcnN0ICYmIHR5cGVvZiBmaXJzdCA9PSAnb2JqZWN0JyAmJlxuICAgICAgICBtaWQgJiYgdHlwZW9mIG1pZCA9PSAnb2JqZWN0JyAmJiBsYXN0ICYmIHR5cGVvZiBsYXN0ID09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBjYWNoZSA9IGdldE9iamVjdCgpO1xuICAgIGNhY2hlWydmYWxzZSddID0gY2FjaGVbJ251bGwnXSA9IGNhY2hlWyd0cnVlJ10gPSBjYWNoZVsndW5kZWZpbmVkJ10gPSBmYWxzZTtcblxuICAgIHZhciByZXN1bHQgPSBnZXRPYmplY3QoKTtcbiAgICByZXN1bHQuYXJyYXkgPSBhcnJheTtcbiAgICByZXN1bHQuY2FjaGUgPSBjYWNoZTtcbiAgICByZXN1bHQucHVzaCA9IGNhY2hlUHVzaDtcblxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICByZXN1bHQucHVzaChhcnJheVtpbmRleF0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgYnkgYHRlbXBsYXRlYCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkXG4gICAqIHN0cmluZyBsaXRlcmFscy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgKi9cbiAgZnVuY3Rpb24gZXNjYXBlU3RyaW5nQ2hhcihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBzdHJpbmdFc2NhcGVzW21hdGNoXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIGFycmF5IGZyb20gdGhlIGFycmF5IHBvb2wgb3IgY3JlYXRlcyBhIG5ldyBvbmUgaWYgdGhlIHBvb2wgaXMgZW1wdHkuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IGZyb20gdGhlIHBvb2wuXG4gICAqL1xuICBmdW5jdGlvbiBnZXRBcnJheSgpIHtcbiAgICByZXR1cm4gYXJyYXlQb29sLnBvcCgpIHx8IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gb2JqZWN0IGZyb20gdGhlIG9iamVjdCBwb29sIG9yIGNyZWF0ZXMgYSBuZXcgb25lIGlmIHRoZSBwb29sIGlzIGVtcHR5LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgb2JqZWN0IGZyb20gdGhlIHBvb2wuXG4gICAqL1xuICBmdW5jdGlvbiBnZXRPYmplY3QoKSB7XG4gICAgcmV0dXJuIG9iamVjdFBvb2wucG9wKCkgfHwge1xuICAgICAgJ2FycmF5JzogbnVsbCxcbiAgICAgICdjYWNoZSc6IG51bGwsXG4gICAgICAnY3JpdGVyaWEnOiBudWxsLFxuICAgICAgJ2ZhbHNlJzogZmFsc2UsXG4gICAgICAnaW5kZXgnOiAwLFxuICAgICAgJ251bGwnOiBmYWxzZSxcbiAgICAgICdudW1iZXInOiBudWxsLFxuICAgICAgJ29iamVjdCc6IG51bGwsXG4gICAgICAncHVzaCc6IG51bGwsXG4gICAgICAnc3RyaW5nJzogbnVsbCxcbiAgICAgICd0cnVlJzogZmFsc2UsXG4gICAgICAndW5kZWZpbmVkJzogZmFsc2UsXG4gICAgICAndmFsdWUnOiBudWxsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxlYXNlcyB0aGUgZ2l2ZW4gYXJyYXkgYmFjayB0byB0aGUgYXJyYXkgcG9vbC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtBcnJheX0gW2FycmF5XSBUaGUgYXJyYXkgdG8gcmVsZWFzZS5cbiAgICovXG4gIGZ1bmN0aW9uIHJlbGVhc2VBcnJheShhcnJheSkge1xuICAgIGFycmF5Lmxlbmd0aCA9IDA7XG4gICAgaWYgKGFycmF5UG9vbC5sZW5ndGggPCBtYXhQb29sU2l6ZSkge1xuICAgICAgYXJyYXlQb29sLnB1c2goYXJyYXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxlYXNlcyB0aGUgZ2l2ZW4gb2JqZWN0IGJhY2sgdG8gdGhlIG9iamVjdCBwb29sLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byByZWxlYXNlLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVsZWFzZU9iamVjdChvYmplY3QpIHtcbiAgICB2YXIgY2FjaGUgPSBvYmplY3QuY2FjaGU7XG4gICAgaWYgKGNhY2hlKSB7XG4gICAgICByZWxlYXNlT2JqZWN0KGNhY2hlKTtcbiAgICB9XG4gICAgb2JqZWN0LmFycmF5ID0gb2JqZWN0LmNhY2hlID0gb2JqZWN0LmNyaXRlcmlhID0gb2JqZWN0Lm9iamVjdCA9IG9iamVjdC5udW1iZXIgPSBvYmplY3Quc3RyaW5nID0gb2JqZWN0LnZhbHVlID0gbnVsbDtcbiAgICBpZiAob2JqZWN0UG9vbC5sZW5ndGggPCBtYXhQb29sU2l6ZSkge1xuICAgICAgb2JqZWN0UG9vbC5wdXNoKG9iamVjdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNsaWNlcyB0aGUgYGNvbGxlY3Rpb25gIGZyb20gdGhlIGBzdGFydGAgaW5kZXggdXAgdG8sIGJ1dCBub3QgaW5jbHVkaW5nLFxuICAgKiB0aGUgYGVuZGAgaW5kZXguXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBpbnN0ZWFkIG9mIGBBcnJheSNzbGljZWAgdG8gc3VwcG9ydCBub2RlIGxpc3RzXG4gICAqIGluIElFIDwgOSBhbmQgdG8gZW5zdXJlIGRlbnNlIGFycmF5cyBhcmUgcmV0dXJuZWQuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBzbGljZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFRoZSBzdGFydCBpbmRleC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGVuZCBUaGUgZW5kIGluZGV4LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIHNsaWNlKGFycmF5LCBzdGFydCwgZW5kKSB7XG4gICAgc3RhcnQgfHwgKHN0YXJ0ID0gMCk7XG4gICAgaWYgKHR5cGVvZiBlbmQgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGVuZCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IGVuZCAtIHN0YXJ0IHx8IDAsXG4gICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoKTtcblxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICByZXN1bHRbaW5kZXhdID0gYXJyYXlbc3RhcnQgKyBpbmRleF07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGBsb2Rhc2hgIGZ1bmN0aW9uIHVzaW5nIHRoZSBnaXZlbiBjb250ZXh0IG9iamVjdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dD1yb290XSBUaGUgY29udGV4dCBvYmplY3QuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgYGxvZGFzaGAgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBydW5JbkNvbnRleHQoY29udGV4dCkge1xuICAgIC8vIEF2b2lkIGlzc3VlcyB3aXRoIHNvbWUgRVMzIGVudmlyb25tZW50cyB0aGF0IGF0dGVtcHQgdG8gdXNlIHZhbHVlcywgbmFtZWRcbiAgICAvLyBhZnRlciBidWlsdC1pbiBjb25zdHJ1Y3RvcnMgbGlrZSBgT2JqZWN0YCwgZm9yIHRoZSBjcmVhdGlvbiBvZiBsaXRlcmFscy5cbiAgICAvLyBFUzUgY2xlYXJzIHRoaXMgdXAgYnkgc3RhdGluZyB0aGF0IGxpdGVyYWxzIG11c3QgdXNlIGJ1aWx0LWluIGNvbnN0cnVjdG9ycy5cbiAgICAvLyBTZWUgaHR0cDovL2VzNS5naXRodWIuaW8vI3gxMS4xLjUuXG4gICAgY29udGV4dCA9IGNvbnRleHQgPyBfLmRlZmF1bHRzKHJvb3QuT2JqZWN0KCksIGNvbnRleHQsIF8ucGljayhyb290LCBjb250ZXh0UHJvcHMpKSA6IHJvb3Q7XG5cbiAgICAvKiogTmF0aXZlIGNvbnN0cnVjdG9yIHJlZmVyZW5jZXMgKi9cbiAgICB2YXIgQXJyYXkgPSBjb250ZXh0LkFycmF5LFxuICAgICAgICBCb29sZWFuID0gY29udGV4dC5Cb29sZWFuLFxuICAgICAgICBEYXRlID0gY29udGV4dC5EYXRlLFxuICAgICAgICBGdW5jdGlvbiA9IGNvbnRleHQuRnVuY3Rpb24sXG4gICAgICAgIE1hdGggPSBjb250ZXh0Lk1hdGgsXG4gICAgICAgIE51bWJlciA9IGNvbnRleHQuTnVtYmVyLFxuICAgICAgICBPYmplY3QgPSBjb250ZXh0Lk9iamVjdCxcbiAgICAgICAgUmVnRXhwID0gY29udGV4dC5SZWdFeHAsXG4gICAgICAgIFN0cmluZyA9IGNvbnRleHQuU3RyaW5nLFxuICAgICAgICBUeXBlRXJyb3IgPSBjb250ZXh0LlR5cGVFcnJvcjtcblxuICAgIC8qKlxuICAgICAqIFVzZWQgZm9yIGBBcnJheWAgbWV0aG9kIHJlZmVyZW5jZXMuXG4gICAgICpcbiAgICAgKiBOb3JtYWxseSBgQXJyYXkucHJvdG90eXBlYCB3b3VsZCBzdWZmaWNlLCBob3dldmVyLCB1c2luZyBhbiBhcnJheSBsaXRlcmFsXG4gICAgICogYXZvaWRzIGlzc3VlcyBpbiBOYXJ3aGFsLlxuICAgICAqL1xuICAgIHZhciBhcnJheVJlZiA9IFtdO1xuXG4gICAgLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyAqL1xuICAgIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgICAvKiogVXNlZCB0byByZXN0b3JlIHRoZSBvcmlnaW5hbCBgX2AgcmVmZXJlbmNlIGluIGBub0NvbmZsaWN0YCAqL1xuICAgIHZhciBvbGREYXNoID0gY29udGV4dC5fO1xuXG4gICAgLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgaW50ZXJuYWwgW1tDbGFzc11dIG9mIHZhbHVlcyAqL1xuICAgIHZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4gICAgLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZSAqL1xuICAgIHZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICAgICAgU3RyaW5nKHRvU3RyaW5nKVxuICAgICAgICAucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKVxuICAgICAgICAucmVwbGFjZSgvdG9TdHJpbmd8IGZvciBbXlxcXV0rL2csICcuKj8nKSArICckJ1xuICAgICk7XG5cbiAgICAvKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbiAgICB2YXIgY2VpbCA9IE1hdGguY2VpbCxcbiAgICAgICAgY2xlYXJUaW1lb3V0ID0gY29udGV4dC5jbGVhclRpbWVvdXQsXG4gICAgICAgIGZsb29yID0gTWF0aC5mbG9vcixcbiAgICAgICAgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgZ2V0UHJvdG90eXBlT2YgPSBpc05hdGl2ZShnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZikgJiYgZ2V0UHJvdG90eXBlT2YsXG4gICAgICAgIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHksXG4gICAgICAgIHB1c2ggPSBhcnJheVJlZi5wdXNoLFxuICAgICAgICBzZXRUaW1lb3V0ID0gY29udGV4dC5zZXRUaW1lb3V0LFxuICAgICAgICBzcGxpY2UgPSBhcnJheVJlZi5zcGxpY2UsXG4gICAgICAgIHVuc2hpZnQgPSBhcnJheVJlZi51bnNoaWZ0O1xuXG4gICAgLyoqIFVzZWQgdG8gc2V0IG1ldGEgZGF0YSBvbiBmdW5jdGlvbnMgKi9cbiAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAvLyBJRSA4IG9ubHkgYWNjZXB0cyBET00gZWxlbWVudHNcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBvID0ge30sXG4gICAgICAgICAgICBmdW5jID0gaXNOYXRpdmUoZnVuYyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgJiYgZnVuYyxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMobywgbywgbykgJiYgZnVuYztcbiAgICAgIH0gY2F0Y2goZSkgeyB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0oKSk7XG5cbiAgICAvKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyBmb3IgbWV0aG9kcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcyAqL1xuICAgIHZhciBuYXRpdmVDcmVhdGUgPSBpc05hdGl2ZShuYXRpdmVDcmVhdGUgPSBPYmplY3QuY3JlYXRlKSAmJiBuYXRpdmVDcmVhdGUsXG4gICAgICAgIG5hdGl2ZUlzQXJyYXkgPSBpc05hdGl2ZShuYXRpdmVJc0FycmF5ID0gQXJyYXkuaXNBcnJheSkgJiYgbmF0aXZlSXNBcnJheSxcbiAgICAgICAgbmF0aXZlSXNGaW5pdGUgPSBjb250ZXh0LmlzRmluaXRlLFxuICAgICAgICBuYXRpdmVJc05hTiA9IGNvbnRleHQuaXNOYU4sXG4gICAgICAgIG5hdGl2ZUtleXMgPSBpc05hdGl2ZShuYXRpdmVLZXlzID0gT2JqZWN0LmtleXMpICYmIG5hdGl2ZUtleXMsXG4gICAgICAgIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgICAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbixcbiAgICAgICAgbmF0aXZlUGFyc2VJbnQgPSBjb250ZXh0LnBhcnNlSW50LFxuICAgICAgICBuYXRpdmVSYW5kb20gPSBNYXRoLnJhbmRvbTtcblxuICAgIC8qKiBVc2VkIHRvIGxvb2t1cCBhIGJ1aWx0LWluIGNvbnN0cnVjdG9yIGJ5IFtbQ2xhc3NdXSAqL1xuICAgIHZhciBjdG9yQnlDbGFzcyA9IHt9O1xuICAgIGN0b3JCeUNsYXNzW2FycmF5Q2xhc3NdID0gQXJyYXk7XG4gICAgY3RvckJ5Q2xhc3NbYm9vbENsYXNzXSA9IEJvb2xlYW47XG4gICAgY3RvckJ5Q2xhc3NbZGF0ZUNsYXNzXSA9IERhdGU7XG4gICAgY3RvckJ5Q2xhc3NbZnVuY0NsYXNzXSA9IEZ1bmN0aW9uO1xuICAgIGN0b3JCeUNsYXNzW29iamVjdENsYXNzXSA9IE9iamVjdDtcbiAgICBjdG9yQnlDbGFzc1tudW1iZXJDbGFzc10gPSBOdW1iZXI7XG4gICAgY3RvckJ5Q2xhc3NbcmVnZXhwQ2xhc3NdID0gUmVnRXhwO1xuICAgIGN0b3JCeUNsYXNzW3N0cmluZ0NsYXNzXSA9IFN0cmluZztcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBsb2Rhc2hgIG9iamVjdCB3aGljaCB3cmFwcyB0aGUgZ2l2ZW4gdmFsdWUgdG8gZW5hYmxlIGludHVpdGl2ZVxuICAgICAqIG1ldGhvZCBjaGFpbmluZy5cbiAgICAgKlxuICAgICAqIEluIGFkZGl0aW9uIHRvIExvLURhc2ggbWV0aG9kcywgd3JhcHBlcnMgYWxzbyBoYXZlIHRoZSBmb2xsb3dpbmcgYEFycmF5YCBtZXRob2RzOlxuICAgICAqIGBjb25jYXRgLCBgam9pbmAsIGBwb3BgLCBgcHVzaGAsIGByZXZlcnNlYCwgYHNoaWZ0YCwgYHNsaWNlYCwgYHNvcnRgLCBgc3BsaWNlYCxcbiAgICAgKiBhbmQgYHVuc2hpZnRgXG4gICAgICpcbiAgICAgKiBDaGFpbmluZyBpcyBzdXBwb3J0ZWQgaW4gY3VzdG9tIGJ1aWxkcyBhcyBsb25nIGFzIHRoZSBgdmFsdWVgIG1ldGhvZCBpc1xuICAgICAqIGltcGxpY2l0bHkgb3IgZXhwbGljaXRseSBpbmNsdWRlZCBpbiB0aGUgYnVpbGQuXG4gICAgICpcbiAgICAgKiBUaGUgY2hhaW5hYmxlIHdyYXBwZXIgZnVuY3Rpb25zIGFyZTpcbiAgICAgKiBgYWZ0ZXJgLCBgYXNzaWduYCwgYGJpbmRgLCBgYmluZEFsbGAsIGBiaW5kS2V5YCwgYGNoYWluYCwgYGNvbXBhY3RgLFxuICAgICAqIGBjb21wb3NlYCwgYGNvbmNhdGAsIGBjb3VudEJ5YCwgYGNyZWF0ZWAsIGBjcmVhdGVDYWxsYmFja2AsIGBjdXJyeWAsXG4gICAgICogYGRlYm91bmNlYCwgYGRlZmF1bHRzYCwgYGRlZmVyYCwgYGRlbGF5YCwgYGRpZmZlcmVuY2VgLCBgZmlsdGVyYCwgYGZsYXR0ZW5gLFxuICAgICAqIGBmb3JFYWNoYCwgYGZvckVhY2hSaWdodGAsIGBmb3JJbmAsIGBmb3JJblJpZ2h0YCwgYGZvck93bmAsIGBmb3JPd25SaWdodGAsXG4gICAgICogYGZ1bmN0aW9uc2AsIGBncm91cEJ5YCwgYGluZGV4QnlgLCBgaW5pdGlhbGAsIGBpbnRlcnNlY3Rpb25gLCBgaW52ZXJ0YCxcbiAgICAgKiBgaW52b2tlYCwgYGtleXNgLCBgbWFwYCwgYG1heGAsIGBtZW1vaXplYCwgYG1lcmdlYCwgYG1pbmAsIGBvYmplY3RgLCBgb21pdGAsXG4gICAgICogYG9uY2VgLCBgcGFpcnNgLCBgcGFydGlhbGAsIGBwYXJ0aWFsUmlnaHRgLCBgcGlja2AsIGBwbHVja2AsIGBwdWxsYCwgYHB1c2hgLFxuICAgICAqIGByYW5nZWAsIGByZWplY3RgLCBgcmVtb3ZlYCwgYHJlc3RgLCBgcmV2ZXJzZWAsIGBzaHVmZmxlYCwgYHNsaWNlYCwgYHNvcnRgLFxuICAgICAqIGBzb3J0QnlgLCBgc3BsaWNlYCwgYHRhcGAsIGB0aHJvdHRsZWAsIGB0aW1lc2AsIGB0b0FycmF5YCwgYHRyYW5zZm9ybWAsXG4gICAgICogYHVuaW9uYCwgYHVuaXFgLCBgdW5zaGlmdGAsIGB1bnppcGAsIGB2YWx1ZXNgLCBgd2hlcmVgLCBgd2l0aG91dGAsIGB3cmFwYCxcbiAgICAgKiBhbmQgYHppcGBcbiAgICAgKlxuICAgICAqIFRoZSBub24tY2hhaW5hYmxlIHdyYXBwZXIgZnVuY3Rpb25zIGFyZTpcbiAgICAgKiBgY2xvbmVgLCBgY2xvbmVEZWVwYCwgYGNvbnRhaW5zYCwgYGVzY2FwZWAsIGBldmVyeWAsIGBmaW5kYCwgYGZpbmRJbmRleGAsXG4gICAgICogYGZpbmRLZXlgLCBgZmluZExhc3RgLCBgZmluZExhc3RJbmRleGAsIGBmaW5kTGFzdEtleWAsIGBoYXNgLCBgaWRlbnRpdHlgLFxuICAgICAqIGBpbmRleE9mYCwgYGlzQXJndW1lbnRzYCwgYGlzQXJyYXlgLCBgaXNCb29sZWFuYCwgYGlzRGF0ZWAsIGBpc0VsZW1lbnRgLFxuICAgICAqIGBpc0VtcHR5YCwgYGlzRXF1YWxgLCBgaXNGaW5pdGVgLCBgaXNGdW5jdGlvbmAsIGBpc05hTmAsIGBpc051bGxgLCBgaXNOdW1iZXJgLFxuICAgICAqIGBpc09iamVjdGAsIGBpc1BsYWluT2JqZWN0YCwgYGlzUmVnRXhwYCwgYGlzU3RyaW5nYCwgYGlzVW5kZWZpbmVkYCwgYGpvaW5gLFxuICAgICAqIGBsYXN0SW5kZXhPZmAsIGBtaXhpbmAsIGBub0NvbmZsaWN0YCwgYHBhcnNlSW50YCwgYHBvcGAsIGByYW5kb21gLCBgcmVkdWNlYCxcbiAgICAgKiBgcmVkdWNlUmlnaHRgLCBgcmVzdWx0YCwgYHNoaWZ0YCwgYHNpemVgLCBgc29tZWAsIGBzb3J0ZWRJbmRleGAsIGBydW5JbkNvbnRleHRgLFxuICAgICAqIGB0ZW1wbGF0ZWAsIGB1bmVzY2FwZWAsIGB1bmlxdWVJZGAsIGFuZCBgdmFsdWVgXG4gICAgICpcbiAgICAgKiBUaGUgd3JhcHBlciBmdW5jdGlvbnMgYGZpcnN0YCBhbmQgYGxhc3RgIHJldHVybiB3cmFwcGVkIHZhbHVlcyB3aGVuIGBuYCBpc1xuICAgICAqIHByb3ZpZGVkLCBvdGhlcndpc2UgdGhleSByZXR1cm4gdW53cmFwcGVkIHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEV4cGxpY2l0IGNoYWluaW5nIGNhbiBiZSBlbmFibGVkIGJ5IHVzaW5nIHRoZSBgXy5jaGFpbmAgbWV0aG9kLlxuICAgICAqXG4gICAgICogQG5hbWUgX1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHdyYXAgaW4gYSBgbG9kYXNoYCBpbnN0YW5jZS5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGEgYGxvZGFzaGAgaW5zdGFuY2UuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciB3cmFwcGVkID0gXyhbMSwgMiwgM10pO1xuICAgICAqXG4gICAgICogLy8gcmV0dXJucyBhbiB1bndyYXBwZWQgdmFsdWVcbiAgICAgKiB3cmFwcGVkLnJlZHVjZShmdW5jdGlvbihzdW0sIG51bSkge1xuICAgICAqICAgcmV0dXJuIHN1bSArIG51bTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiA2XG4gICAgICpcbiAgICAgKiAvLyByZXR1cm5zIGEgd3JhcHBlZCB2YWx1ZVxuICAgICAqIHZhciBzcXVhcmVzID0gd3JhcHBlZC5tYXAoZnVuY3Rpb24obnVtKSB7XG4gICAgICogICByZXR1cm4gbnVtICogbnVtO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogXy5pc0FycmF5KHNxdWFyZXMpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXkoc3F1YXJlcy52YWx1ZSgpKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9kYXNoKHZhbHVlKSB7XG4gICAgICAvLyBkb24ndCB3cmFwIGlmIGFscmVhZHkgd3JhcHBlZCwgZXZlbiBpZiB3cmFwcGVkIGJ5IGEgZGlmZmVyZW50IGBsb2Rhc2hgIGNvbnN0cnVjdG9yXG4gICAgICByZXR1cm4gKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiAhaXNBcnJheSh2YWx1ZSkgJiYgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ19fd3JhcHBlZF9fJykpXG4gICAgICAgPyB2YWx1ZVxuICAgICAgIDogbmV3IGxvZGFzaFdyYXBwZXIodmFsdWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgZmFzdCBwYXRoIGZvciBjcmVhdGluZyBgbG9kYXNoYCB3cmFwcGVyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHdyYXAgaW4gYSBgbG9kYXNoYCBpbnN0YW5jZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNoYWluQWxsIEEgZmxhZyB0byBlbmFibGUgY2hhaW5pbmcgZm9yIGFsbCBtZXRob2RzXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBhIGBsb2Rhc2hgIGluc3RhbmNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGxvZGFzaFdyYXBwZXIodmFsdWUsIGNoYWluQWxsKSB7XG4gICAgICB0aGlzLl9fY2hhaW5fXyA9ICEhY2hhaW5BbGw7XG4gICAgICB0aGlzLl9fd3JhcHBlZF9fID0gdmFsdWU7XG4gICAgfVxuICAgIC8vIGVuc3VyZSBgbmV3IGxvZGFzaFdyYXBwZXJgIGlzIGFuIGluc3RhbmNlIG9mIGBsb2Rhc2hgXG4gICAgbG9kYXNoV3JhcHBlci5wcm90b3R5cGUgPSBsb2Rhc2gucHJvdG90eXBlO1xuXG4gICAgLyoqXG4gICAgICogQW4gb2JqZWN0IHVzZWQgdG8gZmxhZyBlbnZpcm9ubWVudHMgZmVhdHVyZXMuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgKi9cbiAgICB2YXIgc3VwcG9ydCA9IGxvZGFzaC5zdXBwb3J0ID0ge307XG5cbiAgICAvKipcbiAgICAgKiBEZXRlY3QgaWYgZnVuY3Rpb25zIGNhbiBiZSBkZWNvbXBpbGVkIGJ5IGBGdW5jdGlvbiN0b1N0cmluZ2BcbiAgICAgKiAoYWxsIGJ1dCBQUzMgYW5kIG9sZGVyIE9wZXJhIG1vYmlsZSBicm93c2VycyAmIGF2b2lkZWQgaW4gV2luZG93cyA4IGFwcHMpLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0LmZ1bmNEZWNvbXAgPSAhaXNOYXRpdmUoY29udGV4dC5XaW5SVEVycm9yKSAmJiByZVRoaXMudGVzdChydW5JbkNvbnRleHQpO1xuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IGlmIGBGdW5jdGlvbiNuYW1lYCBpcyBzdXBwb3J0ZWQgKGFsbCBidXQgSUUpLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0LmZ1bmNOYW1lcyA9IHR5cGVvZiBGdW5jdGlvbi5uYW1lID09ICdzdHJpbmcnO1xuXG4gICAgLyoqXG4gICAgICogQnkgZGVmYXVsdCwgdGhlIHRlbXBsYXRlIGRlbGltaXRlcnMgdXNlZCBieSBMby1EYXNoIGFyZSBzaW1pbGFyIHRvIHRob3NlIGluXG4gICAgICogZW1iZWRkZWQgUnVieSAoRVJCKS4gQ2hhbmdlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlXG4gICAgICogZGVsaW1pdGVycy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgIGxvZGFzaC50ZW1wbGF0ZVNldHRpbmdzID0ge1xuXG4gICAgICAvKipcbiAgICAgICAqIFVzZWQgdG8gZGV0ZWN0IGBkYXRhYCBwcm9wZXJ0eSB2YWx1ZXMgdG8gYmUgSFRNTC1lc2NhcGVkLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICAgICAqIEB0eXBlIFJlZ0V4cFxuICAgICAgICovXG4gICAgICAnZXNjYXBlJzogLzwlLShbXFxzXFxTXSs/KSU+L2csXG5cbiAgICAgIC8qKlxuICAgICAgICogVXNlZCB0byBkZXRlY3QgY29kZSB0byBiZSBldmFsdWF0ZWQuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgICAgICogQHR5cGUgUmVnRXhwXG4gICAgICAgKi9cbiAgICAgICdldmFsdWF0ZSc6IC88JShbXFxzXFxTXSs/KSU+L2csXG5cbiAgICAgIC8qKlxuICAgICAgICogVXNlZCB0byBkZXRlY3QgYGRhdGFgIHByb3BlcnR5IHZhbHVlcyB0byBpbmplY3QuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgICAgICogQHR5cGUgUmVnRXhwXG4gICAgICAgKi9cbiAgICAgICdpbnRlcnBvbGF0ZSc6IHJlSW50ZXJwb2xhdGUsXG5cbiAgICAgIC8qKlxuICAgICAgICogVXNlZCB0byByZWZlcmVuY2UgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSB0ZW1wbGF0ZSB0ZXh0LlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICAgICAqIEB0eXBlIHN0cmluZ1xuICAgICAgICovXG4gICAgICAndmFyaWFibGUnOiAnJyxcblxuICAgICAgLyoqXG4gICAgICAgKiBVc2VkIHRvIGltcG9ydCB2YXJpYWJsZXMgaW50byB0aGUgY29tcGlsZWQgdGVtcGxhdGUuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgKi9cbiAgICAgICdpbXBvcnRzJzoge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYGxvZGFzaGAgZnVuY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3MuaW1wb3J0c1xuICAgICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICAgKi9cbiAgICAgICAgJ18nOiBsb2Rhc2hcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5iaW5kYCB0aGF0IGNyZWF0ZXMgdGhlIGJvdW5kIGZ1bmN0aW9uIGFuZFxuICAgICAqIHNldHMgaXRzIG1ldGEgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYmluZERhdGEgVGhlIGJpbmQgZGF0YSBhcnJheS5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBib3VuZCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlQmluZChiaW5kRGF0YSkge1xuICAgICAgdmFyIGZ1bmMgPSBiaW5kRGF0YVswXSxcbiAgICAgICAgICBwYXJ0aWFsQXJncyA9IGJpbmREYXRhWzJdLFxuICAgICAgICAgIHRoaXNBcmcgPSBiaW5kRGF0YVs0XTtcblxuICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgIC8vIGBGdW5jdGlvbiNiaW5kYCBzcGVjXG4gICAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMy40LjVcbiAgICAgICAgaWYgKHBhcnRpYWxBcmdzKSB7XG4gICAgICAgICAgLy8gYXZvaWQgYGFyZ3VtZW50c2Agb2JqZWN0IGRlb3B0aW1pemF0aW9ucyBieSB1c2luZyBgc2xpY2VgIGluc3RlYWRcbiAgICAgICAgICAvLyBvZiBgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGxgIGFuZCBub3QgYXNzaWduaW5nIGBhcmd1bWVudHNgIHRvIGFcbiAgICAgICAgICAvLyB2YXJpYWJsZSBhcyBhIHRlcm5hcnkgZXhwcmVzc2lvblxuICAgICAgICAgIHZhciBhcmdzID0gc2xpY2UocGFydGlhbEFyZ3MpO1xuICAgICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBtaW1pYyB0aGUgY29uc3RydWN0b3IncyBgcmV0dXJuYCBiZWhhdmlvclxuICAgICAgICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDEzLjIuMlxuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG4gICAgICAgICAgLy8gZW5zdXJlIGBuZXcgYm91bmRgIGlzIGFuIGluc3RhbmNlIG9mIGBmdW5jYFxuICAgICAgICAgIHZhciB0aGlzQmluZGluZyA9IGJhc2VDcmVhdGUoZnVuYy5wcm90b3R5cGUpLFxuICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzIHx8IGFyZ3VtZW50cyk7XG4gICAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzIHx8IGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICBzZXRCaW5kRGF0YShib3VuZCwgYmluZERhdGEpO1xuICAgICAgcmV0dXJuIGJvdW5kO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmNsb25lYCB3aXRob3V0IGFyZ3VtZW50IGp1Z2dsaW5nIG9yIHN1cHBvcnRcbiAgICAgKiBmb3IgYHRoaXNBcmdgIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNsb25lLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcD1mYWxzZV0gU3BlY2lmeSBhIGRlZXAgY2xvbmUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNsb25pbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgc291cmNlIG9iamVjdHMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyBjbG9uZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBjbG9uZWQgdmFsdWUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUNsb25lKHZhbHVlLCBpc0RlZXAsIGNhbGxiYWNrLCBzdGFja0EsIHN0YWNrQikge1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaW5zcGVjdCBbW0NsYXNzXV1cbiAgICAgIHZhciBpc09iaiA9IGlzT2JqZWN0KHZhbHVlKTtcbiAgICAgIGlmIChpc09iaikge1xuICAgICAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gICAgICAgIGlmICghY2xvbmVhYmxlQ2xhc3Nlc1tjbGFzc05hbWVdKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjdG9yID0gY3RvckJ5Q2xhc3NbY2xhc3NOYW1lXTtcbiAgICAgICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgICAgICBjYXNlIGJvb2xDbGFzczpcbiAgICAgICAgICBjYXNlIGRhdGVDbGFzczpcbiAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigrdmFsdWUpO1xuXG4gICAgICAgICAgY2FzZSBudW1iZXJDbGFzczpcbiAgICAgICAgICBjYXNlIHN0cmluZ0NsYXNzOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKHZhbHVlKTtcblxuICAgICAgICAgIGNhc2UgcmVnZXhwQ2xhc3M6XG4gICAgICAgICAgICByZXN1bHQgPSBjdG9yKHZhbHVlLnNvdXJjZSwgcmVGbGFncy5leGVjKHZhbHVlKSk7XG4gICAgICAgICAgICByZXN1bHQubGFzdEluZGV4ID0gdmFsdWUubGFzdEluZGV4O1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIGlzQXJyID0gaXNBcnJheSh2YWx1ZSk7XG4gICAgICBpZiAoaXNEZWVwKSB7XG4gICAgICAgIC8vIGNoZWNrIGZvciBjaXJjdWxhciByZWZlcmVuY2VzIGFuZCByZXR1cm4gY29ycmVzcG9uZGluZyBjbG9uZVxuICAgICAgICB2YXIgaW5pdGVkU3RhY2sgPSAhc3RhY2tBO1xuICAgICAgICBzdGFja0EgfHwgKHN0YWNrQSA9IGdldEFycmF5KCkpO1xuICAgICAgICBzdGFja0IgfHwgKHN0YWNrQiA9IGdldEFycmF5KCkpO1xuXG4gICAgICAgIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGFja0JbbGVuZ3RoXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gaXNBcnIgPyBjdG9yKHZhbHVlLmxlbmd0aCkgOiB7fTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBpc0FyciA/IHNsaWNlKHZhbHVlKSA6IGFzc2lnbih7fSwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgLy8gYWRkIGFycmF5IHByb3BlcnRpZXMgYXNzaWduZWQgYnkgYFJlZ0V4cCNleGVjYFxuICAgICAgaWYgKGlzQXJyKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnaW5kZXgnKSkge1xuICAgICAgICAgIHJlc3VsdC5pbmRleCA9IHZhbHVlLmluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnaW5wdXQnKSkge1xuICAgICAgICAgIHJlc3VsdC5pbnB1dCA9IHZhbHVlLmlucHV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBleGl0IGZvciBzaGFsbG93IGNsb25lXG4gICAgICBpZiAoIWlzRGVlcCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgLy8gYWRkIHRoZSBzb3VyY2UgdmFsdWUgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgICAvLyBhbmQgYXNzb2NpYXRlIGl0IHdpdGggaXRzIGNsb25lXG4gICAgICBzdGFja0EucHVzaCh2YWx1ZSk7XG4gICAgICBzdGFja0IucHVzaChyZXN1bHQpO1xuXG4gICAgICAvLyByZWN1cnNpdmVseSBwb3B1bGF0ZSBjbG9uZSAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpXG4gICAgICAoaXNBcnIgPyBmb3JFYWNoIDogZm9yT3duKSh2YWx1ZSwgZnVuY3Rpb24ob2JqVmFsdWUsIGtleSkge1xuICAgICAgICByZXN1bHRba2V5XSA9IGJhc2VDbG9uZShvYmpWYWx1ZSwgaXNEZWVwLCBjYWxsYmFjaywgc3RhY2tBLCBzdGFja0IpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgICByZWxlYXNlQXJyYXkoc3RhY2tBKTtcbiAgICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmNyZWF0ZWAgd2l0aG91dCBzdXBwb3J0IGZvciBhc3NpZ25pbmdcbiAgICAgKiBwcm9wZXJ0aWVzIHRvIHRoZSBjcmVhdGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3RvdHlwZSBUaGUgb2JqZWN0IHRvIGluaGVyaXQgZnJvbS5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VDcmVhdGUocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICByZXR1cm4gaXNPYmplY3QocHJvdG90eXBlKSA/IG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpIDoge307XG4gICAgfVxuICAgIC8vIGZhbGxiYWNrIGZvciBicm93c2VycyB3aXRob3V0IGBPYmplY3QuY3JlYXRlYFxuICAgIGlmICghbmF0aXZlQ3JlYXRlKSB7XG4gICAgICBiYXNlQ3JlYXRlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiBPYmplY3QoKSB7fVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocHJvdG90eXBlKSB7XG4gICAgICAgICAgaWYgKGlzT2JqZWN0KHByb3RvdHlwZSkpIHtcbiAgICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE9iamVjdDtcbiAgICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0IHx8IGNvbnRleHQuT2JqZWN0KCk7XG4gICAgICAgIH07XG4gICAgICB9KCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmNyZWF0ZUNhbGxiYWNrYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNyZWF0aW5nXG4gICAgICogXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IFtmdW5jPWlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgY3JlYXRlZCBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0aGUgY2FsbGJhY2sgYWNjZXB0cy5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlQ3JlYXRlQ2FsbGJhY2soZnVuYywgdGhpc0FyZywgYXJnQ291bnQpIHtcbiAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBpZGVudGl0eTtcbiAgICAgIH1cbiAgICAgIC8vIGV4aXQgZWFybHkgZm9yIG5vIGB0aGlzQXJnYCBvciBhbHJlYWR5IGJvdW5kIGJ5IGBGdW5jdGlvbiNiaW5kYFxuICAgICAgaWYgKHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnIHx8ICEoJ3Byb3RvdHlwZScgaW4gZnVuYykpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICB9XG4gICAgICB2YXIgYmluZERhdGEgPSBmdW5jLl9fYmluZERhdGFfXztcbiAgICAgIGlmICh0eXBlb2YgYmluZERhdGEgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHN1cHBvcnQuZnVuY05hbWVzKSB7XG4gICAgICAgICAgYmluZERhdGEgPSAhZnVuYy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGJpbmREYXRhID0gYmluZERhdGEgfHwgIXN1cHBvcnQuZnVuY0RlY29tcDtcbiAgICAgICAgaWYgKCFiaW5kRGF0YSkge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSBmblRvU3RyaW5nLmNhbGwoZnVuYyk7XG4gICAgICAgICAgaWYgKCFzdXBwb3J0LmZ1bmNOYW1lcykge1xuICAgICAgICAgICAgYmluZERhdGEgPSAhcmVGdW5jTmFtZS50ZXN0KHNvdXJjZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghYmluZERhdGEpIHtcbiAgICAgICAgICAgIC8vIGNoZWNrcyBpZiBgZnVuY2AgcmVmZXJlbmNlcyB0aGUgYHRoaXNgIGtleXdvcmQgYW5kIHN0b3JlcyB0aGUgcmVzdWx0XG4gICAgICAgICAgICBiaW5kRGF0YSA9IHJlVGhpcy50ZXN0KHNvdXJjZSk7XG4gICAgICAgICAgICBzZXRCaW5kRGF0YShmdW5jLCBiaW5kRGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBleGl0IGVhcmx5IGlmIHRoZXJlIGFyZSBubyBgdGhpc2AgcmVmZXJlbmNlcyBvciBgZnVuY2AgaXMgYm91bmRcbiAgICAgIGlmIChiaW5kRGF0YSA9PT0gZmFsc2UgfHwgKGJpbmREYXRhICE9PSB0cnVlICYmIGJpbmREYXRhWzFdICYgMSkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGFyZ0NvdW50KSB7XG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSk7XG4gICAgICAgIH07XG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGEsIGIpO1xuICAgICAgICB9O1xuICAgICAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgIH07XG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJpbmQoZnVuYywgdGhpc0FyZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGNyZWF0ZVdyYXBwZXJgIHRoYXQgY3JlYXRlcyB0aGUgd3JhcHBlciBhbmRcbiAgICAgKiBzZXRzIGl0cyBtZXRhIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGJpbmREYXRhIFRoZSBiaW5kIGRhdGEgYXJyYXkuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUNyZWF0ZVdyYXBwZXIoYmluZERhdGEpIHtcbiAgICAgIHZhciBmdW5jID0gYmluZERhdGFbMF0sXG4gICAgICAgICAgYml0bWFzayA9IGJpbmREYXRhWzFdLFxuICAgICAgICAgIHBhcnRpYWxBcmdzID0gYmluZERhdGFbMl0sXG4gICAgICAgICAgcGFydGlhbFJpZ2h0QXJncyA9IGJpbmREYXRhWzNdLFxuICAgICAgICAgIHRoaXNBcmcgPSBiaW5kRGF0YVs0XSxcbiAgICAgICAgICBhcml0eSA9IGJpbmREYXRhWzVdO1xuXG4gICAgICB2YXIgaXNCaW5kID0gYml0bWFzayAmIDEsXG4gICAgICAgICAgaXNCaW5kS2V5ID0gYml0bWFzayAmIDIsXG4gICAgICAgICAgaXNDdXJyeSA9IGJpdG1hc2sgJiA0LFxuICAgICAgICAgIGlzQ3VycnlCb3VuZCA9IGJpdG1hc2sgJiA4LFxuICAgICAgICAgIGtleSA9IGZ1bmM7XG5cbiAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICB2YXIgdGhpc0JpbmRpbmcgPSBpc0JpbmQgPyB0aGlzQXJnIDogdGhpcztcbiAgICAgICAgaWYgKHBhcnRpYWxBcmdzKSB7XG4gICAgICAgICAgdmFyIGFyZ3MgPSBzbGljZShwYXJ0aWFsQXJncyk7XG4gICAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0aWFsUmlnaHRBcmdzIHx8IGlzQ3VycnkpIHtcbiAgICAgICAgICBhcmdzIHx8IChhcmdzID0gc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgICAgaWYgKHBhcnRpYWxSaWdodEFyZ3MpIHtcbiAgICAgICAgICAgIHB1c2guYXBwbHkoYXJncywgcGFydGlhbFJpZ2h0QXJncyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0N1cnJ5ICYmIGFyZ3MubGVuZ3RoIDwgYXJpdHkpIHtcbiAgICAgICAgICAgIGJpdG1hc2sgfD0gMTYgJiB+MzI7XG4gICAgICAgICAgICByZXR1cm4gYmFzZUNyZWF0ZVdyYXBwZXIoW2Z1bmMsIChpc0N1cnJ5Qm91bmQgPyBiaXRtYXNrIDogYml0bWFzayAmIH4zKSwgYXJncywgbnVsbCwgdGhpc0FyZywgYXJpdHldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXJncyB8fCAoYXJncyA9IGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChpc0JpbmRLZXkpIHtcbiAgICAgICAgICBmdW5jID0gdGhpc0JpbmRpbmdba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG4gICAgICAgICAgdGhpc0JpbmRpbmcgPSBiYXNlQ3JlYXRlKGZ1bmMucHJvdG90eXBlKTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQmluZGluZywgYXJncyk7XG4gICAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQmluZGluZywgYXJncyk7XG4gICAgICB9XG4gICAgICBzZXRCaW5kRGF0YShib3VuZCwgYmluZERhdGEpO1xuICAgICAgcmV0dXJuIGJvdW5kO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmRpZmZlcmVuY2VgIHRoYXQgYWNjZXB0cyBhIHNpbmdsZSBhcnJheVxuICAgICAqIG9mIHZhbHVlcyB0byBleGNsdWRlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbdmFsdWVzXSBUaGUgYXJyYXkgb2YgdmFsdWVzIHRvIGV4Y2x1ZGUuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGZpbHRlcmVkIHZhbHVlcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlRGlmZmVyZW5jZShhcnJheSwgdmFsdWVzKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBpbmRleE9mID0gZ2V0SW5kZXhPZigpLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgICAgICBpc0xhcmdlID0gbGVuZ3RoID49IGxhcmdlQXJyYXlTaXplICYmIGluZGV4T2YgPT09IGJhc2VJbmRleE9mLFxuICAgICAgICAgIHJlc3VsdCA9IFtdO1xuXG4gICAgICBpZiAoaXNMYXJnZSkge1xuICAgICAgICB2YXIgY2FjaGUgPSBjcmVhdGVDYWNoZSh2YWx1ZXMpO1xuICAgICAgICBpZiAoY2FjaGUpIHtcbiAgICAgICAgICBpbmRleE9mID0gY2FjaGVJbmRleE9mO1xuICAgICAgICAgIHZhbHVlcyA9IGNhY2hlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzTGFyZ2UgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuICAgICAgICBpZiAoaW5kZXhPZih2YWx1ZXMsIHZhbHVlKSA8IDApIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc0xhcmdlKSB7XG4gICAgICAgIHJlbGVhc2VPYmplY3QodmFsdWVzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZmxhdHRlbmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICAgICAqIHNob3J0aGFuZHMgb3IgYHRoaXNBcmdgIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBmbGF0dGVuLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU2hhbGxvdz1mYWxzZV0gQSBmbGFnIHRvIHJlc3RyaWN0IGZsYXR0ZW5pbmcgdG8gYSBzaW5nbGUgbGV2ZWwuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTdHJpY3Q9ZmFsc2VdIEEgZmxhZyB0byByZXN0cmljdCBmbGF0dGVuaW5nIHRvIGFycmF5cyBhbmQgYGFyZ3VtZW50c2Agb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2Zyb21JbmRleD0wXSBUaGUgaW5kZXggdG8gc3RhcnQgZnJvbS5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgZmxhdHRlbmVkIGFycmF5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VGbGF0dGVuKGFycmF5LCBpc1NoYWxsb3csIGlzU3RyaWN0LCBmcm9tSW5kZXgpIHtcbiAgICAgIHZhciBpbmRleCA9IChmcm9tSW5kZXggfHwgMCkgLSAxLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLmxlbmd0aCA9PSAnbnVtYmVyJ1xuICAgICAgICAgICAgJiYgKGlzQXJyYXkodmFsdWUpIHx8IGlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgICAgICAvLyByZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpXG4gICAgICAgICAgaWYgKCFpc1NoYWxsb3cpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYmFzZUZsYXR0ZW4odmFsdWUsIGlzU2hhbGxvdywgaXNTdHJpY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdmFsSW5kZXggPSAtMSxcbiAgICAgICAgICAgICAgdmFsTGVuZ3RoID0gdmFsdWUubGVuZ3RoLFxuICAgICAgICAgICAgICByZXNJbmRleCA9IHJlc3VsdC5sZW5ndGg7XG5cbiAgICAgICAgICByZXN1bHQubGVuZ3RoICs9IHZhbExlbmd0aDtcbiAgICAgICAgICB3aGlsZSAoKyt2YWxJbmRleCA8IHZhbExlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W3Jlc0luZGV4KytdID0gdmFsdWVbdmFsSW5kZXhdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaXNTdHJpY3QpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNFcXVhbGAsIHdpdGhvdXQgc3VwcG9ydCBmb3IgYHRoaXNBcmdgIGJpbmRpbmcsXG4gICAgICogdGhhdCBhbGxvd3MgcGFydGlhbCBcIl8ud2hlcmVcIiBzdHlsZSBjb21wYXJpc29ucy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSBhIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7Kn0gYiBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaXNXaGVyZT1mYWxzZV0gQSBmbGFnIHRvIGluZGljYXRlIHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBhYCBvYmplY3RzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0I9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYGJgIG9iamVjdHMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlSXNFcXVhbChhLCBiLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgICAgIC8vIHVzZWQgdG8gaW5kaWNhdGUgdGhhdCB3aGVuIGNvbXBhcmluZyBvYmplY3RzLCBgYWAgaGFzIGF0IGxlYXN0IHRoZSBwcm9wZXJ0aWVzIG9mIGBiYFxuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBjYWxsYmFjayhhLCBiKTtcbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gISFyZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV4aXQgZWFybHkgZm9yIGlkZW50aWNhbCB2YWx1ZXNcbiAgICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIC8vIHRyZWF0IGArMGAgdnMuIGAtMGAgYXMgbm90IGVxdWFsXG4gICAgICAgIHJldHVybiBhICE9PSAwIHx8ICgxIC8gYSA9PSAxIC8gYik7XG4gICAgICB9XG4gICAgICB2YXIgdHlwZSA9IHR5cGVvZiBhLFxuICAgICAgICAgIG90aGVyVHlwZSA9IHR5cGVvZiBiO1xuXG4gICAgICAvLyBleGl0IGVhcmx5IGZvciB1bmxpa2UgcHJpbWl0aXZlIHZhbHVlc1xuICAgICAgaWYgKGEgPT09IGEgJiZcbiAgICAgICAgICAhKGEgJiYgb2JqZWN0VHlwZXNbdHlwZV0pICYmXG4gICAgICAgICAgIShiICYmIG9iamVjdFR5cGVzW290aGVyVHlwZV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIGV4aXQgZWFybHkgZm9yIGBudWxsYCBhbmQgYHVuZGVmaW5lZGAgYXZvaWRpbmcgRVMzJ3MgRnVuY3Rpb24jY2FsbCBiZWhhdmlvclxuICAgICAgLy8gaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4zLjQuNFxuICAgICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgICB9XG4gICAgICAvLyBjb21wYXJlIFtbQ2xhc3NdXSBuYW1lc1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSksXG4gICAgICAgICAgb3RoZXJDbGFzcyA9IHRvU3RyaW5nLmNhbGwoYik7XG5cbiAgICAgIGlmIChjbGFzc05hbWUgPT0gYXJnc0NsYXNzKSB7XG4gICAgICAgIGNsYXNzTmFtZSA9IG9iamVjdENsYXNzO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVyQ2xhc3MgPT0gYXJnc0NsYXNzKSB7XG4gICAgICAgIG90aGVyQ2xhc3MgPSBvYmplY3RDbGFzcztcbiAgICAgIH1cbiAgICAgIGlmIChjbGFzc05hbWUgIT0gb3RoZXJDbGFzcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgICBjYXNlIGJvb2xDbGFzczpcbiAgICAgICAgY2FzZSBkYXRlQ2xhc3M6XG4gICAgICAgICAgLy8gY29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1iZXJzLCBkYXRlcyB0byBtaWxsaXNlY29uZHMgYW5kIGJvb2xlYW5zXG4gICAgICAgICAgLy8gdG8gYDFgIG9yIGAwYCB0cmVhdGluZyBpbnZhbGlkIGRhdGVzIGNvZXJjZWQgdG8gYE5hTmAgYXMgbm90IGVxdWFsXG4gICAgICAgICAgcmV0dXJuICthID09ICtiO1xuXG4gICAgICAgIGNhc2UgbnVtYmVyQ2xhc3M6XG4gICAgICAgICAgLy8gdHJlYXQgYE5hTmAgdnMuIGBOYU5gIGFzIGVxdWFsXG4gICAgICAgICAgcmV0dXJuIChhICE9ICthKVxuICAgICAgICAgICAgPyBiICE9ICtiXG4gICAgICAgICAgICAvLyBidXQgdHJlYXQgYCswYCB2cy4gYC0wYCBhcyBub3QgZXF1YWxcbiAgICAgICAgICAgIDogKGEgPT0gMCA/ICgxIC8gYSA9PSAxIC8gYikgOiBhID09ICtiKTtcblxuICAgICAgICBjYXNlIHJlZ2V4cENsYXNzOlxuICAgICAgICBjYXNlIHN0cmluZ0NsYXNzOlxuICAgICAgICAgIC8vIGNvZXJjZSByZWdleGVzIHRvIHN0cmluZ3MgKGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMTAuNi40KVxuICAgICAgICAgIC8vIHRyZWF0IHN0cmluZyBwcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCBpbnN0YW5jZXMgYXMgZXF1YWxcbiAgICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICB9XG4gICAgICB2YXIgaXNBcnIgPSBjbGFzc05hbWUgPT0gYXJyYXlDbGFzcztcbiAgICAgIGlmICghaXNBcnIpIHtcbiAgICAgICAgLy8gdW53cmFwIGFueSBgbG9kYXNoYCB3cmFwcGVkIHZhbHVlc1xuICAgICAgICB2YXIgYVdyYXBwZWQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsICdfX3dyYXBwZWRfXycpLFxuICAgICAgICAgICAgYldyYXBwZWQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsICdfX3dyYXBwZWRfXycpO1xuXG4gICAgICAgIGlmIChhV3JhcHBlZCB8fCBiV3JhcHBlZCkge1xuICAgICAgICAgIHJldHVybiBiYXNlSXNFcXVhbChhV3JhcHBlZCA/IGEuX193cmFwcGVkX18gOiBhLCBiV3JhcHBlZCA/IGIuX193cmFwcGVkX18gOiBiLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV4aXQgZm9yIGZ1bmN0aW9ucyBhbmQgRE9NIG5vZGVzXG4gICAgICAgIGlmIChjbGFzc05hbWUgIT0gb2JqZWN0Q2xhc3MpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW4gb2xkZXIgdmVyc2lvbnMgb2YgT3BlcmEsIGBhcmd1bWVudHNgIG9iamVjdHMgaGF2ZSBgQXJyYXlgIGNvbnN0cnVjdG9yc1xuICAgICAgICB2YXIgY3RvckEgPSBhLmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgY3RvckIgPSBiLmNvbnN0cnVjdG9yO1xuXG4gICAgICAgIC8vIG5vbiBgT2JqZWN0YCBvYmplY3QgaW5zdGFuY2VzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWFsXG4gICAgICAgIGlmIChjdG9yQSAhPSBjdG9yQiAmJlxuICAgICAgICAgICAgICAhKGlzRnVuY3Rpb24oY3RvckEpICYmIGN0b3JBIGluc3RhbmNlb2YgY3RvckEgJiYgaXNGdW5jdGlvbihjdG9yQikgJiYgY3RvckIgaW5zdGFuY2VvZiBjdG9yQikgJiZcbiAgICAgICAgICAgICAgKCdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGFzc3VtZSBjeWNsaWMgc3RydWN0dXJlcyBhcmUgZXF1YWxcbiAgICAgIC8vIHRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWMgc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xXG4gICAgICAvLyBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gIChodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEyLjMpXG4gICAgICB2YXIgaW5pdGVkU3RhY2sgPSAhc3RhY2tBO1xuICAgICAgc3RhY2tBIHx8IChzdGFja0EgPSBnZXRBcnJheSgpKTtcbiAgICAgIHN0YWNrQiB8fCAoc3RhY2tCID0gZ2V0QXJyYXkoKSk7XG5cbiAgICAgIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmIChzdGFja0FbbGVuZ3RoXSA9PSBhKSB7XG4gICAgICAgICAgcmV0dXJuIHN0YWNrQltsZW5ndGhdID09IGI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBzaXplID0gMDtcbiAgICAgIHJlc3VsdCA9IHRydWU7XG5cbiAgICAgIC8vIGFkZCBgYWAgYW5kIGBiYCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHNcbiAgICAgIHN0YWNrQS5wdXNoKGEpO1xuICAgICAgc3RhY2tCLnB1c2goYik7XG5cbiAgICAgIC8vIHJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cylcbiAgICAgIGlmIChpc0Fycikge1xuICAgICAgICAvLyBjb21wYXJlIGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeVxuICAgICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgICAgc2l6ZSA9IGIubGVuZ3RoO1xuICAgICAgICByZXN1bHQgPSBzaXplID09IGxlbmd0aDtcblxuICAgICAgICBpZiAocmVzdWx0IHx8IGlzV2hlcmUpIHtcbiAgICAgICAgICAvLyBkZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzXG4gICAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gbGVuZ3RoLFxuICAgICAgICAgICAgICAgIHZhbHVlID0gYltzaXplXTtcblxuICAgICAgICAgICAgaWYgKGlzV2hlcmUpIHtcbiAgICAgICAgICAgICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlc3VsdCA9IGJhc2VJc0VxdWFsKGFbaW5kZXhdLCB2YWx1ZSwgY2FsbGJhY2ssIGlzV2hlcmUsIHN0YWNrQSwgc3RhY2tCKSkpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghKHJlc3VsdCA9IGJhc2VJc0VxdWFsKGFbc2l6ZV0sIHZhbHVlLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBkZWVwIGNvbXBhcmUgb2JqZWN0cyB1c2luZyBgZm9ySW5gLCBpbnN0ZWFkIG9mIGBmb3JPd25gLCB0byBhdm9pZCBgT2JqZWN0LmtleXNgXG4gICAgICAgIC8vIHdoaWNoLCBpbiB0aGlzIGNhc2UsIGlzIG1vcmUgY29zdGx5XG4gICAgICAgIGZvckluKGIsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGIpIHtcbiAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChiLCBrZXkpKSB7XG4gICAgICAgICAgICAvLyBjb3VudCB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgICAvLyBkZWVwIGNvbXBhcmUgZWFjaCBwcm9wZXJ0eSB2YWx1ZS5cbiAgICAgICAgICAgIHJldHVybiAocmVzdWx0ID0gaGFzT3duUHJvcGVydHkuY2FsbChhLCBrZXkpICYmIGJhc2VJc0VxdWFsKGFba2V5XSwgdmFsdWUsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc3VsdCAmJiAhaXNXaGVyZSkge1xuICAgICAgICAgIC8vIGVuc3VyZSBib3RoIG9iamVjdHMgaGF2ZSB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllc1xuICAgICAgICAgIGZvckluKGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGEpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgLy8gYHNpemVgIHdpbGwgYmUgYC0xYCBpZiBgYWAgaGFzIG1vcmUgcHJvcGVydGllcyB0aGFuIGBiYFxuICAgICAgICAgICAgICByZXR1cm4gKHJlc3VsdCA9IC0tc2l6ZSA+IC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhY2tBLnBvcCgpO1xuICAgICAgc3RhY2tCLnBvcCgpO1xuXG4gICAgICBpZiAoaW5pdGVkU3RhY2spIHtcbiAgICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICAgIHJlbGVhc2VBcnJheShzdGFja0IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5tZXJnZWAgd2l0aG91dCBhcmd1bWVudCBqdWdnbGluZyBvciBzdXBwb3J0XG4gICAgICogZm9yIGB0aGlzQXJnYCBiaW5kaW5nLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgc291cmNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgbWVyZ2luZyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgc291cmNlIG9iamVjdHMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyB2YWx1ZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VNZXJnZShvYmplY3QsIHNvdXJjZSwgY2FsbGJhY2ssIHN0YWNrQSwgc3RhY2tCKSB7XG4gICAgICAoaXNBcnJheShzb3VyY2UpID8gZm9yRWFjaCA6IGZvck93bikoc291cmNlLCBmdW5jdGlvbihzb3VyY2UsIGtleSkge1xuICAgICAgICB2YXIgZm91bmQsXG4gICAgICAgICAgICBpc0FycixcbiAgICAgICAgICAgIHJlc3VsdCA9IHNvdXJjZSxcbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0W2tleV07XG5cbiAgICAgICAgaWYgKHNvdXJjZSAmJiAoKGlzQXJyID0gaXNBcnJheShzb3VyY2UpKSB8fCBpc1BsYWluT2JqZWN0KHNvdXJjZSkpKSB7XG4gICAgICAgICAgLy8gYXZvaWQgbWVyZ2luZyBwcmV2aW91c2x5IG1lcmdlZCBjeWNsaWMgc291cmNlc1xuICAgICAgICAgIHZhciBzdGFja0xlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gICAgICAgICAgd2hpbGUgKHN0YWNrTGVuZ3RoLS0pIHtcbiAgICAgICAgICAgIGlmICgoZm91bmQgPSBzdGFja0Fbc3RhY2tMZW5ndGhdID09IHNvdXJjZSkpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja0Jbc3RhY2tMZW5ndGhdO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdmFyIGlzU2hhbGxvdztcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICByZXN1bHQgPSBjYWxsYmFjayh2YWx1ZSwgc291cmNlKTtcbiAgICAgICAgICAgICAgaWYgKChpc1NoYWxsb3cgPSB0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVzdWx0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzU2hhbGxvdykge1xuICAgICAgICAgICAgICB2YWx1ZSA9IGlzQXJyXG4gICAgICAgICAgICAgICAgPyAoaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IFtdKVxuICAgICAgICAgICAgICAgIDogKGlzUGxhaW5PYmplY3QodmFsdWUpID8gdmFsdWUgOiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhZGQgYHNvdXJjZWAgYW5kIGFzc29jaWF0ZWQgYHZhbHVlYCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHNcbiAgICAgICAgICAgIHN0YWNrQS5wdXNoKHNvdXJjZSk7XG4gICAgICAgICAgICBzdGFja0IucHVzaCh2YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IG1lcmdlIG9iamVjdHMgYW5kIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpXG4gICAgICAgICAgICBpZiAoIWlzU2hhbGxvdykge1xuICAgICAgICAgICAgICBiYXNlTWVyZ2UodmFsdWUsIHNvdXJjZSwgY2FsbGJhY2ssIHN0YWNrQSwgc3RhY2tCKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjYWxsYmFjayh2YWx1ZSwgc291cmNlKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucmFuZG9tYCB3aXRob3V0IGFyZ3VtZW50IGp1Z2dsaW5nIG9yIHN1cHBvcnRcbiAgICAgKiBmb3IgcmV0dXJuaW5nIGZsb2F0aW5nLXBvaW50IG51bWJlcnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gVGhlIG1pbmltdW0gcG9zc2libGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBUaGUgbWF4aW11bSBwb3NzaWJsZSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIGEgcmFuZG9tIG51bWJlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlUmFuZG9tKG1pbiwgbWF4KSB7XG4gICAgICByZXR1cm4gbWluICsgZmxvb3IobmF0aXZlUmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuaXFgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgICAqIG9yIGB0aGlzQXJnYCBiaW5kaW5nLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NvcnRlZD1mYWxzZV0gQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgYGFycmF5YCBpcyBzb3J0ZWQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgZHVwbGljYXRlLXZhbHVlLWZyZWUgYXJyYXkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZVVuaXEoYXJyYXksIGlzU29ydGVkLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgaW5kZXhPZiA9IGdldEluZGV4T2YoKSxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgIHZhciBpc0xhcmdlID0gIWlzU29ydGVkICYmIGxlbmd0aCA+PSBsYXJnZUFycmF5U2l6ZSAmJiBpbmRleE9mID09PSBiYXNlSW5kZXhPZixcbiAgICAgICAgICBzZWVuID0gKGNhbGxiYWNrIHx8IGlzTGFyZ2UpID8gZ2V0QXJyYXkoKSA6IHJlc3VsdDtcblxuICAgICAgaWYgKGlzTGFyZ2UpIHtcbiAgICAgICAgdmFyIGNhY2hlID0gY3JlYXRlQ2FjaGUoc2Vlbik7XG4gICAgICAgIGluZGV4T2YgPSBjYWNoZUluZGV4T2Y7XG4gICAgICAgIHNlZW4gPSBjYWNoZTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XSxcbiAgICAgICAgICAgIGNvbXB1dGVkID0gY2FsbGJhY2sgPyBjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGFycmF5KSA6IHZhbHVlO1xuXG4gICAgICAgIGlmIChpc1NvcnRlZFxuICAgICAgICAgICAgICA/ICFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IGNvbXB1dGVkXG4gICAgICAgICAgICAgIDogaW5kZXhPZihzZWVuLCBjb21wdXRlZCkgPCAwXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgaXNMYXJnZSkge1xuICAgICAgICAgICAgc2Vlbi5wdXNoKGNvbXB1dGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNMYXJnZSkge1xuICAgICAgICByZWxlYXNlQXJyYXkoc2Vlbi5hcnJheSk7XG4gICAgICAgIHJlbGVhc2VPYmplY3Qoc2Vlbik7XG4gICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHJlbGVhc2VBcnJheShzZWVuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgYWdncmVnYXRlcyBhIGNvbGxlY3Rpb24sIGNyZWF0aW5nIGFuIG9iamVjdCBjb21wb3NlZFxuICAgICAqIG9mIGtleXMgZ2VuZXJhdGVkIGZyb20gdGhlIHJlc3VsdHMgb2YgcnVubmluZyBlYWNoIGVsZW1lbnQgb2YgdGhlIGNvbGxlY3Rpb25cbiAgICAgKiB0aHJvdWdoIGEgY2FsbGJhY2suIFRoZSBnaXZlbiBgc2V0dGVyYCBmdW5jdGlvbiBzZXRzIHRoZSBrZXlzIGFuZCB2YWx1ZXNcbiAgICAgKiBvZiB0aGUgY29tcG9zZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzZXR0ZXIgVGhlIHNldHRlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBhZ2dyZWdhdG9yIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUFnZ3JlZ2F0b3Ioc2V0dGVyKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuXG4gICAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbGxlY3Rpb25baW5kZXhdO1xuICAgICAgICAgICAgc2V0dGVyKHJlc3VsdCwgdmFsdWUsIGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbiksIGNvbGxlY3Rpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgc2V0dGVyKHJlc3VsdCwgdmFsdWUsIGNhbGxiYWNrKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGVpdGhlciBjdXJyaWVzIG9yIGludm9rZXMgYGZ1bmNgXG4gICAgICogd2l0aCBhbiBvcHRpb25hbCBgdGhpc2AgYmluZGluZyBhbmQgcGFydGlhbGx5IGFwcGxpZWQgYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufHN0cmluZ30gZnVuYyBUaGUgZnVuY3Rpb24gb3IgbWV0aG9kIG5hbWUgdG8gcmVmZXJlbmNlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiaXRtYXNrIFRoZSBiaXRtYXNrIG9mIG1ldGhvZCBmbGFncyB0byBjb21wb3NlLlxuICAgICAqICBUaGUgYml0bWFzayBtYXkgYmUgY29tcG9zZWQgb2YgdGhlIGZvbGxvd2luZyBmbGFnczpcbiAgICAgKiAgMSAtIGBfLmJpbmRgXG4gICAgICogIDIgLSBgXy5iaW5kS2V5YFxuICAgICAqICA0IC0gYF8uY3VycnlgXG4gICAgICogIDggLSBgXy5jdXJyeWAgKGJvdW5kKVxuICAgICAqICAxNiAtIGBfLnBhcnRpYWxgXG4gICAgICogIDMyIC0gYF8ucGFydGlhbFJpZ2h0YFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtwYXJ0aWFsQXJnc10gQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIHByZXBlbmQgdG8gdGhvc2VcbiAgICAgKiAgcHJvdmlkZWQgdG8gdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbcGFydGlhbFJpZ2h0QXJnc10gQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGFwcGVuZCB0byB0aG9zZVxuICAgICAqICBwcm92aWRlZCB0byB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFthcml0eV0gVGhlIGFyaXR5IG9mIGBmdW5jYC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjcmVhdGVXcmFwcGVyKGZ1bmMsIGJpdG1hc2ssIHBhcnRpYWxBcmdzLCBwYXJ0aWFsUmlnaHRBcmdzLCB0aGlzQXJnLCBhcml0eSkge1xuICAgICAgdmFyIGlzQmluZCA9IGJpdG1hc2sgJiAxLFxuICAgICAgICAgIGlzQmluZEtleSA9IGJpdG1hc2sgJiAyLFxuICAgICAgICAgIGlzQ3VycnkgPSBiaXRtYXNrICYgNCxcbiAgICAgICAgICBpc0N1cnJ5Qm91bmQgPSBiaXRtYXNrICYgOCxcbiAgICAgICAgICBpc1BhcnRpYWwgPSBiaXRtYXNrICYgMTYsXG4gICAgICAgICAgaXNQYXJ0aWFsUmlnaHQgPSBiaXRtYXNrICYgMzI7XG5cbiAgICAgIGlmICghaXNCaW5kS2V5ICYmICFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB9XG4gICAgICBpZiAoaXNQYXJ0aWFsICYmICFwYXJ0aWFsQXJncy5sZW5ndGgpIHtcbiAgICAgICAgYml0bWFzayAmPSB+MTY7XG4gICAgICAgIGlzUGFydGlhbCA9IHBhcnRpYWxBcmdzID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaXNQYXJ0aWFsUmlnaHQgJiYgIXBhcnRpYWxSaWdodEFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGJpdG1hc2sgJj0gfjMyO1xuICAgICAgICBpc1BhcnRpYWxSaWdodCA9IHBhcnRpYWxSaWdodEFyZ3MgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciBiaW5kRGF0YSA9IGZ1bmMgJiYgZnVuYy5fX2JpbmREYXRhX187XG4gICAgICBpZiAoYmluZERhdGEgJiYgYmluZERhdGEgIT09IHRydWUpIHtcbiAgICAgICAgLy8gY2xvbmUgYGJpbmREYXRhYFxuICAgICAgICBiaW5kRGF0YSA9IHNsaWNlKGJpbmREYXRhKTtcbiAgICAgICAgaWYgKGJpbmREYXRhWzJdKSB7XG4gICAgICAgICAgYmluZERhdGFbMl0gPSBzbGljZShiaW5kRGF0YVsyXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJpbmREYXRhWzNdKSB7XG4gICAgICAgICAgYmluZERhdGFbM10gPSBzbGljZShiaW5kRGF0YVszXSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IGB0aGlzQmluZGluZ2AgaXMgbm90IHByZXZpb3VzbHkgYm91bmRcbiAgICAgICAgaWYgKGlzQmluZCAmJiAhKGJpbmREYXRhWzFdICYgMSkpIHtcbiAgICAgICAgICBiaW5kRGF0YVs0XSA9IHRoaXNBcmc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IGlmIHByZXZpb3VzbHkgYm91bmQgYnV0IG5vdCBjdXJyZW50bHkgKHN1YnNlcXVlbnQgY3VycmllZCBmdW5jdGlvbnMpXG4gICAgICAgIGlmICghaXNCaW5kICYmIGJpbmREYXRhWzFdICYgMSkge1xuICAgICAgICAgIGJpdG1hc2sgfD0gODtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgY3VycmllZCBhcml0eSBpZiBub3QgeWV0IHNldFxuICAgICAgICBpZiAoaXNDdXJyeSAmJiAhKGJpbmREYXRhWzFdICYgNCkpIHtcbiAgICAgICAgICBiaW5kRGF0YVs1XSA9IGFyaXR5O1xuICAgICAgICB9XG4gICAgICAgIC8vIGFwcGVuZCBwYXJ0aWFsIGxlZnQgYXJndW1lbnRzXG4gICAgICAgIGlmIChpc1BhcnRpYWwpIHtcbiAgICAgICAgICBwdXNoLmFwcGx5KGJpbmREYXRhWzJdIHx8IChiaW5kRGF0YVsyXSA9IFtdKSwgcGFydGlhbEFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFwcGVuZCBwYXJ0aWFsIHJpZ2h0IGFyZ3VtZW50c1xuICAgICAgICBpZiAoaXNQYXJ0aWFsUmlnaHQpIHtcbiAgICAgICAgICB1bnNoaWZ0LmFwcGx5KGJpbmREYXRhWzNdIHx8IChiaW5kRGF0YVszXSA9IFtdKSwgcGFydGlhbFJpZ2h0QXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbWVyZ2UgZmxhZ3NcbiAgICAgICAgYmluZERhdGFbMV0gfD0gYml0bWFzaztcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVdyYXBwZXIuYXBwbHkobnVsbCwgYmluZERhdGEpO1xuICAgICAgfVxuICAgICAgLy8gZmFzdCBwYXRoIGZvciBgXy5iaW5kYFxuICAgICAgdmFyIGNyZWF0ZXIgPSAoYml0bWFzayA9PSAxIHx8IGJpdG1hc2sgPT09IDE3KSA/IGJhc2VCaW5kIDogYmFzZUNyZWF0ZVdyYXBwZXI7XG4gICAgICByZXR1cm4gY3JlYXRlcihbZnVuYywgYml0bWFzaywgcGFydGlhbEFyZ3MsIHBhcnRpYWxSaWdodEFyZ3MsIHRoaXNBcmcsIGFyaXR5XSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlZCBieSBgZXNjYXBlYCB0byBjb252ZXJ0IGNoYXJhY3RlcnMgdG8gSFRNTCBlbnRpdGllcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXNjYXBlSHRtbENoYXIobWF0Y2gpIHtcbiAgICAgIHJldHVybiBodG1sRXNjYXBlc1ttYXRjaF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgYXBwcm9wcmlhdGUgXCJpbmRleE9mXCIgZnVuY3Rpb24uIElmIHRoZSBgXy5pbmRleE9mYCBtZXRob2QgaXNcbiAgICAgKiBjdXN0b21pemVkLCB0aGlzIG1ldGhvZCByZXR1cm5zIHRoZSBjdXN0b20gbWV0aG9kLCBvdGhlcndpc2UgaXQgcmV0dXJuc1xuICAgICAqIHRoZSBgYmFzZUluZGV4T2ZgIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIFwiaW5kZXhPZlwiIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldEluZGV4T2YoKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gKHJlc3VsdCA9IGxvZGFzaC5pbmRleE9mKSA9PT0gaW5kZXhPZiA/IGJhc2VJbmRleE9mIDogcmVzdWx0O1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiByZU5hdGl2ZS50ZXN0KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIGB0aGlzYCBiaW5kaW5nIGRhdGEgb24gYSBnaXZlbiBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gc2V0IGRhdGEgb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gdmFsdWUgVGhlIGRhdGEgYXJyYXkgdG8gc2V0LlxuICAgICAqL1xuICAgIHZhciBzZXRCaW5kRGF0YSA9ICFkZWZpbmVQcm9wZXJ0eSA/IG5vb3AgOiBmdW5jdGlvbihmdW5jLCB2YWx1ZSkge1xuICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IHZhbHVlO1xuICAgICAgZGVmaW5lUHJvcGVydHkoZnVuYywgJ19fYmluZERhdGFfXycsIGRlc2NyaXB0b3IpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBpc1BsYWluT2JqZWN0YCB3aGljaCBjaGVja3MgaWYgYSBnaXZlbiB2YWx1ZVxuICAgICAqIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3RvciwgYXNzdW1pbmcgb2JqZWN0cyBjcmVhdGVkXG4gICAgICogYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yIGhhdmUgbm8gaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcyBhbmQgdGhhdFxuICAgICAqIHRoZXJlIGFyZSBubyBgT2JqZWN0LnByb3RvdHlwZWAgZXh0ZW5zaW9ucy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaGltSXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICAgICAgdmFyIGN0b3IsXG4gICAgICAgICAgcmVzdWx0O1xuXG4gICAgICAvLyBhdm9pZCBub24gT2JqZWN0IG9iamVjdHMsIGBhcmd1bWVudHNgIG9iamVjdHMsIGFuZCBET00gZWxlbWVudHNcbiAgICAgIGlmICghKHZhbHVlICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdENsYXNzKSB8fFxuICAgICAgICAgIChjdG9yID0gdmFsdWUuY29uc3RydWN0b3IsIGlzRnVuY3Rpb24oY3RvcikgJiYgIShjdG9yIGluc3RhbmNlb2YgY3RvcikpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIEluIG1vc3QgZW52aXJvbm1lbnRzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzIGFyZSBpdGVyYXRlZCBiZWZvcmVcbiAgICAgIC8vIGl0cyBpbmhlcml0ZWQgcHJvcGVydGllcy4gSWYgdGhlIGxhc3QgaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3NcbiAgICAgIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgICAgZm9ySW4odmFsdWUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgcmVzdWx0ID0ga2V5O1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdHlwZW9mIHJlc3VsdCA9PSAndW5kZWZpbmVkJyB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZWQgYnkgYHVuZXNjYXBlYCB0byBjb252ZXJ0IEhUTUwgZW50aXRpZXMgdG8gY2hhcmFjdGVycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byB1bmVzY2FwZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSB1bmVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVuZXNjYXBlSHRtbENoYXIobWF0Y2gpIHtcbiAgICAgIHJldHVybiBodG1sVW5lc2NhcGVzW21hdGNoXTtcbiAgICB9XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIGBhcmd1bWVudHNgIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAoZnVuY3Rpb24oKSB7IHJldHVybiBfLmlzQXJndW1lbnRzKGFyZ3VtZW50cyk7IH0pKDEsIDIsIDMpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNBcmd1bWVudHMoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJnc0NsYXNzIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAoZnVuY3Rpb24oKSB7IHJldHVybiBfLmlzQXJyYXkoYXJndW1lbnRzKTsgfSkoKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBpc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgICAgIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MgfHwgZmFsc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBwcm9kdWNlcyBhbiBhcnJheSBvZiB0aGVcbiAgICAgKiBnaXZlbiBvYmplY3QncyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gICAgICovXG4gICAgdmFyIHNoaW1LZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBbXTtcbiAgICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZiAoIShvYmplY3RUeXBlc1t0eXBlb2Ygb2JqZWN0XSkpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChpdGVyYWJsZSwgaW5kZXgpKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChpbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGFuIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmtleXMoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gICAgICogLy8gPT4gWydvbmUnLCAndHdvJywgJ3RocmVlJ10gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICovXG4gICAgdmFyIGtleXMgPSAhbmF0aXZlS2V5cyA/IHNoaW1LZXlzIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjb252ZXJ0IGNoYXJhY3RlcnMgdG8gSFRNTCBlbnRpdGllczpcbiAgICAgKlxuICAgICAqIFRob3VnaCB0aGUgYD5gIGNoYXJhY3RlciBpcyBlc2NhcGVkIGZvciBzeW1tZXRyeSwgY2hhcmFjdGVycyBsaWtlIGA+YCBhbmQgYC9gXG4gICAgICogZG9uJ3QgcmVxdWlyZSBlc2NhcGluZyBpbiBIVE1MIGFuZCBoYXZlIG5vIHNwZWNpYWwgbWVhbmluZyB1bmxlc3MgdGhleSdyZSBwYXJ0XG4gICAgICogb2YgYSB0YWcgb3IgYW4gdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLlxuICAgICAqIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2FtYmlndW91cy1hbXBlcnNhbmRzICh1bmRlciBcInNlbWktcmVsYXRlZCBmdW4gZmFjdFwiKVxuICAgICAqL1xuICAgIHZhciBodG1sRXNjYXBlcyA9IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgIFwiJ1wiOiAnJiMzOTsnXG4gICAgfTtcblxuICAgIC8qKiBVc2VkIHRvIGNvbnZlcnQgSFRNTCBlbnRpdGllcyB0byBjaGFyYWN0ZXJzICovXG4gICAgdmFyIGh0bWxVbmVzY2FwZXMgPSBpbnZlcnQoaHRtbEVzY2FwZXMpO1xuXG4gICAgLyoqIFVzZWQgdG8gbWF0Y2ggSFRNTCBlbnRpdGllcyBhbmQgSFRNTCBjaGFyYWN0ZXJzICovXG4gICAgdmFyIHJlRXNjYXBlZEh0bWwgPSBSZWdFeHAoJygnICsga2V5cyhodG1sVW5lc2NhcGVzKS5qb2luKCd8JykgKyAnKScsICdnJyksXG4gICAgICAgIHJlVW5lc2NhcGVkSHRtbCA9IFJlZ0V4cCgnWycgKyBrZXlzKGh0bWxFc2NhcGVzKS5qb2luKCcnKSArICddJywgJ2cnKTtcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICogb2JqZWN0LiBTdWJzZXF1ZW50IHNvdXJjZXMgd2lsbCBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXNcbiAgICAgKiBzb3VyY2VzLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGVcbiAgICAgKiBhc3NpZ25lZCB2YWx1ZXMuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0d29cbiAgICAgKiBhcmd1bWVudHM7IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUpLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAYWxpYXMgZXh0ZW5kXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHsuLi5PYmplY3R9IFtzb3VyY2VdIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uYXNzaWduKHsgJ25hbWUnOiAnZnJlZCcgfSwgeyAnZW1wbG95ZXInOiAnc2xhdGUnIH0pO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcsICdlbXBsb3llcic6ICdzbGF0ZScgfVxuICAgICAqXG4gICAgICogdmFyIGRlZmF1bHRzID0gXy5wYXJ0aWFsUmlnaHQoXy5hc3NpZ24sIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgKiAgIHJldHVybiB0eXBlb2YgYSA9PSAndW5kZWZpbmVkJyA/IGIgOiBhO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnYmFybmV5JyB9O1xuICAgICAqIGRlZmF1bHRzKG9iamVjdCwgeyAnbmFtZSc6ICdmcmVkJywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9KTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2Jhcm5leScsICdlbXBsb3llcic6ICdzbGF0ZScgfVxuICAgICAqL1xuICAgIHZhciBhc3NpZ24gPSBmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgZ3VhcmQpIHtcbiAgICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICAgICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICAgIGFyZ3NJbmRleCA9IDAsXG4gICAgICAgICAgYXJnc0xlbmd0aCA9IHR5cGVvZiBndWFyZCA9PSAnbnVtYmVyJyA/IDIgOiBhcmdzLmxlbmd0aDtcbiAgICAgIGlmIChhcmdzTGVuZ3RoID4gMyAmJiB0eXBlb2YgYXJnc1thcmdzTGVuZ3RoIC0gMl0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBiYXNlQ3JlYXRlQ2FsbGJhY2soYXJnc1stLWFyZ3NMZW5ndGggLSAxXSwgYXJnc1thcmdzTGVuZ3RoLS1dLCAyKTtcbiAgICAgIH0gZWxzZSBpZiAoYXJnc0xlbmd0aCA+IDIgJiYgdHlwZW9mIGFyZ3NbYXJnc0xlbmd0aCAtIDFdID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBhcmdzWy0tYXJnc0xlbmd0aF07XG4gICAgICB9XG4gICAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICAgIGl0ZXJhYmxlID0gYXJnc1thcmdzSW5kZXhdO1xuICAgICAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkge1xuICAgICAgICB2YXIgb3duSW5kZXggPSAtMSxcbiAgICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgICB3aGlsZSAoKytvd25JbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICAgIHJlc3VsdFtpbmRleF0gPSBjYWxsYmFjayA/IGNhbGxiYWNrKHJlc3VsdFtpbmRleF0sIGl0ZXJhYmxlW2luZGV4XSkgOiBpdGVyYWJsZVtpbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY2xvbmUgb2YgYHZhbHVlYC4gSWYgYGlzRGVlcGAgaXMgYHRydWVgIG5lc3RlZCBvYmplY3RzIHdpbGwgYWxzb1xuICAgICAqIGJlIGNsb25lZCwgb3RoZXJ3aXNlIHRoZXkgd2lsbCBiZSBhc3NpZ25lZCBieSByZWZlcmVuY2UuIElmIGEgY2FsbGJhY2tcbiAgICAgKiBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkIHRvIHByb2R1Y2UgdGhlIGNsb25lZCB2YWx1ZXMuIElmIHRoZVxuICAgICAqIGNhbGxiYWNrIHJldHVybnMgYHVuZGVmaW5lZGAgY2xvbmluZyB3aWxsIGJlIGhhbmRsZWQgYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLlxuICAgICAqIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCBvbmUgYXJndW1lbnQ7ICh2YWx1ZSkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNsb25lLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcD1mYWxzZV0gU3BlY2lmeSBhIGRlZXAgY2xvbmUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNsb25pbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBjbG9uZWQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogdmFyIHNoYWxsb3cgPSBfLmNsb25lKGNoYXJhY3RlcnMpO1xuICAgICAqIHNoYWxsb3dbMF0gPT09IGNoYXJhY3RlcnNbMF07XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogdmFyIGRlZXAgPSBfLmNsb25lKGNoYXJhY3RlcnMsIHRydWUpO1xuICAgICAqIGRlZXBbMF0gPT09IGNoYXJhY3RlcnNbMF07XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8ubWl4aW4oe1xuICAgICAqICAgJ2Nsb25lJzogXy5wYXJ0aWFsUmlnaHQoXy5jbG9uZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgKiAgICAgcmV0dXJuIF8uaXNFbGVtZW50KHZhbHVlKSA/IHZhbHVlLmNsb25lTm9kZShmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgICogICB9KVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogdmFyIGNsb25lID0gXy5jbG9uZShkb2N1bWVudC5ib2R5KTtcbiAgICAgKiBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgKiAvLyA9PiAwXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2xvbmUodmFsdWUsIGlzRGVlcCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIC8vIGFsbG93cyB3b3JraW5nIHdpdGggXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMgd2l0aG91dCB1c2luZyB0aGVpciBgaW5kZXhgXG4gICAgICAvLyBhbmQgYGNvbGxlY3Rpb25gIGFyZ3VtZW50cyBmb3IgYGlzRGVlcGAgYW5kIGBjYWxsYmFja2BcbiAgICAgIGlmICh0eXBlb2YgaXNEZWVwICE9ICdib29sZWFuJyAmJiBpc0RlZXAgIT0gbnVsbCkge1xuICAgICAgICB0aGlzQXJnID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gaXNEZWVwO1xuICAgICAgICBpc0RlZXAgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBiYXNlQ2xvbmUodmFsdWUsIGlzRGVlcCwgdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGRlZXAgY2xvbmUgb2YgYHZhbHVlYC4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlXG4gICAgICogZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGUgY2xvbmVkIHZhbHVlcy4gSWYgdGhlIGNhbGxiYWNrIHJldHVybnMgYHVuZGVmaW5lZGBcbiAgICAgKiBjbG9uaW5nIHdpbGwgYmUgaGFuZGxlZCBieSB0aGUgbWV0aG9kIGluc3RlYWQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0b1xuICAgICAqIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIG9uZSBhcmd1bWVudDsgKHZhbHVlKS5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgbWV0aG9kIGlzIGxvb3NlbHkgYmFzZWQgb24gdGhlIHN0cnVjdHVyZWQgY2xvbmUgYWxnb3JpdGhtLiBGdW5jdGlvbnNcbiAgICAgKiBhbmQgRE9NIG5vZGVzIGFyZSAqKm5vdCoqIGNsb25lZC4gVGhlIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBgYXJndW1lbnRzYCBvYmplY3RzIGFuZFxuICAgICAqIG9iamVjdHMgY3JlYXRlZCBieSBjb25zdHJ1Y3RvcnMgb3RoZXIgdGhhbiBgT2JqZWN0YCBhcmUgY2xvbmVkIHRvIHBsYWluIGBPYmplY3RgIG9iamVjdHMuXG4gICAgICogU2VlIGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2luZnJhc3RydWN0dXJlLmh0bWwjaW50ZXJuYWwtc3RydWN0dXJlZC1jbG9uaW5nLWFsZ29yaXRobS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gZGVlcCBjbG9uZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY2xvbmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGRlZXAgY2xvbmVkIHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIHZhciBkZWVwID0gXy5jbG9uZURlZXAoY2hhcmFjdGVycyk7XG4gICAgICogZGVlcFswXSA9PT0gY2hhcmFjdGVyc1swXTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogdmFyIHZpZXcgPSB7XG4gICAgICogICAnbGFiZWwnOiAnZG9jcycsXG4gICAgICogICAnbm9kZSc6IGVsZW1lbnRcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIGNsb25lID0gXy5jbG9uZURlZXAodmlldywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgKiAgIHJldHVybiBfLmlzRWxlbWVudCh2YWx1ZSkgPyB2YWx1ZS5jbG9uZU5vZGUodHJ1ZSkgOiB1bmRlZmluZWQ7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBjbG9uZS5ub2RlID09IHZpZXcubm9kZTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNsb25lRGVlcCh2YWx1ZSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiBiYXNlQ2xvbmUodmFsdWUsIHRydWUsIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICYmIGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gb2JqZWN0IHRoYXQgaW5oZXJpdHMgZnJvbSB0aGUgZ2l2ZW4gYHByb3RvdHlwZWAgb2JqZWN0LiBJZiBhXG4gICAgICogYHByb3BlcnRpZXNgIG9iamVjdCBpcyBwcm92aWRlZCBpdHMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBhcmUgYXNzaWduZWRcbiAgICAgKiB0byB0aGUgY3JlYXRlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b3R5cGUgVGhlIG9iamVjdCB0byBpbmhlcml0IGZyb20uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzXSBUaGUgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBmdW5jdGlvbiBTaGFwZSgpIHtcbiAgICAgKiAgIHRoaXMueCA9IDA7XG4gICAgICogICB0aGlzLnkgPSAwO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIGZ1bmN0aW9uIENpcmNsZSgpIHtcbiAgICAgKiAgIFNoYXBlLmNhbGwodGhpcyk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogQ2lyY2xlLnByb3RvdHlwZSA9IF8uY3JlYXRlKFNoYXBlLnByb3RvdHlwZSwgeyAnY29uc3RydWN0b3InOiBDaXJjbGUgfSk7XG4gICAgICpcbiAgICAgKiB2YXIgY2lyY2xlID0gbmV3IENpcmNsZTtcbiAgICAgKiBjaXJjbGUgaW5zdGFuY2VvZiBDaXJjbGU7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogY2lyY2xlIGluc3RhbmNlb2YgU2hhcGU7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZShwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAgIHZhciByZXN1bHQgPSBiYXNlQ3JlYXRlKHByb3RvdHlwZSk7XG4gICAgICByZXR1cm4gcHJvcGVydGllcyA/IGFzc2lnbihyZXN1bHQsIHByb3BlcnRpZXMpIDogcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzc2lnbnMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBzb3VyY2Ugb2JqZWN0KHMpIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAqIG9iamVjdCBmb3IgYWxsIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMgdGhhdCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLiBPbmNlIGFcbiAgICAgKiBwcm9wZXJ0eSBpcyBzZXQsIGFkZGl0aW9uYWwgZGVmYXVsdHMgb2YgdGhlIHNhbWUgcHJvcGVydHkgd2lsbCBiZSBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICAgICAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBBbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgd2l0aG91dCB1c2luZyBpdHNcbiAgICAgKiAgYGtleWAgYW5kIGBvYmplY3RgIGFyZ3VtZW50cyBhcyBzb3VyY2VzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnYmFybmV5JyB9O1xuICAgICAqIF8uZGVmYXVsdHMob2JqZWN0LCB7ICduYW1lJzogJ2ZyZWQnLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0pO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XG4gICAgICovXG4gICAgdmFyIGRlZmF1bHRzID0gZnVuY3Rpb24ob2JqZWN0LCBzb3VyY2UsIGd1YXJkKSB7XG4gICAgICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICBhcmdzSW5kZXggPSAwLFxuICAgICAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gICAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICAgIGl0ZXJhYmxlID0gYXJnc1thcmdzSW5kZXhdO1xuICAgICAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkge1xuICAgICAgICB2YXIgb3duSW5kZXggPSAtMSxcbiAgICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgICB3aGlsZSAoKytvd25JbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2luZGV4XSA9PSAndW5kZWZpbmVkJykgcmVzdWx0W2luZGV4XSA9IGl0ZXJhYmxlW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZmluZEluZGV4YCBleGNlcHQgdGhhdCBpdCByZXR1cm5zIHRoZSBrZXkgb2YgdGhlXG4gICAgICogZmlyc3QgZWxlbWVudCB0aGF0IHBhc3NlcyB0aGUgY2FsbGJhY2sgY2hlY2ssIGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgaXRzZWxmLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBzZWFyY2guXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyXG4gICAgICogIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWQgdG9cbiAgICAgKiAgY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gUmV0dXJucyB0aGUga2V5IG9mIHRoZSBmb3VuZCBlbGVtZW50LCBlbHNlIGB1bmRlZmluZWRgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IHtcbiAgICAgKiAgICdiYXJuZXknOiB7ICAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfSxcbiAgICAgKiAgICdmcmVkJzogeyAgICAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9LFxuICAgICAqICAgJ3BlYmJsZXMnOiB7ICdhZ2UnOiAxLCAgJ2Jsb2NrZWQnOiBmYWxzZSB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uZmluZEtleShjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHtcbiAgICAgKiAgIHJldHVybiBjaHIuYWdlIDwgNDA7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gJ2Jhcm5leScgKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpbmRLZXkoY2hhcmFjdGVycywgeyAnYWdlJzogMSB9KTtcbiAgICAgKiAvLyA9PiAncGViYmxlcydcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZEtleShjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+ICdmcmVkJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRLZXkob2JqZWN0LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIGZvck93bihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGtleSwgb2JqZWN0KSkge1xuICAgICAgICAgIHJlc3VsdCA9IGtleTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmZpbmRLZXlgIGV4Y2VwdCB0aGF0IGl0IGl0ZXJhdGVzIG92ZXIgZWxlbWVudHNcbiAgICAgKiBvZiBhIGBjb2xsZWN0aW9uYCBpbiB0aGUgb3Bwb3NpdGUgb3JkZXIuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXJcbiAgICAgKiAgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0b1xuICAgICAqICBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBSZXR1cm5zIHRoZSBrZXkgb2YgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYHVuZGVmaW5lZGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0ge1xuICAgICAqICAgJ2Jhcm5leSc6IHsgICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiB0cnVlIH0sXG4gICAgICogICAnZnJlZCc6IHsgICAgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICAncGViYmxlcyc6IHsgJ2FnZSc6IDEsICAnYmxvY2tlZCc6IHRydWUgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiBfLmZpbmRMYXN0S2V5KGNoYXJhY3RlcnMsIGZ1bmN0aW9uKGNocikge1xuICAgICAqICAgcmV0dXJuIGNoci5hZ2UgPCA0MDtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiByZXR1cm5zIGBwZWJibGVzYCwgYXNzdW1pbmcgYF8uZmluZEtleWAgcmV0dXJucyBgYmFybmV5YFxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kTGFzdEtleShjaGFyYWN0ZXJzLCB7ICdhZ2UnOiA0MCB9KTtcbiAgICAgKiAvLyA9PiAnZnJlZCdcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZExhc3RLZXkoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiAncGViYmxlcydcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaW5kTGFzdEtleShvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgZm9yT3duUmlnaHQob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBrZXksIG9iamVjdCkpIHtcbiAgICAgICAgICByZXN1bHQgPSBrZXk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0LFxuICAgICAqIGV4ZWN1dGluZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggcHJvcGVydHkuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2BcbiAgICAgKiBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBrZXksIG9iamVjdCkuIENhbGxiYWNrcyBtYXkgZXhpdFxuICAgICAqIGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gU2hhcGUoKSB7XG4gICAgICogICB0aGlzLnggPSAwO1xuICAgICAqICAgdGhpcy55ID0gMDtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBTaGFwZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgKiAgIHRoaXMueCArPSB4O1xuICAgICAqICAgdGhpcy55ICs9IHk7XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uZm9ySW4obmV3IFNoYXBlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICogICBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IGxvZ3MgJ3gnLCAneScsIGFuZCAnbW92ZScgKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICovXG4gICAgdmFyIGZvckluID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBjb2xsZWN0aW9uLCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gICAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICBmb3IgKGluZGV4IGluIGl0ZXJhYmxlKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKGl0ZXJhYmxlW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pID09PSBmYWxzZSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmZvckluYCBleGNlcHQgdGhhdCBpdCBpdGVyYXRlcyBvdmVyIGVsZW1lbnRzXG4gICAgICogb2YgYSBgY29sbGVjdGlvbmAgaW4gdGhlIG9wcG9zaXRlIG9yZGVyLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIGZ1bmN0aW9uIFNoYXBlKCkge1xuICAgICAqICAgdGhpcy54ID0gMDtcbiAgICAgKiAgIHRoaXMueSA9IDA7XG4gICAgICogfVxuICAgICAqXG4gICAgICogU2hhcGUucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgICogICB0aGlzLnggKz0geDtcbiAgICAgKiAgIHRoaXMueSArPSB5O1xuICAgICAqIH07XG4gICAgICpcbiAgICAgKiBfLmZvckluUmlnaHQobmV3IFNoYXBlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICogICBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IGxvZ3MgJ21vdmUnLCAneScsIGFuZCAneCcgYXNzdW1pbmcgYF8uZm9ySW4gYCBsb2dzICd4JywgJ3knLCBhbmQgJ21vdmUnXG4gICAgICovXG4gICAgZnVuY3Rpb24gZm9ySW5SaWdodChvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcGFpcnMgPSBbXTtcblxuICAgICAgZm9ySW4ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHBhaXJzLnB1c2goa2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGxlbmd0aCA9IHBhaXJzLmxlbmd0aDtcbiAgICAgIGNhbGxiYWNrID0gYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBpZiAoY2FsbGJhY2socGFpcnNbbGVuZ3RoLS1dLCBwYWlyc1tsZW5ndGhdLCBvYmplY3QpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGVzIG92ZXIgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBhbiBvYmplY3QsIGV4ZWN1dGluZyB0aGUgY2FsbGJhY2tcbiAgICAgKiBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlXG4gICAgICogYXJndW1lbnRzOyAodmFsdWUsIGtleSwgb2JqZWN0KS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieVxuICAgICAqIGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmZvck93bih7ICcwJzogJ3plcm8nLCAnMSc6ICdvbmUnLCAnbGVuZ3RoJzogMiB9LCBmdW5jdGlvbihudW0sIGtleSkge1xuICAgICAqICAgY29uc29sZS5sb2coa2V5KTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBsb2dzICcwJywgJzEnLCBhbmQgJ2xlbmd0aCcgKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICovXG4gICAgdmFyIGZvck93biA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gY29sbGVjdGlvbiwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYgKCFvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSByZXR1cm4gcmVzdWx0O1xuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayAmJiB0eXBlb2YgdGhpc0FyZyA9PSAndW5kZWZpbmVkJyA/IGNhbGxiYWNrIDogYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgICAgICBvd25Qcm9wcyA9IG9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0gJiYga2V5cyhpdGVyYWJsZSksXG4gICAgICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpbmRleCA9IG93blByb3BzW293bkluZGV4XTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2soaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZm9yT3duYCBleGNlcHQgdGhhdCBpdCBpdGVyYXRlcyBvdmVyIGVsZW1lbnRzXG4gICAgICogb2YgYSBgY29sbGVjdGlvbmAgaW4gdGhlIG9wcG9zaXRlIG9yZGVyLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZm9yT3duUmlnaHQoeyAnMCc6ICd6ZXJvJywgJzEnOiAnb25lJywgJ2xlbmd0aCc6IDIgfSwgZnVuY3Rpb24obnVtLCBrZXkpIHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gbG9ncyAnbGVuZ3RoJywgJzEnLCBhbmQgJzAnIGFzc3VtaW5nIGBfLmZvck93bmAgbG9ncyAnMCcsICcxJywgYW5kICdsZW5ndGgnXG4gICAgICovXG4gICAgZnVuY3Rpb24gZm9yT3duUmlnaHQob2JqZWN0LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICAgICAgY2FsbGJhY2sgPSBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIHZhciBrZXkgPSBwcm9wc1tsZW5ndGhdO1xuICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0W2tleV0sIGtleSwgb2JqZWN0KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc29ydGVkIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIG9mIGFsbCBlbnVtZXJhYmxlIHByb3BlcnRpZXMsXG4gICAgICogb3duIGFuZCBpbmhlcml0ZWQsIG9mIGBvYmplY3RgIHRoYXQgaGF2ZSBmdW5jdGlvbiB2YWx1ZXMuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgbWV0aG9kc1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIHRoYXQgaGF2ZSBmdW5jdGlvbiB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZnVuY3Rpb25zKF8pO1xuICAgICAqIC8vID0+IFsnYWxsJywgJ2FueScsICdiaW5kJywgJ2JpbmRBbGwnLCAnY2xvbmUnLCAnY29tcGFjdCcsICdjb21wb3NlJywgLi4uXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZ1bmN0aW9ucyhvYmplY3QpIHtcbiAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgIGZvckluKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQuc29ydCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgc3BlY2lmaWVkIHByb3BlcnR5IG5hbWUgZXhpc3RzIGFzIGEgZGlyZWN0IHByb3BlcnR5IG9mIGBvYmplY3RgLFxuICAgICAqIGluc3RlYWQgb2YgYW4gaW5oZXJpdGVkIHByb3BlcnR5LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYga2V5IGlzIGEgZGlyZWN0IHByb3BlcnR5LCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaGFzKHsgJ2EnOiAxLCAnYic6IDIsICdjJzogMyB9LCAnYicpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXMob2JqZWN0LCBrZXkpIHtcbiAgICAgIHJldHVybiBvYmplY3QgPyBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSA6IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBpbnZlcnRlZCBrZXlzIGFuZCB2YWx1ZXMgb2YgdGhlIGdpdmVuIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGludmVydC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBjcmVhdGVkIGludmVydGVkIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pbnZlcnQoeyAnZmlyc3QnOiAnZnJlZCcsICdzZWNvbmQnOiAnYmFybmV5JyB9KTtcbiAgICAgKiAvLyA9PiB7ICdmcmVkJzogJ2ZpcnN0JywgJ2Jhcm5leSc6ICdzZWNvbmQnIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbnZlcnQob2JqZWN0KSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBwcm9wcyA9IGtleXMob2JqZWN0KSxcbiAgICAgICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICAgIHJlc3VsdFtvYmplY3Rba2V5XV0gPSBrZXk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgYm9vbGVhbiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgYm9vbGVhbiB2YWx1ZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzQm9vbGVhbihudWxsKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzQm9vbGVhbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZSB8fFxuICAgICAgICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYm9vbENsYXNzIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZGF0ZS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgZGF0ZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzRGF0ZShuZXcgRGF0ZSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRGF0ZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBkYXRlQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBET00gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgRE9NIGVsZW1lbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc0VsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRWxlbWVudCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLm5vZGVUeXBlID09PSAxIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGVtcHR5LiBBcnJheXMsIHN0cmluZ3MsIG9yIGBhcmd1bWVudHNgIG9iamVjdHMgd2l0aCBhXG4gICAgICogbGVuZ3RoIG9mIGAwYCBhbmQgb2JqZWN0cyB3aXRoIG5vIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgYXJlIGNvbnNpZGVyZWRcbiAgICAgKiBcImVtcHR5XCIuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGVtcHR5LCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNFbXB0eShbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzRW1wdHkoe30pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNFbXB0eSgnJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwodmFsdWUpLFxuICAgICAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcblxuICAgICAgaWYgKChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcyB8fCBjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MgfHwgY2xhc3NOYW1lID09IGFyZ3NDbGFzcyApIHx8XG4gICAgICAgICAgKGNsYXNzTmFtZSA9PSBvYmplY3RDbGFzcyAmJiB0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInICYmIGlzRnVuY3Rpb24odmFsdWUuc3BsaWNlKSkpIHtcbiAgICAgICAgcmV0dXJuICFsZW5ndGg7XG4gICAgICB9XG4gICAgICBmb3JPd24odmFsdWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKHJlc3VsdCA9IGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB2YWx1ZXMgdG8gZGV0ZXJtaW5lIGlmIHRoZXkgYXJlXG4gICAgICogZXF1aXZhbGVudCB0byBlYWNoIG90aGVyLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWRcbiAgICAgKiB0byBjb21wYXJlIHZhbHVlcy4gSWYgdGhlIGNhbGxiYWNrIHJldHVybnMgYHVuZGVmaW5lZGAgY29tcGFyaXNvbnMgd2lsbFxuICAgICAqIGJlIGhhbmRsZWQgYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgICAqIGludm9rZWQgd2l0aCB0d28gYXJndW1lbnRzOyAoYSwgYikuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gYSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAgICAgKiBAcGFyYW0geyp9IGIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnZnJlZCcgfTtcbiAgICAgKiB2YXIgY29weSA9IHsgJ25hbWUnOiAnZnJlZCcgfTtcbiAgICAgKlxuICAgICAqIG9iamVjdCA9PSBjb3B5O1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzRXF1YWwob2JqZWN0LCBjb3B5KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiB2YXIgd29yZHMgPSBbJ2hlbGxvJywgJ2dvb2RieWUnXTtcbiAgICAgKiB2YXIgb3RoZXJXb3JkcyA9IFsnaGknLCAnZ29vZGJ5ZSddO1xuICAgICAqXG4gICAgICogXy5pc0VxdWFsKHdvcmRzLCBvdGhlcldvcmRzLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICogICB2YXIgcmVHcmVldCA9IC9eKD86aGVsbG98aGkpJC9pLFxuICAgICAqICAgICAgIGFHcmVldCA9IF8uaXNTdHJpbmcoYSkgJiYgcmVHcmVldC50ZXN0KGEpLFxuICAgICAqICAgICAgIGJHcmVldCA9IF8uaXNTdHJpbmcoYikgJiYgcmVHcmVldC50ZXN0KGIpO1xuICAgICAqXG4gICAgICogICByZXR1cm4gKGFHcmVldCB8fCBiR3JlZXQpID8gKGFHcmVldCA9PSBiR3JlZXQpIDogdW5kZWZpbmVkO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0VxdWFsKGEsIGIsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gYmFzZUlzRXF1YWwoYSwgYiwgdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAyKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMsIG9yIGNhbiBiZSBjb2VyY2VkIHRvLCBhIGZpbml0ZSBudW1iZXIuXG4gICAgICpcbiAgICAgKiBOb3RlOiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBuYXRpdmUgYGlzRmluaXRlYCB3aGljaCB3aWxsIHJldHVybiB0cnVlIGZvclxuICAgICAqIGJvb2xlYW5zIGFuZCBlbXB0eSBzdHJpbmdzLiBTZWUgaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4xLjIuNS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGZpbml0ZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzRmluaXRlKC0xMDEpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNGaW5pdGUoJzEwJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0Zpbml0ZSh0cnVlKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc0Zpbml0ZSgnJyk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uaXNGaW5pdGUoSW5maW5pdHkpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNGaW5pdGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBuYXRpdmVJc0Zpbml0ZSh2YWx1ZSkgJiYgIW5hdGl2ZUlzTmFOKHBhcnNlRmxvYXQodmFsdWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzRnVuY3Rpb24oXyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gICAgICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc09iamVjdCh7fSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNPYmplY3QoMSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgICAgLy8gY2hlY2sgaWYgdGhlIHZhbHVlIGlzIHRoZSBFQ01BU2NyaXB0IGxhbmd1YWdlIHR5cGUgb2YgT2JqZWN0XG4gICAgICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDhcbiAgICAgIC8vIGFuZCBhdm9pZCBhIFY4IGJ1Z1xuICAgICAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MVxuICAgICAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGBOYU5gLlxuICAgICAqXG4gICAgICogTm90ZTogVGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgbmF0aXZlIGBpc05hTmAgd2hpY2ggd2lsbCByZXR1cm4gYHRydWVgIGZvclxuICAgICAqIGB1bmRlZmluZWRgIGFuZCBvdGhlciBub24tbnVtZXJpYyB2YWx1ZXMuIFNlZSBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEuMi40LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYE5hTmAsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc05hTihOYU4pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNOYU4obmV3IE51bWJlcihOYU4pKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBpc05hTih1bmRlZmluZWQpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uaXNOYU4odW5kZWZpbmVkKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzTmFOKHZhbHVlKSB7XG4gICAgICAvLyBgTmFOYCBhcyBhIHByaW1pdGl2ZSBpcyB0aGUgb25seSB2YWx1ZSB0aGF0IGlzIG5vdCBlcXVhbCB0byBpdHNlbGZcbiAgICAgIC8vIChwZXJmb3JtIHRoZSBbW0NsYXNzXV0gY2hlY2sgZmlyc3QgdG8gYXZvaWQgZXJyb3JzIHdpdGggc29tZSBob3N0IG9iamVjdHMgaW4gSUUpXG4gICAgICByZXR1cm4gaXNOdW1iZXIodmFsdWUpICYmIHZhbHVlICE9ICt2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBgbnVsbGAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBgbnVsbGAsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc051bGwobnVsbCk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc051bGwodW5kZWZpbmVkKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzTnVsbCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbnVtYmVyLlxuICAgICAqXG4gICAgICogTm90ZTogYE5hTmAgaXMgY29uc2lkZXJlZCBhIG51bWJlci4gU2VlIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4OC41LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBudW1iZXIsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc051bWJlcig4LjQgKiA1KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOdW1iZXIodmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHxcbiAgICAgICAgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IG51bWJlckNsYXNzIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gU2hhcGUoKSB7XG4gICAgICogICB0aGlzLnggPSAwO1xuICAgICAqICAgdGhpcy55ID0gMDtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBfLmlzUGxhaW5PYmplY3QobmV3IFNoYXBlKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc1BsYWluT2JqZWN0KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uaXNQbGFpbk9iamVjdCh7ICd4JzogMCwgJ3knOiAwIH0pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgaXNQbGFpbk9iamVjdCA9ICFnZXRQcm90b3R5cGVPZiA/IHNoaW1Jc1BsYWluT2JqZWN0IDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICghKHZhbHVlICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdENsYXNzKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YsXG4gICAgICAgICAgb2JqUHJvdG8gPSBpc05hdGl2ZSh2YWx1ZU9mKSAmJiAob2JqUHJvdG8gPSBnZXRQcm90b3R5cGVPZih2YWx1ZU9mKSkgJiYgZ2V0UHJvdG90eXBlT2Yob2JqUHJvdG8pO1xuXG4gICAgICByZXR1cm4gb2JqUHJvdG9cbiAgICAgICAgPyAodmFsdWUgPT0gb2JqUHJvdG8gfHwgZ2V0UHJvdG90eXBlT2YodmFsdWUpID09IG9ialByb3RvKVxuICAgICAgICA6IHNoaW1Jc1BsYWluT2JqZWN0KHZhbHVlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzUmVnRXhwKC9mcmVkLyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzUmVnRXhwKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IHJlZ2V4cENsYXNzIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgc3RyaW5nLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBzdHJpbmcsIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc1N0cmluZygnZnJlZCcpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fFxuICAgICAgICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3RyaW5nQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYHVuZGVmaW5lZGAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBgdW5kZWZpbmVkYCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzVW5kZWZpbmVkKHZvaWQgMCk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzVW5kZWZpbmVkKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gb2JqZWN0IHdpdGggdGhlIHNhbWUga2V5cyBhcyBgb2JqZWN0YCBhbmQgdmFsdWVzIGdlbmVyYXRlZCBieVxuICAgICAqIHJ1bm5pbmcgZWFjaCBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBvZiBgb2JqZWN0YCB0aHJvdWdoIHRoZSBjYWxsYmFjay5cbiAgICAgKiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzO1xuICAgICAqICh2YWx1ZSwga2V5LCBvYmplY3QpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgb2JqZWN0IHdpdGggdmFsdWVzIG9mIHRoZSByZXN1bHRzIG9mIGVhY2ggYGNhbGxiYWNrYCBleGVjdXRpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ubWFwVmFsdWVzKHsgJ2EnOiAxLCAnYic6IDIsICdjJzogM30gLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIG51bSAqIDM7IH0pO1xuICAgICAqIC8vID0+IHsgJ2EnOiAzLCAnYic6IDYsICdjJzogOSB9XG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IHtcbiAgICAgKiAgICdmcmVkJzogeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH0sXG4gICAgICogICAncGViYmxlcyc6IHsgJ25hbWUnOiAncGViYmxlcycsICdhZ2UnOiAxIH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5tYXBWYWx1ZXMoY2hhcmFjdGVycywgJ2FnZScpO1xuICAgICAqIC8vID0+IHsgJ2ZyZWQnOiA0MCwgJ3BlYmJsZXMnOiAxIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYXBWYWx1ZXMob2JqZWN0LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuXG4gICAgICBmb3JPd24ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBjYWxsYmFjayh2YWx1ZSwga2V5LCBvYmplY3QpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY3Vyc2l2ZWx5IG1lcmdlcyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoZSBzb3VyY2Ugb2JqZWN0KHMpLCB0aGF0XG4gICAgICogZG9uJ3QgcmVzb2x2ZSB0byBgdW5kZWZpbmVkYCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlc1xuICAgICAqIHdpbGwgb3ZlcndyaXRlIHByb3BlcnR5IGFzc2lnbm1lbnRzIG9mIHByZXZpb3VzIHNvdXJjZXMuIElmIGEgY2FsbGJhY2sgaXNcbiAgICAgKiBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkIHRvIHByb2R1Y2UgdGhlIG1lcmdlZCB2YWx1ZXMgb2YgdGhlIGRlc3RpbmF0aW9uXG4gICAgICogYW5kIHNvdXJjZSBwcm9wZXJ0aWVzLiBJZiB0aGUgY2FsbGJhY2sgcmV0dXJucyBgdW5kZWZpbmVkYCBtZXJnaW5nIHdpbGxcbiAgICAgKiBiZSBoYW5kbGVkIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmRcbiAgICAgKiBpbnZva2VkIHdpdGggdHdvIGFyZ3VtZW50czsgKG9iamVjdFZhbHVlLCBzb3VyY2VWYWx1ZSkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBtZXJnaW5nIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgbmFtZXMgPSB7XG4gICAgICogICAnY2hhcmFjdGVycyc6IFtcbiAgICAgKiAgICAgeyAnbmFtZSc6ICdiYXJuZXknIH0sXG4gICAgICogICAgIHsgJ25hbWUnOiAnZnJlZCcgfVxuICAgICAqICAgXVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgYWdlcyA9IHtcbiAgICAgKiAgICdjaGFyYWN0ZXJzJzogW1xuICAgICAqICAgICB7ICdhZ2UnOiAzNiB9LFxuICAgICAqICAgICB7ICdhZ2UnOiA0MCB9XG4gICAgICogICBdXG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8ubWVyZ2UobmFtZXMsIGFnZXMpO1xuICAgICAqIC8vID0+IHsgJ2NoYXJhY3RlcnMnOiBbeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSwgeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH1dIH1cbiAgICAgKlxuICAgICAqIHZhciBmb29kID0ge1xuICAgICAqICAgJ2ZydWl0cyc6IFsnYXBwbGUnXSxcbiAgICAgKiAgICd2ZWdldGFibGVzJzogWydiZWV0J11cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIG90aGVyRm9vZCA9IHtcbiAgICAgKiAgICdmcnVpdHMnOiBbJ2JhbmFuYSddLFxuICAgICAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2NhcnJvdCddXG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8ubWVyZ2UoZm9vZCwgb3RoZXJGb29kLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICogICByZXR1cm4gXy5pc0FycmF5KGEpID8gYS5jb25jYXQoYikgOiB1bmRlZmluZWQ7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4geyAnZnJ1aXRzJzogWydhcHBsZScsICdiYW5hbmEnXSwgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnLCAnY2Fycm90XSB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0KSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICBsZW5ndGggPSAyO1xuXG4gICAgICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cbiAgICAgIC8vIGFsbG93cyB3b3JraW5nIHdpdGggYF8ucmVkdWNlYCBhbmQgYF8ucmVkdWNlUmlnaHRgIHdpdGhvdXQgdXNpbmdcbiAgICAgIC8vIHRoZWlyIGBpbmRleGAgYW5kIGBjb2xsZWN0aW9uYCBhcmd1bWVudHNcbiAgICAgIGlmICh0eXBlb2YgYXJnc1syXSAhPSAnbnVtYmVyJykge1xuICAgICAgICBsZW5ndGggPSBhcmdzLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChsZW5ndGggPiAzICYmIHR5cGVvZiBhcmdzW2xlbmd0aCAtIDJdID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYmFzZUNyZWF0ZUNhbGxiYWNrKGFyZ3NbLS1sZW5ndGggLSAxXSwgYXJnc1tsZW5ndGgtLV0sIDIpO1xuICAgICAgfSBlbHNlIGlmIChsZW5ndGggPiAyICYmIHR5cGVvZiBhcmdzW2xlbmd0aCAtIDFdID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBhcmdzWy0tbGVuZ3RoXTtcbiAgICAgIH1cbiAgICAgIHZhciBzb3VyY2VzID0gc2xpY2UoYXJndW1lbnRzLCAxLCBsZW5ndGgpLFxuICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgc3RhY2tBID0gZ2V0QXJyYXkoKSxcbiAgICAgICAgICBzdGFja0IgPSBnZXRBcnJheSgpO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBiYXNlTWVyZ2Uob2JqZWN0LCBzb3VyY2VzW2luZGV4XSwgY2FsbGJhY2ssIHN0YWNrQSwgc3RhY2tCKTtcbiAgICAgIH1cbiAgICAgIHJlbGVhc2VBcnJheShzdGFja0EpO1xuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQik7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzaGFsbG93IGNsb25lIG9mIGBvYmplY3RgIGV4Y2x1ZGluZyB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMuXG4gICAgICogUHJvcGVydHkgbmFtZXMgbWF5IGJlIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIGFyZ3VtZW50cyBvciBhcyBhcnJheXMgb2ZcbiAgICAgKiBwcm9wZXJ0eSBuYW1lcy4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkIGZvciBlYWNoXG4gICAgICogcHJvcGVydHkgb2YgYG9iamVjdGAgb21pdHRpbmcgdGhlIHByb3BlcnRpZXMgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZXlcbiAgICAgKiBmb3IuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gICAgICogKHZhbHVlLCBrZXksIG9iamVjdCkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnwuLi5zdHJpbmd8c3RyaW5nW119IFtjYWxsYmFja10gVGhlIHByb3BlcnRpZXMgdG8gb21pdCBvciB0aGVcbiAgICAgKiAgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aG91dCB0aGUgb21pdHRlZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLm9taXQoeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH0sICdhZ2UnKTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2ZyZWQnIH1cbiAgICAgKlxuICAgICAqIF8ub21pdCh7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgKiAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcic7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJyB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gb21pdChvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIHByb3BzID0gW107XG4gICAgICAgIGZvckluKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgIHByb3BzLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHByb3BzID0gYmFzZURpZmZlcmVuY2UocHJvcHMsIGJhc2VGbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgZmFsc2UsIDEpKTtcblxuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICBmb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgICAgIGlmICghY2FsbGJhY2sodmFsdWUsIGtleSwgb2JqZWN0KSkge1xuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgdHdvIGRpbWVuc2lvbmFsIGFycmF5IG9mIGFuIG9iamVjdCdzIGtleS12YWx1ZSBwYWlycyxcbiAgICAgKiBpLmUuIGBbW2tleTEsIHZhbHVlMV0sIFtrZXkyLCB2YWx1ZTJdXWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBuZXcgYXJyYXkgb2Yga2V5LXZhbHVlIHBhaXJzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnBhaXJzKHsgJ2Jhcm5leSc6IDM2LCAnZnJlZCc6IDQwIH0pO1xuICAgICAqIC8vID0+IFtbJ2Jhcm5leScsIDM2XSwgWydmcmVkJywgNDBdXSAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwYWlycyhvYmplY3QpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIHByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gW2tleSwgb2JqZWN0W2tleV1dO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2hhbGxvdyBjbG9uZSBvZiBgb2JqZWN0YCBjb21wb3NlZCBvZiB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMuXG4gICAgICogUHJvcGVydHkgbmFtZXMgbWF5IGJlIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIGFyZ3VtZW50cyBvciBhcyBhcnJheXMgb2ZcbiAgICAgKiBwcm9wZXJ0eSBuYW1lcy4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkIGZvciBlYWNoXG4gICAgICogcHJvcGVydHkgb2YgYG9iamVjdGAgcGlja2luZyB0aGUgcHJvcGVydGllcyB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleVxuICAgICAqIGZvci4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50cztcbiAgICAgKiAodmFsdWUsIGtleSwgb2JqZWN0KS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgc291cmNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufC4uLnN0cmluZ3xzdHJpbmdbXX0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlclxuICAgICAqICBpdGVyYXRpb24gb3IgcHJvcGVydHkgbmFtZXMgdG8gcGljaywgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgcHJvcGVydHlcbiAgICAgKiAgbmFtZXMgb3IgYXJyYXlzIG9mIHByb3BlcnR5IG5hbWVzLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBwaWNrZWQgcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5waWNrKHsgJ25hbWUnOiAnZnJlZCcsICdfdXNlcmlkJzogJ2ZyZWQxJyB9LCAnbmFtZScpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcgfVxuICAgICAqXG4gICAgICogXy5waWNrKHsgJ25hbWUnOiAnZnJlZCcsICdfdXNlcmlkJzogJ2ZyZWQxJyB9LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICogICByZXR1cm4ga2V5LmNoYXJBdCgwKSAhPSAnXyc7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJyB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gcGljayhvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBwcm9wcyA9IGJhc2VGbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgZmFsc2UsIDEpLFxuICAgICAgICAgICAgbGVuZ3RoID0gaXNPYmplY3Qob2JqZWN0KSA/IHByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgICAgICAgIGlmIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IG9iamVjdFtrZXldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICBmb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwga2V5LCBvYmplY3QpKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuIGFsdGVybmF0aXZlIHRvIGBfLnJlZHVjZWAgdGhpcyBtZXRob2QgdHJhbnNmb3JtcyBgb2JqZWN0YCB0byBhIG5ld1xuICAgICAqIGBhY2N1bXVsYXRvcmAgb2JqZWN0IHdoaWNoIGlzIHRoZSByZXN1bHQgb2YgcnVubmluZyBlYWNoIG9mIGl0cyBvd25cbiAgICAgKiBlbnVtZXJhYmxlIHByb3BlcnRpZXMgdGhyb3VnaCBhIGNhbGxiYWNrLCB3aXRoIGVhY2ggY2FsbGJhY2sgZXhlY3V0aW9uXG4gICAgICogcG90ZW50aWFsbHkgbXV0YXRpbmcgdGhlIGBhY2N1bXVsYXRvcmAgb2JqZWN0LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG9cbiAgICAgKiBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCBmb3VyIGFyZ3VtZW50czsgKGFjY3VtdWxhdG9yLCB2YWx1ZSwga2V5LCBvYmplY3QpLlxuICAgICAqIENhbGxiYWNrcyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gVGhlIGN1c3RvbSBhY2N1bXVsYXRvciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBzcXVhcmVzID0gXy50cmFuc2Zvcm0oWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXSwgZnVuY3Rpb24ocmVzdWx0LCBudW0pIHtcbiAgICAgKiAgIG51bSAqPSBudW07XG4gICAgICogICBpZiAobnVtICUgMikge1xuICAgICAqICAgICByZXR1cm4gcmVzdWx0LnB1c2gobnVtKSA8IDM7XG4gICAgICogICB9XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gWzEsIDksIDI1XVxuICAgICAqXG4gICAgICogdmFyIG1hcHBlZCA9IF8udHJhbnNmb3JtKHsgJ2EnOiAxLCAnYic6IDIsICdjJzogMyB9LCBmdW5jdGlvbihyZXN1bHQsIG51bSwga2V5KSB7XG4gICAgICogICByZXN1bHRba2V5XSA9IG51bSAqIDM7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4geyAnYSc6IDMsICdiJzogNiwgJ2MnOiA5IH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm0ob2JqZWN0LCBjYWxsYmFjaywgYWNjdW11bGF0b3IsIHRoaXNBcmcpIHtcbiAgICAgIHZhciBpc0FyciA9IGlzQXJyYXkob2JqZWN0KTtcbiAgICAgIGlmIChhY2N1bXVsYXRvciA9PSBudWxsKSB7XG4gICAgICAgIGlmIChpc0Fycikge1xuICAgICAgICAgIGFjY3VtdWxhdG9yID0gW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGN0b3IgPSBvYmplY3QgJiYgb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgICBwcm90byA9IGN0b3IgJiYgY3Rvci5wcm90b3R5cGU7XG5cbiAgICAgICAgICBhY2N1bXVsYXRvciA9IGJhc2VDcmVhdGUocHJvdG8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDQpO1xuICAgICAgICAoaXNBcnIgPyBmb3JFYWNoIDogZm9yT3duKShvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgb2JqZWN0KSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIG9iamVjdCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IHZhbHVlcyBvZiBgb2JqZWN0YC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHByb3BlcnR5IHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy52YWx1ZXMoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gICAgICogLy8gPT4gWzEsIDIsIDNdIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHZhbHVlcyhvYmplY3QpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIHByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gb2JqZWN0W3Byb3BzW2luZGV4XV07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiBlbGVtZW50cyBmcm9tIHRoZSBzcGVjaWZpZWQgaW5kZXhlcywgb3Iga2V5cywgb2YgdGhlXG4gICAgICogYGNvbGxlY3Rpb25gLiBJbmRleGVzIG1heSBiZSBzcGVjaWZpZWQgYXMgaW5kaXZpZHVhbCBhcmd1bWVudHMgb3IgYXMgYXJyYXlzXG4gICAgICogb2YgaW5kZXhlcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHsuLi4obnVtYmVyfG51bWJlcltdfHN0cmluZ3xzdHJpbmdbXSl9IFtpbmRleF0gVGhlIGluZGV4ZXMgb2YgYGNvbGxlY3Rpb25gXG4gICAgICogICB0byByZXRyaWV2ZSwgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgaW5kZXhlcyBvciBhcnJheXMgb2YgaW5kZXhlcy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZWxlbWVudHMgY29ycmVzcG9uZGluZyB0byB0aGVcbiAgICAgKiAgcHJvdmlkZWQgaW5kZXhlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5hdChbJ2EnLCAnYicsICdjJywgJ2QnLCAnZSddLCBbMCwgMiwgNF0pO1xuICAgICAqIC8vID0+IFsnYScsICdjJywgJ2UnXVxuICAgICAqXG4gICAgICogXy5hdChbJ2ZyZWQnLCAnYmFybmV5JywgJ3BlYmJsZXMnXSwgMCwgMik7XG4gICAgICogLy8gPT4gWydmcmVkJywgJ3BlYmJsZXMnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGF0KGNvbGxlY3Rpb24pIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgcHJvcHMgPSBiYXNlRmxhdHRlbihhcmdzLCB0cnVlLCBmYWxzZSwgMSksXG4gICAgICAgICAgbGVuZ3RoID0gKGFyZ3NbMl0gJiYgYXJnc1syXVthcmdzWzFdXSA9PT0gY29sbGVjdGlvbikgPyAxIDogcHJvcHMubGVuZ3RoLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IGNvbGxlY3Rpb25bcHJvcHNbaW5kZXhdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgcHJlc2VudCBpbiBhIGNvbGxlY3Rpb24gdXNpbmcgc3RyaWN0IGVxdWFsaXR5XG4gICAgICogZm9yIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLiBJZiBgZnJvbUluZGV4YCBpcyBuZWdhdGl2ZSwgaXQgaXMgdXNlZCBhcyB0aGVcbiAgICAgKiBvZmZzZXQgZnJvbSB0aGUgZW5kIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGluY2x1ZGVcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7Kn0gdGFyZ2V0IFRoZSB2YWx1ZSB0byBjaGVjayBmb3IuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtmcm9tSW5kZXg9MF0gVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHRhcmdldGAgZWxlbWVudCBpcyBmb3VuZCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmNvbnRhaW5zKFsxLCAyLCAzXSwgMSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5jb250YWlucyhbMSwgMiwgM10sIDEsIDIpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmNvbnRhaW5zKHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCB9LCAnZnJlZCcpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIF8uY29udGFpbnMoJ3BlYmJsZXMnLCAnZWInKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29udGFpbnMoY29sbGVjdGlvbiwgdGFyZ2V0LCBmcm9tSW5kZXgpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGluZGV4T2YgPSBnZXRJbmRleE9mKCksXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcblxuICAgICAgZnJvbUluZGV4ID0gKGZyb21JbmRleCA8IDAgPyBuYXRpdmVNYXgoMCwgbGVuZ3RoICsgZnJvbUluZGV4KSA6IGZyb21JbmRleCkgfHwgMDtcbiAgICAgIGlmIChpc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAgIHJlc3VsdCA9IGluZGV4T2YoY29sbGVjdGlvbiwgdGFyZ2V0LCBmcm9tSW5kZXgpID4gLTE7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgcmVzdWx0ID0gKGlzU3RyaW5nKGNvbGxlY3Rpb24pID8gY29sbGVjdGlvbi5pbmRleE9mKHRhcmdldCwgZnJvbUluZGV4KSA6IGluZGV4T2YoY29sbGVjdGlvbiwgdGFyZ2V0LCBmcm9tSW5kZXgpKSA+IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yT3duKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCsraW5kZXggPj0gZnJvbUluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gIShyZXN1bHQgPSB2YWx1ZSA9PT0gdGFyZ2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiBrZXlzIGdlbmVyYXRlZCBmcm9tIHRoZSByZXN1bHRzIG9mIHJ1bm5pbmdcbiAgICAgKiBlYWNoIGVsZW1lbnQgb2YgYGNvbGxlY3Rpb25gIHRocm91Z2ggdGhlIGNhbGxiYWNrLiBUaGUgY29ycmVzcG9uZGluZyB2YWx1ZVxuICAgICAqIG9mIGVhY2gga2V5IGlzIHRoZSBudW1iZXIgb2YgdGltZXMgdGhlIGtleSB3YXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrLlxuICAgICAqIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gICAgICogKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY29tcG9zZWQgYWdncmVnYXRlIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5jb3VudEJ5KFs0LjMsIDYuMSwgNi40XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBNYXRoLmZsb29yKG51bSk7IH0pO1xuICAgICAqIC8vID0+IHsgJzQnOiAxLCAnNic6IDIgfVxuICAgICAqXG4gICAgICogXy5jb3VudEJ5KFs0LjMsIDYuMSwgNi40XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiB0aGlzLmZsb29yKG51bSk7IH0sIE1hdGgpO1xuICAgICAqIC8vID0+IHsgJzQnOiAxLCAnNic6IDIgfVxuICAgICAqXG4gICAgICogXy5jb3VudEJ5KFsnb25lJywgJ3R3bycsICd0aHJlZSddLCAnbGVuZ3RoJyk7XG4gICAgICogLy8gPT4geyAnMyc6IDIsICc1JzogMSB9XG4gICAgICovXG4gICAgdmFyIGNvdW50QnkgPSBjcmVhdGVBZ2dyZWdhdG9yKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgICAgKGhhc093blByb3BlcnR5LmNhbGwocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0rKyA6IHJlc3VsdFtrZXldID0gMSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIGdpdmVuIGNhbGxiYWNrIHJldHVybnMgdHJ1ZXkgdmFsdWUgZm9yICoqYWxsKiogZWxlbWVudHMgb2ZcbiAgICAgKiBhIGNvbGxlY3Rpb24uIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgICAqIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgYWxsXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbGwgZWxlbWVudHMgcGFzc2VkIHRoZSBjYWxsYmFjayBjaGVjayxcbiAgICAgKiAgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmV2ZXJ5KFt0cnVlLCAxLCBudWxsLCAneWVzJ10pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZXZlcnkoY2hhcmFjdGVycywgJ2FnZScpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZXZlcnkoY2hhcmFjdGVycywgeyAnYWdlJzogMzYgfSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBldmVyeShjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gISFjYWxsYmFjayhjb2xsZWN0aW9uW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIChyZXN1bHQgPSAhIWNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBhIGNvbGxlY3Rpb24sIHJldHVybmluZyBhbiBhcnJheSBvZiBhbGwgZWxlbWVudHNcbiAgICAgKiB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleSBmb3IuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kXG4gICAgICogaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgc2VsZWN0XG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBlbGVtZW50cyB0aGF0IHBhc3NlZCB0aGUgY2FsbGJhY2sgY2hlY2suXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBldmVucyA9IF8uZmlsdGVyKFsxLCAyLCAzLCA0LCA1LCA2XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBudW0gJSAyID09IDA7IH0pO1xuICAgICAqIC8vID0+IFsyLCA0LCA2XVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmlsdGVyKGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH1dXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpbHRlcihjaGFyYWN0ZXJzLCB7ICdhZ2UnOiAzNiB9KTtcbiAgICAgKiAvLyA9PiBbeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaWx0ZXIoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcblxuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xsZWN0aW9uW2luZGV4XTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yT3duKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBhIGNvbGxlY3Rpb24sIHJldHVybmluZyB0aGUgZmlyc3QgZWxlbWVudCB0aGF0XG4gICAgICogdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZXkgZm9yLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgICAqIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGRldGVjdCwgZmluZFdoZXJlXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmb3VuZCBlbGVtZW50LCBlbHNlIGB1bmRlZmluZWRgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IHRydWUgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAncGViYmxlcycsICdhZ2UnOiAxLCAgJ2Jsb2NrZWQnOiBmYWxzZSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8uZmluZChjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHtcbiAgICAgKiAgIHJldHVybiBjaHIuYWdlIDwgNDA7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kKGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDEgfSk7XG4gICAgICogLy8gPT4gIHsgJ25hbWUnOiAncGViYmxlcycsICdhZ2UnOiAxLCAnYmxvY2tlZCc6IGZhbHNlIH1cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gY29sbGVjdGlvbltpbmRleF07XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmZpbmRgIGV4Y2VwdCB0aGF0IGl0IGl0ZXJhdGVzIG92ZXIgZWxlbWVudHNcbiAgICAgKiBvZiBhIGBjb2xsZWN0aW9uYCBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYHVuZGVmaW5lZGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZmluZExhc3QoWzEsIDIsIDMsIDRdLCBmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gJSAyID09IDE7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gM1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRMYXN0KGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgZm9yRWFjaFJpZ2h0KGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgYSBjb2xsZWN0aW9uLCBleGVjdXRpbmcgdGhlIGNhbGxiYWNrIGZvciBlYWNoXG4gICAgICogZWxlbWVudC4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50cztcbiAgICAgKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIENhbGxiYWNrcyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnlcbiAgICAgKiBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgICAqXG4gICAgICogTm90ZTogQXMgd2l0aCBvdGhlciBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcywgb2JqZWN0cyB3aXRoIGEgYGxlbmd0aGAgcHJvcGVydHlcbiAgICAgKiBhcmUgaXRlcmF0ZWQgbGlrZSBhcnJheXMuIFRvIGF2b2lkIHRoaXMgYmVoYXZpb3IgYF8uZm9ySW5gIG9yIGBfLmZvck93bmBcbiAgICAgKiBtYXkgYmUgdXNlZCBmb3Igb2JqZWN0IGl0ZXJhdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBlYWNoXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8oWzEsIDIsIDNdKS5mb3JFYWNoKGZ1bmN0aW9uKG51bSkgeyBjb25zb2xlLmxvZyhudW0pOyB9KS5qb2luKCcsJyk7XG4gICAgICogLy8gPT4gbG9ncyBlYWNoIG51bWJlciBhbmQgcmV0dXJucyAnMSwyLDMnXG4gICAgICpcbiAgICAgKiBfLmZvckVhY2goeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSwgZnVuY3Rpb24obnVtKSB7IGNvbnNvbGUubG9nKG51bSk7IH0pO1xuICAgICAqIC8vID0+IGxvZ3MgZWFjaCBudW1iZXIgYW5kIHJldHVybnMgdGhlIG9iamVjdCAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JFYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuXG4gICAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2soY29sbGVjdGlvbltpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yT3duKGNvbGxlY3Rpb24sIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZm9yRWFjaGAgZXhjZXB0IHRoYXQgaXQgaXRlcmF0ZXMgb3ZlciBlbGVtZW50c1xuICAgICAqIG9mIGEgYGNvbGxlY3Rpb25gIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBlYWNoUmlnaHRcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXyhbMSwgMiwgM10pLmZvckVhY2hSaWdodChmdW5jdGlvbihudW0pIHsgY29uc29sZS5sb2cobnVtKTsgfSkuam9pbignLCcpO1xuICAgICAqIC8vID0+IGxvZ3MgZWFjaCBudW1iZXIgZnJvbSByaWdodCB0byBsZWZ0IGFuZCByZXR1cm5zICczLDIsMSdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JFYWNoUmlnaHQoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayAmJiB0eXBlb2YgdGhpc0FyZyA9PSAndW5kZWZpbmVkJyA/IGNhbGxiYWNrIDogYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAgIGlmIChjYWxsYmFjayhjb2xsZWN0aW9uW2xlbmd0aF0sIGxlbmd0aCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwcm9wcyA9IGtleXMoY29sbGVjdGlvbik7XG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICAgICAgZm9yT3duKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICBrZXkgPSBwcm9wcyA/IHByb3BzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhjb2xsZWN0aW9uW2tleV0sIGtleSwgY29sbGVjdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3QgY29tcG9zZWQgb2Yga2V5cyBnZW5lcmF0ZWQgZnJvbSB0aGUgcmVzdWx0cyBvZiBydW5uaW5nXG4gICAgICogZWFjaCBlbGVtZW50IG9mIGEgY29sbGVjdGlvbiB0aHJvdWdoIHRoZSBjYWxsYmFjay4gVGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVcbiAgICAgKiBvZiBlYWNoIGtleSBpcyBhbiBhcnJheSBvZiB0aGUgZWxlbWVudHMgcmVzcG9uc2libGUgZm9yIGdlbmVyYXRpbmcgdGhlIGtleS5cbiAgICAgKiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzO1xuICAgICAqICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY29tcG9zZWQgYWdncmVnYXRlIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5ncm91cEJ5KFs0LjIsIDYuMSwgNi40XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBNYXRoLmZsb29yKG51bSk7IH0pO1xuICAgICAqIC8vID0+IHsgJzQnOiBbNC4yXSwgJzYnOiBbNi4xLCA2LjRdIH1cbiAgICAgKlxuICAgICAqIF8uZ3JvdXBCeShbNC4yLCA2LjEsIDYuNF0sIGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gdGhpcy5mbG9vcihudW0pOyB9LCBNYXRoKTtcbiAgICAgKiAvLyA9PiB7ICc0JzogWzQuMl0sICc2JzogWzYuMSwgNi40XSB9XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmdyb3VwQnkoWydvbmUnLCAndHdvJywgJ3RocmVlJ10sICdsZW5ndGgnKTtcbiAgICAgKiAvLyA9PiB7ICczJzogWydvbmUnLCAndHdvJ10sICc1JzogWyd0aHJlZSddIH1cbiAgICAgKi9cbiAgICB2YXIgZ3JvdXBCeSA9IGNyZWF0ZUFnZ3JlZ2F0b3IoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgICAoaGFzT3duUHJvcGVydHkuY2FsbChyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IHJlc3VsdFtrZXldID0gW10pLnB1c2godmFsdWUpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3QgY29tcG9zZWQgb2Yga2V5cyBnZW5lcmF0ZWQgZnJvbSB0aGUgcmVzdWx0cyBvZiBydW5uaW5nXG4gICAgICogZWFjaCBlbGVtZW50IG9mIHRoZSBjb2xsZWN0aW9uIHRocm91Z2ggdGhlIGdpdmVuIGNhbGxiYWNrLiBUaGUgY29ycmVzcG9uZGluZ1xuICAgICAqIHZhbHVlIG9mIGVhY2gga2V5IGlzIHRoZSBsYXN0IGVsZW1lbnQgcmVzcG9uc2libGUgZm9yIGdlbmVyYXRpbmcgdGhlIGtleS5cbiAgICAgKiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzO1xuICAgICAqICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGNvbXBvc2VkIGFnZ3JlZ2F0ZSBvYmplY3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBrZXlzID0gW1xuICAgICAqICAgeyAnZGlyJzogJ2xlZnQnLCAnY29kZSc6IDk3IH0sXG4gICAgICogICB7ICdkaXInOiAncmlnaHQnLCAnY29kZSc6IDEwMCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8uaW5kZXhCeShrZXlzLCAnZGlyJyk7XG4gICAgICogLy8gPT4geyAnbGVmdCc6IHsgJ2Rpcic6ICdsZWZ0JywgJ2NvZGUnOiA5NyB9LCAncmlnaHQnOiB7ICdkaXInOiAncmlnaHQnLCAnY29kZSc6IDEwMCB9IH1cbiAgICAgKlxuICAgICAqIF8uaW5kZXhCeShrZXlzLCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoa2V5LmNvZGUpOyB9KTtcbiAgICAgKiAvLyA9PiB7ICdhJzogeyAnZGlyJzogJ2xlZnQnLCAnY29kZSc6IDk3IH0sICdkJzogeyAnZGlyJzogJ3JpZ2h0JywgJ2NvZGUnOiAxMDAgfSB9XG4gICAgICpcbiAgICAgKiBfLmluZGV4QnkoY2hhcmFjdGVycywgZnVuY3Rpb24oa2V5KSB7IHRoaXMuZnJvbUNoYXJDb2RlKGtleS5jb2RlKTsgfSwgU3RyaW5nKTtcbiAgICAgKiAvLyA9PiB7ICdhJzogeyAnZGlyJzogJ2xlZnQnLCAnY29kZSc6IDk3IH0sICdkJzogeyAnZGlyJzogJ3JpZ2h0JywgJ2NvZGUnOiAxMDAgfSB9XG4gICAgICovXG4gICAgdmFyIGluZGV4QnkgPSBjcmVhdGVBZ2dyZWdhdG9yKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIG1ldGhvZCBuYW1lZCBieSBgbWV0aG9kTmFtZWAgb24gZWFjaCBlbGVtZW50IGluIHRoZSBgY29sbGVjdGlvbmBcbiAgICAgKiByZXR1cm5pbmcgYW4gYXJyYXkgb2YgdGhlIHJlc3VsdHMgb2YgZWFjaCBpbnZva2VkIG1ldGhvZC4gQWRkaXRpb25hbCBhcmd1bWVudHNcbiAgICAgKiB3aWxsIGJlIHByb3ZpZGVkIHRvIGVhY2ggaW52b2tlZCBtZXRob2QuIElmIGBtZXRob2ROYW1lYCBpcyBhIGZ1bmN0aW9uIGl0XG4gICAgICogd2lsbCBiZSBpbnZva2VkIGZvciwgYW5kIGB0aGlzYCBib3VuZCB0bywgZWFjaCBlbGVtZW50IGluIHRoZSBgY29sbGVjdGlvbmAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBtZXRob2ROYW1lIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gaW52b2tlIG9yXG4gICAgICogIHRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsuLi4qfSBbYXJnXSBBcmd1bWVudHMgdG8gaW52b2tlIHRoZSBtZXRob2Qgd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgdGhlIHJlc3VsdHMgb2YgZWFjaCBpbnZva2VkIG1ldGhvZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pbnZva2UoW1s1LCAxLCA3XSwgWzMsIDIsIDFdXSwgJ3NvcnQnKTtcbiAgICAgKiAvLyA9PiBbWzEsIDUsIDddLCBbMSwgMiwgM11dXG4gICAgICpcbiAgICAgKiBfLmludm9rZShbMTIzLCA0NTZdLCBTdHJpbmcucHJvdG90eXBlLnNwbGl0LCAnJyk7XG4gICAgICogLy8gPT4gW1snMScsICcyJywgJzMnXSwgWyc0JywgJzUnLCAnNiddXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGludm9rZShjb2xsZWN0aW9uLCBtZXRob2ROYW1lKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBpc0Z1bmMgPSB0eXBlb2YgbWV0aG9kTmFtZSA9PSAnZnVuY3Rpb24nLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyA/IGxlbmd0aCA6IDApO1xuXG4gICAgICBmb3JFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJlc3VsdFsrK2luZGV4XSA9IChpc0Z1bmMgPyBtZXRob2ROYW1lIDogdmFsdWVbbWV0aG9kTmFtZV0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHZhbHVlcyBieSBydW5uaW5nIGVhY2ggZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvblxuICAgICAqIHRocm91Z2ggdGhlIGNhbGxiYWNrLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGhcbiAgICAgKiB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGNvbGxlY3RcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHRoZSByZXN1bHRzIG9mIGVhY2ggYGNhbGxiYWNrYCBleGVjdXRpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ubWFwKFsxLCAyLCAzXSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBudW0gKiAzOyB9KTtcbiAgICAgKiAvLyA9PiBbMywgNiwgOV1cbiAgICAgKlxuICAgICAqIF8ubWFwKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0sIGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gbnVtICogMzsgfSk7XG4gICAgICogLy8gPT4gWzMsIDYsIDldIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLm1hcChjaGFyYWN0ZXJzLCAnbmFtZScpO1xuICAgICAqIC8vID0+IFsnYmFybmV5JywgJ2ZyZWQnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1hcChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMDtcblxuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGNhbGxiYWNrKGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbikge1xuICAgICAgICAgIHJlc3VsdFsrK2luZGV4XSA9IGNhbGxiYWNrKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIHRoZSBtYXhpbXVtIHZhbHVlIG9mIGEgY29sbGVjdGlvbi4gSWYgdGhlIGNvbGxlY3Rpb24gaXMgZW1wdHkgb3JcbiAgICAgKiBmYWxzZXkgYC1JbmZpbml0eWAgaXMgcmV0dXJuZWQuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSBleGVjdXRlZFxuICAgICAqIGZvciBlYWNoIHZhbHVlIGluIHRoZSBjb2xsZWN0aW9uIHRvIGdlbmVyYXRlIHRoZSBjcml0ZXJpb24gYnkgd2hpY2ggdGhlIHZhbHVlXG4gICAgICogaXMgcmFua2VkLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWVcbiAgICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIG1heGltdW0gdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ubWF4KFs0LCAyLCA4LCA2XSk7XG4gICAgICogLy8gPT4gOFxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLm1heChjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHsgcmV0dXJuIGNoci5hZ2U7IH0pO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCB9O1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5tYXgoY2hhcmFjdGVycywgJ2FnZScpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCB9O1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1heChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGNvbXB1dGVkID0gLUluZmluaXR5LFxuICAgICAgICAgIHJlc3VsdCA9IGNvbXB1dGVkO1xuXG4gICAgICAvLyBhbGxvd3Mgd29ya2luZyB3aXRoIGZ1bmN0aW9ucyBsaWtlIGBfLm1hcGAgd2l0aG91dCB1c2luZ1xuICAgICAgLy8gdGhlaXIgYGluZGV4YCBhcmd1bWVudCBhcyBhIGNhbGxiYWNrXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicgJiYgdGhpc0FyZyAmJiB0aGlzQXJnW2NhbGxiYWNrXSA9PT0gY29sbGVjdGlvbikge1xuICAgICAgICBjYWxsYmFjayA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCAmJiBpc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xsZWN0aW9uW2luZGV4XTtcbiAgICAgICAgICBpZiAodmFsdWUgPiByZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sgPSAoY2FsbGJhY2sgPT0gbnVsbCAmJiBpc1N0cmluZyhjb2xsZWN0aW9uKSlcbiAgICAgICAgICA/IGNoYXJBdENhbGxiYWNrXG4gICAgICAgICAgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuXG4gICAgICAgIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgdmFyIGN1cnJlbnQgPSBjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgICAgIGlmIChjdXJyZW50ID4gY29tcHV0ZWQpIHtcbiAgICAgICAgICAgIGNvbXB1dGVkID0gY3VycmVudDtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgbWluaW11bSB2YWx1ZSBvZiBhIGNvbGxlY3Rpb24uIElmIHRoZSBjb2xsZWN0aW9uIGlzIGVtcHR5IG9yXG4gICAgICogZmFsc2V5IGBJbmZpbml0eWAgaXMgcmV0dXJuZWQuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSBleGVjdXRlZFxuICAgICAqIGZvciBlYWNoIHZhbHVlIGluIHRoZSBjb2xsZWN0aW9uIHRvIGdlbmVyYXRlIHRoZSBjcml0ZXJpb24gYnkgd2hpY2ggdGhlIHZhbHVlXG4gICAgICogaXMgcmFua2VkLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWVcbiAgICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIG1pbmltdW0gdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ubWluKFs0LCAyLCA4LCA2XSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLm1pbihjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHsgcmV0dXJuIGNoci5hZ2U7IH0pO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLm1pbihjaGFyYWN0ZXJzLCAnYWdlJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfTtcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtaW4oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IEluZmluaXR5LFxuICAgICAgICAgIHJlc3VsdCA9IGNvbXB1dGVkO1xuXG4gICAgICAvLyBhbGxvd3Mgd29ya2luZyB3aXRoIGZ1bmN0aW9ucyBsaWtlIGBfLm1hcGAgd2l0aG91dCB1c2luZ1xuICAgICAgLy8gdGhlaXIgYGluZGV4YCBhcmd1bWVudCBhcyBhIGNhbGxiYWNrXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicgJiYgdGhpc0FyZyAmJiB0aGlzQXJnW2NhbGxiYWNrXSA9PT0gY29sbGVjdGlvbikge1xuICAgICAgICBjYWxsYmFjayA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCAmJiBpc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xsZWN0aW9uW2luZGV4XTtcbiAgICAgICAgICBpZiAodmFsdWUgPCByZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sgPSAoY2FsbGJhY2sgPT0gbnVsbCAmJiBpc1N0cmluZyhjb2xsZWN0aW9uKSlcbiAgICAgICAgICA/IGNoYXJBdENhbGxiYWNrXG4gICAgICAgICAgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuXG4gICAgICAgIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgdmFyIGN1cnJlbnQgPSBjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgICAgIGlmIChjdXJyZW50IDwgY29tcHV0ZWQpIHtcbiAgICAgICAgICAgIGNvbXB1dGVkID0gY3VycmVudDtcbiAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgdmFsdWUgb2YgYSBzcGVjaWZpZWQgcHJvcGVydHkgZnJvbSBhbGwgZWxlbWVudHMgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBwbHVjay5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgcHJvcGVydHkgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8ucGx1Y2soY2hhcmFjdGVycywgJ25hbWUnKTtcbiAgICAgKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAgICAgKi9cbiAgICB2YXIgcGx1Y2sgPSBtYXA7XG5cbiAgICAvKipcbiAgICAgKiBSZWR1Y2VzIGEgY29sbGVjdGlvbiB0byBhIHZhbHVlIHdoaWNoIGlzIHRoZSBhY2N1bXVsYXRlZCByZXN1bHQgb2YgcnVubmluZ1xuICAgICAqIGVhY2ggZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbiB0aHJvdWdoIHRoZSBjYWxsYmFjaywgd2hlcmUgZWFjaCBzdWNjZXNzaXZlXG4gICAgICogY2FsbGJhY2sgZXhlY3V0aW9uIGNvbnN1bWVzIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIHByZXZpb3VzIGV4ZWN1dGlvbi4gSWZcbiAgICAgKiBgYWNjdW11bGF0b3JgIGlzIG5vdCBwcm92aWRlZCB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgY29sbGVjdGlvbiB3aWxsIGJlXG4gICAgICogdXNlZCBhcyB0aGUgaW5pdGlhbCBgYWNjdW11bGF0b3JgIHZhbHVlLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgXG4gICAgICogYW5kIGludm9rZWQgd2l0aCBmb3VyIGFyZ3VtZW50czsgKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBmb2xkbCwgaW5qZWN0XG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gSW5pdGlhbCB2YWx1ZSBvZiB0aGUgYWNjdW11bGF0b3IuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgc3VtID0gXy5yZWR1Y2UoWzEsIDIsIDNdLCBmdW5jdGlvbihzdW0sIG51bSkge1xuICAgICAqICAgcmV0dXJuIHN1bSArIG51bTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiA2XG4gICAgICpcbiAgICAgKiB2YXIgbWFwcGVkID0gXy5yZWR1Y2UoeyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzIH0sIGZ1bmN0aW9uKHJlc3VsdCwgbnVtLCBrZXkpIHtcbiAgICAgKiAgIHJlc3VsdFtrZXldID0gbnVtICogMztcbiAgICAgKiAgIHJldHVybiByZXN1bHQ7XG4gICAgICogfSwge30pO1xuICAgICAqIC8vID0+IHsgJ2EnOiAzLCAnYic6IDYsICdjJzogOSB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVkdWNlKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCBhY2N1bXVsYXRvciwgdGhpc0FyZykge1xuICAgICAgaWYgKCFjb2xsZWN0aW9uKSByZXR1cm4gYWNjdW11bGF0b3I7XG4gICAgICB2YXIgbm9hY2N1bSA9IGFyZ3VtZW50cy5sZW5ndGggPCAzO1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDQpO1xuXG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcblxuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKG5vYWNjdW0pIHtcbiAgICAgICAgICBhY2N1bXVsYXRvciA9IGNvbGxlY3Rpb25bKytpbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBhY2N1bXVsYXRvciA9IGNhbGxiYWNrKGFjY3VtdWxhdG9yLCBjb2xsZWN0aW9uW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBub2FjY3VtXG4gICAgICAgICAgICA/IChub2FjY3VtID0gZmFsc2UsIHZhbHVlKVxuICAgICAgICAgICAgOiBjYWxsYmFjayhhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLnJlZHVjZWAgZXhjZXB0IHRoYXQgaXQgaXRlcmF0ZXMgb3ZlciBlbGVtZW50c1xuICAgICAqIG9mIGEgYGNvbGxlY3Rpb25gIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBmb2xkclxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbYWNjdW11bGF0b3JdIEluaXRpYWwgdmFsdWUgb2YgdGhlIGFjY3VtdWxhdG9yLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGxpc3QgPSBbWzAsIDFdLCBbMiwgM10sIFs0LCA1XV07XG4gICAgICogdmFyIGZsYXQgPSBfLnJlZHVjZVJpZ2h0KGxpc3QsIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEuY29uY2F0KGIpOyB9LCBbXSk7XG4gICAgICogLy8gPT4gWzQsIDUsIDIsIDMsIDAsIDFdXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVkdWNlUmlnaHQoY29sbGVjdGlvbiwgY2FsbGJhY2ssIGFjY3VtdWxhdG9yLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgbm9hY2N1bSA9IGFyZ3VtZW50cy5sZW5ndGggPCAzO1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDQpO1xuICAgICAgZm9yRWFjaFJpZ2h0KGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICBhY2N1bXVsYXRvciA9IG5vYWNjdW1cbiAgICAgICAgICA/IChub2FjY3VtID0gZmFsc2UsIHZhbHVlKVxuICAgICAgICAgIDogY2FsbGJhY2soYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3Bwb3NpdGUgb2YgYF8uZmlsdGVyYCB0aGlzIG1ldGhvZCByZXR1cm5zIHRoZSBlbGVtZW50cyBvZiBhXG4gICAgICogY29sbGVjdGlvbiB0aGF0IHRoZSBjYWxsYmFjayBkb2VzICoqbm90KiogcmV0dXJuIHRydWV5IGZvci5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBlbGVtZW50cyB0aGF0IGZhaWxlZCB0aGUgY2FsbGJhY2sgY2hlY2suXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvZGRzID0gXy5yZWplY3QoWzEsIDIsIDMsIDQsIDUsIDZdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIG51bSAlIDIgPT0gMDsgfSk7XG4gICAgICogLy8gPT4gWzEsIDMsIDVdXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5yZWplY3QoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiBbeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfV1cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ucmVqZWN0KGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDM2IH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlamVjdChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgcmV0dXJuIGZpbHRlcihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuICFjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIGEgcmFuZG9tIGVsZW1lbnQgb3IgYG5gIHJhbmRvbSBlbGVtZW50cyBmcm9tIGEgY29sbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBzYW1wbGUuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtuXSBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNhbXBsZS5cbiAgICAgKiBAcGFyYW0tIHtPYmplY3R9IFtndWFyZF0gQWxsb3dzIHdvcmtpbmcgd2l0aCBmdW5jdGlvbnMgbGlrZSBgXy5tYXBgXG4gICAgICogIHdpdGhvdXQgdXNpbmcgdGhlaXIgYGluZGV4YCBhcmd1bWVudHMgYXMgYG5gLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgcmFuZG9tIHNhbXBsZShzKSBvZiBgY29sbGVjdGlvbmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uc2FtcGxlKFsxLCAyLCAzLCA0XSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogXy5zYW1wbGUoWzEsIDIsIDMsIDRdLCAyKTtcbiAgICAgKiAvLyA9PiBbMywgMV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzYW1wbGUoY29sbGVjdGlvbiwgbiwgZ3VhcmQpIHtcbiAgICAgIGlmIChjb2xsZWN0aW9uICYmIHR5cGVvZiBjb2xsZWN0aW9uLmxlbmd0aCAhPSAnbnVtYmVyJykge1xuICAgICAgICBjb2xsZWN0aW9uID0gdmFsdWVzKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb25bYmFzZVJhbmRvbSgwLCBjb2xsZWN0aW9uLmxlbmd0aCAtIDEpXSA6IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHZhciByZXN1bHQgPSBzaHVmZmxlKGNvbGxlY3Rpb24pO1xuICAgICAgcmVzdWx0Lmxlbmd0aCA9IG5hdGl2ZU1pbihuYXRpdmVNYXgoMCwgbiksIHJlc3VsdC5sZW5ndGgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHNodWZmbGVkIHZhbHVlcywgdXNpbmcgYSB2ZXJzaW9uIG9mIHRoZSBGaXNoZXItWWF0ZXNcbiAgICAgKiBzaHVmZmxlLiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXItWWF0ZXNfc2h1ZmZsZS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBzaHVmZmxlLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBzaHVmZmxlZCBjb2xsZWN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnNodWZmbGUoWzEsIDIsIDMsIDQsIDUsIDZdKTtcbiAgICAgKiAvLyA9PiBbNCwgMSwgNiwgMywgNSwgMl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaHVmZmxlKGNvbGxlY3Rpb24pIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyA/IGxlbmd0aCA6IDApO1xuXG4gICAgICBmb3JFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHZhciByYW5kID0gYmFzZVJhbmRvbSgwLCArK2luZGV4KTtcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IHJlc3VsdFtyYW5kXTtcbiAgICAgICAgcmVzdWx0W3JhbmRdID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgYGNvbGxlY3Rpb25gIGJ5IHJldHVybmluZyBgY29sbGVjdGlvbi5sZW5ndGhgIGZvciBhcnJheXNcbiAgICAgKiBhbmQgYXJyYXktbGlrZSBvYmplY3RzIG9yIHRoZSBudW1iZXIgb2Ygb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBmb3Igb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpbnNwZWN0LlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYGNvbGxlY3Rpb24ubGVuZ3RoYCBvciBudW1iZXIgb2Ygb3duIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5zaXplKFsxLCAyXSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogXy5zaXplKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0pO1xuICAgICAqIC8vID0+IDNcbiAgICAgKlxuICAgICAqIF8uc2l6ZSgncGViYmxlcycpO1xuICAgICAqIC8vID0+IDdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaXplKGNvbGxlY3Rpb24pIHtcbiAgICAgIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuICAgICAgcmV0dXJuIHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicgPyBsZW5ndGggOiBrZXlzKGNvbGxlY3Rpb24pLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgYSB0cnVleSB2YWx1ZSBmb3IgKiphbnkqKiBlbGVtZW50IG9mIGFcbiAgICAgKiBjb2xsZWN0aW9uLiBUaGUgZnVuY3Rpb24gcmV0dXJucyBhcyBzb29uIGFzIGl0IGZpbmRzIGEgcGFzc2luZyB2YWx1ZSBhbmRcbiAgICAgKiBkb2VzIG5vdCBpdGVyYXRlIG92ZXIgdGhlIGVudGlyZSBjb2xsZWN0aW9uLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG9cbiAgICAgKiBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGFueVxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGVsZW1lbnQgcGFzc2VkIHRoZSBjYWxsYmFjayBjaGVjayxcbiAgICAgKiAgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnNvbWUoW251bGwsIDAsICd5ZXMnLCBmYWxzZV0sIEJvb2xlYW4pO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IHRydWUgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnNvbWUoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnNvbWUoY2hhcmFjdGVycywgeyAnYWdlJzogMSB9KTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNvbWUoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKChyZXN1bHQgPSBjYWxsYmFjayhjb2xsZWN0aW9uW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuICEocmVzdWx0ID0gY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuICEhcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgZWxlbWVudHMsIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIgYnkgdGhlIHJlc3VsdHMgb2ZcbiAgICAgKiBydW5uaW5nIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdGhyb3VnaCB0aGUgY2FsbGJhY2suIFRoaXMgbWV0aG9kXG4gICAgICogcGVyZm9ybXMgYSBzdGFibGUgc29ydCwgdGhhdCBpcywgaXQgd2lsbCBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgc29ydCBvcmRlclxuICAgICAqIG9mIGVxdWFsIGVsZW1lbnRzLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGhcbiAgICAgKiB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjb2xsZWN0aW9uXG4gICAgICogd2lsbCBiZSBzb3J0ZWQgYnkgZWFjaCBwcm9wZXJ0eSB2YWx1ZS5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fEZ1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBzb3J0ZWQgZWxlbWVudHMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uc29ydEJ5KFsxLCAyLCAzXSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBNYXRoLnNpbihudW0pOyB9KTtcbiAgICAgKiAvLyA9PiBbMywgMSwgMl1cbiAgICAgKlxuICAgICAqIF8uc29ydEJ5KFsxLCAyLCAzXSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiB0aGlzLnNpbihudW0pOyB9LCBNYXRoKTtcbiAgICAgKiAvLyA9PiBbMywgMSwgMl1cbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYWdlJzogNDAgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgICdhZ2UnOiAyNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2FnZSc6IDMwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5tYXAoXy5zb3J0QnkoY2hhcmFjdGVycywgJ2FnZScpLCBfLnZhbHVlcyk7XG4gICAgICogLy8gPT4gW1snYmFybmV5JywgMjZdLCBbJ2ZyZWQnLCAzMF0sIFsnYmFybmV5JywgMzZdLCBbJ2ZyZWQnLCA0MF1dXG4gICAgICpcbiAgICAgKiAvLyBzb3J0aW5nIGJ5IG11bHRpcGxlIHByb3BlcnRpZXNcbiAgICAgKiBfLm1hcChfLnNvcnRCeShjaGFyYWN0ZXJzLCBbJ25hbWUnLCAnYWdlJ10pLCBfLnZhbHVlcyk7XG4gICAgICogLy8gPSA+IFtbJ2Jhcm5leScsIDI2XSwgWydiYXJuZXknLCAzNl0sIFsnZnJlZCcsIDMwXSwgWydmcmVkJywgNDBdXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNvcnRCeShjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgaXNBcnIgPSBpc0FycmF5KGNhbGxiYWNrKSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicgPyBsZW5ndGggOiAwKTtcblxuICAgICAgaWYgKCFpc0Fycikge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICB9XG4gICAgICBmb3JFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IHJlc3VsdFsrK2luZGV4XSA9IGdldE9iamVjdCgpO1xuICAgICAgICBpZiAoaXNBcnIpIHtcbiAgICAgICAgICBvYmplY3QuY3JpdGVyaWEgPSBtYXAoY2FsbGJhY2ssIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgKG9iamVjdC5jcml0ZXJpYSA9IGdldEFycmF5KCkpWzBdID0gY2FsbGJhY2sodmFsdWUsIGtleSwgY29sbGVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0LmluZGV4ID0gaW5kZXg7XG4gICAgICAgIG9iamVjdC52YWx1ZSA9IHZhbHVlO1xuICAgICAgfSk7XG5cbiAgICAgIGxlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG4gICAgICByZXN1bHQuc29ydChjb21wYXJlQXNjZW5kaW5nKTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICB2YXIgb2JqZWN0ID0gcmVzdWx0W2xlbmd0aF07XG4gICAgICAgIHJlc3VsdFtsZW5ndGhdID0gb2JqZWN0LnZhbHVlO1xuICAgICAgICBpZiAoIWlzQXJyKSB7XG4gICAgICAgICAgcmVsZWFzZUFycmF5KG9iamVjdC5jcml0ZXJpYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVsZWFzZU9iamVjdChvYmplY3QpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyB0aGUgYGNvbGxlY3Rpb25gIHRvIGFuIGFycmF5LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGNvbnZlcnQuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgY29udmVydGVkIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAoZnVuY3Rpb24oKSB7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTsgfSkoMSwgMiwgMywgNCk7XG4gICAgICogLy8gPT4gWzIsIDMsIDRdXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9BcnJheShjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoY29sbGVjdGlvbiAmJiB0eXBlb2YgY29sbGVjdGlvbi5sZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHNsaWNlKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlcyhjb2xsZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBgY29sbGVjdGlvbmAgdG8gdGhlIGdpdmVuXG4gICAgICogYHByb3BlcnRpZXNgIG9iamVjdCwgcmV0dXJuaW5nIGFuIGFycmF5IG9mIGFsbCBlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudFxuICAgICAqIHByb3BlcnR5IHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgVGhlIG9iamVjdCBvZiBwcm9wZXJ0eSB2YWx1ZXMgdG8gZmlsdGVyIGJ5LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIGdpdmVuIHByb3BlcnRpZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdwZXRzJzogWydob3BweSddIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCwgJ3BldHMnOiBbJ2JhYnkgcHVzcycsICdkaW5vJ10gfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLndoZXJlKGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDM2IH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ3BldHMnOiBbJ2hvcHB5J10gfV1cbiAgICAgKlxuICAgICAqIF8ud2hlcmUoY2hhcmFjdGVycywgeyAncGV0cyc6IFsnZGlubyddIH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAsICdwZXRzJzogWydiYWJ5IHB1c3MnLCAnZGlubyddIH1dXG4gICAgICovXG4gICAgdmFyIHdoZXJlID0gZmlsdGVyO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IHdpdGggYWxsIGZhbHNleSB2YWx1ZXMgcmVtb3ZlZC4gVGhlIHZhbHVlcyBgZmFsc2VgLCBgbnVsbGAsXG4gICAgICogYDBgLCBgXCJcImAsIGB1bmRlZmluZWRgLCBhbmQgYE5hTmAgYXJlIGFsbCBmYWxzZXkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGNvbXBhY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGZpbHRlcmVkIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5jb21wYWN0KFswLCAxLCBmYWxzZSwgMiwgJycsIDNdKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgM11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wYWN0KGFycmF5KSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgZXhjbHVkaW5nIGFsbCB2YWx1ZXMgb2YgdGhlIHByb3ZpZGVkIGFycmF5cyB1c2luZyBzdHJpY3RcbiAgICAgKiBlcXVhbGl0eSBmb3IgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHByb2Nlc3MuXG4gICAgICogQHBhcmFtIHsuLi5BcnJheX0gW3ZhbHVlc10gVGhlIGFycmF5cyBvZiB2YWx1ZXMgdG8gZXhjbHVkZS5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmRpZmZlcmVuY2UoWzEsIDIsIDMsIDQsIDVdLCBbNSwgMiwgMTBdKTtcbiAgICAgKiAvLyA9PiBbMSwgMywgNF1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkaWZmZXJlbmNlKGFycmF5KSB7XG4gICAgICByZXR1cm4gYmFzZURpZmZlcmVuY2UoYXJyYXksIGJhc2VGbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSwgMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZmluZGAgZXhjZXB0IHRoYXQgaXQgcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0XG4gICAgICogZWxlbWVudCB0aGF0IHBhc3NlcyB0aGUgY2FsbGJhY2sgY2hlY2ssIGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgaXRzZWxmLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBmb3VuZCBlbGVtZW50LCBlbHNlIGAtMWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEsICAnYmxvY2tlZCc6IGZhbHNlIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogXy5maW5kSW5kZXgoY2hhcmFjdGVycywgZnVuY3Rpb24oY2hyKSB7XG4gICAgICogICByZXR1cm4gY2hyLmFnZSA8IDIwO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IDJcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZEluZGV4KGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDM2IH0pO1xuICAgICAqIC8vID0+IDBcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZEluZGV4KGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4gMVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRJbmRleChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcblxuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZmluZEluZGV4YCBleGNlcHQgdGhhdCBpdCBpdGVyYXRlcyBvdmVyIGVsZW1lbnRzXG4gICAgICogb2YgYSBgY29sbGVjdGlvbmAgZnJvbSByaWdodCB0byBsZWZ0LlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBmb3VuZCBlbGVtZW50LCBlbHNlIGAtMWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IHRydWUgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiBmYWxzZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEsICAnYmxvY2tlZCc6IHRydWUgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLmZpbmRMYXN0SW5kZXgoY2hhcmFjdGVycywgZnVuY3Rpb24oY2hyKSB7XG4gICAgICogICByZXR1cm4gY2hyLmFnZSA+IDMwO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IDFcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZExhc3RJbmRleChjaGFyYWN0ZXJzLCB7ICdhZ2UnOiAzNiB9KTtcbiAgICAgKiAvLyA9PiAwXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpbmRMYXN0SW5kZXgoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZExhc3RJbmRleChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKGFycmF5W2xlbmd0aF0sIGxlbmd0aCwgYXJyYXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGZpcnN0IGVsZW1lbnQgb3IgZmlyc3QgYG5gIGVsZW1lbnRzIG9mIGFuIGFycmF5LiBJZiBhIGNhbGxiYWNrXG4gICAgICogaXMgcHJvdmlkZWQgZWxlbWVudHMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkgYXJlIHJldHVybmVkIGFzIGxvbmdcbiAgICAgKiBhcyB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmRcbiAgICAgKiBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGluZGV4LCBhcnJheSkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBoZWFkLCB0YWtlXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxudW1iZXJ8c3RyaW5nfSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGVsZW1lbnQgb3IgdGhlIG51bWJlciBvZiBlbGVtZW50cyB0byByZXR1cm4uIElmIGEgcHJvcGVydHkgbmFtZSBvclxuICAgICAqICBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiXG4gICAgICogIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZpcnN0IGVsZW1lbnQocykgb2YgYGFycmF5YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5maXJzdChbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IDFcbiAgICAgKlxuICAgICAqIF8uZmlyc3QoWzEsIDIsIDNdLCAyKTtcbiAgICAgKiAvLyA9PiBbMSwgMl1cbiAgICAgKlxuICAgICAqIF8uZmlyc3QoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gPCAzO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IFsxLCAyXVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYmxvY2tlZCc6IGZhbHNlLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnbmEnIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maXJzdChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdibG9ja2VkJzogdHJ1ZSwgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5wbHVjayhfLmZpcnN0KGNoYXJhY3RlcnMsIHsgJ2VtcGxveWVyJzogJ3NsYXRlJyB9KSwgJ25hbWUnKTtcbiAgICAgKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaXJzdChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBuID0gMCxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ251bWJlcicgJiYgY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCAmJiBjYWxsYmFjayhhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHtcbiAgICAgICAgICBuKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG4gPSBjYWxsYmFjaztcbiAgICAgICAgaWYgKG4gPT0gbnVsbCB8fCB0aGlzQXJnKSB7XG4gICAgICAgICAgcmV0dXJuIGFycmF5ID8gYXJyYXlbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBzbGljZShhcnJheSwgMCwgbmF0aXZlTWluKG5hdGl2ZU1heCgwLCBuKSwgbGVuZ3RoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmxhdHRlbnMgYSBuZXN0ZWQgYXJyYXkgKHRoZSBuZXN0aW5nIGNhbiBiZSB0byBhbnkgZGVwdGgpLiBJZiBgaXNTaGFsbG93YFxuICAgICAqIGlzIHRydWV5LCB0aGUgYXJyYXkgd2lsbCBvbmx5IGJlIGZsYXR0ZW5lZCBhIHNpbmdsZSBsZXZlbC4gSWYgYSBjYWxsYmFja1xuICAgICAqIGlzIHByb3ZpZGVkIGVhY2ggZWxlbWVudCBvZiB0aGUgYXJyYXkgaXMgcGFzc2VkIHRocm91Z2ggdGhlIGNhbGxiYWNrIGJlZm9yZVxuICAgICAqIGZsYXR0ZW5pbmcuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgICAqIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgYXJyYXkpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGZsYXR0ZW4uXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaGFsbG93PWZhbHNlXSBBIGZsYWcgdG8gcmVzdHJpY3QgZmxhdHRlbmluZyB0byBhIHNpbmdsZSBsZXZlbC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZmxhdHRlbihbMSwgWzJdLCBbMywgW1s0XV1dXSk7XG4gICAgICogLy8gPT4gWzEsIDIsIDMsIDRdO1xuICAgICAqXG4gICAgICogXy5mbGF0dGVuKFsxLCBbMl0sIFszLCBbWzRdXV1dLCB0cnVlKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgMywgW1s0XV1dO1xuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzMCwgJ3BldHMnOiBbJ2hvcHB5J10gfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwLCAncGV0cyc6IFsnYmFieSBwdXNzJywgJ2Rpbm8nXSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmxhdHRlbihjaGFyYWN0ZXJzLCAncGV0cycpO1xuICAgICAqIC8vID0+IFsnaG9wcHknLCAnYmFieSBwdXNzJywgJ2Rpbm8nXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZsYXR0ZW4oYXJyYXksIGlzU2hhbGxvdywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIC8vIGp1Z2dsZSBhcmd1bWVudHNcbiAgICAgIGlmICh0eXBlb2YgaXNTaGFsbG93ICE9ICdib29sZWFuJyAmJiBpc1NoYWxsb3cgIT0gbnVsbCkge1xuICAgICAgICB0aGlzQXJnID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gKHR5cGVvZiBpc1NoYWxsb3cgIT0gJ2Z1bmN0aW9uJyAmJiB0aGlzQXJnICYmIHRoaXNBcmdbaXNTaGFsbG93XSA9PT0gYXJyYXkpID8gbnVsbCA6IGlzU2hhbGxvdztcbiAgICAgICAgaXNTaGFsbG93ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICBhcnJheSA9IG1hcChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VGbGF0dGVuKGFycmF5LCBpc1NoYWxsb3cpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGB2YWx1ZWAgaXMgZm91bmQgdXNpbmdcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkgZm9yIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLiBJZiB0aGUgYXJyYXkgaXMgYWxyZWFkeSBzb3J0ZWRcbiAgICAgKiBwcm92aWRpbmcgYHRydWVgIGZvciBgZnJvbUluZGV4YCB3aWxsIHJ1biBhIGZhc3RlciBiaW5hcnkgc2VhcmNoLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58bnVtYmVyfSBbZnJvbUluZGV4PTBdIFRoZSBpbmRleCB0byBzZWFyY2ggZnJvbSBvciBgdHJ1ZWBcbiAgICAgKiAgdG8gcGVyZm9ybSBhIGJpbmFyeSBzZWFyY2ggb24gYSBzb3J0ZWQgYXJyYXkuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUgb3IgYC0xYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pbmRleE9mKFsxLCAyLCAzLCAxLCAyLCAzXSwgMik7XG4gICAgICogLy8gPT4gMVxuICAgICAqXG4gICAgICogXy5pbmRleE9mKFsxLCAyLCAzLCAxLCAyLCAzXSwgMiwgMyk7XG4gICAgICogLy8gPT4gNFxuICAgICAqXG4gICAgICogXy5pbmRleE9mKFsxLCAxLCAyLCAyLCAzLCAzXSwgMiwgdHJ1ZSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgICAgIGlmICh0eXBlb2YgZnJvbUluZGV4ID09ICdudW1iZXInKSB7XG4gICAgICAgIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG4gICAgICAgIGZyb21JbmRleCA9IChmcm9tSW5kZXggPCAwID8gbmF0aXZlTWF4KDAsIGxlbmd0aCArIGZyb21JbmRleCkgOiBmcm9tSW5kZXggfHwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGZyb21JbmRleCkge1xuICAgICAgICB2YXIgaW5kZXggPSBzb3J0ZWRJbmRleChhcnJheSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdID09PSB2YWx1ZSA/IGluZGV4IDogLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZUluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgYWxsIGJ1dCB0aGUgbGFzdCBlbGVtZW50IG9yIGxhc3QgYG5gIGVsZW1lbnRzIG9mIGFuIGFycmF5LiBJZiBhXG4gICAgICogY2FsbGJhY2sgaXMgcHJvdmlkZWQgZWxlbWVudHMgYXQgdGhlIGVuZCBvZiB0aGUgYXJyYXkgYXJlIGV4Y2x1ZGVkIGZyb21cbiAgICAgKiB0aGUgcmVzdWx0IGFzIGxvbmcgYXMgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZXkuIFRoZSBjYWxsYmFjayBpcyBib3VuZFxuICAgICAqIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgYXJyYXkpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fG51bWJlcnxzdHJpbmd9IFtjYWxsYmFjaz0xXSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBlbGVtZW50IG9yIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gZXhjbHVkZS4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yXG4gICAgICogIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWQgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCJcbiAgICAgKiAgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBzbGljZSBvZiBgYXJyYXlgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmluaXRpYWwoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiBbMSwgMl1cbiAgICAgKlxuICAgICAqIF8uaW5pdGlhbChbMSwgMiwgM10sIDIpO1xuICAgICAqIC8vID0+IFsxXVxuICAgICAqXG4gICAgICogXy5pbml0aWFsKFsxLCAyLCAzXSwgZnVuY3Rpb24obnVtKSB7XG4gICAgICogICByZXR1cm4gbnVtID4gMTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBbMV1cbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2Jsb2NrZWQnOiBmYWxzZSwgJ2VtcGxveWVyJzogJ3NsYXRlJyB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2Jsb2NrZWQnOiB0cnVlLCAgJ2VtcGxveWVyJzogJ3NsYXRlJyB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2Jsb2NrZWQnOiB0cnVlLCAgJ2VtcGxveWVyJzogJ25hJyB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uaW5pdGlhbChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICAnYmxvY2tlZCc6IGZhbHNlLCAnZW1wbG95ZXInOiAnc2xhdGUnIH1dXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnBsdWNrKF8uaW5pdGlhbChjaGFyYWN0ZXJzLCB7ICdlbXBsb3llcic6ICduYScgfSksICduYW1lJyk7XG4gICAgICogLy8gPT4gWydiYXJuZXknLCAnZnJlZCddXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdGlhbChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBuID0gMCxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ251bWJlcicgJiYgY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICB2YXIgaW5kZXggPSBsZW5ndGg7XG4gICAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgICAgd2hpbGUgKGluZGV4LS0gJiYgY2FsbGJhY2soYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICAgICAgbisrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuID0gKGNhbGxiYWNrID09IG51bGwgfHwgdGhpc0FyZykgPyAxIDogY2FsbGJhY2sgfHwgbjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzbGljZShhcnJheSwgMCwgbmF0aXZlTWluKG5hdGl2ZU1heCgwLCBsZW5ndGggLSBuKSwgbGVuZ3RoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB1bmlxdWUgdmFsdWVzIHByZXNlbnQgaW4gYWxsIHByb3ZpZGVkIGFycmF5cyB1c2luZ1xuICAgICAqIHN0cmljdCBlcXVhbGl0eSBmb3IgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHsuLi5BcnJheX0gW2FycmF5XSBUaGUgYXJyYXlzIHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHNoYXJlZCB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaW50ZXJzZWN0aW9uKFsxLCAyLCAzXSwgWzUsIDIsIDEsIDRdLCBbMiwgMV0pO1xuICAgICAqIC8vID0+IFsxLCAyXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGludGVyc2VjdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gW10sXG4gICAgICAgICAgYXJnc0luZGV4ID0gLTEsXG4gICAgICAgICAgYXJnc0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgICAgICAgY2FjaGVzID0gZ2V0QXJyYXkoKSxcbiAgICAgICAgICBpbmRleE9mID0gZ2V0SW5kZXhPZigpLFxuICAgICAgICAgIHRydXN0SW5kZXhPZiA9IGluZGV4T2YgPT09IGJhc2VJbmRleE9mLFxuICAgICAgICAgIHNlZW4gPSBnZXRBcnJheSgpO1xuXG4gICAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGFyZ3VtZW50c1thcmdzSW5kZXhdO1xuICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICAgICAgYXJncy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICBjYWNoZXMucHVzaCh0cnVzdEluZGV4T2YgJiYgdmFsdWUubGVuZ3RoID49IGxhcmdlQXJyYXlTaXplICYmXG4gICAgICAgICAgICBjcmVhdGVDYWNoZShhcmdzSW5kZXggPyBhcmdzW2FyZ3NJbmRleF0gOiBzZWVuKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBhcnJheSA9IGFyZ3NbMF0sXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgIG91dGVyOlxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGNhY2hlID0gY2FjaGVzWzBdO1xuICAgICAgICB2YWx1ZSA9IGFycmF5W2luZGV4XTtcblxuICAgICAgICBpZiAoKGNhY2hlID8gY2FjaGVJbmRleE9mKGNhY2hlLCB2YWx1ZSkgOiBpbmRleE9mKHNlZW4sIHZhbHVlKSkgPCAwKSB7XG4gICAgICAgICAgYXJnc0luZGV4ID0gYXJnc0xlbmd0aDtcbiAgICAgICAgICAoY2FjaGUgfHwgc2VlbikucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgd2hpbGUgKC0tYXJnc0luZGV4KSB7XG4gICAgICAgICAgICBjYWNoZSA9IGNhY2hlc1thcmdzSW5kZXhdO1xuICAgICAgICAgICAgaWYgKChjYWNoZSA/IGNhY2hlSW5kZXhPZihjYWNoZSwgdmFsdWUpIDogaW5kZXhPZihhcmdzW2FyZ3NJbmRleF0sIHZhbHVlKSkgPCAwKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChhcmdzTGVuZ3RoLS0pIHtcbiAgICAgICAgY2FjaGUgPSBjYWNoZXNbYXJnc0xlbmd0aF07XG4gICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgIHJlbGVhc2VPYmplY3QoY2FjaGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWxlYXNlQXJyYXkoY2FjaGVzKTtcbiAgICAgIHJlbGVhc2VBcnJheShzZWVuKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbGFzdCBlbGVtZW50IG9yIGxhc3QgYG5gIGVsZW1lbnRzIG9mIGFuIGFycmF5LiBJZiBhIGNhbGxiYWNrIGlzXG4gICAgICogcHJvdmlkZWQgZWxlbWVudHMgYXQgdGhlIGVuZCBvZiB0aGUgYXJyYXkgYXJlIHJldHVybmVkIGFzIGxvbmcgYXMgdGhlXG4gICAgICogY2FsbGJhY2sgcmV0dXJucyB0cnVleS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZFxuICAgICAqIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGluZGV4LCBhcnJheSkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8bnVtYmVyfHN0cmluZ30gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBlbGVtZW50IG9yIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gcmV0dXJuLiBJZiBhIHByb3BlcnR5IG5hbWUgb3JcbiAgICAgKiAgb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIlxuICAgICAqICBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBsYXN0IGVsZW1lbnQocykgb2YgYGFycmF5YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5sYXN0KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gM1xuICAgICAqXG4gICAgICogXy5sYXN0KFsxLCAyLCAzXSwgMik7XG4gICAgICogLy8gPT4gWzIsIDNdXG4gICAgICpcbiAgICAgKiBfLmxhc3QoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gPiAxO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IFsyLCAzXVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYmxvY2tlZCc6IGZhbHNlLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnbmEnIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5wbHVjayhfLmxhc3QoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKSwgJ25hbWUnKTtcbiAgICAgKiAvLyA9PiBbJ2ZyZWQnLCAncGViYmxlcyddXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmxhc3QoY2hhcmFjdGVycywgeyAnZW1wbG95ZXInOiAnbmEnIH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ3BlYmJsZXMnLCAnYmxvY2tlZCc6IHRydWUsICdlbXBsb3llcic6ICduYScgfV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsYXN0KGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIG4gPSAwLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnbnVtYmVyJyAmJiBjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxlbmd0aDtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICB3aGlsZSAoaW5kZXgtLSAmJiBjYWxsYmFjayhhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHtcbiAgICAgICAgICBuKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG4gPSBjYWxsYmFjaztcbiAgICAgICAgaWYgKG4gPT0gbnVsbCB8fCB0aGlzQXJnKSB7XG4gICAgICAgICAgcmV0dXJuIGFycmF5ID8gYXJyYXlbbGVuZ3RoIC0gMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBzbGljZShhcnJheSwgbmF0aXZlTWF4KDAsIGxlbmd0aCAtIG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgbGFzdCBvY2N1cnJlbmNlIG9mIGB2YWx1ZWAgaXMgZm91bmQgdXNpbmcgc3RyaWN0XG4gICAgICogZXF1YWxpdHkgZm9yIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLiBJZiBgZnJvbUluZGV4YCBpcyBuZWdhdGl2ZSwgaXQgaXMgdXNlZFxuICAgICAqIGFzIHRoZSBvZmZzZXQgZnJvbSB0aGUgZW5kIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZnJvbUluZGV4PWFycmF5Lmxlbmd0aC0xXSBUaGUgaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUgb3IgYC0xYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5sYXN0SW5kZXhPZihbMSwgMiwgMywgMSwgMiwgM10sIDIpO1xuICAgICAqIC8vID0+IDRcbiAgICAgKlxuICAgICAqIF8ubGFzdEluZGV4T2YoWzEsIDIsIDMsIDEsIDIsIDNdLCAyLCAzKTtcbiAgICAgKiAvLyA9PiAxXG4gICAgICovXG4gICAgZnVuY3Rpb24gbGFzdEluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgICAgIHZhciBpbmRleCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgICAgIGlmICh0eXBlb2YgZnJvbUluZGV4ID09ICdudW1iZXInKSB7XG4gICAgICAgIGluZGV4ID0gKGZyb21JbmRleCA8IDAgPyBuYXRpdmVNYXgoMCwgaW5kZXggKyBmcm9tSW5kZXgpIDogbmF0aXZlTWluKGZyb21JbmRleCwgaW5kZXggLSAxKSkgKyAxO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgICAgaWYgKGFycmF5W2luZGV4XSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBwcm92aWRlZCB2YWx1ZXMgZnJvbSB0aGUgZ2l2ZW4gYXJyYXkgdXNpbmcgc3RyaWN0IGVxdWFsaXR5IGZvclxuICAgICAqIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbdmFsdWVdIFRoZSB2YWx1ZXMgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgYXJyYXkgPSBbMSwgMiwgMywgMSwgMiwgM107XG4gICAgICogXy5wdWxsKGFycmF5LCAyLCAzKTtcbiAgICAgKiBjb25zb2xlLmxvZyhhcnJheSk7XG4gICAgICogLy8gPT4gWzEsIDFdXG4gICAgICovXG4gICAgZnVuY3Rpb24gcHVsbChhcnJheSkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgICAgICBhcmdzTGVuZ3RoID0gYXJncy5sZW5ndGgsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuXG4gICAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgdmFsdWUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKGFycmF5W2luZGV4XSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHNwbGljZS5jYWxsKGFycmF5LCBpbmRleC0tLCAxKTtcbiAgICAgICAgICAgIGxlbmd0aC0tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgbnVtYmVycyAocG9zaXRpdmUgYW5kL29yIG5lZ2F0aXZlKSBwcm9ncmVzc2luZyBmcm9tXG4gICAgICogYHN0YXJ0YCB1cCB0byBidXQgbm90IGluY2x1ZGluZyBgZW5kYC4gSWYgYHN0YXJ0YCBpcyBsZXNzIHRoYW4gYHN0b3BgIGFcbiAgICAgKiB6ZXJvLWxlbmd0aCByYW5nZSBpcyBjcmVhdGVkIHVubGVzcyBhIG5lZ2F0aXZlIGBzdGVwYCBpcyBzcGVjaWZpZWQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydD0wXSBUaGUgc3RhcnQgb2YgdGhlIHJhbmdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgVGhlIGVuZCBvZiB0aGUgcmFuZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGVwPTFdIFRoZSB2YWx1ZSB0byBpbmNyZW1lbnQgb3IgZGVjcmVtZW50IGJ5LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyByYW5nZSBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5yYW5nZSg0KTtcbiAgICAgKiAvLyA9PiBbMCwgMSwgMiwgM11cbiAgICAgKlxuICAgICAqIF8ucmFuZ2UoMSwgNSk7XG4gICAgICogLy8gPT4gWzEsIDIsIDMsIDRdXG4gICAgICpcbiAgICAgKiBfLnJhbmdlKDAsIDIwLCA1KTtcbiAgICAgKiAvLyA9PiBbMCwgNSwgMTAsIDE1XVxuICAgICAqXG4gICAgICogXy5yYW5nZSgwLCAtNCwgLTEpO1xuICAgICAqIC8vID0+IFswLCAtMSwgLTIsIC0zXVxuICAgICAqXG4gICAgICogXy5yYW5nZSgxLCA0LCAwKTtcbiAgICAgKiAvLyA9PiBbMSwgMSwgMV1cbiAgICAgKlxuICAgICAqIF8ucmFuZ2UoMCk7XG4gICAgICogLy8gPT4gW11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByYW5nZShzdGFydCwgZW5kLCBzdGVwKSB7XG4gICAgICBzdGFydCA9ICtzdGFydCB8fCAwO1xuICAgICAgc3RlcCA9IHR5cGVvZiBzdGVwID09ICdudW1iZXInID8gc3RlcCA6ICgrc3RlcCB8fCAxKTtcblxuICAgICAgaWYgKGVuZCA9PSBudWxsKSB7XG4gICAgICAgIGVuZCA9IHN0YXJ0O1xuICAgICAgICBzdGFydCA9IDA7XG4gICAgICB9XG4gICAgICAvLyB1c2UgYEFycmF5KGxlbmd0aClgIHNvIGVuZ2luZXMgbGlrZSBDaGFrcmEgYW5kIFY4IGF2b2lkIHNsb3dlciBtb2Rlc1xuICAgICAgLy8gaHR0cDovL3lvdXR1LmJlL1hBcUlwR1U4WlprI3Q9MTdtMjVzXG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgoMCwgY2VpbCgoZW5kIC0gc3RhcnQpIC8gKHN0ZXAgfHwgMSkpKSxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gc3RhcnQ7XG4gICAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGVsZW1lbnRzIGZyb20gYW4gYXJyYXkgdGhhdCB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleSBmb3JcbiAgICAgKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiByZW1vdmVkIGVsZW1lbnRzLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgXG4gICAgICogYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGFycmF5KS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgcmVtb3ZlZCBlbGVtZW50cy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGFycmF5ID0gWzEsIDIsIDMsIDQsIDUsIDZdO1xuICAgICAqIHZhciBldmVucyA9IF8ucmVtb3ZlKGFycmF5LCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIG51bSAlIDIgPT0gMDsgfSk7XG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhhcnJheSk7XG4gICAgICogLy8gPT4gWzEsIDMsIDVdXG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhldmVucyk7XG4gICAgICogLy8gPT4gWzIsIDQsIDZdXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVtb3ZlKGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IFtdO1xuXG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICBzcGxpY2UuY2FsbChhcnJheSwgaW5kZXgtLSwgMSk7XG4gICAgICAgICAgbGVuZ3RoLS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG9wcG9zaXRlIG9mIGBfLmluaXRpYWxgIHRoaXMgbWV0aG9kIGdldHMgYWxsIGJ1dCB0aGUgZmlyc3QgZWxlbWVudCBvclxuICAgICAqIGZpcnN0IGBuYCBlbGVtZW50cyBvZiBhbiBhcnJheS4gSWYgYSBjYWxsYmFjayBmdW5jdGlvbiBpcyBwcm92aWRlZCBlbGVtZW50c1xuICAgICAqIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5IGFyZSBleGNsdWRlZCBmcm9tIHRoZSByZXN1bHQgYXMgbG9uZyBhcyB0aGVcbiAgICAgKiBjYWxsYmFjayByZXR1cm5zIHRydWV5LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkXG4gICAgICogd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGFycmF5KS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGRyb3AsIHRhaWxcbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fG51bWJlcnxzdHJpbmd9IFtjYWxsYmFjaz0xXSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBlbGVtZW50IG9yIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gZXhjbHVkZS4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yXG4gICAgICogIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWQgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCJcbiAgICAgKiAgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBzbGljZSBvZiBgYXJyYXlgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnJlc3QoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiBbMiwgM11cbiAgICAgKlxuICAgICAqIF8ucmVzdChbMSwgMiwgM10sIDIpO1xuICAgICAqIC8vID0+IFszXVxuICAgICAqXG4gICAgICogXy5yZXN0KFsxLCAyLCAzXSwgZnVuY3Rpb24obnVtKSB7XG4gICAgICogICByZXR1cm4gbnVtIDwgMztcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBbM11cbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2Jsb2NrZWQnOiB0cnVlLCAgJ2VtcGxveWVyJzogJ3NsYXRlJyB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2Jsb2NrZWQnOiBmYWxzZSwgICdlbXBsb3llcic6ICdzbGF0ZScgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAncGViYmxlcycsICdibG9ja2VkJzogdHJ1ZSwgJ2VtcGxveWVyJzogJ25hJyB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ucGx1Y2soXy5yZXN0KGNoYXJhY3RlcnMsICdibG9ja2VkJyksICduYW1lJyk7XG4gICAgICogLy8gPT4gWydmcmVkJywgJ3BlYmJsZXMnXVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5yZXN0KGNoYXJhY3RlcnMsIHsgJ2VtcGxveWVyJzogJ3NsYXRlJyB9KTtcbiAgICAgKiAvLyA9PiBbeyAnbmFtZSc6ICdwZWJibGVzJywgJ2Jsb2NrZWQnOiB0cnVlLCAnZW1wbG95ZXInOiAnbmEnIH1dXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzdChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ251bWJlcicgJiYgY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICB2YXIgbiA9IDAsXG4gICAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuXG4gICAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGggJiYgY2FsbGJhY2soYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICAgICAgbisrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuID0gKGNhbGxiYWNrID09IG51bGwgfHwgdGhpc0FyZykgPyAxIDogbmF0aXZlTWF4KDAsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzbGljZShhcnJheSwgbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlcyBhIGJpbmFyeSBzZWFyY2ggdG8gZGV0ZXJtaW5lIHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaCBhIHZhbHVlXG4gICAgICogc2hvdWxkIGJlIGluc2VydGVkIGludG8gYSBnaXZlbiBzb3J0ZWQgYXJyYXkgaW4gb3JkZXIgdG8gbWFpbnRhaW4gdGhlIHNvcnRcbiAgICAgKiBvcmRlciBvZiB0aGUgYXJyYXkuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSBleGVjdXRlZCBmb3JcbiAgICAgKiBgdmFsdWVgIGFuZCBlYWNoIGVsZW1lbnQgb2YgYGFycmF5YCB0byBjb21wdXRlIHRoZWlyIHNvcnQgcmFua2luZy4gVGhlXG4gICAgICogY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggb25lIGFyZ3VtZW50OyAodmFsdWUpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gZXZhbHVhdGUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBhdCB3aGljaCBgdmFsdWVgIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAqICBpbnRvIGBhcnJheWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uc29ydGVkSW5kZXgoWzIwLCAzMCwgNTBdLCA0MCk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5zb3J0ZWRJbmRleChbeyAneCc6IDIwIH0sIHsgJ3gnOiAzMCB9LCB7ICd4JzogNTAgfV0sIHsgJ3gnOiA0MCB9LCAneCcpO1xuICAgICAqIC8vID0+IDJcbiAgICAgKlxuICAgICAqIHZhciBkaWN0ID0ge1xuICAgICAqICAgJ3dvcmRUb051bWJlcic6IHsgJ3R3ZW50eSc6IDIwLCAndGhpcnR5JzogMzAsICdmb3VydHknOiA0MCwgJ2ZpZnR5JzogNTAgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiBfLnNvcnRlZEluZGV4KFsndHdlbnR5JywgJ3RoaXJ0eScsICdmaWZ0eSddLCAnZm91cnR5JywgZnVuY3Rpb24od29yZCkge1xuICAgICAqICAgcmV0dXJuIGRpY3Qud29yZFRvTnVtYmVyW3dvcmRdO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IDJcbiAgICAgKlxuICAgICAqIF8uc29ydGVkSW5kZXgoWyd0d2VudHknLCAndGhpcnR5JywgJ2ZpZnR5J10sICdmb3VydHknLCBmdW5jdGlvbih3b3JkKSB7XG4gICAgICogICByZXR1cm4gdGhpcy53b3JkVG9OdW1iZXJbd29yZF07XG4gICAgICogfSwgZGljdCk7XG4gICAgICogLy8gPT4gMlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNvcnRlZEluZGV4KGFycmF5LCB2YWx1ZSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBsb3cgPSAwLFxuICAgICAgICAgIGhpZ2ggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IGxvdztcblxuICAgICAgLy8gZXhwbGljaXRseSByZWZlcmVuY2UgYGlkZW50aXR5YCBmb3IgYmV0dGVyIGlubGluaW5nIGluIEZpcmVmb3hcbiAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgPyBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDEpIDogaWRlbnRpdHk7XG4gICAgICB2YWx1ZSA9IGNhbGxiYWNrKHZhbHVlKTtcblxuICAgICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgICAgKGNhbGxiYWNrKGFycmF5W21pZF0pIDwgdmFsdWUpXG4gICAgICAgICAgPyBsb3cgPSBtaWQgKyAxXG4gICAgICAgICAgOiBoaWdoID0gbWlkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvdztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHVuaXF1ZSB2YWx1ZXMsIGluIG9yZGVyLCBvZiB0aGUgcHJvdmlkZWQgYXJyYXlzIHVzaW5nXG4gICAgICogc3RyaWN0IGVxdWFsaXR5IGZvciBjb21wYXJpc29ucywgaS5lLiBgPT09YC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0gey4uLkFycmF5fSBbYXJyYXldIFRoZSBhcnJheXMgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgY29tYmluZWQgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnVuaW9uKFsxLCAyLCAzXSwgWzUsIDIsIDEsIDRdLCBbMiwgMV0pO1xuICAgICAqIC8vID0+IFsxLCAyLCAzLCA1LCA0XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVuaW9uKCkge1xuICAgICAgcmV0dXJuIGJhc2VVbmlxKGJhc2VGbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBkdXBsaWNhdGUtdmFsdWUtZnJlZSB2ZXJzaW9uIG9mIGFuIGFycmF5IHVzaW5nIHN0cmljdCBlcXVhbGl0eVxuICAgICAqIGZvciBjb21wYXJpc29ucywgaS5lLiBgPT09YC4gSWYgdGhlIGFycmF5IGlzIHNvcnRlZCwgcHJvdmlkaW5nXG4gICAgICogYHRydWVgIGZvciBgaXNTb3J0ZWRgIHdpbGwgdXNlIGEgZmFzdGVyIGFsZ29yaXRobS4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZFxuICAgICAqIGVhY2ggZWxlbWVudCBvZiBgYXJyYXlgIGlzIHBhc3NlZCB0aHJvdWdoIHRoZSBjYWxsYmFjayBiZWZvcmUgdW5pcXVlbmVzc1xuICAgICAqIGlzIGNvbXB1dGVkLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWVcbiAgICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGFycmF5KS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIHVuaXF1ZVxuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NvcnRlZD1mYWxzZV0gQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgYGFycmF5YCBpcyBzb3J0ZWQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBkdXBsaWNhdGUtdmFsdWUtZnJlZSBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy51bmlxKFsxLCAyLCAxLCAzLCAxXSk7XG4gICAgICogLy8gPT4gWzEsIDIsIDNdXG4gICAgICpcbiAgICAgKiBfLnVuaXEoWzEsIDEsIDIsIDIsIDNdLCB0cnVlKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgM11cbiAgICAgKlxuICAgICAqIF8udW5pcShbJ0EnLCAnYicsICdDJywgJ2EnLCAnQicsICdjJ10sIGZ1bmN0aW9uKGxldHRlcikgeyByZXR1cm4gbGV0dGVyLnRvTG93ZXJDYXNlKCk7IH0pO1xuICAgICAqIC8vID0+IFsnQScsICdiJywgJ0MnXVxuICAgICAqXG4gICAgICogXy51bmlxKFsxLCAyLjUsIDMsIDEuNSwgMiwgMy41XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiB0aGlzLmZsb29yKG51bSk7IH0sIE1hdGgpO1xuICAgICAqIC8vID0+IFsxLCAyLjUsIDNdXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnVuaXEoW3sgJ3gnOiAxIH0sIHsgJ3gnOiAyIH0sIHsgJ3gnOiAxIH1dLCAneCcpO1xuICAgICAqIC8vID0+IFt7ICd4JzogMSB9LCB7ICd4JzogMiB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVuaXEoYXJyYXksIGlzU29ydGVkLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8ganVnZ2xlIGFyZ3VtZW50c1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCAhPSAnYm9vbGVhbicgJiYgaXNTb3J0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzQXJnID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gKHR5cGVvZiBpc1NvcnRlZCAhPSAnZnVuY3Rpb24nICYmIHRoaXNBcmcgJiYgdGhpc0FyZ1tpc1NvcnRlZF0gPT09IGFycmF5KSA/IG51bGwgOiBpc1NvcnRlZDtcbiAgICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBiYXNlVW5pcShhcnJheSwgaXNTb3J0ZWQsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IGV4Y2x1ZGluZyBhbGwgcHJvdmlkZWQgdmFsdWVzIHVzaW5nIHN0cmljdCBlcXVhbGl0eSBmb3JcbiAgICAgKiBjb21wYXJpc29ucywgaS5lLiBgPT09YC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmlsdGVyLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW3ZhbHVlXSBUaGUgdmFsdWVzIHRvIGV4Y2x1ZGUuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGZpbHRlcmVkIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy53aXRob3V0KFsxLCAyLCAxLCAwLCAzLCAxLCA0XSwgMCwgMSk7XG4gICAgICogLy8gPT4gWzIsIDMsIDRdXG4gICAgICovXG4gICAgZnVuY3Rpb24gd2l0aG91dChhcnJheSkge1xuICAgICAgcmV0dXJuIGJhc2VEaWZmZXJlbmNlKGFycmF5LCBzbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IHRoYXQgaXMgdGhlIHN5bW1ldHJpYyBkaWZmZXJlbmNlIG9mIHRoZSBwcm92aWRlZCBhcnJheXMuXG4gICAgICogU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU3ltbWV0cmljX2RpZmZlcmVuY2UuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHsuLi5BcnJheX0gW2FycmF5XSBUaGUgYXJyYXlzIHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy54b3IoWzEsIDIsIDNdLCBbNSwgMiwgMSwgNF0pO1xuICAgICAqIC8vID0+IFszLCA1LCA0XVxuICAgICAqXG4gICAgICogXy54b3IoWzEsIDIsIDVdLCBbMiwgMywgNV0sIFszLCA0LCA1XSk7XG4gICAgICogLy8gPT4gWzEsIDQsIDVdXG4gICAgICovXG4gICAgZnVuY3Rpb24geG9yKCkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgaWYgKGlzQXJyYXkoYXJyYXkpIHx8IGlzQXJndW1lbnRzKGFycmF5KSkge1xuICAgICAgICAgIHZhciByZXN1bHQgPSByZXN1bHRcbiAgICAgICAgICAgID8gYmFzZVVuaXEoYmFzZURpZmZlcmVuY2UocmVzdWx0LCBhcnJheSkuY29uY2F0KGJhc2VEaWZmZXJlbmNlKGFycmF5LCByZXN1bHQpKSlcbiAgICAgICAgICAgIDogYXJyYXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQgfHwgW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiBncm91cGVkIGVsZW1lbnRzLCB0aGUgZmlyc3Qgb2Ygd2hpY2ggY29udGFpbnMgdGhlIGZpcnN0XG4gICAgICogZWxlbWVudHMgb2YgdGhlIGdpdmVuIGFycmF5cywgdGhlIHNlY29uZCBvZiB3aGljaCBjb250YWlucyB0aGUgc2Vjb25kXG4gICAgICogZWxlbWVudHMgb2YgdGhlIGdpdmVuIGFycmF5cywgYW5kIHNvIG9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIHVuemlwXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7Li4uQXJyYXl9IFthcnJheV0gQXJyYXlzIHRvIHByb2Nlc3MuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGdyb3VwZWQgZWxlbWVudHMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uemlwKFsnZnJlZCcsICdiYXJuZXknXSwgWzMwLCA0MF0sIFt0cnVlLCBmYWxzZV0pO1xuICAgICAqIC8vID0+IFtbJ2ZyZWQnLCAzMCwgdHJ1ZV0sIFsnYmFybmV5JywgNDAsIGZhbHNlXV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB6aXAoKSB7XG4gICAgICB2YXIgYXJyYXkgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50cyA6IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gbWF4KHBsdWNrKGFycmF5LCAnbGVuZ3RoJykpIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGggPCAwID8gMCA6IGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBwbHVjayhhcnJheSwgaW5kZXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBmcm9tIGFycmF5cyBvZiBga2V5c2AgYW5kIGB2YWx1ZXNgLiBQcm92aWRlXG4gICAgICogZWl0aGVyIGEgc2luZ2xlIHR3byBkaW1lbnNpb25hbCBhcnJheSwgaS5lLiBgW1trZXkxLCB2YWx1ZTFdLCBba2V5MiwgdmFsdWUyXV1gXG4gICAgICogb3IgdHdvIGFycmF5cywgb25lIG9mIGBrZXlzYCBhbmQgb25lIG9mIGNvcnJlc3BvbmRpbmcgYHZhbHVlc2AuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgb2JqZWN0XG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGtleXMgVGhlIGFycmF5IG9mIGtleXMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlcz1bXV0gVGhlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGFuIG9iamVjdCBjb21wb3NlZCBvZiB0aGUgZ2l2ZW4ga2V5cyBhbmRcbiAgICAgKiAgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uemlwT2JqZWN0KFsnZnJlZCcsICdiYXJuZXknXSwgWzMwLCA0MF0pO1xuICAgICAqIC8vID0+IHsgJ2ZyZWQnOiAzMCwgJ2Jhcm5leSc6IDQwIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB6aXBPYmplY3Qoa2V5cywgdmFsdWVzKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBrZXlzID8ga2V5cy5sZW5ndGggOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICBpZiAoIXZhbHVlcyAmJiBsZW5ndGggJiYgIWlzQXJyYXkoa2V5c1swXSkpIHtcbiAgICAgICAgdmFsdWVzID0gW107XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpbmRleF07XG4gICAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlc1tpbmRleF07XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5KSB7XG4gICAgICAgICAgcmVzdWx0W2tleVswXV0gPSBrZXlbMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyBgZnVuY2AsIHdpdGggIHRoZSBgdGhpc2AgYmluZGluZyBhbmRcbiAgICAgKiBhcmd1bWVudHMgb2YgdGhlIGNyZWF0ZWQgZnVuY3Rpb24sIG9ubHkgYWZ0ZXIgYmVpbmcgY2FsbGVkIGBuYCB0aW1lcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBiZWZvcmVcbiAgICAgKiAgYGZ1bmNgIGlzIGV4ZWN1dGVkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHJlc3RyaWN0LlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHJlc3RyaWN0ZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBzYXZlcyA9IFsncHJvZmlsZScsICdzZXR0aW5ncyddO1xuICAgICAqXG4gICAgICogdmFyIGRvbmUgPSBfLmFmdGVyKHNhdmVzLmxlbmd0aCwgZnVuY3Rpb24oKSB7XG4gICAgICogICBjb25zb2xlLmxvZygnRG9uZSBzYXZpbmchJyk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBfLmZvckVhY2goc2F2ZXMsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgKiAgIGFzeW5jU2F2ZSh7ICd0eXBlJzogdHlwZSwgJ2NvbXBsZXRlJzogZG9uZSB9KTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBsb2dzICdEb25lIHNhdmluZyEnLCBhZnRlciBhbGwgc2F2ZXMgaGF2ZSBjb21wbGV0ZWRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhZnRlcihuLCBmdW5jKSB7XG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKC0tbiA8IDEpIHtcbiAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgXG4gICAgICogYmluZGluZyBvZiBgdGhpc0FyZ2AgYW5kIHByZXBlbmRzIGFueSBhZGRpdGlvbmFsIGBiaW5kYCBhcmd1bWVudHMgdG8gdGhvc2VcbiAgICAgKiBwcm92aWRlZCB0byB0aGUgYm91bmQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmluZC5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJvdW5kIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgZnVuYyA9IGZ1bmN0aW9uKGdyZWV0aW5nKSB7XG4gICAgICogICByZXR1cm4gZ3JlZXRpbmcgKyAnICcgKyB0aGlzLm5hbWU7XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIGZ1bmMgPSBfLmJpbmQoZnVuYywgeyAnbmFtZSc6ICdmcmVkJyB9LCAnaGknKTtcbiAgICAgKiBmdW5jKCk7XG4gICAgICogLy8gPT4gJ2hpIGZyZWQnXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmluZChmdW5jLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDJcbiAgICAgICAgPyBjcmVhdGVXcmFwcGVyKGZ1bmMsIDE3LCBzbGljZShhcmd1bWVudHMsIDIpLCBudWxsLCB0aGlzQXJnKVxuICAgICAgICA6IGNyZWF0ZVdyYXBwZXIoZnVuYywgMSwgbnVsbCwgbnVsbCwgdGhpc0FyZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmluZHMgbWV0aG9kcyBvZiBhbiBvYmplY3QgdG8gdGhlIG9iamVjdCBpdHNlbGYsIG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZ1xuICAgICAqIG1ldGhvZC4gTWV0aG9kIG5hbWVzIG1heSBiZSBzcGVjaWZpZWQgYXMgaW5kaXZpZHVhbCBhcmd1bWVudHMgb3IgYXMgYXJyYXlzXG4gICAgICogb2YgbWV0aG9kIG5hbWVzLiBJZiBubyBtZXRob2QgbmFtZXMgYXJlIHByb3ZpZGVkIGFsbCB0aGUgZnVuY3Rpb24gcHJvcGVydGllc1xuICAgICAqIG9mIGBvYmplY3RgIHdpbGwgYmUgYm91bmQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJpbmQgYW5kIGFzc2lnbiB0aGUgYm91bmQgbWV0aG9kcyB0by5cbiAgICAgKiBAcGFyYW0gey4uLnN0cmluZ30gW21ldGhvZE5hbWVdIFRoZSBvYmplY3QgbWV0aG9kIG5hbWVzIHRvXG4gICAgICogIGJpbmQsIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIG1ldGhvZCBuYW1lcyBvciBhcnJheXMgb2YgbWV0aG9kIG5hbWVzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciB2aWV3ID0ge1xuICAgICAqICAgJ2xhYmVsJzogJ2RvY3MnLFxuICAgICAqICAgJ29uQ2xpY2snOiBmdW5jdGlvbigpIHsgY29uc29sZS5sb2coJ2NsaWNrZWQgJyArIHRoaXMubGFiZWwpOyB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uYmluZEFsbCh2aWV3KTtcbiAgICAgKiBqUXVlcnkoJyNkb2NzJykub24oJ2NsaWNrJywgdmlldy5vbkNsaWNrKTtcbiAgICAgKiAvLyA9PiBsb2dzICdjbGlja2VkIGRvY3MnLCB3aGVuIHRoZSBidXR0b24gaXMgY2xpY2tlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJpbmRBbGwob2JqZWN0KSB7XG4gICAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGJhc2VGbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgZmFsc2UsIDEpIDogZnVuY3Rpb25zKG9iamVjdCksXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBmdW5jcy5sZW5ndGg7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBrZXkgPSBmdW5jc1tpbmRleF07XG4gICAgICAgIG9iamVjdFtrZXldID0gY3JlYXRlV3JhcHBlcihvYmplY3Rba2V5XSwgMSwgbnVsbCwgbnVsbCwgb2JqZWN0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBpbnZva2VzIHRoZSBtZXRob2QgYXQgYG9iamVjdFtrZXldYFxuICAgICAqIGFuZCBwcmVwZW5kcyBhbnkgYWRkaXRpb25hbCBgYmluZEtleWAgYXJndW1lbnRzIHRvIHRob3NlIHByb3ZpZGVkIHRvIHRoZSBib3VuZFxuICAgICAqIGZ1bmN0aW9uLiBUaGlzIG1ldGhvZCBkaWZmZXJzIGZyb20gYF8uYmluZGAgYnkgYWxsb3dpbmcgYm91bmQgZnVuY3Rpb25zIHRvXG4gICAgICogcmVmZXJlbmNlIG1ldGhvZHMgdGhhdCB3aWxsIGJlIHJlZGVmaW5lZCBvciBkb24ndCB5ZXQgZXhpc3QuXG4gICAgICogU2VlIGh0dHA6Ly9taWNoYXV4LmNhL2FydGljbGVzL2xhenktZnVuY3Rpb24tZGVmaW5pdGlvbi1wYXR0ZXJuLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0aGUgbWV0aG9kIGJlbG9uZ3MgdG8uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBtZXRob2QuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbYXJnXSBBcmd1bWVudHMgdG8gYmUgcGFydGlhbGx5IGFwcGxpZWQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSB7XG4gICAgICogICAnbmFtZSc6ICdmcmVkJyxcbiAgICAgKiAgICdncmVldCc6IGZ1bmN0aW9uKGdyZWV0aW5nKSB7XG4gICAgICogICAgIHJldHVybiBncmVldGluZyArICcgJyArIHRoaXMubmFtZTtcbiAgICAgKiAgIH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIGZ1bmMgPSBfLmJpbmRLZXkob2JqZWN0LCAnZ3JlZXQnLCAnaGknKTtcbiAgICAgKiBmdW5jKCk7XG4gICAgICogLy8gPT4gJ2hpIGZyZWQnXG4gICAgICpcbiAgICAgKiBvYmplY3QuZ3JlZXQgPSBmdW5jdGlvbihncmVldGluZykge1xuICAgICAqICAgcmV0dXJuIGdyZWV0aW5nICsgJ3lhICcgKyB0aGlzLm5hbWUgKyAnISc7XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIGZ1bmMoKTtcbiAgICAgKiAvLyA9PiAnaGl5YSBmcmVkISdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiaW5kS2V5KG9iamVjdCwga2V5KSB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDJcbiAgICAgICAgPyBjcmVhdGVXcmFwcGVyKGtleSwgMTksIHNsaWNlKGFyZ3VtZW50cywgMiksIG51bGwsIG9iamVjdClcbiAgICAgICAgOiBjcmVhdGVXcmFwcGVyKGtleSwgMywgbnVsbCwgbnVsbCwgb2JqZWN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgdGhlIHByb3ZpZGVkIGZ1bmN0aW9ucyxcbiAgICAgKiB3aGVyZSBlYWNoIGZ1bmN0aW9uIGNvbnN1bWVzIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgICAgKiBGb3IgZXhhbXBsZSwgY29tcG9zaW5nIHRoZSBmdW5jdGlvbnMgYGYoKWAsIGBnKClgLCBhbmQgYGgoKWAgcHJvZHVjZXMgYGYoZyhoKCkpKWAuXG4gICAgICogRWFjaCBmdW5jdGlvbiBpcyBleGVjdXRlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgY29tcG9zZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHsuLi5GdW5jdGlvbn0gW2Z1bmNdIEZ1bmN0aW9ucyB0byBjb21wb3NlLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGNvbXBvc2VkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgcmVhbE5hbWVNYXAgPSB7XG4gICAgICogICAncGViYmxlcyc6ICdwZW5lbG9wZSdcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIGZvcm1hdCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgKiAgIG5hbWUgPSByZWFsTmFtZU1hcFtuYW1lLnRvTG93ZXJDYXNlKCldIHx8IG5hbWU7XG4gICAgICogICByZXR1cm4gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIGdyZWV0ID0gZnVuY3Rpb24oZm9ybWF0dGVkKSB7XG4gICAgICogICByZXR1cm4gJ0hpeWEgJyArIGZvcm1hdHRlZCArICchJztcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogdmFyIHdlbGNvbWUgPSBfLmNvbXBvc2UoZ3JlZXQsIGZvcm1hdCk7XG4gICAgICogd2VsY29tZSgncGViYmxlcycpO1xuICAgICAqIC8vID0+ICdIaXlhIFBlbmVsb3BlISdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wb3NlKCkge1xuICAgICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzLFxuICAgICAgICAgIGxlbmd0aCA9IGZ1bmNzLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jc1tsZW5ndGhdKSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgICBsZW5ndGggPSBmdW5jcy5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAgYXJncyA9IFtmdW5jc1tsZW5ndGhdLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJnc1swXTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgb25lIG9yIG1vcmUgYXJndW1lbnRzIG9mIGBmdW5jYCB0aGF0IHdoZW5cbiAgICAgKiBpbnZva2VkIGVpdGhlciBleGVjdXRlcyBgZnVuY2AgcmV0dXJuaW5nIGl0cyByZXN1bHQsIGlmIGFsbCBgZnVuY2AgYXJndW1lbnRzXG4gICAgICogaGF2ZSBiZWVuIHByb3ZpZGVkLCBvciByZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIG9uZSBvciBtb3JlIG9mIHRoZVxuICAgICAqIHJlbWFpbmluZyBgZnVuY2AgYXJndW1lbnRzLCBhbmQgc28gb24uIFRoZSBhcml0eSBvZiBgZnVuY2AgY2FuIGJlIHNwZWNpZmllZFxuICAgICAqIGlmIGBmdW5jLmxlbmd0aGAgaXMgbm90IHN1ZmZpY2llbnQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFthcml0eT1mdW5jLmxlbmd0aF0gVGhlIGFyaXR5IG9mIGBmdW5jYC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY3VycmllZCA9IF8uY3VycnkoZnVuY3Rpb24oYSwgYiwgYykge1xuICAgICAqICAgY29uc29sZS5sb2coYSArIGIgKyBjKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIGN1cnJpZWQoMSkoMikoMyk7XG4gICAgICogLy8gPT4gNlxuICAgICAqXG4gICAgICogY3VycmllZCgxLCAyKSgzKTtcbiAgICAgKiAvLyA9PiA2XG4gICAgICpcbiAgICAgKiBjdXJyaWVkKDEsIDIsIDMpO1xuICAgICAqIC8vID0+IDZcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjdXJyeShmdW5jLCBhcml0eSkge1xuICAgICAgYXJpdHkgPSB0eXBlb2YgYXJpdHkgPT0gJ251bWJlcicgPyBhcml0eSA6ICgrYXJpdHkgfHwgZnVuYy5sZW5ndGgpO1xuICAgICAgcmV0dXJuIGNyZWF0ZVdyYXBwZXIoZnVuYywgNCwgbnVsbCwgbnVsbCwgbnVsbCwgYXJpdHkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiBvZiBgZnVuY2AgdW50aWwgYWZ0ZXJcbiAgICAgKiBgd2FpdGAgbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIGl0IHdhcyBpbnZva2VkLlxuICAgICAqIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgdGhhdCBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb25cbiAgICAgKiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHNcbiAgICAgKiB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gICAgICpcbiAgICAgKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgIGBmdW5jYCB3aWxsIGJlIGNhbGxlZFxuICAgICAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcbiAgICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgY2FsbGVkLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XG4gICAgICogdmFyIGxhenlMYXlvdXQgPSBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKTtcbiAgICAgKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgbGF6eUxheW91dCk7XG4gICAgICpcbiAgICAgKiAvLyBleGVjdXRlIGBzZW5kTWFpbGAgd2hlbiB0aGUgY2xpY2sgZXZlbnQgaXMgZmlyZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxsc1xuICAgICAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAgICAgKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAgICAgKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiAvLyBlbnN1cmUgYGJhdGNoTG9nYCBpcyBleGVjdXRlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxsc1xuICAgICAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAgICAgKiBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xuICAgICAqICAgJ21heFdhaXQnOiAxMDAwXG4gICAgICogfSwgZmFsc2UpO1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhcmdzLFxuICAgICAgICAgIG1heFRpbWVvdXRJZCxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgc3RhbXAsXG4gICAgICAgICAgdGhpc0FyZyxcbiAgICAgICAgICB0aW1lb3V0SWQsXG4gICAgICAgICAgdHJhaWxpbmdDYWxsLFxuICAgICAgICAgIGxhc3RDYWxsZWQgPSAwLFxuICAgICAgICAgIG1heFdhaXQgPSBmYWxzZSxcbiAgICAgICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgfVxuICAgICAgd2FpdCA9IG5hdGl2ZU1heCgwLCB3YWl0KSB8fCAwO1xuICAgICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICAgICAgdmFyIGxlYWRpbmcgPSB0cnVlO1xuICAgICAgICB0cmFpbGluZyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICBsZWFkaW5nID0gb3B0aW9ucy5sZWFkaW5nO1xuICAgICAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgKG5hdGl2ZU1heCh3YWl0LCBvcHRpb25zLm1heFdhaXQpIHx8IDApO1xuICAgICAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgICAgIH1cbiAgICAgIHZhciBkZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdygpIC0gc3RhbXApO1xuICAgICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQobWF4VGltZW91dElkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGlzQ2FsbGVkID0gdHJhaWxpbmdDYWxsO1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgbWF4RGVsYXllZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGltZW91dElkKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHJhaWxpbmcgfHwgKG1heFdhaXQgIT09IHdhaXQpKSB7XG4gICAgICAgICAgbGFzdENhbGxlZCA9IG5vdygpO1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgICAgaWYgKCF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgICAgYXJncyA9IHRoaXNBcmcgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICBzdGFtcCA9IG5vdygpO1xuICAgICAgICB0aGlzQXJnID0gdGhpcztcbiAgICAgICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XG5cbiAgICAgICAgaWYgKG1heFdhaXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGxlYWRpbmdDYWxsID0gbGVhZGluZyAmJiAhdGltZW91dElkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghbWF4VGltZW91dElkICYmICFsZWFkaW5nKSB7XG4gICAgICAgICAgICBsYXN0Q2FsbGVkID0gc3RhbXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByZW1haW5pbmcgPSBtYXhXYWl0IC0gKHN0YW1wIC0gbGFzdENhbGxlZCksXG4gICAgICAgICAgICAgIGlzQ2FsbGVkID0gcmVtYWluaW5nIDw9IDA7XG5cbiAgICAgICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgICAgbWF4VGltZW91dElkID0gY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0Q2FsbGVkID0gc3RhbXA7XG4gICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICghbWF4VGltZW91dElkKSB7XG4gICAgICAgICAgICBtYXhUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KG1heERlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc0NhbGxlZCAmJiB0aW1lb3V0SWQpIHtcbiAgICAgICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghdGltZW91dElkICYmIHdhaXQgIT09IG1heFdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkaW5nQ2FsbCkge1xuICAgICAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgICBhcmdzID0gdGhpc0FyZyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVmZXJzIGV4ZWN1dGluZyB0aGUgYGZ1bmNgIGZ1bmN0aW9uIHVudGlsIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzIGNsZWFyZWQuXG4gICAgICogQWRkaXRpb25hbCBhcmd1bWVudHMgd2lsbCBiZSBwcm92aWRlZCB0byBgZnVuY2Agd2hlbiBpdCBpcyBpbnZva2VkLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlZmVyLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGludm9rZSB0aGUgZnVuY3Rpb24gd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lciBpZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5kZWZlcihmdW5jdGlvbih0ZXh0KSB7IGNvbnNvbGUubG9nKHRleHQpOyB9LCAnZGVmZXJyZWQnKTtcbiAgICAgKiAvLyBsb2dzICdkZWZlcnJlZCcgYWZ0ZXIgb25lIG9yIG1vcmUgbWlsbGlzZWNvbmRzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVmZXIoZnVuYykge1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB9XG4gICAgICB2YXIgYXJncyA9IHNsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3MpOyB9LCAxKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyB0aGUgYGZ1bmNgIGZ1bmN0aW9uIGFmdGVyIGB3YWl0YCBtaWxsaXNlY29uZHMuIEFkZGl0aW9uYWwgYXJndW1lbnRzXG4gICAgICogd2lsbCBiZSBwcm92aWRlZCB0byBgZnVuY2Agd2hlbiBpdCBpcyBpbnZva2VkLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlbGF5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0IFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGV4ZWN1dGlvbi5cbiAgICAgKiBAcGFyYW0gey4uLip9IFthcmddIEFyZ3VtZW50cyB0byBpbnZva2UgdGhlIGZ1bmN0aW9uIHdpdGguXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXIgaWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZGVsYXkoZnVuY3Rpb24odGV4dCkgeyBjb25zb2xlLmxvZyh0ZXh0KTsgfSwgMTAwMCwgJ2xhdGVyJyk7XG4gICAgICogLy8gPT4gbG9ncyAnbGF0ZXInIGFmdGVyIG9uZSBzZWNvbmRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkZWxheShmdW5jLCB3YWl0KSB7XG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHZhciBhcmdzID0gc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7IH0sIHdhaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IG1lbW9pemVzIHRoZSByZXN1bHQgb2YgYGZ1bmNgLiBJZiBgcmVzb2x2ZXJgIGlzXG4gICAgICogcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgY2FjaGUga2V5IGZvciBzdG9yaW5nIHRoZSByZXN1bHRcbiAgICAgKiBiYXNlZCBvbiB0aGUgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBtZW1vaXplZCBmdW5jdGlvbi4gQnkgZGVmYXVsdCwgdGhlXG4gICAgICogZmlyc3QgYXJndW1lbnQgcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlIGNhY2hlIGtleS5cbiAgICAgKiBUaGUgYGZ1bmNgIGlzIGV4ZWN1dGVkIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBtZW1vaXplZCBmdW5jdGlvbi5cbiAgICAgKiBUaGUgcmVzdWx0IGNhY2hlIGlzIGV4cG9zZWQgYXMgdGhlIGBjYWNoZWAgcHJvcGVydHkgb24gdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbcmVzb2x2ZXJdIEEgZnVuY3Rpb24gdXNlZCB0byByZXNvbHZlIHRoZSBjYWNoZSBrZXkuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgbWVtb2l6aW5nIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgZmlib25hY2NpID0gXy5tZW1vaXplKGZ1bmN0aW9uKG4pIHtcbiAgICAgKiAgIHJldHVybiBuIDwgMiA/IG4gOiBmaWJvbmFjY2kobiAtIDEpICsgZmlib25hY2NpKG4gLSAyKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIGZpYm9uYWNjaSg5KVxuICAgICAqIC8vID0+IDM0XG4gICAgICpcbiAgICAgKiB2YXIgZGF0YSA9IHtcbiAgICAgKiAgICdmcmVkJzogeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH0sXG4gICAgICogICAncGViYmxlcyc6IHsgJ25hbWUnOiAncGViYmxlcycsICdhZ2UnOiAxIH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogLy8gbW9kaWZ5aW5nIHRoZSByZXN1bHQgY2FjaGVcbiAgICAgKiB2YXIgZ2V0ID0gXy5tZW1vaXplKGZ1bmN0aW9uKG5hbWUpIHsgcmV0dXJuIGRhdGFbbmFtZV07IH0sIF8uaWRlbnRpdHkpO1xuICAgICAqIGdldCgncGViYmxlcycpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAncGViYmxlcycsICdhZ2UnOiAxIH1cbiAgICAgKlxuICAgICAqIGdldC5jYWNoZS5wZWJibGVzLm5hbWUgPSAncGVuZWxvcGUnO1xuICAgICAqIGdldCgncGViYmxlcycpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAncGVuZWxvcGUnLCAnYWdlJzogMSB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gbWVtb2l6ZShmdW5jLCByZXNvbHZlcikge1xuICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB9XG4gICAgICB2YXIgbWVtb2l6ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNhY2hlID0gbWVtb2l6ZWQuY2FjaGUsXG4gICAgICAgICAgICBrZXkgPSByZXNvbHZlciA/IHJlc29sdmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBrZXlQcmVmaXggKyBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoY2FjaGUsIGtleSlcbiAgICAgICAgICA/IGNhY2hlW2tleV1cbiAgICAgICAgICA6IChjYWNoZVtrZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgIH1cbiAgICAgIG1lbW9pemVkLmNhY2hlID0ge307XG4gICAgICByZXR1cm4gbWVtb2l6ZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaXMgcmVzdHJpY3RlZCB0byBleGVjdXRlIGBmdW5jYCBvbmNlLiBSZXBlYXQgY2FsbHMgdG9cbiAgICAgKiB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBjYWxsLiBUaGUgYGZ1bmNgIGlzIGV4ZWN1dGVkXG4gICAgICogd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIGNyZWF0ZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gcmVzdHJpY3QuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgcmVzdHJpY3RlZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGluaXRpYWxpemUgPSBfLm9uY2UoY3JlYXRlQXBwbGljYXRpb24pO1xuICAgICAqIGluaXRpYWxpemUoKTtcbiAgICAgKiBpbml0aWFsaXplKCk7XG4gICAgICogLy8gYGluaXRpYWxpemVgIGV4ZWN1dGVzIGBjcmVhdGVBcHBsaWNhdGlvbmAgb25jZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uY2UoZnVuYykge1xuICAgICAgdmFyIHJhbixcbiAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocmFuKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgLy8gY2xlYXIgdGhlIGBmdW5jYCB2YXJpYWJsZSBzbyB0aGUgZnVuY3Rpb24gbWF5IGJlIGdhcmJhZ2UgY29sbGVjdGVkXG4gICAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGludm9rZXMgYGZ1bmNgIHdpdGggYW55IGFkZGl0aW9uYWxcbiAgICAgKiBgcGFydGlhbGAgYXJndW1lbnRzIHByZXBlbmRlZCB0byB0aG9zZSBwcm92aWRlZCB0byB0aGUgbmV3IGZ1bmN0aW9uLiBUaGlzXG4gICAgICogbWV0aG9kIGlzIHNpbWlsYXIgdG8gYF8uYmluZGAgZXhjZXB0IGl0IGRvZXMgKipub3QqKiBhbHRlciB0aGUgYHRoaXNgIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gcGFydGlhbGx5IGFwcGx5IGFyZ3VtZW50cyB0by5cbiAgICAgKiBAcGFyYW0gey4uLip9IFthcmddIEFyZ3VtZW50cyB0byBiZSBwYXJ0aWFsbHkgYXBwbGllZC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBwYXJ0aWFsbHkgYXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGdyZWV0ID0gZnVuY3Rpb24oZ3JlZXRpbmcsIG5hbWUpIHsgcmV0dXJuIGdyZWV0aW5nICsgJyAnICsgbmFtZTsgfTtcbiAgICAgKiB2YXIgaGkgPSBfLnBhcnRpYWwoZ3JlZXQsICdoaScpO1xuICAgICAqIGhpKCdmcmVkJyk7XG4gICAgICogLy8gPT4gJ2hpIGZyZWQnXG4gICAgICovXG4gICAgZnVuY3Rpb24gcGFydGlhbChmdW5jKSB7XG4gICAgICByZXR1cm4gY3JlYXRlV3JhcHBlcihmdW5jLCAxNiwgc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5wYXJ0aWFsYCBleGNlcHQgdGhhdCBgcGFydGlhbGAgYXJndW1lbnRzIGFyZVxuICAgICAqIGFwcGVuZGVkIHRvIHRob3NlIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gcGFydGlhbGx5IGFwcGx5IGFyZ3VtZW50cyB0by5cbiAgICAgKiBAcGFyYW0gey4uLip9IFthcmddIEFyZ3VtZW50cyB0byBiZSBwYXJ0aWFsbHkgYXBwbGllZC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBwYXJ0aWFsbHkgYXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGRlZmF1bHRzRGVlcCA9IF8ucGFydGlhbFJpZ2h0KF8ubWVyZ2UsIF8uZGVmYXVsdHMpO1xuICAgICAqXG4gICAgICogdmFyIG9wdGlvbnMgPSB7XG4gICAgICogICAndmFyaWFibGUnOiAnZGF0YScsXG4gICAgICogICAnaW1wb3J0cyc6IHsgJ2pxJzogJCB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIGRlZmF1bHRzRGVlcChvcHRpb25zLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuICAgICAqXG4gICAgICogb3B0aW9ucy52YXJpYWJsZVxuICAgICAqIC8vID0+ICdkYXRhJ1xuICAgICAqXG4gICAgICogb3B0aW9ucy5pbXBvcnRzXG4gICAgICogLy8gPT4geyAnXyc6IF8sICdqcSc6ICQgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBhcnRpYWxSaWdodChmdW5jKSB7XG4gICAgICByZXR1cm4gY3JlYXRlV3JhcHBlcihmdW5jLCAzMiwgbnVsbCwgc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gZXhlY3V0ZWQsIHdpbGwgb25seSBjYWxsIHRoZSBgZnVuY2AgZnVuY3Rpb25cbiAgICAgKiBhdCBtb3N0IG9uY2UgcGVyIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG9cbiAgICAgKiBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZVxuICAgICAqIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGxcbiAgICAgKiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgY2FsbC5cbiAgICAgKlxuICAgICAqIE5vdGU6IElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAgYGZ1bmNgIHdpbGwgYmUgY2FsbGVkXG4gICAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIHRocm90dGxlZCBmdW5jdGlvbiBpc1xuICAgICAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBleGVjdXRpb25zIHRvLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz10cnVlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAvLyBhdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nXG4gICAgICogdmFyIHRocm90dGxlZCA9IF8udGhyb3R0bGUodXBkYXRlUG9zaXRpb24sIDEwMCk7XG4gICAgICogalF1ZXJ5KHdpbmRvdykub24oJ3Njcm9sbCcsIHRocm90dGxlZCk7XG4gICAgICpcbiAgICAgKiAvLyBleGVjdXRlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXNcbiAgICAgKiBqUXVlcnkoJy5pbnRlcmFjdGl2ZScpLm9uKCdjbGljaycsIF8udGhyb3R0bGUocmVuZXdUb2tlbiwgMzAwMDAwLCB7XG4gICAgICogICAndHJhaWxpbmcnOiBmYWxzZVxuICAgICAqIH0pKTtcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgICAgICBsZWFkaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICAgICAgfVxuICAgICAgZGVib3VuY2VPcHRpb25zLmxlYWRpbmcgPSBsZWFkaW5nO1xuICAgICAgZGVib3VuY2VPcHRpb25zLm1heFdhaXQgPSB3YWl0O1xuICAgICAgZGVib3VuY2VPcHRpb25zLnRyYWlsaW5nID0gdHJhaWxpbmc7XG5cbiAgICAgIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCBkZWJvdW5jZU9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHByb3ZpZGVzIGB2YWx1ZWAgdG8gdGhlIHdyYXBwZXIgZnVuY3Rpb24gYXMgaXRzXG4gICAgICogZmlyc3QgYXJndW1lbnQuIEFkZGl0aW9uYWwgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBmdW5jdGlvbiBhcmUgYXBwZW5kZWRcbiAgICAgKiB0byB0aG9zZSBwcm92aWRlZCB0byB0aGUgd3JhcHBlciBmdW5jdGlvbi4gVGhlIHdyYXBwZXIgaXMgZXhlY3V0ZWQgd2l0aFxuICAgICAqIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgY3JlYXRlZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB3cmFwLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHdyYXBwZXIgVGhlIHdyYXBwZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBwID0gXy53cmFwKF8uZXNjYXBlLCBmdW5jdGlvbihmdW5jLCB0ZXh0KSB7XG4gICAgICogICByZXR1cm4gJzxwPicgKyBmdW5jKHRleHQpICsgJzwvcD4nO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogcCgnRnJlZCwgV2lsbWEsICYgUGViYmxlcycpO1xuICAgICAqIC8vID0+ICc8cD5GcmVkLCBXaWxtYSwgJmFtcDsgUGViYmxlczwvcD4nXG4gICAgICovXG4gICAgZnVuY3Rpb24gd3JhcCh2YWx1ZSwgd3JhcHBlcikge1xuICAgICAgcmV0dXJuIGNyZWF0ZVdyYXBwZXIod3JhcHBlciwgMTYsIFt2YWx1ZV0pO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBgdmFsdWVgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiBmcm9tIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2ZyZWQnIH07XG4gICAgICogdmFyIGdldHRlciA9IF8uY29uc3RhbnQob2JqZWN0KTtcbiAgICAgKiBnZXR0ZXIoKSA9PT0gb2JqZWN0O1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb25zdGFudCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2R1Y2VzIGEgY2FsbGJhY2sgYm91bmQgdG8gYW4gb3B0aW9uYWwgYHRoaXNBcmdgLiBJZiBgZnVuY2AgaXMgYSBwcm9wZXJ0eVxuICAgICAqIG5hbWUgdGhlIGNyZWF0ZWQgY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIGZvciBhIGdpdmVuIGVsZW1lbnQuXG4gICAgICogSWYgYGZ1bmNgIGlzIGFuIG9iamVjdCB0aGUgY3JlYXRlZCBjYWxsYmFjayB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzXG4gICAgICogdGhhdCBjb250YWluIHRoZSBlcXVpdmFsZW50IG9iamVjdCBwcm9wZXJ0aWVzLCBvdGhlcndpc2UgaXQgd2lsbCByZXR1cm4gYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0geyp9IFtmdW5jPWlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgY3JlYXRlZCBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0aGUgY2FsbGJhY2sgYWNjZXB0cy5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB3cmFwIHRvIGNyZWF0ZSBjdXN0b20gY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgICAqIF8uY3JlYXRlQ2FsbGJhY2sgPSBfLndyYXAoXy5jcmVhdGVDYWxsYmFjaywgZnVuY3Rpb24oZnVuYywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgKiAgIHZhciBtYXRjaCA9IC9eKC4rPylfXyhbZ2xddCkoLispJC8uZXhlYyhjYWxsYmFjayk7XG4gICAgICogICByZXR1cm4gIW1hdGNoID8gZnVuYyhjYWxsYmFjaywgdGhpc0FyZykgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgKiAgICAgcmV0dXJuIG1hdGNoWzJdID09ICdndCcgPyBvYmplY3RbbWF0Y2hbMV1dID4gbWF0Y2hbM10gOiBvYmplY3RbbWF0Y2hbMV1dIDwgbWF0Y2hbM107XG4gICAgICogICB9O1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogXy5maWx0ZXIoY2hhcmFjdGVycywgJ2FnZV9fZ3QzOCcpO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjcmVhdGVDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgZnVuYztcbiAgICAgIGlmIChmdW5jID09IG51bGwgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBiYXNlQ3JlYXRlQ2FsbGJhY2soZnVuYywgdGhpc0FyZywgYXJnQ291bnQpO1xuICAgICAgfVxuICAgICAgLy8gaGFuZGxlIFwiXy5wbHVja1wiIHN0eWxlIGNhbGxiYWNrIHNob3J0aGFuZHNcbiAgICAgIGlmICh0eXBlICE9ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eShmdW5jKTtcbiAgICAgIH1cbiAgICAgIHZhciBwcm9wcyA9IGtleXMoZnVuYyksXG4gICAgICAgICAga2V5ID0gcHJvcHNbMF0sXG4gICAgICAgICAgYSA9IGZ1bmNba2V5XTtcblxuICAgICAgLy8gaGFuZGxlIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrIHNob3J0aGFuZHNcbiAgICAgIGlmIChwcm9wcy5sZW5ndGggPT0gMSAmJiBhID09PSBhICYmICFpc09iamVjdChhKSkge1xuICAgICAgICAvLyBmYXN0IHBhdGggdGhlIGNvbW1vbiBjYXNlIG9mIHByb3ZpZGluZyBhbiBvYmplY3Qgd2l0aCBhIHNpbmdsZVxuICAgICAgICAvLyBwcm9wZXJ0eSBjb250YWluaW5nIGEgcHJpbWl0aXZlIHZhbHVlXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICB2YXIgYiA9IG9iamVjdFtrZXldO1xuICAgICAgICAgIHJldHVybiBhID09PSBiICYmIChhICE9PSAwIHx8ICgxIC8gYSA9PSAxIC8gYikpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICB2YXIgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gYmFzZUlzRXF1YWwob2JqZWN0W3Byb3BzW2xlbmd0aF1dLCBmdW5jW3Byb3BzW2xlbmd0aF1dLCBudWxsLCB0cnVlKSkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyB0aGUgY2hhcmFjdGVycyBgJmAsIGA8YCwgYD5gLCBgXCJgLCBhbmQgYCdgIGluIGBzdHJpbmdgIHRvIHRoZWlyXG4gICAgICogY29ycmVzcG9uZGluZyBIVE1MIGVudGl0aWVzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBlc2NhcGUuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBzdHJpbmcuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZXNjYXBlKCdGcmVkLCBXaWxtYSwgJiBQZWJibGVzJyk7XG4gICAgICogLy8gPT4gJ0ZyZWQsIFdpbG1hLCAmYW1wOyBQZWJibGVzJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVzY2FwZShzdHJpbmcpIHtcbiAgICAgIHJldHVybiBzdHJpbmcgPT0gbnVsbCA/ICcnIDogU3RyaW5nKHN0cmluZykucmVwbGFjZShyZVVuZXNjYXBlZEh0bWwsIGVzY2FwZUh0bWxDaGFyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byBpdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdmcmVkJyB9O1xuICAgICAqIF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0O1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgZnVuY3Rpb24gcHJvcGVydGllcyBvZiBhIHNvdXJjZSBvYmplY3QgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBJZiBgb2JqZWN0YCBpcyBhIGZ1bmN0aW9uIG1ldGhvZHMgd2lsbCBiZSBhZGRlZCB0byBpdHMgcHJvdG90eXBlIGFzIHdlbGwuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IFtvYmplY3Q9bG9kYXNoXSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBvYmplY3Qgb2YgZnVuY3Rpb25zIHRvIGFkZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNoYWluPXRydWVdIFNwZWNpZnkgd2hldGhlciB0aGUgZnVuY3Rpb25zIGFkZGVkIGFyZSBjaGFpbmFibGUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIGZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gICAgICogICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogXy5taXhpbih7ICdjYXBpdGFsaXplJzogY2FwaXRhbGl6ZSB9KTtcbiAgICAgKiBfLmNhcGl0YWxpemUoJ2ZyZWQnKTtcbiAgICAgKiAvLyA9PiAnRnJlZCdcbiAgICAgKlxuICAgICAqIF8oJ2ZyZWQnKS5jYXBpdGFsaXplKCkudmFsdWUoKTtcbiAgICAgKiAvLyA9PiAnRnJlZCdcbiAgICAgKlxuICAgICAqIF8ubWl4aW4oeyAnY2FwaXRhbGl6ZSc6IGNhcGl0YWxpemUgfSwgeyAnY2hhaW4nOiBmYWxzZSB9KTtcbiAgICAgKiBfKCdmcmVkJykuY2FwaXRhbGl6ZSgpO1xuICAgICAqIC8vID0+ICdGcmVkJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1peGluKG9iamVjdCwgc291cmNlLCBvcHRpb25zKSB7XG4gICAgICB2YXIgY2hhaW4gPSB0cnVlLFxuICAgICAgICAgIG1ldGhvZE5hbWVzID0gc291cmNlICYmIGZ1bmN0aW9ucyhzb3VyY2UpO1xuXG4gICAgICBpZiAoIXNvdXJjZSB8fCAoIW9wdGlvbnMgJiYgIW1ldGhvZE5hbWVzLmxlbmd0aCkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICAgIG9wdGlvbnMgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgY3RvciA9IGxvZGFzaFdyYXBwZXI7XG4gICAgICAgIHNvdXJjZSA9IG9iamVjdDtcbiAgICAgICAgb2JqZWN0ID0gbG9kYXNoO1xuICAgICAgICBtZXRob2ROYW1lcyA9IGZ1bmN0aW9ucyhzb3VyY2UpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMgPT09IGZhbHNlKSB7XG4gICAgICAgIGNoYWluID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpICYmICdjaGFpbicgaW4gb3B0aW9ucykge1xuICAgICAgICBjaGFpbiA9IG9wdGlvbnMuY2hhaW47XG4gICAgICB9XG4gICAgICB2YXIgY3RvciA9IG9iamVjdCxcbiAgICAgICAgICBpc0Z1bmMgPSBpc0Z1bmN0aW9uKGN0b3IpO1xuXG4gICAgICBmb3JFYWNoKG1ldGhvZE5hbWVzLCBmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgICAgIHZhciBmdW5jID0gb2JqZWN0W21ldGhvZE5hbWVdID0gc291cmNlW21ldGhvZE5hbWVdO1xuICAgICAgICBpZiAoaXNGdW5jKSB7XG4gICAgICAgICAgY3Rvci5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjaGFpbkFsbCA9IHRoaXMuX19jaGFpbl9fLFxuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5fX3dyYXBwZWRfXyxcbiAgICAgICAgICAgICAgICBhcmdzID0gW3ZhbHVlXTtcblxuICAgICAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkob2JqZWN0LCBhcmdzKTtcbiAgICAgICAgICAgIGlmIChjaGFpbiB8fCBjaGFpbkFsbCkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHJlc3VsdCAmJiBpc09iamVjdChyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IGN0b3IocmVzdWx0KTtcbiAgICAgICAgICAgICAgcmVzdWx0Ll9fY2hhaW5fXyA9IGNoYWluQWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXZlcnRzIHRoZSAnXycgdmFyaWFibGUgdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvXG4gICAgICogdGhlIGBsb2Rhc2hgIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgYGxvZGFzaGAgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBsb2Rhc2ggPSBfLm5vQ29uZmxpY3QoKTtcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgICAgY29udGV4dC5fID0gb2xkRGFzaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgbm8tb3BlcmF0aW9uIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdmcmVkJyB9O1xuICAgICAqIF8ubm9vcChvYmplY3QpID09PSB1bmRlZmluZWQ7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG5vb3AoKSB7XG4gICAgICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxuICAgICAqICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgc3RhbXAgPSBfLm5vdygpO1xuICAgICAqIF8uZGVmZXIoZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7IH0pO1xuICAgICAqIC8vID0+IGxvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZFxuICAgICAqL1xuICAgIHZhciBub3cgPSBpc05hdGl2ZShub3cgPSBEYXRlLm5vdykgJiYgbm93IHx8IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyB0aGUgZ2l2ZW4gdmFsdWUgaW50byBhbiBpbnRlZ2VyIG9mIHRoZSBzcGVjaWZpZWQgcmFkaXguXG4gICAgICogSWYgYHJhZGl4YCBpcyBgdW5kZWZpbmVkYCBvciBgMGAgYSBgcmFkaXhgIG9mIGAxMGAgaXMgdXNlZCB1bmxlc3MgdGhlXG4gICAgICogYHZhbHVlYCBpcyBhIGhleGFkZWNpbWFsLCBpbiB3aGljaCBjYXNlIGEgYHJhZGl4YCBvZiBgMTZgIGlzIHVzZWQuXG4gICAgICpcbiAgICAgKiBOb3RlOiBUaGlzIG1ldGhvZCBhdm9pZHMgZGlmZmVyZW5jZXMgaW4gbmF0aXZlIEVTMyBhbmQgRVM1IGBwYXJzZUludGBcbiAgICAgKiBpbXBsZW1lbnRhdGlvbnMuIFNlZSBodHRwOi8vZXM1LmdpdGh1Yi5pby8jRS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRvIHBhcnNlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcmFkaXhdIFRoZSByYWRpeCB1c2VkIHRvIGludGVycHJldCB0aGUgdmFsdWUgdG8gcGFyc2UuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbmV3IGludGVnZXIgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ucGFyc2VJbnQoJzA4Jyk7XG4gICAgICogLy8gPT4gOFxuICAgICAqL1xuICAgIHZhciBwYXJzZUludCA9IG5hdGl2ZVBhcnNlSW50KHdoaXRlc3BhY2UgKyAnMDgnKSA9PSA4ID8gbmF0aXZlUGFyc2VJbnQgOiBmdW5jdGlvbih2YWx1ZSwgcmFkaXgpIHtcbiAgICAgIC8vIEZpcmVmb3ggPCAyMSBhbmQgT3BlcmEgPCAxNSBmb2xsb3cgdGhlIEVTMyBzcGVjaWZpZWQgaW1wbGVtZW50YXRpb24gb2YgYHBhcnNlSW50YFxuICAgICAgcmV0dXJuIG5hdGl2ZVBhcnNlSW50KGlzU3RyaW5nKHZhbHVlKSA/IHZhbHVlLnJlcGxhY2UocmVMZWFkaW5nU3BhY2VzQW5kWmVyb3MsICcnKSA6IHZhbHVlLCByYWRpeCB8fCAwKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIFwiXy5wbHVja1wiIHN0eWxlIGZ1bmN0aW9uLCB3aGljaCByZXR1cm5zIHRoZSBga2V5YCB2YWx1ZSBvZiBhXG4gICAgICogZ2l2ZW4gb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHJldHJpZXZlLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH0sXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIHZhciBnZXROYW1lID0gXy5wcm9wZXJ0eSgnbmFtZScpO1xuICAgICAqXG4gICAgICogXy5tYXAoY2hhcmFjdGVycywgZ2V0TmFtZSk7XG4gICAgICogLy8gPT4gWydiYXJuZXknLCAnZnJlZCddXG4gICAgICpcbiAgICAgKiBfLnNvcnRCeShjaGFyYWN0ZXJzLCBnZXROYW1lKTtcbiAgICAgKiAvLyA9PiBbeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSwgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9wZXJ0eShrZXkpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdFtrZXldO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9kdWNlcyBhIHJhbmRvbSBudW1iZXIgYmV0d2VlbiBgbWluYCBhbmQgYG1heGAgKGluY2x1c2l2ZSkuIElmIG9ubHkgb25lXG4gICAgICogYXJndW1lbnQgaXMgcHJvdmlkZWQgYSBudW1iZXIgYmV0d2VlbiBgMGAgYW5kIHRoZSBnaXZlbiBudW1iZXIgd2lsbCBiZVxuICAgICAqIHJldHVybmVkLiBJZiBgZmxvYXRpbmdgIGlzIHRydWV5IG9yIGVpdGhlciBgbWluYCBvciBgbWF4YCBhcmUgZmxvYXRzIGFcbiAgICAgKiBmbG9hdGluZy1wb2ludCBudW1iZXIgd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkIG9mIGFuIGludGVnZXIuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttaW49MF0gVGhlIG1pbmltdW0gcG9zc2libGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttYXg9MV0gVGhlIG1heGltdW0gcG9zc2libGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZmxvYXRpbmc9ZmFsc2VdIFNwZWNpZnkgcmV0dXJuaW5nIGEgZmxvYXRpbmctcG9pbnQgbnVtYmVyLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYSByYW5kb20gbnVtYmVyLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnJhbmRvbSgwLCA1KTtcbiAgICAgKiAvLyA9PiBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgNVxuICAgICAqXG4gICAgICogXy5yYW5kb20oNSk7XG4gICAgICogLy8gPT4gYWxzbyBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgNVxuICAgICAqXG4gICAgICogXy5yYW5kb20oNSwgdHJ1ZSk7XG4gICAgICogLy8gPT4gYSBmbG9hdGluZy1wb2ludCBudW1iZXIgYmV0d2VlbiAwIGFuZCA1XG4gICAgICpcbiAgICAgKiBfLnJhbmRvbSgxLjIsIDUuMik7XG4gICAgICogLy8gPT4gYSBmbG9hdGluZy1wb2ludCBudW1iZXIgYmV0d2VlbiAxLjIgYW5kIDUuMlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJhbmRvbShtaW4sIG1heCwgZmxvYXRpbmcpIHtcbiAgICAgIHZhciBub01pbiA9IG1pbiA9PSBudWxsLFxuICAgICAgICAgIG5vTWF4ID0gbWF4ID09IG51bGw7XG5cbiAgICAgIGlmIChmbG9hdGluZyA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWluID09ICdib29sZWFuJyAmJiBub01heCkge1xuICAgICAgICAgIGZsb2F0aW5nID0gbWluO1xuICAgICAgICAgIG1pbiA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW5vTWF4ICYmIHR5cGVvZiBtYXggPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgZmxvYXRpbmcgPSBtYXg7XG4gICAgICAgICAgbm9NYXggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobm9NaW4gJiYgbm9NYXgpIHtcbiAgICAgICAgbWF4ID0gMTtcbiAgICAgIH1cbiAgICAgIG1pbiA9ICttaW4gfHwgMDtcbiAgICAgIGlmIChub01heCkge1xuICAgICAgICBtYXggPSBtaW47XG4gICAgICAgIG1pbiA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXggPSArbWF4IHx8IDA7XG4gICAgICB9XG4gICAgICBpZiAoZmxvYXRpbmcgfHwgbWluICUgMSB8fCBtYXggJSAxKSB7XG4gICAgICAgIHZhciByYW5kID0gbmF0aXZlUmFuZG9tKCk7XG4gICAgICAgIHJldHVybiBuYXRpdmVNaW4obWluICsgKHJhbmQgKiAobWF4IC0gbWluICsgcGFyc2VGbG9hdCgnMWUtJyArICgocmFuZCArJycpLmxlbmd0aCAtIDEpKSkpLCBtYXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VSYW5kb20obWluLCBtYXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc29sdmVzIHRoZSB2YWx1ZSBvZiBwcm9wZXJ0eSBga2V5YCBvbiBgb2JqZWN0YC4gSWYgYGtleWAgaXMgYSBmdW5jdGlvblxuICAgICAqIGl0IHdpbGwgYmUgaW52b2tlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiBgb2JqZWN0YCBhbmQgaXRzIHJlc3VsdCByZXR1cm5lZCxcbiAgICAgKiBlbHNlIHRoZSBwcm9wZXJ0eSB2YWx1ZSBpcyByZXR1cm5lZC4gSWYgYG9iamVjdGAgaXMgZmFsc2V5IHRoZW4gYHVuZGVmaW5lZGBcbiAgICAgKiBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byByZXNvbHZlLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSByZXNvbHZlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHtcbiAgICAgKiAgICdjaGVlc2UnOiAnY3J1bXBldHMnLFxuICAgICAqICAgJ3N0dWZmJzogZnVuY3Rpb24oKSB7XG4gICAgICogICAgIHJldHVybiAnbm9uc2Vuc2UnO1xuICAgICAqICAgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiBfLnJlc3VsdChvYmplY3QsICdjaGVlc2UnKTtcbiAgICAgKiAvLyA9PiAnY3J1bXBldHMnXG4gICAgICpcbiAgICAgKiBfLnJlc3VsdChvYmplY3QsICdzdHVmZicpO1xuICAgICAqIC8vID0+ICdub25zZW5zZSdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXN1bHQob2JqZWN0LCBrZXkpIHtcbiAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgICAgIHJldHVybiBpc0Z1bmN0aW9uKHZhbHVlKSA/IG9iamVjdFtrZXldKCkgOiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIG1pY3JvLXRlbXBsYXRpbmcgbWV0aG9kIHRoYXQgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzXG4gICAgICogd2hpdGVzcGFjZSwgYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gICAgICpcbiAgICAgKiBOb3RlOiBJbiB0aGUgZGV2ZWxvcG1lbnQgYnVpbGQsIGBfLnRlbXBsYXRlYCB1dGlsaXplcyBzb3VyY2VVUkxzIGZvciBlYXNpZXJcbiAgICAgKiBkZWJ1Z2dpbmcuIFNlZSBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9kZXZlbG9wZXJ0b29scy9zb3VyY2VtYXBzLyN0b2Mtc291cmNldXJsXG4gICAgICpcbiAgICAgKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBwcmVjb21waWxpbmcgdGVtcGxhdGVzIHNlZTpcbiAgICAgKiBodHRwOi8vbG9kYXNoLmNvbS9jdXN0b20tYnVpbGRzXG4gICAgICpcbiAgICAgKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBDaHJvbWUgZXh0ZW5zaW9uIHNhbmRib3hlcyBzZWU6XG4gICAgICogaHR0cDovL2RldmVsb3Blci5jaHJvbWUuY29tL3N0YWJsZS9leHRlbnNpb25zL3NhbmRib3hpbmdFdmFsLmh0bWxcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBUaGUgdGVtcGxhdGUgdGV4dC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSBUaGUgZGF0YSBvYmplY3QgdXNlZCB0byBwb3B1bGF0ZSB0aGUgdGV4dC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuZXNjYXBlXSBUaGUgXCJlc2NhcGVcIiBkZWxpbWl0ZXIuXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmV2YWx1YXRlXSBUaGUgXCJldmFsdWF0ZVwiIGRlbGltaXRlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuaW1wb3J0c10gQW4gb2JqZWN0IHRvIGltcG9ydCBpbnRvIHRoZSB0ZW1wbGF0ZSBhcyBsb2NhbCB2YXJpYWJsZXMuXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmludGVycG9sYXRlXSBUaGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3NvdXJjZVVSTF0gVGhlIHNvdXJjZVVSTCBvZiB0aGUgdGVtcGxhdGUncyBjb21waWxlZCBzb3VyY2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt2YXJpYWJsZV0gVGhlIGRhdGEgb2JqZWN0IHZhcmlhYmxlIG5hbWUuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufHN0cmluZ30gUmV0dXJucyBhIGNvbXBpbGVkIGZ1bmN0aW9uIHdoZW4gbm8gYGRhdGFgIG9iamVjdFxuICAgICAqICBpcyBnaXZlbiwgZWxzZSBpdCByZXR1cm5zIHRoZSBpbnRlcnBvbGF0ZWQgdGV4dC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXIgdG8gY3JlYXRlIGEgY29tcGlsZWQgdGVtcGxhdGVcbiAgICAgKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoZWxsbyA8JT0gbmFtZSAlPicpO1xuICAgICAqIGNvbXBpbGVkKHsgJ25hbWUnOiAnZnJlZCcgfSk7XG4gICAgICogLy8gPT4gJ2hlbGxvIGZyZWQnXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyB0aGUgXCJlc2NhcGVcIiBkZWxpbWl0ZXIgdG8gZXNjYXBlIEhUTUwgaW4gZGF0YSBwcm9wZXJ0eSB2YWx1ZXNcbiAgICAgKiBfLnRlbXBsYXRlKCc8Yj48JS0gdmFsdWUgJT48L2I+JywgeyAndmFsdWUnOiAnPHNjcmlwdD4nIH0pO1xuICAgICAqIC8vID0+ICc8Yj4mbHQ7c2NyaXB0Jmd0OzwvYj4nXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyB0aGUgXCJldmFsdWF0ZVwiIGRlbGltaXRlciB0byBnZW5lcmF0ZSBIVE1MXG4gICAgICogdmFyIGxpc3QgPSAnPCUgXy5mb3JFYWNoKHBlb3BsZSwgZnVuY3Rpb24obmFtZSkgeyAlPjxsaT48JS0gbmFtZSAlPjwvbGk+PCUgfSk7ICU+JztcbiAgICAgKiBfLnRlbXBsYXRlKGxpc3QsIHsgJ3Blb3BsZSc6IFsnZnJlZCcsICdiYXJuZXknXSB9KTtcbiAgICAgKiAvLyA9PiAnPGxpPmZyZWQ8L2xpPjxsaT5iYXJuZXk8L2xpPidcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBFUzYgZGVsaW1pdGVyIGFzIGFuIGFsdGVybmF0aXZlIHRvIHRoZSBkZWZhdWx0IFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXJcbiAgICAgKiBfLnRlbXBsYXRlKCdoZWxsbyAkeyBuYW1lIH0nLCB7ICduYW1lJzogJ3BlYmJsZXMnIH0pO1xuICAgICAqIC8vID0+ICdoZWxsbyBwZWJibGVzJ1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIGludGVybmFsIGBwcmludGAgZnVuY3Rpb24gaW4gXCJldmFsdWF0ZVwiIGRlbGltaXRlcnNcbiAgICAgKiBfLnRlbXBsYXRlKCc8JSBwcmludChcImhlbGxvIFwiICsgbmFtZSk7ICU+IScsIHsgJ25hbWUnOiAnYmFybmV5JyB9KTtcbiAgICAgKiAvLyA9PiAnaGVsbG8gYmFybmV5ISdcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIGEgY3VzdG9tIHRlbXBsYXRlIGRlbGltaXRlcnNcbiAgICAgKiBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgICogICAnaW50ZXJwb2xhdGUnOiAve3soW1xcc1xcU10rPyl9fS9nXG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8udGVtcGxhdGUoJ2hlbGxvIHt7IG5hbWUgfX0hJywgeyAnbmFtZSc6ICdtdXN0YWNoZScgfSk7XG4gICAgICogLy8gPT4gJ2hlbGxvIG11c3RhY2hlISdcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBgaW1wb3J0c2Agb3B0aW9uIHRvIGltcG9ydCBqUXVlcnlcbiAgICAgKiB2YXIgbGlzdCA9ICc8JSBqcS5lYWNoKHBlb3BsZSwgZnVuY3Rpb24obmFtZSkgeyAlPjxsaT48JS0gbmFtZSAlPjwvbGk+PCUgfSk7ICU+JztcbiAgICAgKiBfLnRlbXBsYXRlKGxpc3QsIHsgJ3Blb3BsZSc6IFsnZnJlZCcsICdiYXJuZXknXSB9LCB7ICdpbXBvcnRzJzogeyAnanEnOiBqUXVlcnkgfSB9KTtcbiAgICAgKiAvLyA9PiAnPGxpPmZyZWQ8L2xpPjxsaT5iYXJuZXk8L2xpPidcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBgc291cmNlVVJMYCBvcHRpb24gdG8gc3BlY2lmeSBhIGN1c3RvbSBzb3VyY2VVUkwgZm9yIHRoZSB0ZW1wbGF0ZVxuICAgICAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIDwlPSBuYW1lICU+JywgbnVsbCwgeyAnc291cmNlVVJMJzogJy9iYXNpYy9ncmVldGluZy5qc3QnIH0pO1xuICAgICAqIGNvbXBpbGVkKGRhdGEpO1xuICAgICAqIC8vID0+IGZpbmQgdGhlIHNvdXJjZSBvZiBcImdyZWV0aW5nLmpzdFwiIHVuZGVyIHRoZSBTb3VyY2VzIHRhYiBvciBSZXNvdXJjZXMgcGFuZWwgb2YgdGhlIHdlYiBpbnNwZWN0b3JcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBgdmFyaWFibGVgIG9wdGlvbiB0byBlbnN1cmUgYSB3aXRoLXN0YXRlbWVudCBpc24ndCB1c2VkIGluIHRoZSBjb21waWxlZCB0ZW1wbGF0ZVxuICAgICAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hpIDwlPSBkYXRhLm5hbWUgJT4hJywgbnVsbCwgeyAndmFyaWFibGUnOiAnZGF0YScgfSk7XG4gICAgICogY29tcGlsZWQuc291cmNlO1xuICAgICAqIC8vID0+IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgKiAgIHZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZTtcbiAgICAgKiAgIF9fcCArPSAnaGkgJyArICgoX190ID0gKCBkYXRhLm5hbWUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArICchJztcbiAgICAgKiAgIHJldHVybiBfX3A7XG4gICAgICogfVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIGBzb3VyY2VgIHByb3BlcnR5IHRvIGlubGluZSBjb21waWxlZCB0ZW1wbGF0ZXMgZm9yIG1lYW5pbmdmdWxcbiAgICAgKiAvLyBsaW5lIG51bWJlcnMgaW4gZXJyb3IgbWVzc2FnZXMgYW5kIGEgc3RhY2sgdHJhY2VcbiAgICAgKiBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihjd2QsICdqc3QuanMnKSwgJ1xcXG4gICAgICogICB2YXIgSlNUID0ge1xcXG4gICAgICogICAgIFwibWFpblwiOiAnICsgXy50ZW1wbGF0ZShtYWluVGV4dCkuc291cmNlICsgJ1xcXG4gICAgICogICB9O1xcXG4gICAgICogJyk7XG4gICAgICovXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUodGV4dCwgZGF0YSwgb3B0aW9ucykge1xuICAgICAgLy8gYmFzZWQgb24gSm9obiBSZXNpZydzIGB0bXBsYCBpbXBsZW1lbnRhdGlvblxuICAgICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2phdmFzY3JpcHQtbWljcm8tdGVtcGxhdGluZy9cbiAgICAgIC8vIGFuZCBMYXVyYSBEb2t0b3JvdmEncyBkb1QuanNcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9vbGFkby9kb1RcbiAgICAgIHZhciBzZXR0aW5ncyA9IGxvZGFzaC50ZW1wbGF0ZVNldHRpbmdzO1xuICAgICAgdGV4dCA9IFN0cmluZyh0ZXh0IHx8ICcnKTtcblxuICAgICAgLy8gYXZvaWQgbWlzc2luZyBkZXBlbmRlbmNpZXMgd2hlbiBgaXRlcmF0b3JUZW1wbGF0ZWAgaXMgbm90IGRlZmluZWRcbiAgICAgIG9wdGlvbnMgPSBkZWZhdWx0cyh7fSwgb3B0aW9ucywgc2V0dGluZ3MpO1xuXG4gICAgICB2YXIgaW1wb3J0cyA9IGRlZmF1bHRzKHt9LCBvcHRpb25zLmltcG9ydHMsIHNldHRpbmdzLmltcG9ydHMpLFxuICAgICAgICAgIGltcG9ydHNLZXlzID0ga2V5cyhpbXBvcnRzKSxcbiAgICAgICAgICBpbXBvcnRzVmFsdWVzID0gdmFsdWVzKGltcG9ydHMpO1xuXG4gICAgICB2YXIgaXNFdmFsdWF0aW5nLFxuICAgICAgICAgIGluZGV4ID0gMCxcbiAgICAgICAgICBpbnRlcnBvbGF0ZSA9IG9wdGlvbnMuaW50ZXJwb2xhdGUgfHwgcmVOb01hdGNoLFxuICAgICAgICAgIHNvdXJjZSA9IFwiX19wICs9ICdcIjtcblxuICAgICAgLy8gY29tcGlsZSB0aGUgcmVnZXhwIHRvIG1hdGNoIGVhY2ggZGVsaW1pdGVyXG4gICAgICB2YXIgcmVEZWxpbWl0ZXJzID0gUmVnRXhwKFxuICAgICAgICAob3B0aW9ucy5lc2NhcGUgfHwgcmVOb01hdGNoKS5zb3VyY2UgKyAnfCcgK1xuICAgICAgICBpbnRlcnBvbGF0ZS5zb3VyY2UgKyAnfCcgK1xuICAgICAgICAoaW50ZXJwb2xhdGUgPT09IHJlSW50ZXJwb2xhdGUgPyByZUVzVGVtcGxhdGUgOiByZU5vTWF0Y2gpLnNvdXJjZSArICd8JyArXG4gICAgICAgIChvcHRpb25zLmV2YWx1YXRlIHx8IHJlTm9NYXRjaCkuc291cmNlICsgJ3wkJ1xuICAgICAgLCAnZycpO1xuXG4gICAgICB0ZXh0LnJlcGxhY2UocmVEZWxpbWl0ZXJzLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlVmFsdWUsIGludGVycG9sYXRlVmFsdWUsIGVzVGVtcGxhdGVWYWx1ZSwgZXZhbHVhdGVWYWx1ZSwgb2Zmc2V0KSB7XG4gICAgICAgIGludGVycG9sYXRlVmFsdWUgfHwgKGludGVycG9sYXRlVmFsdWUgPSBlc1RlbXBsYXRlVmFsdWUpO1xuXG4gICAgICAgIC8vIGVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgY2Fubm90IGJlIGluY2x1ZGVkIGluIHN0cmluZyBsaXRlcmFsc1xuICAgICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KS5yZXBsYWNlKHJlVW5lc2NhcGVkU3RyaW5nLCBlc2NhcGVTdHJpbmdDaGFyKTtcblxuICAgICAgICAvLyByZXBsYWNlIGRlbGltaXRlcnMgd2l0aCBzbmlwcGV0c1xuICAgICAgICBpZiAoZXNjYXBlVmFsdWUpIHtcbiAgICAgICAgICBzb3VyY2UgKz0gXCInICtcXG5fX2UoXCIgKyBlc2NhcGVWYWx1ZSArIFwiKSArXFxuJ1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmFsdWF0ZVZhbHVlKSB7XG4gICAgICAgICAgaXNFdmFsdWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGVWYWx1ZSArIFwiO1xcbl9fcCArPSAnXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludGVycG9sYXRlVmFsdWUpIHtcbiAgICAgICAgICBzb3VyY2UgKz0gXCInICtcXG4oKF9fdCA9IChcIiArIGludGVycG9sYXRlVmFsdWUgKyBcIikpID09IG51bGwgPyAnJyA6IF9fdCkgK1xcbidcIjtcbiAgICAgICAgfVxuICAgICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgICAgICAvLyB0aGUgSlMgZW5naW5lIGVtYmVkZGVkIGluIEFkb2JlIHByb2R1Y3RzIHJlcXVpcmVzIHJldHVybmluZyB0aGUgYG1hdGNoYFxuICAgICAgICAvLyBzdHJpbmcgaW4gb3JkZXIgdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBgb2Zmc2V0YCB2YWx1ZVxuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9KTtcblxuICAgICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgICAgLy8gaWYgYHZhcmlhYmxlYCBpcyBub3Qgc3BlY2lmaWVkLCB3cmFwIGEgd2l0aC1zdGF0ZW1lbnQgYXJvdW5kIHRoZSBnZW5lcmF0ZWRcbiAgICAgIC8vIGNvZGUgdG8gYWRkIHRoZSBkYXRhIG9iamVjdCB0byB0aGUgdG9wIG9mIHRoZSBzY29wZSBjaGFpblxuICAgICAgdmFyIHZhcmlhYmxlID0gb3B0aW9ucy52YXJpYWJsZSxcbiAgICAgICAgICBoYXNWYXJpYWJsZSA9IHZhcmlhYmxlO1xuXG4gICAgICBpZiAoIWhhc1ZhcmlhYmxlKSB7XG4gICAgICAgIHZhcmlhYmxlID0gJ29iaic7XG4gICAgICAgIHNvdXJjZSA9ICd3aXRoICgnICsgdmFyaWFibGUgKyAnKSB7XFxuJyArIHNvdXJjZSArICdcXG59XFxuJztcbiAgICAgIH1cbiAgICAgIC8vIGNsZWFudXAgY29kZSBieSBzdHJpcHBpbmcgZW1wdHkgc3RyaW5nc1xuICAgICAgc291cmNlID0gKGlzRXZhbHVhdGluZyA/IHNvdXJjZS5yZXBsYWNlKHJlRW1wdHlTdHJpbmdMZWFkaW5nLCAnJykgOiBzb3VyY2UpXG4gICAgICAgIC5yZXBsYWNlKHJlRW1wdHlTdHJpbmdNaWRkbGUsICckMScpXG4gICAgICAgIC5yZXBsYWNlKHJlRW1wdHlTdHJpbmdUcmFpbGluZywgJyQxOycpO1xuXG4gICAgICAvLyBmcmFtZSBjb2RlIGFzIHRoZSBmdW5jdGlvbiBib2R5XG4gICAgICBzb3VyY2UgPSAnZnVuY3Rpb24oJyArIHZhcmlhYmxlICsgJykge1xcbicgK1xuICAgICAgICAoaGFzVmFyaWFibGUgPyAnJyA6IHZhcmlhYmxlICsgJyB8fCAoJyArIHZhcmlhYmxlICsgJyA9IHt9KTtcXG4nKSArXG4gICAgICAgIFwidmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlXCIgK1xuICAgICAgICAoaXNFdmFsdWF0aW5nXG4gICAgICAgICAgPyAnLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcXG4nICtcbiAgICAgICAgICAgIFwiZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XFxuXCJcbiAgICAgICAgICA6ICc7XFxuJ1xuICAgICAgICApICtcbiAgICAgICAgc291cmNlICtcbiAgICAgICAgJ3JldHVybiBfX3BcXG59JztcblxuICAgICAgLy8gVXNlIGEgc291cmNlVVJMIGZvciBlYXNpZXIgZGVidWdnaW5nLlxuICAgICAgLy8gaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvZGV2ZWxvcGVydG9vbHMvc291cmNlbWFwcy8jdG9jLXNvdXJjZXVybFxuICAgICAgdmFyIHNvdXJjZVVSTCA9ICdcXG4vKlxcbi8vIyBzb3VyY2VVUkw9JyArIChvcHRpb25zLnNvdXJjZVVSTCB8fCAnL2xvZGFzaC90ZW1wbGF0ZS9zb3VyY2VbJyArICh0ZW1wbGF0ZUNvdW50ZXIrKykgKyAnXScpICsgJ1xcbiovJztcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IEZ1bmN0aW9uKGltcG9ydHNLZXlzLCAncmV0dXJuICcgKyBzb3VyY2UgKyBzb3VyY2VVUkwpLmFwcGx5KHVuZGVmaW5lZCwgaW1wb3J0c1ZhbHVlcyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0KGRhdGEpO1xuICAgICAgfVxuICAgICAgLy8gcHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24ncyBzb3VyY2UgYnkgaXRzIGB0b1N0cmluZ2AgbWV0aG9kLCBpblxuICAgICAgLy8gc3VwcG9ydGVkIGVudmlyb25tZW50cywgb3IgdGhlIGBzb3VyY2VgIHByb3BlcnR5IGFzIGEgY29udmVuaWVuY2UgZm9yXG4gICAgICAvLyBpbmxpbmluZyBjb21waWxlZCB0ZW1wbGF0ZXMgZHVyaW5nIHRoZSBidWlsZCBwcm9jZXNzXG4gICAgICByZXN1bHQuc291cmNlID0gc291cmNlO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyB0aGUgY2FsbGJhY2sgYG5gIHRpbWVzLCByZXR1cm5pbmcgYW4gYXJyYXkgb2YgdGhlIHJlc3VsdHNcbiAgICAgKiBvZiBlYWNoIGNhbGxiYWNrIGV4ZWN1dGlvbi4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZFxuICAgICAqIHdpdGggb25lIGFyZ3VtZW50OyAoaW5kZXgpLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuIFRoZSBudW1iZXIgb2YgdGltZXMgdG8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcmVzdWx0cyBvZiBlYWNoIGBjYWxsYmFja2AgZXhlY3V0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgZGljZVJvbGxzID0gXy50aW1lcygzLCBfLnBhcnRpYWwoXy5yYW5kb20sIDEsIDYpKTtcbiAgICAgKiAvLyA9PiBbMywgNiwgNF1cbiAgICAgKlxuICAgICAqIF8udGltZXMoMywgZnVuY3Rpb24obikgeyBtYWdlLmNhc3RTcGVsbChuKTsgfSk7XG4gICAgICogLy8gPT4gY2FsbHMgYG1hZ2UuY2FzdFNwZWxsKG4pYCB0aHJlZSB0aW1lcywgcGFzc2luZyBgbmAgb2YgYDBgLCBgMWAsIGFuZCBgMmAgcmVzcGVjdGl2ZWx5XG4gICAgICpcbiAgICAgKiBfLnRpbWVzKDMsIGZ1bmN0aW9uKG4pIHsgdGhpcy5jYXN0KG4pOyB9LCBtYWdlKTtcbiAgICAgKiAvLyA9PiBhbHNvIGNhbGxzIGBtYWdlLmNhc3RTcGVsbChuKWAgdGhyZWUgdGltZXNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aW1lcyhuLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgbiA9IChuID0gK24pID4gLTEgPyBuIDogMDtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KG4pO1xuXG4gICAgICBjYWxsYmFjayA9IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMSk7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IG4pIHtcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IGNhbGxiYWNrKGluZGV4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGludmVyc2Ugb2YgYF8uZXNjYXBlYCB0aGlzIG1ldGhvZCBjb252ZXJ0cyB0aGUgSFRNTCBlbnRpdGllc1xuICAgICAqIGAmYW1wO2AsIGAmbHQ7YCwgYCZndDtgLCBgJnF1b3Q7YCwgYW5kIGAmIzM5O2AgaW4gYHN0cmluZ2AgdG8gdGhlaXJcbiAgICAgKiBjb3JyZXNwb25kaW5nIGNoYXJhY3RlcnMuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUaGUgc3RyaW5nIHRvIHVuZXNjYXBlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHVuZXNjYXBlZCBzdHJpbmcuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8udW5lc2NhcGUoJ0ZyZWQsIEJhcm5leSAmYW1wOyBQZWJibGVzJyk7XG4gICAgICogLy8gPT4gJ0ZyZWQsIEJhcm5leSAmIFBlYmJsZXMnXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5lc2NhcGUoc3RyaW5nKSB7XG4gICAgICByZXR1cm4gc3RyaW5nID09IG51bGwgPyAnJyA6IFN0cmluZyhzdHJpbmcpLnJlcGxhY2UocmVFc2NhcGVkSHRtbCwgdW5lc2NhcGVIdG1sQ2hhcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgdW5pcXVlIElELiBJZiBgcHJlZml4YCBpcyBwcm92aWRlZCB0aGUgSUQgd2lsbCBiZSBhcHBlbmRlZCB0byBpdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3ByZWZpeF0gVGhlIHZhbHVlIHRvIHByZWZpeCB0aGUgSUQgd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSB1bmlxdWUgSUQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8udW5pcXVlSWQoJ2NvbnRhY3RfJyk7XG4gICAgICogLy8gPT4gJ2NvbnRhY3RfMTA0J1xuICAgICAqXG4gICAgICogXy51bmlxdWVJZCgpO1xuICAgICAqIC8vID0+ICcxMDUnXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5pcXVlSWQocHJlZml4KSB7XG4gICAgICB2YXIgaWQgPSArK2lkQ291bnRlcjtcbiAgICAgIHJldHVybiBTdHJpbmcocHJlZml4ID09IG51bGwgPyAnJyA6IHByZWZpeCkgKyBpZDtcbiAgICB9XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgbG9kYXNoYCBvYmplY3QgdGhhdCB3cmFwcyB0aGUgZ2l2ZW4gdmFsdWUgd2l0aCBleHBsaWNpdFxuICAgICAqIG1ldGhvZCBjaGFpbmluZyBlbmFibGVkLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENoYWluaW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gd3JhcC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdhZ2UnOiA0MCB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiB2YXIgeW91bmdlc3QgPSBfLmNoYWluKGNoYXJhY3RlcnMpXG4gICAgICogICAgIC5zb3J0QnkoJ2FnZScpXG4gICAgICogICAgIC5tYXAoZnVuY3Rpb24oY2hyKSB7IHJldHVybiBjaHIubmFtZSArICcgaXMgJyArIGNoci5hZ2U7IH0pXG4gICAgICogICAgIC5maXJzdCgpXG4gICAgICogICAgIC52YWx1ZSgpO1xuICAgICAqIC8vID0+ICdwZWJibGVzIGlzIDEnXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2hhaW4odmFsdWUpIHtcbiAgICAgIHZhbHVlID0gbmV3IGxvZGFzaFdyYXBwZXIodmFsdWUpO1xuICAgICAgdmFsdWUuX19jaGFpbl9fID0gdHJ1ZTtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIGBpbnRlcmNlcHRvcmAgd2l0aCB0aGUgYHZhbHVlYCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgYW5kIHRoZW5cbiAgICAgKiByZXR1cm5zIGB2YWx1ZWAuIFRoZSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZFxuICAgICAqIGNoYWluIGluIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW5cbiAgICAgKiB0aGUgY2hhaW4uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ2hhaW5pbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm92aWRlIHRvIGBpbnRlcmNlcHRvcmAuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaW50ZXJjZXB0b3IgVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfKFsxLCAyLCAzLCA0XSlcbiAgICAgKiAgLnRhcChmdW5jdGlvbihhcnJheSkgeyBhcnJheS5wb3AoKTsgfSlcbiAgICAgKiAgLnJldmVyc2UoKVxuICAgICAqICAudmFsdWUoKTtcbiAgICAgKiAvLyA9PiBbMywgMiwgMV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0YXAodmFsdWUsIGludGVyY2VwdG9yKSB7XG4gICAgICBpbnRlcmNlcHRvcih2YWx1ZSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlcyBleHBsaWNpdCBtZXRob2QgY2hhaW5pbmcgb24gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG5hbWUgY2hhaW5cbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB3aXRob3V0IGV4cGxpY2l0IGNoYWluaW5nXG4gICAgICogXyhjaGFyYWN0ZXJzKS5maXJzdCgpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH1cbiAgICAgKlxuICAgICAqIC8vIHdpdGggZXhwbGljaXQgY2hhaW5pbmdcbiAgICAgKiBfKGNoYXJhY3RlcnMpLmNoYWluKClcbiAgICAgKiAgIC5maXJzdCgpXG4gICAgICogICAucGljaygnYWdlJylcbiAgICAgKiAgIC52YWx1ZSgpO1xuICAgICAqIC8vID0+IHsgJ2FnZSc6IDM2IH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3cmFwcGVyQ2hhaW4oKSB7XG4gICAgICB0aGlzLl9fY2hhaW5fXyA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9kdWNlcyB0aGUgYHRvU3RyaW5nYCByZXN1bHQgb2YgdGhlIHdyYXBwZWQgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAbmFtZSB0b1N0cmluZ1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENoYWluaW5nXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nIHJlc3VsdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXyhbMSwgMiwgM10pLnRvU3RyaW5nKCk7XG4gICAgICogLy8gPT4gJzEsMiwzJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHdyYXBwZXJUb1N0cmluZygpIHtcbiAgICAgIHJldHVybiBTdHJpbmcodGhpcy5fX3dyYXBwZWRfXyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdHMgdGhlIHdyYXBwZWQgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAbmFtZSB2YWx1ZU9mXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgdmFsdWVcbiAgICAgKiBAY2F0ZWdvcnkgQ2hhaW5pbmdcbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgd3JhcHBlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXyhbMSwgMiwgM10pLnZhbHVlT2YoKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgM11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3cmFwcGVyVmFsdWVPZigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fd3JhcHBlZF9fO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLy8gYWRkIGZ1bmN0aW9ucyB0aGF0IHJldHVybiB3cmFwcGVkIHZhbHVlcyB3aGVuIGNoYWluaW5nXG4gICAgbG9kYXNoLmFmdGVyID0gYWZ0ZXI7XG4gICAgbG9kYXNoLmFzc2lnbiA9IGFzc2lnbjtcbiAgICBsb2Rhc2guYXQgPSBhdDtcbiAgICBsb2Rhc2guYmluZCA9IGJpbmQ7XG4gICAgbG9kYXNoLmJpbmRBbGwgPSBiaW5kQWxsO1xuICAgIGxvZGFzaC5iaW5kS2V5ID0gYmluZEtleTtcbiAgICBsb2Rhc2guY2hhaW4gPSBjaGFpbjtcbiAgICBsb2Rhc2guY29tcGFjdCA9IGNvbXBhY3Q7XG4gICAgbG9kYXNoLmNvbXBvc2UgPSBjb21wb3NlO1xuICAgIGxvZGFzaC5jb25zdGFudCA9IGNvbnN0YW50O1xuICAgIGxvZGFzaC5jb3VudEJ5ID0gY291bnRCeTtcbiAgICBsb2Rhc2guY3JlYXRlID0gY3JlYXRlO1xuICAgIGxvZGFzaC5jcmVhdGVDYWxsYmFjayA9IGNyZWF0ZUNhbGxiYWNrO1xuICAgIGxvZGFzaC5jdXJyeSA9IGN1cnJ5O1xuICAgIGxvZGFzaC5kZWJvdW5jZSA9IGRlYm91bmNlO1xuICAgIGxvZGFzaC5kZWZhdWx0cyA9IGRlZmF1bHRzO1xuICAgIGxvZGFzaC5kZWZlciA9IGRlZmVyO1xuICAgIGxvZGFzaC5kZWxheSA9IGRlbGF5O1xuICAgIGxvZGFzaC5kaWZmZXJlbmNlID0gZGlmZmVyZW5jZTtcbiAgICBsb2Rhc2guZmlsdGVyID0gZmlsdGVyO1xuICAgIGxvZGFzaC5mbGF0dGVuID0gZmxhdHRlbjtcbiAgICBsb2Rhc2guZm9yRWFjaCA9IGZvckVhY2g7XG4gICAgbG9kYXNoLmZvckVhY2hSaWdodCA9IGZvckVhY2hSaWdodDtcbiAgICBsb2Rhc2guZm9ySW4gPSBmb3JJbjtcbiAgICBsb2Rhc2guZm9ySW5SaWdodCA9IGZvckluUmlnaHQ7XG4gICAgbG9kYXNoLmZvck93biA9IGZvck93bjtcbiAgICBsb2Rhc2guZm9yT3duUmlnaHQgPSBmb3JPd25SaWdodDtcbiAgICBsb2Rhc2guZnVuY3Rpb25zID0gZnVuY3Rpb25zO1xuICAgIGxvZGFzaC5ncm91cEJ5ID0gZ3JvdXBCeTtcbiAgICBsb2Rhc2guaW5kZXhCeSA9IGluZGV4Qnk7XG4gICAgbG9kYXNoLmluaXRpYWwgPSBpbml0aWFsO1xuICAgIGxvZGFzaC5pbnRlcnNlY3Rpb24gPSBpbnRlcnNlY3Rpb247XG4gICAgbG9kYXNoLmludmVydCA9IGludmVydDtcbiAgICBsb2Rhc2guaW52b2tlID0gaW52b2tlO1xuICAgIGxvZGFzaC5rZXlzID0ga2V5cztcbiAgICBsb2Rhc2gubWFwID0gbWFwO1xuICAgIGxvZGFzaC5tYXBWYWx1ZXMgPSBtYXBWYWx1ZXM7XG4gICAgbG9kYXNoLm1heCA9IG1heDtcbiAgICBsb2Rhc2gubWVtb2l6ZSA9IG1lbW9pemU7XG4gICAgbG9kYXNoLm1lcmdlID0gbWVyZ2U7XG4gICAgbG9kYXNoLm1pbiA9IG1pbjtcbiAgICBsb2Rhc2gub21pdCA9IG9taXQ7XG4gICAgbG9kYXNoLm9uY2UgPSBvbmNlO1xuICAgIGxvZGFzaC5wYWlycyA9IHBhaXJzO1xuICAgIGxvZGFzaC5wYXJ0aWFsID0gcGFydGlhbDtcbiAgICBsb2Rhc2gucGFydGlhbFJpZ2h0ID0gcGFydGlhbFJpZ2h0O1xuICAgIGxvZGFzaC5waWNrID0gcGljaztcbiAgICBsb2Rhc2gucGx1Y2sgPSBwbHVjaztcbiAgICBsb2Rhc2gucHJvcGVydHkgPSBwcm9wZXJ0eTtcbiAgICBsb2Rhc2gucHVsbCA9IHB1bGw7XG4gICAgbG9kYXNoLnJhbmdlID0gcmFuZ2U7XG4gICAgbG9kYXNoLnJlamVjdCA9IHJlamVjdDtcbiAgICBsb2Rhc2gucmVtb3ZlID0gcmVtb3ZlO1xuICAgIGxvZGFzaC5yZXN0ID0gcmVzdDtcbiAgICBsb2Rhc2guc2h1ZmZsZSA9IHNodWZmbGU7XG4gICAgbG9kYXNoLnNvcnRCeSA9IHNvcnRCeTtcbiAgICBsb2Rhc2gudGFwID0gdGFwO1xuICAgIGxvZGFzaC50aHJvdHRsZSA9IHRocm90dGxlO1xuICAgIGxvZGFzaC50aW1lcyA9IHRpbWVzO1xuICAgIGxvZGFzaC50b0FycmF5ID0gdG9BcnJheTtcbiAgICBsb2Rhc2gudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIGxvZGFzaC51bmlvbiA9IHVuaW9uO1xuICAgIGxvZGFzaC51bmlxID0gdW5pcTtcbiAgICBsb2Rhc2gudmFsdWVzID0gdmFsdWVzO1xuICAgIGxvZGFzaC53aGVyZSA9IHdoZXJlO1xuICAgIGxvZGFzaC53aXRob3V0ID0gd2l0aG91dDtcbiAgICBsb2Rhc2gud3JhcCA9IHdyYXA7XG4gICAgbG9kYXNoLnhvciA9IHhvcjtcbiAgICBsb2Rhc2guemlwID0gemlwO1xuICAgIGxvZGFzaC56aXBPYmplY3QgPSB6aXBPYmplY3Q7XG5cbiAgICAvLyBhZGQgYWxpYXNlc1xuICAgIGxvZGFzaC5jb2xsZWN0ID0gbWFwO1xuICAgIGxvZGFzaC5kcm9wID0gcmVzdDtcbiAgICBsb2Rhc2guZWFjaCA9IGZvckVhY2g7XG4gICAgbG9kYXNoLmVhY2hSaWdodCA9IGZvckVhY2hSaWdodDtcbiAgICBsb2Rhc2guZXh0ZW5kID0gYXNzaWduO1xuICAgIGxvZGFzaC5tZXRob2RzID0gZnVuY3Rpb25zO1xuICAgIGxvZGFzaC5vYmplY3QgPSB6aXBPYmplY3Q7XG4gICAgbG9kYXNoLnNlbGVjdCA9IGZpbHRlcjtcbiAgICBsb2Rhc2gudGFpbCA9IHJlc3Q7XG4gICAgbG9kYXNoLnVuaXF1ZSA9IHVuaXE7XG4gICAgbG9kYXNoLnVuemlwID0gemlwO1xuXG4gICAgLy8gYWRkIGZ1bmN0aW9ucyB0byBgbG9kYXNoLnByb3RvdHlwZWBcbiAgICBtaXhpbihsb2Rhc2gpO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvLyBhZGQgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIHVud3JhcHBlZCB2YWx1ZXMgd2hlbiBjaGFpbmluZ1xuICAgIGxvZGFzaC5jbG9uZSA9IGNsb25lO1xuICAgIGxvZGFzaC5jbG9uZURlZXAgPSBjbG9uZURlZXA7XG4gICAgbG9kYXNoLmNvbnRhaW5zID0gY29udGFpbnM7XG4gICAgbG9kYXNoLmVzY2FwZSA9IGVzY2FwZTtcbiAgICBsb2Rhc2guZXZlcnkgPSBldmVyeTtcbiAgICBsb2Rhc2guZmluZCA9IGZpbmQ7XG4gICAgbG9kYXNoLmZpbmRJbmRleCA9IGZpbmRJbmRleDtcbiAgICBsb2Rhc2guZmluZEtleSA9IGZpbmRLZXk7XG4gICAgbG9kYXNoLmZpbmRMYXN0ID0gZmluZExhc3Q7XG4gICAgbG9kYXNoLmZpbmRMYXN0SW5kZXggPSBmaW5kTGFzdEluZGV4O1xuICAgIGxvZGFzaC5maW5kTGFzdEtleSA9IGZpbmRMYXN0S2V5O1xuICAgIGxvZGFzaC5oYXMgPSBoYXM7XG4gICAgbG9kYXNoLmlkZW50aXR5ID0gaWRlbnRpdHk7XG4gICAgbG9kYXNoLmluZGV4T2YgPSBpbmRleE9mO1xuICAgIGxvZGFzaC5pc0FyZ3VtZW50cyA9IGlzQXJndW1lbnRzO1xuICAgIGxvZGFzaC5pc0FycmF5ID0gaXNBcnJheTtcbiAgICBsb2Rhc2guaXNCb29sZWFuID0gaXNCb29sZWFuO1xuICAgIGxvZGFzaC5pc0RhdGUgPSBpc0RhdGU7XG4gICAgbG9kYXNoLmlzRWxlbWVudCA9IGlzRWxlbWVudDtcbiAgICBsb2Rhc2guaXNFbXB0eSA9IGlzRW1wdHk7XG4gICAgbG9kYXNoLmlzRXF1YWwgPSBpc0VxdWFsO1xuICAgIGxvZGFzaC5pc0Zpbml0ZSA9IGlzRmluaXRlO1xuICAgIGxvZGFzaC5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbiAgICBsb2Rhc2guaXNOYU4gPSBpc05hTjtcbiAgICBsb2Rhc2guaXNOdWxsID0gaXNOdWxsO1xuICAgIGxvZGFzaC5pc051bWJlciA9IGlzTnVtYmVyO1xuICAgIGxvZGFzaC5pc09iamVjdCA9IGlzT2JqZWN0O1xuICAgIGxvZGFzaC5pc1BsYWluT2JqZWN0ID0gaXNQbGFpbk9iamVjdDtcbiAgICBsb2Rhc2guaXNSZWdFeHAgPSBpc1JlZ0V4cDtcbiAgICBsb2Rhc2guaXNTdHJpbmcgPSBpc1N0cmluZztcbiAgICBsb2Rhc2guaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcbiAgICBsb2Rhc2gubGFzdEluZGV4T2YgPSBsYXN0SW5kZXhPZjtcbiAgICBsb2Rhc2gubWl4aW4gPSBtaXhpbjtcbiAgICBsb2Rhc2gubm9Db25mbGljdCA9IG5vQ29uZmxpY3Q7XG4gICAgbG9kYXNoLm5vb3AgPSBub29wO1xuICAgIGxvZGFzaC5ub3cgPSBub3c7XG4gICAgbG9kYXNoLnBhcnNlSW50ID0gcGFyc2VJbnQ7XG4gICAgbG9kYXNoLnJhbmRvbSA9IHJhbmRvbTtcbiAgICBsb2Rhc2gucmVkdWNlID0gcmVkdWNlO1xuICAgIGxvZGFzaC5yZWR1Y2VSaWdodCA9IHJlZHVjZVJpZ2h0O1xuICAgIGxvZGFzaC5yZXN1bHQgPSByZXN1bHQ7XG4gICAgbG9kYXNoLnJ1bkluQ29udGV4dCA9IHJ1bkluQ29udGV4dDtcbiAgICBsb2Rhc2guc2l6ZSA9IHNpemU7XG4gICAgbG9kYXNoLnNvbWUgPSBzb21lO1xuICAgIGxvZGFzaC5zb3J0ZWRJbmRleCA9IHNvcnRlZEluZGV4O1xuICAgIGxvZGFzaC50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIGxvZGFzaC51bmVzY2FwZSA9IHVuZXNjYXBlO1xuICAgIGxvZGFzaC51bmlxdWVJZCA9IHVuaXF1ZUlkO1xuXG4gICAgLy8gYWRkIGFsaWFzZXNcbiAgICBsb2Rhc2guYWxsID0gZXZlcnk7XG4gICAgbG9kYXNoLmFueSA9IHNvbWU7XG4gICAgbG9kYXNoLmRldGVjdCA9IGZpbmQ7XG4gICAgbG9kYXNoLmZpbmRXaGVyZSA9IGZpbmQ7XG4gICAgbG9kYXNoLmZvbGRsID0gcmVkdWNlO1xuICAgIGxvZGFzaC5mb2xkciA9IHJlZHVjZVJpZ2h0O1xuICAgIGxvZGFzaC5pbmNsdWRlID0gY29udGFpbnM7XG4gICAgbG9kYXNoLmluamVjdCA9IHJlZHVjZTtcblxuICAgIG1peGluKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNvdXJjZSA9IHt9XG4gICAgICBmb3JPd24obG9kYXNoLCBmdW5jdGlvbihmdW5jLCBtZXRob2ROYW1lKSB7XG4gICAgICAgIGlmICghbG9kYXNoLnByb3RvdHlwZVttZXRob2ROYW1lXSkge1xuICAgICAgICAgIHNvdXJjZVttZXRob2ROYW1lXSA9IGZ1bmM7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICB9KCksIGZhbHNlKTtcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLy8gYWRkIGZ1bmN0aW9ucyBjYXBhYmxlIG9mIHJldHVybmluZyB3cmFwcGVkIGFuZCB1bndyYXBwZWQgdmFsdWVzIHdoZW4gY2hhaW5pbmdcbiAgICBsb2Rhc2guZmlyc3QgPSBmaXJzdDtcbiAgICBsb2Rhc2gubGFzdCA9IGxhc3Q7XG4gICAgbG9kYXNoLnNhbXBsZSA9IHNhbXBsZTtcblxuICAgIC8vIGFkZCBhbGlhc2VzXG4gICAgbG9kYXNoLnRha2UgPSBmaXJzdDtcbiAgICBsb2Rhc2guaGVhZCA9IGZpcnN0O1xuXG4gICAgZm9yT3duKGxvZGFzaCwgZnVuY3Rpb24oZnVuYywgbWV0aG9kTmFtZSkge1xuICAgICAgdmFyIGNhbGxiYWNrYWJsZSA9IG1ldGhvZE5hbWUgIT09ICdzYW1wbGUnO1xuICAgICAgaWYgKCFsb2Rhc2gucHJvdG90eXBlW21ldGhvZE5hbWVdKSB7XG4gICAgICAgIGxvZGFzaC5wcm90b3R5cGVbbWV0aG9kTmFtZV09IGZ1bmN0aW9uKG4sIGd1YXJkKSB7XG4gICAgICAgICAgdmFyIGNoYWluQWxsID0gdGhpcy5fX2NoYWluX18sXG4gICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmModGhpcy5fX3dyYXBwZWRfXywgbiwgZ3VhcmQpO1xuXG4gICAgICAgICAgcmV0dXJuICFjaGFpbkFsbCAmJiAobiA9PSBudWxsIHx8IChndWFyZCAmJiAhKGNhbGxiYWNrYWJsZSAmJiB0eXBlb2YgbiA9PSAnZnVuY3Rpb24nKSkpXG4gICAgICAgICAgICA/IHJlc3VsdFxuICAgICAgICAgICAgOiBuZXcgbG9kYXNoV3JhcHBlcihyZXN1bHQsIGNoYWluQWxsKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogVGhlIHNlbWFudGljIHZlcnNpb24gbnVtYmVyLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgc3RyaW5nXG4gICAgICovXG4gICAgbG9kYXNoLlZFUlNJT04gPSAnMi40LjEnO1xuXG4gICAgLy8gYWRkIFwiQ2hhaW5pbmdcIiBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXJcbiAgICBsb2Rhc2gucHJvdG90eXBlLmNoYWluID0gd3JhcHBlckNoYWluO1xuICAgIGxvZGFzaC5wcm90b3R5cGUudG9TdHJpbmcgPSB3cmFwcGVyVG9TdHJpbmc7XG4gICAgbG9kYXNoLnByb3RvdHlwZS52YWx1ZSA9IHdyYXBwZXJWYWx1ZU9mO1xuICAgIGxvZGFzaC5wcm90b3R5cGUudmFsdWVPZiA9IHdyYXBwZXJWYWx1ZU9mO1xuXG4gICAgLy8gYWRkIGBBcnJheWAgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIHVud3JhcHBlZCB2YWx1ZXNcbiAgICBmb3JFYWNoKFsnam9pbicsICdwb3AnLCAnc2hpZnQnXSwgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBhcnJheVJlZlttZXRob2ROYW1lXTtcbiAgICAgIGxvZGFzaC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNoYWluQWxsID0gdGhpcy5fX2NoYWluX18sXG4gICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMuX193cmFwcGVkX18sIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgcmV0dXJuIGNoYWluQWxsXG4gICAgICAgICAgPyBuZXcgbG9kYXNoV3JhcHBlcihyZXN1bHQsIGNoYWluQWxsKVxuICAgICAgICAgIDogcmVzdWx0O1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vIGFkZCBgQXJyYXlgIGZ1bmN0aW9ucyB0aGF0IHJldHVybiB0aGUgZXhpc3Rpbmcgd3JhcHBlZCB2YWx1ZVxuICAgIGZvckVhY2goWydwdXNoJywgJ3JldmVyc2UnLCAnc29ydCcsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gYXJyYXlSZWZbbWV0aG9kTmFtZV07XG4gICAgICBsb2Rhc2gucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmMuYXBwbHkodGhpcy5fX3dyYXBwZWRfXywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gYWRkIGBBcnJheWAgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIG5ldyB3cmFwcGVkIHZhbHVlc1xuICAgIGZvckVhY2goWydjb25jYXQnLCAnc2xpY2UnLCAnc3BsaWNlJ10sIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gYXJyYXlSZWZbbWV0aG9kTmFtZV07XG4gICAgICBsb2Rhc2gucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgbG9kYXNoV3JhcHBlcihmdW5jLmFwcGx5KHRoaXMuX193cmFwcGVkX18sIGFyZ3VtZW50cyksIHRoaXMuX19jaGFpbl9fKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbG9kYXNoO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLy8gZXhwb3NlIExvLURhc2hcbiAgdmFyIF8gPSBydW5JbkNvbnRleHQoKTtcblxuICAvLyBzb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzIGxpa2Ugci5qcyBjaGVjayBmb3IgY29uZGl0aW9uIHBhdHRlcm5zIGxpa2UgdGhlIGZvbGxvd2luZzpcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gRXhwb3NlIExvLURhc2ggdG8gdGhlIGdsb2JhbCBvYmplY3QgZXZlbiB3aGVuIGFuIEFNRCBsb2FkZXIgaXMgcHJlc2VudCBpblxuICAgIC8vIGNhc2UgTG8tRGFzaCBpcyBsb2FkZWQgd2l0aCBhIFJlcXVpcmVKUyBzaGltIGNvbmZpZy5cbiAgICAvLyBTZWUgaHR0cDovL3JlcXVpcmVqcy5vcmcvZG9jcy9hcGkuaHRtbCNjb25maWctc2hpbVxuICAgIHJvb3QuXyA9IF87XG5cbiAgICAvLyBkZWZpbmUgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSBzbywgdGhyb3VnaCBwYXRoIG1hcHBpbmcsIGl0IGNhbiBiZVxuICAgIC8vIHJlZmVyZW5jZWQgYXMgdGhlIFwidW5kZXJzY29yZVwiIG1vZHVsZVxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICB9XG4gIC8vIGNoZWNrIGZvciBgZXhwb3J0c2AgYWZ0ZXIgYGRlZmluZWAgaW4gY2FzZSBhIGJ1aWxkIG9wdGltaXplciBhZGRzIGFuIGBleHBvcnRzYCBvYmplY3RcbiAgZWxzZSBpZiAoZnJlZUV4cG9ydHMgJiYgZnJlZU1vZHVsZSkge1xuICAgIC8vIGluIE5vZGUuanMgb3IgUmluZ29KU1xuICAgIGlmIChtb2R1bGVFeHBvcnRzKSB7XG4gICAgICAoZnJlZU1vZHVsZS5leHBvcnRzID0gXykuXyA9IF87XG4gICAgfVxuICAgIC8vIGluIE5hcndoYWwgb3IgUmhpbm8gLXJlcXVpcmVcbiAgICBlbHNlIHtcbiAgICAgIGZyZWVFeHBvcnRzLl8gPSBfO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBpbiBhIGJyb3dzZXIgb3IgUmhpbm9cbiAgICByb290Ll8gPSBfO1xuICB9XG59LmNhbGwodGhpcykpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIC8vIFR1cm4gb2ZmIHN0cmljdCBtb2RlIGZvciB0aGlzIGZ1bmN0aW9uIHNvIHdlIGNhbiBhc3NpZ24gdG8gZ2xvYmFsLlFcbiAgICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2Uge1xuICAgICAgICBRID0gZGVmaW5pdGlvbigpO1xuICAgIH1cblxufSkoZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNTdGFja3MgPSBmYWxzZTtcbnRyeSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzU3RhY2tzID0gISFlLnN0YWNrO1xufVxuXG4vLyBBbGwgY29kZSBhZnRlciB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMgcmVwb3J0ZWRcbi8vIGJ5IFEuXG52YXIgcVN0YXJ0aW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG52YXIgcUZpbGVOYW1lO1xuXG4vLyBzaGltc1xuXG4vLyB1c2VkIGZvciBmYWxsYmFjayBpbiBcImFsbFJlc29sdmVkXCJcbnZhciBub29wID0gZnVuY3Rpb24gKCkge307XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cbnZhciBuZXh0VGljayA9KGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbiAgICB2YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xuICAgIHZhciB0YWlsID0gaGVhZDtcbiAgICB2YXIgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB2YXIgcmVxdWVzdFRpY2sgPSB2b2lkIDA7XG4gICAgdmFyIGlzTm9kZUpTID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG5cbiAgICAgICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgICAgIHZhciB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmbHVzaGluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIG5leHRUaWNrID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICAgICAgbmV4dDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gTm9kZS5qcyBiZWZvcmUgMC45LiBOb3RlIHRoYXQgc29tZSBmYWtlLU5vZGUgZW52aXJvbm1lbnRzLCBsaWtlIHRoZVxuICAgICAgICAvLyBNb2NoYSB0ZXN0IHJ1bm5lciwgaW50cm9kdWNlIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYC5cbiAgICAgICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAgICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgLy8gQXQgbGVhc3QgU2FmYXJpIFZlcnNpb24gNi4wLjUgKDg1MzYuMzAuMSkgaW50ZXJtaXR0ZW50bHkgY2Fubm90IGNyZWF0ZVxuICAgICAgICAvLyB3b3JraW5nIG1lc3NhZ2UgcG9ydHMgdGhlIGZpcnN0IHRpbWUgYSBwYWdlIGxvYWRzLlxuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gcmVxdWVzdFBvcnRUaWNrO1xuICAgICAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXF1ZXN0UG9ydFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBPcGVyYSByZXF1aXJlcyB1cyB0byBwcm92aWRlIGEgbWVzc2FnZSBwYXlsb2FkLCByZWdhcmRsZXNzIG9mXG4gICAgICAgICAgICAvLyB3aGV0aGVyIHdlIHVzZSBpdC5cbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICByZXF1ZXN0UG9ydFRpY2soKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9sZCBicm93c2Vyc1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgZnVsZmlsbGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgZnVsZmlsbGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbihhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9mdWxmaWxsZWQodmFsdWUpKTtcbiAgICAgICAgfSwgXCJ3aGVuXCIsIFtmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9yZWplY3RlZChleGNlcHRpb24pKTtcbiAgICAgICAgfV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUHJvZ3Jlc3MgcHJvcGFnYXRvciBuZWVkIHRvIGJlIGF0dGFjaGVkIGluIHRoZSBjdXJyZW50IHRpY2suXG4gICAgc2VsZi5wcm9taXNlRGlzcGF0Y2godm9pZCAwLCBcIndoZW5cIiwgW3ZvaWQgMCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZTtcbiAgICAgICAgdmFyIHRocmV3ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXdWYWx1ZSA9IF9wcm9ncmVzc2VkKHZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyZXcgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhyZXcpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeShuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIG9ic2VydmVyIG9uIGEgcHJvbWlzZS5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICpcbiAqIDEuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gKiAyLiB0aGF0IGVpdGhlciB0aGUgZnVsZmlsbGVkIGNhbGxiYWNrIG9yIHRoZSByZWplY3RlZCBjYWxsYmFjayB3aWxsIGJlXG4gKiAgICBjYWxsZWQsIGJ1dCBub3QgYm90aC5cbiAqIDMuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIG5vdCBiZSBjYWxsZWQgaW4gdGhpcyB0dXJuLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSAgICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSB0byBvYnNlcnZlXG4gKiBAcGFyYW0gZnVsZmlsbGVkICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiBAcGFyYW0gcmVqZWN0ZWQgICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgcmVqZWN0aW9uIGV4Y2VwdGlvblxuICogQHBhcmFtIHByb2dyZXNzZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgaW52b2tlZCBjYWxsYmFja1xuICovXG5RLndoZW4gPSB3aGVuO1xuZnVuY3Rpb24gd2hlbih2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsdWU7IH0pO1xufTtcblxuUS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uIChwcm9taXNlLCB2YWx1ZSkge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IHJlYXNvbjsgfSk7XG59O1xuXG5RLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlamVjdChyZWFzb24pO1xufTtcblxuLyoqXG4gKiBJZiBhbiBvYmplY3QgaXMgbm90IGEgcHJvbWlzZSwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUuXG4gKiBJZiBhIHByb21pc2UgaXMgcmVqZWN0ZWQsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlIHRvby5cbiAqIElmIGl04oCZcyBhIGZ1bGZpbGxlZCBwcm9taXNlLCB0aGUgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmVhcmVyLlxuICogSWYgaXTigJlzIGEgZGVmZXJyZWQgcHJvbWlzZSBhbmQgdGhlIGRlZmVycmVkIGhhcyBiZWVuIHJlc29sdmVkLCB0aGVcbiAqIHJlc29sdXRpb24gaXMgXCJuZWFyZXJcIi5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIG1vc3QgcmVzb2x2ZWQgKG5lYXJlc3QpIGZvcm0gb2YgdGhlIG9iamVjdFxuICovXG5cbi8vIFhYWCBzaG91bGQgd2UgcmUtZG8gdGhpcz9cblEubmVhcmVyID0gbmVhcmVyO1xuZnVuY3Rpb24gbmVhcmVyKHZhbHVlKSB7XG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IHZhbHVlLmluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcHJvbWlzZS5cbiAqIE90aGVyd2lzZSBpdCBpcyBhIGZ1bGZpbGxlZCB2YWx1ZS5cbiAqL1xuUS5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiZcbiAgICAgICAgdHlwZW9mIG9iamVjdC5wcm9taXNlRGlzcGF0Y2ggPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICB0eXBlb2Ygb2JqZWN0Lmluc3BlY3QgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4Y2VwdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIGNvdW50RG93biA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK2NvdW50RG93bjtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tY291bnREb3duID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChjb3VudERvd24gPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtTdHJpbmd9IGN1c3RvbSBlcnJvciBtZXNzYWdlIChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIG1lc3NhZ2UpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgbWVzc2FnZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKG1lc3NhZ2UgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbi8vIEFsbCBjb2RlIGJlZm9yZSB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMuXG52YXIgcUVuZGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xuXG5yZXR1cm4gUTtcblxufSk7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpKSJdfQ==
