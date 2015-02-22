!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.pojoviz=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Q = require('q');
var utils = require('./util/');
var assert = require('assert');

var Inspector = require('./analyzer/Inspector');
var InspectedInstances = require('./InspectedInstances');

// enable promise chain debug
Q.longStackSupport = true;

var inspector, oldInspector;
var pojoviz;

// public api
pojoviz = {
  /**
   * Clears the inspector variable
   * @chainable
   */
  unsetInspector: function () {
    oldInspector = inspector;
    inspector = null;
    return this;
  },
  /**
   * Gets the current inspector (set through #setCurrentInspector)
   * @returns {*}
   */
  getCurrentInspector: function () {
    return inspector;
  },
  /**
   * Given an object containing the configuration options of a
   * possible new instance of Inspector, this method checks if there's
   * already an instance with the same displayName/entryPoint to avoid
   * creating more Instances of the same type, calls the hook
   * `modifyInstance` after the inspector is retrieved/created
   *
   * @param {config} options Options passed to an Inspector instance
   * if the entryPoint/displayName wasn't created yet in
   * InspectorInstances
   * @returns {Promise}
   */
  run: function (options) {
    assert(options);
    var entryPoint = options.displayName || options.entryPoint;
    assert(entryPoint);
    oldInspector = inspector;
    inspector = InspectedInstances[entryPoint];

    if (!inspector) {
      inspector = InspectedInstances.create(options);
    }
    inspector.modifyInstance(options);
    return inspector.init();
  },

  // expose inner modules
  ObjectAnalyzer: require('./ObjectAnalyzer'),
  InspectedInstances: InspectedInstances,
  analyzer: {
    Inspector: Inspector
  },
  Inspector: Inspector,
  utils: require('./util'),

  // known configurations
  schemas: require('./schemas')
};

// alias
pojoviz.setCurrentInspector = pojoviz.run;

module.exports = pojoviz;
},{"./InspectedInstances":7,"./ObjectAnalyzer":8,"./analyzer/Inspector":12,"./schemas":15,"./util":21,"./util/":21,"assert":2,"q":undefined}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":6}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

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
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var Inspector = require('./analyzer/Inspector');
var PObject = require('./analyzer/Object');
var BuiltIn = require('./analyzer/BuiltIn');
var Global = require('./analyzer/Global');
var Angular = require('./analyzer/Angular');
var libraries;

var proto = {
  /**
   * Creates a new Inspector with `config` as its configuration
   * saved in `this` as `entryPoint`
   * @param {Object} options
   * @chainable
   */
  create: function (options) {
    var displayName = options.displayName || options.entryPoint;
    console.log('creating a generic container for: ' + displayName, options);
    return (libraries[displayName] = new Inspector(options));
  },
  /**
   * Execute `fn` with all the properties saved in `this`
   * @param fn
   * @chainable
   */
  all: function (fn) {
    _.forOwn(libraries, fn);
    return this;
  },
  /**
   * Marks all the properties saved in `this` as dirty
   * @chainable
   */
  setDirty: function () {
    this.all(function (v) {
      v.setDirty();
    });
    return this;
  }
};

libraries = Object.create(proto);
//console.log(libraries);
_.merge(libraries, {
  object: new PObject({
    displayName: 'Object'
  }),
  builtIn: new BuiltIn({
    displayName: 'Built In'
  }),
  global: new Global(),
  //popular
  angular: new Angular()
  //huge
  //three: new Inspector({
  //  entryPoint: 'THREE',
  //  alwaysDirty: true
  //})
});

Inspector.instances = libraries;

module.exports = libraries;

},{"./analyzer/Angular":9,"./analyzer/BuiltIn":10,"./analyzer/Global":11,"./analyzer/Inspector":12,"./analyzer/Object":13,"lodash":undefined}],8:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var assert = require('assert');

var HashMap = require('./util/HashMap');
var hashKey = require('./util/hashKey');
var labeler = require('./util/labeler');
var utils = require('./util');

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
    if (utils.isFunction(obj) &&
        utils.isObjectOrFunction(obj.prototype)) {
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
 * @param {Object} [config.items = new HashMap]
 * @param {Object} [config.forbidden = new HashMap]
 * @param {Object} [config.cache = true]
 * @param {Object} [config.levels = Analyzer.DFS_LEVELS]
 * @param {Object} [config.visitConstructors = Analyzer.VISIT_CONSTRUCTORS]
 * @param {Object} [config.visitSimpleFunctions = Analyzer.VISIT_SIMPLE_FUNCTIONS]
 */
function Analyzer(config) {
  config = _.merge(_.clone(Analyzer.DEFAULT_CONFIG, true), config);

  /**
   * items registered in this instance
   * @type {HashMap}
   */
  this.items = config.items || new HashMap();

  /**
   * Forbidden objects
   * @type {HashMap}
   */
  this.forbidden = config.forbidden || new HashMap();

  /**
   * Print debug info in the console
   * @type {boolean}
   */
  this.debug = true;

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
  visitConstructors: Analyzer.VISIT_CONSTRUCTORS,
  visitSimpleFunctions: Analyzer.VISIT_SIMPLE_FUNCTIONS,
  visitArrays: Analyzer.VISIT_ARRAYS,
  levels: Analyzer.DFS_LEVELS
};

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
  buildNodeProperties: function (value, parent, property) {
    return {
      parent: hashKey(parent),
      property: property,
      //value: value,
      type: typeof value,
      isTraversable: utils.isTraversable(value),
      isFunction: utils.isFunction(value),
      isObject: utils.isObject(value),
      toString: utils.internalClassProperty(value)
    };
  },

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
  traversableObjectProperties: function (obj, property) {
    var me = this;
    var value;
    try {
      value = obj[property];
    } catch (e) {
      return {
        parent: hashKey(obj),
        property: property,
        unreachable: true,
        isTraversable: false
      };
    }
    // self, parent, property
    var properties = me.buildNodeProperties(value, obj, property);

    // if the current property is a function and it's not allowed to
    // visit simple functions mark the property as not traversable
    if (properties.isFunction && !this.visitSimpleFunctions) {
      var ownProperties = Object.getOwnPropertyNames(value);
      var length = ownProperties.length;
      // the minimum number of properties a normal function has is 5
      // - ["length", "name", "arguments", "caller", "prototype"]

      // an additional property retrieved is the hidden key that
      // the hash function may have already set
      if (ownProperties.indexOf(hashKey.hiddenKey) > -1) {
        --length;
      }
      // discard the prototype link to consider a property simple
      if (ownProperties.indexOf('prototype') > -1) {
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
      if (typeof value.name === 'string' &&
          value.name.search(/^[A-Z]/) > -1) {
        properties.isTraversable = true;
        properties.isConstructor = true;
      }
    }

    // verification of the flag visitArrays when it's set to false
    if (properties.toString === 'Array' && !this.visitArrays) {
      properties.isTraversable = false;
    }

    return properties;
  },

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
  getProperties: function (obj, traversableOnly) {
    var me = this;
    var hk = hashKey(obj);
    var allProperties;
    var nodeProperties;

    if (!obj) {
      throw 'this method needs an object to analyze';
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
    // set a name on each property
    allProperties
      .forEach(function (propertyDescription) {
        labeler(obj, propertyDescription.property);
      });

    // special properties
    // __proto__
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      nodeProperties = me.buildNodeProperties(proto, obj, '[[Prototype]]');
      nodeProperties.hidden = true;
      allProperties.push(nodeProperties);
    }

    if (this.cache && !traversableOnly) {
      this.__objectsCache__[hk] = allProperties;
    }

    return allProperties;
  },

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
  analyzeObjects: function (objects, currentLevel) {
    var me = this;
    if (currentLevel <= me.levels) {
      objects.forEach(function (v) {
        if (!me.items.get(v) &&           // registered check
          !me.isForbidden(v)            // forbidden check
        ) {

          // add the item to the registered items pool
          me.items.put(v);

          // dfs to the next level
          me.analyzeObjects(
            // get all the links outgoing from `v`
            me.getOwnLinks(v)
              // to analyze the tree only the `to` property is needed
              .map(function (link) {
                return link.to;
              }),
            currentLevel + 1
          );
        }
      });
    }
  },

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
  getOwnLinks: function (obj) {
    var me = this;
    var links = [];
    var properties;
    var name = hashKey(obj);

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

    // given an `obj` let's find out if it has a hash or not
    // if it doesn't have a hash then we have to analyze the name of
    // the property which when applied on an external objects gives obj
    //
    // it's not needed to set a hash for `prototype` or `constructor`
    // since the hashKey function takes care of assigning it
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

    properties
      .filter(function (desc) {
        // desc.property might be [[Prototype]], since obj["[[Prototype]]"]
        // doesn't exist it's not valid a property to be accessed
        return desc.property !== '[[Prototype]]';
      })
      .forEach(function (desc) {
        var ref = obj[desc.property];
        assert(ref, 'obj[property] should exist');
        // if the object doesn't have a hashKey
        // let's give it a name equal to the property being analyzed
        //getAugmentedHash(ref, desc.property);

        if (!me.isForbidden(ref)) {
          links.push({
            from: obj,
            fromHash: hashKey(obj),
            to: ref,
            toHash: hashKey(ref),
            property: desc.property
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
      this.__linksCache__[name] = links;
    }

    return links;
  },

  /**
   * Marks this analyzer as dirty
   */
  makeDirty: function () {
    this.dirty = true;
  },

  /**
   * Set the number of levels for the dfs routine
   * @param {number} l
   */
  setLevels: function (l) {
    this.levels = l;
  },

  /**
   * Sets the dirty state of this analyzer
   * @param {boolean} d
   */
  setDirty: function (d) {
    this.dirty = d;
  },

  /**
   * Gets the items stored in this Analyzer
   * @returns {HashMap}
   */
  getItems: function () {
    return this.items;
  },

  /**
   * @private
   * Returns the labels of the object `obj`, each label is stored in
   * the labeler util
   *
   * @param  obj
   * @return {Array}
   */
  stringifyObjectLabels: function (obj) {
    var labels = labeler(obj);
    assert(labels.size(), 'object must have labels');
    return labels.getValues();
  },

  /**
   * @private
   * This method stringifies the properties of the object `obj`, to avoid
   * getting the JSON.stringify cyclic error let's delete some properties
   * that are know to be objects/functions
   *
   * @param  obj
   * @return {Array}
   */
  stringifyObjectProperties: function (obj) {
    return this.getProperties(obj);
  },

  /**
   * @private
   * Returns a representation of the outgoing links of
   * an object
   * @return {Object}
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
      labels = {},
      nodes = {},
      edges = {};
    if (me.debug) {
      console.log(me);
    }
    me.debug && console.time('stringify');
    _.forOwn(me.items, function (v) {
      var hk = hashKey(v);
      labels[hk] = me.stringifyObjectLabels(v);
      nodes[hk] = me.stringifyObjectProperties(v);
      edges[hk] = me.stringifyObjectLinks(v);
    });
    if (me.debug) {
      console.log('nodes', nodes);
      console.log('edges', edges);
      console.log('labels', labels);
    }
    me.debug && console.timeEnd('stringify');
    return {
      labels: labels,
      edges: edges,
      nodes: nodes
    };
  },

  /**
   * Alias for #analyzeObjects
   * @param {Array} objects
   * @chainable
   */
  add: function (objects) {
    //console.time('analyze');
    this.analyzeObjects(objects, 0);
    //console.timeEnd('analyze');
    return this;
  },

  /**
   * Removes some existing objects from the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to remove the prototype
   * if the current object being removed is a function
   * @chainable
   */
  remove: function (objects, withPrototype) {
    var me = this;

    function doRemove(obj) {
      me.items.remove(obj);
    }

    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doRemove);
      } else {
        doRemove(obj);
      }
    });
    return me;
  },

  /**
   * Forbids some objects to be added to the items HashMap
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  forbid: function (objects, withPrototype) {
    var me = this;
    me.remove(objects, withPrototype);

    function doForbid(obj) {
      me.forbidden.put(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doForbid);
      } else {
        doForbid(obj);
      }
    });
  },

  /**
   * Allows some objects to be added to the items HashMap, call this to
   * remove some existing objects from the forbidden HashMap (so that when
   * the tree is analyzed again)
   * @param {Array} objects
   * @param {boolean} withPrototype True to forbid the prototype
   * if the current object being forbidden is a function
   */
  allow: function (objects, withPrototype) {
    var me = this;

    function doAllow(obj) {
      me.forbidden.remove(obj);
    }
    objects.forEach(function (obj) {
      if (withPrototype) {
        withFunctionAndPrototype(obj, doAllow);
      } else {
        doAllow(obj);
      }
    });
  },

  /**
   * Empties all the info stored in this analyzer
   */
  reset: function () {
    this.__linksCache__ = {};
    this.__objectsCache__ = {};
    this.forbidden.empty();
    this.items.empty();
  }
};

var proto = Analyzer.prototype;
function chain(method) {
  proto[method] =
    utils.functionChain()
      .chain(proto.makeDirty)
      .chain(proto[method]);
}

// call #makeDirty before all these methods are called
chain('add');
chain('remove');
chain('forbid');
chain('allow');

module.exports = Analyzer;

},{"./util":21,"./util/HashMap":19,"./util/hashKey":20,"./util/labeler":22,"assert":2,"lodash":undefined}],9:[function(require,module,exports){
(function (global){
'use strict';

var _ = require('lodash');
var Inspector = require('./Inspector');
var hashKey = require('../util/hashKey');

function Angular(config) {
  Inspector.call(this, _.merge({
    entryPoint: 'angular',
    displayName: 'AngularJS',
    alwaysDirty: true,
    additionalForbiddenTokens: 'global:jQuery'
  }, config));

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
    '$timeout'
    // '$window'
  ].map(function (v) {
    return { checked: true, name: v };
  });
}

Angular.prototype = Object.create(Inspector.prototype);

Angular.prototype.getSelectedServices = function () {
  var me = this,
    toAnalyze = [];

  global.angular.module('app', ['ng']);
  this.injector = global.angular.injector(['app']);

  me.services.forEach(function (s) {
    if (s.checked) {
      var obj = me.injector.get(s.name);
      toAnalyze.push(obj);
    }
  });
  return toAnalyze;
};

/**
 * @override
 */
Angular.prototype.inspectSelf = function () {
  var me = this;
  this.debug && console.log('inspecting angular');

  // get the objects that need to be forbidden
  var toForbid = me.parseForbiddenTokens();
  this.debug && console.log('forbidding: ', toForbid);
  this.analyzer.forbid(toForbid, true);

  this.analyzer.add(
    [global.angular].concat(this.getSelectedServices())
  );
};

/**
 * @template
 * Since Angular is a script retrieved on demand but the instance
 * is already created in InspectedInstance, let's alter the
 * properties it has before making the request
 */
Angular.prototype.modifyInstance = function (options) {
  this.src = options.src;
};

module.exports = Angular;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../util/hashKey":20,"./Inspector":12,"lodash":undefined}],10:[function(require,module,exports){
'use strict';

var GenericAnalyzer = require('./Inspector'),
  utils = require('../util/');

var toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

function BuiltIn(options) {
  GenericAnalyzer.call(this, options);
}

BuiltIn.prototype = Object.create(GenericAnalyzer.prototype);

/**
 * @override
 */
BuiltIn.prototype.inspectSelf = function () {
  this.debug && console.log('inspecting builtIn objects');
  this.analyzer.add(this.getItems());
};

/**
 * @override
 * @returns {Array}
 */
BuiltIn.prototype.getItems = function () {
  return toInspect;
};

BuiltIn.prototype.showSearch = function (nodeName, nodeProperty) {
  var url = 'https://developer.mozilla.org/en-US/search?' +
    utils.toQueryString({
      q: encodeURIComponent(nodeName + ' ' + nodeProperty)
    });
  window.open(url);
};

module.exports = BuiltIn;
},{"../util/":21,"./Inspector":12}],11:[function(require,module,exports){
(function (global){
'use strict';

var _ = require('lodash');
var hashKey = require('../util/hashKey');
var Inspector = require('./Inspector');

var toInspect = [global];

function Global() {
  Inspector.call(this, {
    analyzerConfig: {
      levels: 1,
      visitConstructors: false
    },
    alwaysDirty: true
  });
}

Global.prototype = Object.create(Inspector.prototype);

Global.prototype.getItems = function () {
  return toInspect;
};

Global.prototype.inspectSelf = function () {
  var me = this;
  this.debug && console.log('inspecting global');
  //var me = this,
  //  hashes = require('../InspectedInstances');
  //
  //_.forOwn(hashes, function (v, k) {
  //  if (v.getItems()) {
  //    me.analyzer.forbid([v.getItems()], true);
  //  }
  //});
  this.analyzer.items.empty();
  this.analyzer.add(me.getItems());
};

module.exports = Global;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../util/hashKey":20,"./Inspector":12,"lodash":undefined}],12:[function(require,module,exports){
(function (global){
'use strict';

var Q = require('q');
var _ = require('lodash');
var util = require('util');
var assert = require('assert');
var utils = require('../util/');
var hashKey = require('../util/hashKey');
var Analyzer = require('../ObjectAnalyzer');

var searchEngine = 'https://duckduckgo.com/?q=';

/**
 * @constructor
 *
 * Instances of the class inspector decide which objects will be
 * analyzed by the internal analyzer it holds, besides doing that
 * this inspector is able to:
 *
 * - do deferred analysis (analysis on demand)
 * - fetch external scripts in series (the analysis is made
 *   when all the scrips have finished loading)
 * - mark itself as an already inspected instance so that
 *   further inspection calls are not made
 * - receive a configuration to forbid complete graphs from
 *   the analysis step
 *
 * Sample usage:
 *
 * Analysis of a simple object:
 *
 *    var x = {};
 *    var inspector = new Inspector();
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x}
 *      })
 *
 * As seen in the code there is a default variable which specifies
 * the objects that will be forbidden, the value is a pipe separated
 * list of commands (see @forbiddenTokens) which is making the
 * inspector avoid the builtIn properties, let's avoid that by making
 * forbiddenTokens null:
 *
 *    var x = {};
 *    var inspector = new Inspector({
 *      forbiddenTokens: null
 *    });
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x, Object,
 *          Object.prototype, Function, Function.prototype}
 *      })
 *
 * To execute more complex analysis consider overriding:
 *
 * - inspectSelf
 * - getItems
 *
 * See BuiltIn.js for a basic override of the methods above
 *
 * @param {Object} config
 * @param {string} [config.entryPoint]
 * @param {string} [config.src]
 * @param {string} [config.displayName]
 * @param {string} [config.forbiddenTokens=Inspector.DEFAULT_FORBIDDEN_TOKENS]
 */
function Inspector(config) {
  config = _.merge(_.clone(Inspector.DEFAULT_CONFIG, true), config);

  /**
   * If provided it'll be used as the starting object from the
   * global object to be analyzed, nested objects can be specified
   * with the dot notation
   * @type {string}
   */
  this.entryPoint = config.entryPoint;

  /**
   * Name to be displayed
   * @type {string}
   */
  this.displayName = config.displayName;

  /**
   * If the inspector needs to fetch external resources use
   * a string separated with the pipe | character, the scripts
   * are loaded in series because one script might need the existence
   * of another before it's fetched
   * @type {string}
   */
  this.src = config.src;

  /**
   * Each token determines which objects will be forbidden
   * when the analyzer is run.
   *
   * Token examples:
   *
   * - pojoviz:{string}
   *   Forbids all the items saved in the {string} instance which
   *   is stored in the InspectedInstances object,
   *   assuming that each is a subclass of `Inspector`
   *
   * e.g.
   *
   *   // forbid all the items found in the builtIn inspector
   *   pojoviz:builtIn
   *
   * - global:{string}
   *   Forbids an object which is in the global object, {string} might
   *   also indicate a nested object using . as a normal property
   *   retrieval
   *
   * e.g.
   *
   *   global:document
   *   global:document.body
   *   global:document.head
   *
   * ForbiddenTokens example:
   *
   *  pojoviz:builtIn|pojoviz:window|global:document
   *
   * @type {string}
   */
  this.forbiddenTokens = [config.forbiddenTokens, config.additionalForbiddenTokens]
    .filter(function (token) {
      return !!token;
    })
    .join('|');

  /**
   * This inspector is initially in a dirty state
   * @type {boolean}
   */
  this.dirty = true;

  /**
   * Print debug info
   * @type {boolean}
   */
  this.debug = config.debug;

  /**
   * To avoid reanalyzing the same structure multiple times a small
   * optimization is to mark the inspector as inspected, to avoid
   * this optimization pass alwaysDirty as true in the options
   * @type {boolean}
   */
  this.alwaysDirty = config.alwaysDirty;

  /**
   * An instance of ObjectAnalyzer which will save all
   * the inspected objects
   * @type {ObjectAnalyzer}
   */
  this.analyzer = new Analyzer(config.analyzerConfig);
}

/**
 * An object which holds all the inspector instances created
 * (filled in the file InspectedInstances)
 * @type {Object}
 */
Inspector.instances = null;

/**
 * Default forbidden commands (in node global is the global object)
 * @type {string[]}
 */
Inspector.DEFAULT_FORBIDDEN_TOKENS_ARRAY = [
  'pojoviz:global',
  'pojoviz:builtIn',
  'global:document'
];

/**
 * Forbidden tokens which are set by default on any Inspector instance
 * @type {string}
 */
Inspector.DEFAULT_FORBIDDEN_TOKENS =
  Inspector.DEFAULT_FORBIDDEN_TOKENS_ARRAY.join('|');

/**
 * Default config used whenever an instance of Inspector is created
 * @type {Object}
 */
Inspector.DEFAULT_CONFIG = {
  src: null,
  entryPoint: '',
  displayName: '',
  alwaysDirty: false,
  debug: !!global.window,
  forbiddenTokens: Inspector.DEFAULT_FORBIDDEN_TOKENS,
  additionalForbiddenTokens: null,
  analyzerConfig: {}
};

/**
 * Update the builtIn visibility of all the new instances to be created
 * @param visible
 */
Inspector.setBuiltInVisibility = function (visible) {
  var me = this;
  var token = 'pojoviz:builtIn';
  var arr = me.DEFAULT_FORBIDDEN_TOKENS_ARRAY;
  if (visible) {
    arr.push(token);
  } else {
    arr.splice(arr.indexOf(token), 1);
  }
  me.DEFAULT_CONFIG.forbiddenTokens = arr.join('|');
};

/**
 * Init routine, should be called on demand to initialize the
 * analysis process, it orchestrates the following:
 *
 * - fetching of external resources
 * - inspection of elements if the inspector is in a dirty state
 *
 * @returns {Promise}
 */
Inspector.prototype.init = function () {
  var me = this;
  me.debug && console.log('%cPojoViz', 'font-size: 15px; color: ');
  return me.fetch()
    .then(function () {
      if (me.alwaysDirty) {
        me.setDirty();
      }
      if (me.dirty) {
        me.debug && console.log('%cInspecting: %s', 'color: red', me.entryPoint || me.displayName);
        me.inspect();
      }
      return me;
    });
};

/**
 * @template
 *
 * Performs the analysis of an object given an entryPoint, before
 * performing the analysis it identifies which object need to be
 * forbidden (forbiddenTokens)
 *
 * @chainable
 */
Inspector.prototype.inspectSelf = function () {
  var me = this;
  var start = me.findNestedValueInGlobal(me.entryPoint);
  var analyzer = this.analyzer;

  if (!start) {
    console.error(this);
    throw 'entry point not found!';
  }
  me.debug && console.log('analyzing global.' + me.entryPoint);

  // before inspect hook
  me.beforeInspectSelf();

  // get the objects that need to be forbidden
  var toForbid = me.parseForbiddenTokens();
  me.debug && console.log('forbidding: ', toForbid);
  analyzer.forbid(toForbid, true);

  // perform the analysis
  me.debug && console.log('adding: ' + start);
  analyzer.add([start]);

  // after inspect hook
  me.afterInspectSelf();
  return me;
};

/**
 * @template
 * before inspect self hook
 */
Inspector.prototype.beforeInspectSelf = function () {
};

/**
 * @template
 * after inspect self hook
 */
Inspector.prototype.afterInspectSelf = function () {
};

/**
 * Parses the forbiddenTokens string and identifies which
 * objects should be forbidden from the analysis phase
 * @returns {Array}
 */
Inspector.prototype.parseForbiddenTokens = function () {
  var me = this;
  var forbidden = this.forbiddenTokens.split('|');
  var toForbid = [];
  me.debug && console.log('about to forbid: ', forbidden);
  forbidden
    .filter(function (v) { return !!v; })
    .forEach(function(token) {
      var arr = [];
      var tokens;
      if (token.search(/^pojoviz:/) > -1) {
        tokens = token.split(':');

        // if it's a command for the library then make sure it exists
        assert(Inspector.instances[tokens[1]]);
        arr = Inspector.instances[tokens[1]].getItems();
      } else if (token.search(/^global:/) > -1) {
        tokens = token.split(':');
        arr = [me.findNestedValueInGlobal(tokens[1])];
      }

      toForbid = toForbid.concat(arr);
    });
  return toForbid;
};

/**
 * Marks this inspector as dirty
 * @chainable
 */
Inspector.prototype.setDirty = function () {
  this.dirty = true;
  this.analyzer.items.empty();
  this.analyzer.forbidden.empty();
  return this;
};

/**
 * Marks this inspector as not dirty (so that further calls
 * to inspect are not made)
 * @chainable
 */
Inspector.prototype.unsetDirty = function () {
  this.dirty = false;
  return this;
};

/**
 * @template
 * Should be called after the instance is created to modify it with
 * additional options
 */
Inspector.prototype.modifyInstance = function (options) {
};

/**
 * @private
 * Performs the inspection on self
 * @chainable
 */
Inspector.prototype.inspect = function () {
  return this
    .unsetDirty()
    .inspectSelf();
};

/**
 * @template
 * Prerender hook
 */
Inspector.prototype.preRender = function () {
};

/**
 * @template
 * Postrender hook
 */
Inspector.prototype.postRender = function () {
};

/**
 * @templates
 * Returns the predefined items that this inspector is in charge of
 * it's useful to determine which objects need to be discarded in
 * #inspectSelf
 */
Inspector.prototype.getItems = function () {
  return [];
};

/**
 * Given a string which have tokens separated by the . symbol
 * this methods checks if it's a valid value under the global object
 *
 * e.g.
 *        'document.body'
 *        returns global.document.body since it's a valid object
 *        under the global object
 *
 * @param nestedConfiguration
 * @returns {*}
 */
Inspector.prototype.findNestedValueInGlobal = function (nestedConfiguration) {
  var tokens = nestedConfiguration.split('.');
  var start = global;
  while (tokens.length) {
    var token = tokens.shift();
    if (!start.hasOwnProperty(token)) {
      this.debug && console.warn('nestedConfig not found!');
      return null;
    }
    start = start[token];
  }
  return start;
};

/**
 * Fetches all the resources required to perform the inspection,
 * (which are saved in `this.src`), returns a promise which is
 * resolved when all the scrips have finished loading
 * @returns {Promise}
 */
Inspector.prototype.fetch = function () {
  var me = this;

  /**
   * Given a string `v` it fetches it an an async way,
   * since this method returns a promise it allows easy chaining
   * see the reduce part below
   * @param v
   * @returns {Function}
   */
  function promisify(v) {
    return function () {
      utils.notification('fetching script ' + v, true);
      var deferred = Q.defer();
      var script = document.createElement('script');
      script.src = v;
      script.onload = function () {
        utils.notification('completed fetching script ' + v, true);
        deferred.resolve(me.findNestedValueInGlobal(me.entryPoint));
      };
      document.head.appendChild(script);
      return deferred.promise;
    };
  }

  if (me.src) {
    if (me.findNestedValueInGlobal(me.entryPoint)) {
      console.log('resource already fetched: ' + me.entryPoint);
    } else {
      var srcs = this.src.split('|');
      return srcs.reduce(function (prev, current) {
        return prev.then(promisify(current));
      }, Q('reduce'));
    }
  }

  return Q.delay(0);
};

/**
 * Toggles the visibility of the builtIn objects
 * @param visible
 */
Inspector.prototype.setBuiltInVisibility = function (visible) {
  var me = this;
  var token = 'pojoviz:builtIn';
  var arr = me.forbiddenTokens;
  if (visible) {
    arr.push(token);
  } else {
    arr.splice(arr.indexOf(token), 1);
  }
};

Inspector.prototype.showSearch = function (nodeName, nodeProperty) {
  var me = this;
  var tpl = _.template('${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}');
  var compiled = tpl({
    searchEngine: searchEngine,
    lucky: Inspector.lucky ? '!ducky' : '',
    libraryName: me.entryPoint,
    nodeName: nodeName,
    nodeProperty: nodeProperty
  });
  window.open(compiled);
};

module.exports = Inspector;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ObjectAnalyzer":8,"../util/":21,"../util/hashKey":20,"assert":2,"lodash":undefined,"q":undefined,"util":6}],13:[function(require,module,exports){
'use strict';
var Inspector = require('./Inspector');
function PObject(options) {
  Inspector.call(this, options);
}

PObject.prototype = Object.create(Inspector.prototype);

PObject.prototype.inspectSelf = function () {
  this.debug && console.log('inspecting Object objects');
  this.analyzer.add(this.getItems());
  return this;
};

PObject.prototype.getItems = function () {
  return [Object];
};

module.exports = PObject;
},{"./Inspector":12}],14:[function(require,module,exports){
/**
 * Created by mauricio on 2/17/15.
 */
module.exports = [{
  entryPoint: 'global'
}, {
  label: 'ExtJS',
  src: '//cdn.sencha.com/ext/gpl/4.2.1/ext-all.js',
  entryPoint: 'Ext',
  analyzerConfig: {
    levels: 1
  }
}, {
  entryPoint: 'THREE'
}, {
  entryPoint: 'Phaser',
  src: '//cdnjs.cloudflare.com/ajax/libs/phaser/2.0.6/phaser.min.js',
  analyzerConfig: {
    visitSimpleFunctions: true
  }
}];
},{}],15:[function(require,module,exports){
/**
 * Created by mauricio on 2/17/15.
 */
var _ = require('lodash');

var proto = {
  find: function (entry) {
    function predicate(v) {
      return v.displayName === entry || v.entryPoint === entry;
    }
    var result;
    _.forOwn(this, function (schema) {
      result = result || _.find(schema, predicate);
    });
    return result;
  }
};

var schemas = Object.create(proto);

_.merge(schemas, {
  knownSchemas: require('./knownSchemas'),
  notableLibraries: require('./notableLibraries'),
  myLibraries: require('./myLibraries'),
  hugeSchemas: require('./hugeSchemas'),
  downloaded: []
});

module.exports = schemas;
},{"./hugeSchemas":14,"./knownSchemas":16,"./myLibraries":17,"./notableLibraries":18,"lodash":undefined}],16:[function(require,module,exports){
/**
 * Created by mauricio on 2/17/15.
 */
module.exports = [{
  label: 'Object',
  displayName: 'object'
}, {
  label: 'BuiltIn Objects',
  displayName: 'builtIn'
}];
},{}],17:[function(require,module,exports){
/**
 * Created by mauricio on 2/17/15.
 */
module.exports = [{
  label: 'PojoViz',
  entryPoint: 'pojoviz',
  alwaysDirty: true,
  additionalForbiddenTokens: 'global:pojoviz.InspectedInstances.pojoviz.analyzer.items',
  analyzerConfig: {
    visitArrays: false
  }
}, {
  entryPoint: 't3'
}];
},{}],18:[function(require,module,exports){
/**
 * Created by mauricio on 2/17/15.
 */
module.exports = [{
  src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js',
  entryPoint: 'jQuery'
}, {
  entryPoint: 'Polymer',
  additionalForbiddenTokens: 'global:Polymer.elements'
}, {
  entryPoint: 'd3'
}, {
  displayName: 'Lo-Dash',
  entryPoint: '_',
  src: '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js'
}, {
  src: '//fb.me/react-0.12.2.js',
  entryPoint: 'React'
}, {
  src: '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.js',
  entryPoint: 'angular',
  label: 'Angular JS'
}, {
  src: '//cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.2/modernizr.js',
  entryPoint: 'Modernizr'
}, {
  src: '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.1.2/handlebars.js',
  entryPoint: 'Handlebars'
}, {
  label: 'EmberJS',
  src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js|//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.1.2/handlebars.js|//cdnjs.cloudflare.com/ajax/libs/ember.js/1.6.1/ember.js',
  entryPoint: 'Ember',
  forbiddenTokens: 'global:$|global:Handlebars|pojoviz:builtIn|global:window|global:document'
}, {
  src: '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js|//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone.js',
  entryPoint: 'Backbone'
}, {
  label: 'Marionette.js',
  src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js|//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js|//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone.js|http://marionettejs.com/downloads/backbone.marionette.js',
  entryPoint: 'Marionette'
}];
},{}],19:[function(require,module,exports){
'use strict';

var hashKey = require('./hashKey');

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

// alias
HashMap.prototype.set = HashMap.prototype.put;

module.exports = HashMap;
},{"./hashKey":20}],20:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var assert = require('assert');
var utils = require('./');
var me, hashKey;
var doGet, doSet;

me = hashKey = function (v) {
  var uid = v;
  if (utils.isObjectOrFunction(v)) {
    if (!me.has(v)) {
      doSet(v, _.uniqueId());
    }
    uid = doGet(v);
    if (!me.has(v)) {
      throw Error(v + ' should have a hashKey at this point :(');
    }
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};

/**
 * @private
 * Gets the stored hashkey, since there are object that might not have a chain
 * up to Object.prototype the check is done with Object.prototype.hasOwnProperty explicitly
 *
 * @param  {*} obj
 * @return {string}
 */
doGet = function (obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return Object.prototype.hasOwnProperty.call(obj, me.hiddenKey) &&
    obj[me.hiddenKey];
};

/**
 * @private
 * Sets a hidden key on an object, the hidden key is determined as follows:
 *
 * - null object-null
 * - numbers: number-{value}
 * - boolean: boolean-{true|false}
 * - string: string-{value}
 * - undefined undefined-undefined
 * - function: function-{id} id = _.uniqueId
 * - object: object-{id} id = _.uniqueId
 *
 * @param {*} obj The object to set the hiddenKey
 * @param {string} key The key to be set in the object
 */
doSet = function (obj, key) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  assert(
    typeof key === 'string',
    'The key needs to be a valid string'
  );
  var value;
  if (!me.has(obj)) {
    value = typeof obj + '-' + key;
    Object.defineProperty(obj, me.hiddenKey, {
      value: value
    });
    if (!obj[me.hiddenKey]) {
      // in node setting the instruction above might not have worked
      console.warn('hashKey#doSet() setting the value on the object directly');
      obj[me.hiddenKey] = value;
    }
    assert(obj[me.hiddenKey], 'Object.defineProperty did not work!');
  }
  return me;
};

me.hiddenKey = '__pojovizKey__';

me.has = function (v) {
  return typeof doGet(v) === 'string';
};

module.exports = me;
},{"./":21,"assert":2,"lodash":undefined}],21:[function(require,module,exports){
'use strict';

var _ = require('lodash');

function type(v) {
  return Object.prototype.toString.call(v).slice(8, -1);
}

var utils = {};

/**
 * After calling `Object.prototype.toString` with `v` as the scope
 * the return value would be the concatenation of '[Object ',
 * class and ']', `class` is the returning value of this function
 *
 * e.g.   Object.prototype.toString.call([]) == [object Array],
 *        the returning value is the string Array
 *
 * @param {*} v
 * @returns {string}
 */
utils.internalClassProperty = function (v) {
  return type(v);
};

/**
 * Checks if a given value is a function, the library only needs
 * to distinguish between different kinds of primitive types (no need to
 * distinguish between different kinds of objects)
 *
 * @param  {*}  v The value to be checked
 * @returns {Boolean}
 */
utils.isFunction = function (v) {
  return !!v && typeof v === 'function';
};

/**
 * Checks if the value is a constructor,
 * NOTE: for the sake of this library a constructor is a function
 * that has a name which starts with an uppercase letter and also
 * that the prototype's constructor is itself
 * @param {*} v
 */
utils.isConstructor = function (v) {
  return this.isFunction(v) && typeof v.name === 'string' &&
      v.name.length && v.prototype && v.prototype.constructor === v;
};

/**
 * Checks if a given value is an object, the library only needs
 * to distinguish between different kinds of primitive types (no need to
 * distinguish between different kinds of objects)
 *
 * NOTE: a function will not pass this test
 * i.e.
 *        utils.isObject(function() {}) is false!
 *
 * Special values whose `typeof` results in an object:
 * - null
 *
 * @param  {*}  v The value to be checked
 * @returns {Boolean}
 */
utils.isObject = function (v) {
  return !!v && typeof v === 'object';
};

/**
 * Checks if the given value is an object or a function (note that for the sake
 * of the library Arrays are not objects)
 *
 * @param {*} v
 * @returns {Boolean}
 */
utils.isObjectOrFunction = function (v) {
  return utils.isObject(v) || utils.isFunction(v);
};

/**
 * @template
 *
 * Checks if the given value is traversable, for the sake of the library an
 * object (which is not an array) or a function is traversable, since this function
 * is used by the object analyzer overriding it will determine which objects
 * are traversable
 *
 * @param {*} v
 * @returns {Boolean}
 */
utils.isTraversable = function (v) {
  return utils.isObjectOrFunction(v);
};

/**
 * Creates a special function which is able to execute a series of functions through
 * chaining, to run all the functions stored in the chain execute the resulting value
 *
 * - each function is invoked with the original arguments which `functionChain` was
 * invoked with + the resulting value of the last operation as the last argument
 * - the scope of each function is the same scope as the one that the resulting
 * function will have
 *
 *    var fns = utils.functionChain()
 *                .chain(function (a, b) {
 *                  console.log(a, b);
 *                  return 'first';
 *                })
 *                .chain(function (a, b, c) {
 *                  console.log(a, b, c);
 *                  return 'second;
 *                })
 *    fns(1, 2);  // returns 'second'
 *    // logs 1, 2
 *    // logs 1, 2, 'first'
 *
 * @returns {Function}
 */
utils.functionChain = function () {
  var stack = [];
  var inner = function () {
    var args = Array.prototype.slice.call(arguments);
    var value = null;
    for (var i = 0; i < stack.length; i += 1) {
      value = stack[i].apply(this, args.concat(value));
    }
    return value;
  };
  inner.chain = function (v) {
    stack.push(v);
    return inner;
  };
  return inner;
};

/**
 * Given a str made of any characters this method returns a string
 * representation of a signed int
 * @param {string} str
 */
utils.hashCode = function (str) {
  var i, length, char, hash = 0;
  for (i = 0, length = str.length; i < length; i += 1) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
};

utils.createEvent = function (eventName, details) {
  return new CustomEvent(eventName, {
    detail: details
  });
};
utils.notification = function (message, consoleToo) {
  var ev = utils.createEvent('pojoviz-notification', message);
  consoleToo && console.log(message);
  document.dispatchEvent(ev);
};
utils.createJsonpCallback = function (url) {
  var script = document.createElement('script');
  script.src = url;
  document.head.appendChild(script);
};
utils.toQueryString = function (obj) {
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
};

/**
 * @template
 *
 * Given a property name this method identifies if it's a valid property for the sake
 * of the library, a valid property is a property which does not provoke an error
 * when trying to access the value associated to it from any object
 *
 * For example executing the following code in strict mode will yield an error:
 *
 *    var fn = function() {};
 *    fn.arguments
 *
 * Since arguments is prohibited in strict mode
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
 *
 *
 *
 * @param {Object|Function} object
 * @param {string} property
 */
utils.objectPropertyIsForbidden = function (object, property) {
  var key;
  var rules = utils.propertyForbiddenRules;
  for (key in rules) {
    if (rules.hasOwnProperty(key)) {
      if (rules[key](object, property)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * @template
 *
 * Modify this object to add/remove rules that wil be run by
 * #objectPropertyIsForbidden, to determine if a property is invalid
 *
 * @type {Object}
 */
utils.propertyForbiddenRules = {
  /**
   * `caller` and `arguments` are invalid properties of a function in strict mode
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  strictMode: function (object, property) {
    if (utils.isFunction(object)) {
      return property === 'caller' || property === 'arguments';
    }
    return false;
  },

  /**
   * Properties that start and end with __ are special properties,
   * in some cases they are valid (like __proto__) or deprecated
   * like __defineGetter__
   *
   * e.g.
   *  - Object.prototype.__proto__
   *  - Object.prototype.__defineGetter__
   *  - Object.prototype.__defineSetter__
   *  - Object.prototype.__lookupGetter__
   *  - Object.prototype.__lookupSetter__
   *
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  hiddenProperty: function (object, property) {
    return property.search(/^__.*?__$/) > -1;
  },

  /**
   * Angular hidden properties start and end with $$, for the sake
   * of the library these are invalid properties
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  angularHiddenProperty: function (object, property) {
    return property.search(/^\$\$.*?\$\$$/) > -1;
  },

  /**
   * The properties that have the following symbols are forbidden:
   * [:+~!><=//\[\]@\. ]
   * @param {*} object
   * @param {string} property
   * @returns {boolean}
   */
  //symbols: function (object, property) {
  //  return property.search(/[:+~!><=//\]@\. ]/) > -1;
  //}
};

module.exports = utils;
},{"lodash":undefined}],22:[function(require,module,exports){
/**
 * Created by mauricio on 2/21/15.
 */
var _ = require('lodash');
var assert = require('assert');
var hashKey = require('./hashKey');
var utils = require('./');
var me, labeler;
var doInsert, doGet;

// labels per each object will be saved inside this object
var labelCache = {};

var proto = {
  first: function () {
    return this.values[0];
  },
  size: function () {
    return this.values.length;
  },
  getValues: function () {
    return this.values;
  }
};

/**
 * @param {Object} from
 * @param {string} [property]
 * @param {string} [config]
 *
 *  - config.labelOverride Overrides the property label with this value
 *  - config.highPriority {boolean} if set to true then the label will be
 *  prepended instead of being append
 *
 * @type {Function}
 */
me = labeler = function (from, property, config) {
  assert(utils.isObjectOrFunction(from), 'from needs to be an object or a function');
  config = config || {};
  var obj;
  var label;

  function attempToInsert(obj, from, label) {
    if (utils.isObjectOrFunction(obj)) {
      var objHash = hashKey(obj);
      var fromHash = from ? hashKey(from) : null;
      var labelCfg = {
        from: fromHash,
        label: label
      };
      if (!_.find(labelCache[objHash] || [], labelCfg)) {
        doInsert(obj, labelCfg, config);
      }
    }
  }


  if (property) {
    obj = from[property];
    label = property;
    // if the property is `prototype` append the name of the constructor
    // this means that it has a higher priority so the item should be prepended
    if (property === 'prototype' && utils.isConstructor(from)) {
      config.highPriority = true;
      label = from.name + '.' + property;
    }
    attempToInsert(obj, from, label);
  } else {
    // the default label for an iterable is the hashkey
    attempToInsert(from, null, hashKey(from));

    // if it's called with the second arg === undefined then only
    // set a label if it's a constructor
    if (utils.isConstructor(from)) {
      config.highPriority = true;
      attempToInsert(from, null, from.name);
    }
  }

  return doGet(from, property);
};

me.hiddenLabel = '__pojovizLabel__';

/**
 * The object has a hidden key if it exists and is
 * an array
 * @param v
 * @returns {boolean}
 */
me.has = function (v) {
  return typeof labelCache[hashKey(v)] !== 'undefined';
};

doGet = function (from, property) {
  var obj = property ? from[property] : from;
  var r = Object.create(proto);
  r.values = (utils.isObjectOrFunction(obj) && labelCache[hashKey(obj)]) || [];
  return r;
};
'length', 'name', 'prototype',

/**
 * @private
 * Sets a hidden key on an object, the hidden key is an array of objects,
 * each object has the following structure:
 *
 *  {
 *    from: string,
 *    label: string
 *  }
 *
 * @param {*} obj The object whose label need to be saved
 * @param {Object} properties The properties of the labels
 * @param {Object} config additional configuration options
 */
doInsert = function (obj, properties, config) {
  var hkObj = hashKey(obj);
  labelCache[hkObj] = labelCache[hkObj] || [];
  var arr = labelCache[hkObj];
  var index = config.highPriority ? 0 : arr.length;

  // label override
  if (config.labelOverride) {
    properties.label = config.labelOverride;
  }

  // insertion either at start or end
  arr.splice(index, 0, properties);
};

//me.labelCache = labelCache;
module.exports = me;
},{"./":21,"./hashKey":20,"assert":2,"lodash":undefined}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9JbnNwZWN0ZWRJbnN0YW5jZXMuanMiLCJzcmMvT2JqZWN0QW5hbHl6ZXIuanMiLCJzcmMvYW5hbHl6ZXIvQW5ndWxhci5qcyIsInNyYy9hbmFseXplci9CdWlsdEluLmpzIiwic3JjL2FuYWx5emVyL0dsb2JhbC5qcyIsInNyYy9hbmFseXplci9JbnNwZWN0b3IuanMiLCJzcmMvYW5hbHl6ZXIvT2JqZWN0LmpzIiwic3JjL3NjaGVtYXMvaHVnZVNjaGVtYXMuanMiLCJzcmMvc2NoZW1hcy9pbmRleC5qcyIsInNyYy9zY2hlbWFzL2tub3duU2NoZW1hcy5qcyIsInNyYy9zY2hlbWFzL215TGlicmFyaWVzLmpzIiwic3JjL3NjaGVtYXMvbm90YWJsZUxpYnJhcmllcy5qcyIsInNyYy91dGlsL0hhc2hNYXAuanMiLCJzcmMvdXRpbC9oYXNoS2V5LmpzIiwic3JjL3V0aWwvaW5kZXguanMiLCJzcmMvdXRpbC9sYWJlbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaHVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDemVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUSA9IHJlcXVpcmUoJ3EnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbC8nKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcblxudmFyIEluc3BlY3RvciA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvSW5zcGVjdG9yJyk7XG52YXIgSW5zcGVjdGVkSW5zdGFuY2VzID0gcmVxdWlyZSgnLi9JbnNwZWN0ZWRJbnN0YW5jZXMnKTtcblxuLy8gZW5hYmxlIHByb21pc2UgY2hhaW4gZGVidWdcblEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG5cbnZhciBpbnNwZWN0b3IsIG9sZEluc3BlY3RvcjtcbnZhciBwb2pvdml6O1xuXG4vLyBwdWJsaWMgYXBpXG5wb2pvdml6ID0ge1xuICAvKipcbiAgICogQ2xlYXJzIHRoZSBpbnNwZWN0b3IgdmFyaWFibGVcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgdW5zZXRJbnNwZWN0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICBvbGRJbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG4gICAgaW5zcGVjdG9yID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgaW5zcGVjdG9yIChzZXQgdGhyb3VnaCAjc2V0Q3VycmVudEluc3BlY3RvcilcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBnZXRDdXJyZW50SW5zcGVjdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGluc3BlY3RvcjtcbiAgfSxcbiAgLyoqXG4gICAqIEdpdmVuIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgb2YgYVxuICAgKiBwb3NzaWJsZSBuZXcgaW5zdGFuY2Ugb2YgSW5zcGVjdG9yLCB0aGlzIG1ldGhvZCBjaGVja3MgaWYgdGhlcmUnc1xuICAgKiBhbHJlYWR5IGFuIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgZGlzcGxheU5hbWUvZW50cnlQb2ludCB0byBhdm9pZFxuICAgKiBjcmVhdGluZyBtb3JlIEluc3RhbmNlcyBvZiB0aGUgc2FtZSB0eXBlLCBjYWxscyB0aGUgaG9va1xuICAgKiBgbW9kaWZ5SW5zdGFuY2VgIGFmdGVyIHRoZSBpbnNwZWN0b3IgaXMgcmV0cmlldmVkL2NyZWF0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtjb25maWd9IG9wdGlvbnMgT3B0aW9ucyBwYXNzZWQgdG8gYW4gSW5zcGVjdG9yIGluc3RhbmNlXG4gICAqIGlmIHRoZSBlbnRyeVBvaW50L2Rpc3BsYXlOYW1lIHdhc24ndCBjcmVhdGVkIHlldCBpblxuICAgKiBJbnNwZWN0b3JJbnN0YW5jZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBydW46IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgYXNzZXJ0KG9wdGlvbnMpO1xuICAgIHZhciBlbnRyeVBvaW50ID0gb3B0aW9ucy5kaXNwbGF5TmFtZSB8fCBvcHRpb25zLmVudHJ5UG9pbnQ7XG4gICAgYXNzZXJ0KGVudHJ5UG9pbnQpO1xuICAgIG9sZEluc3BlY3RvciA9IGluc3BlY3RvcjtcbiAgICBpbnNwZWN0b3IgPSBJbnNwZWN0ZWRJbnN0YW5jZXNbZW50cnlQb2ludF07XG5cbiAgICBpZiAoIWluc3BlY3Rvcikge1xuICAgICAgaW5zcGVjdG9yID0gSW5zcGVjdGVkSW5zdGFuY2VzLmNyZWF0ZShvcHRpb25zKTtcbiAgICB9XG4gICAgaW5zcGVjdG9yLm1vZGlmeUluc3RhbmNlKG9wdGlvbnMpO1xuICAgIHJldHVybiBpbnNwZWN0b3IuaW5pdCgpO1xuICB9LFxuXG4gIC8vIGV4cG9zZSBpbm5lciBtb2R1bGVzXG4gIE9iamVjdEFuYWx5emVyOiByZXF1aXJlKCcuL09iamVjdEFuYWx5emVyJyksXG4gIEluc3BlY3RlZEluc3RhbmNlczogSW5zcGVjdGVkSW5zdGFuY2VzLFxuICBhbmFseXplcjoge1xuICAgIEluc3BlY3RvcjogSW5zcGVjdG9yXG4gIH0sXG4gIEluc3BlY3RvcjogSW5zcGVjdG9yLFxuICB1dGlsczogcmVxdWlyZSgnLi91dGlsJyksXG5cbiAgLy8ga25vd24gY29uZmlndXJhdGlvbnNcbiAgc2NoZW1hczogcmVxdWlyZSgnLi9zY2hlbWFzJylcbn07XG5cbi8vIGFsaWFzXG5wb2pvdml6LnNldEN1cnJlbnRJbnNwZWN0b3IgPSBwb2pvdml6LnJ1bjtcblxubW9kdWxlLmV4cG9ydHMgPSBwb2pvdml6OyIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmICFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpIHtcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgfVxuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpLFxuICAgICAgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIEluc3BlY3RvciA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvSW5zcGVjdG9yJyk7XG52YXIgUE9iamVjdCA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvT2JqZWN0Jyk7XG52YXIgQnVpbHRJbiA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvQnVpbHRJbicpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvR2xvYmFsJyk7XG52YXIgQW5ndWxhciA9IHJlcXVpcmUoJy4vYW5hbHl6ZXIvQW5ndWxhcicpO1xudmFyIGxpYnJhcmllcztcblxudmFyIHByb3RvID0ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBJbnNwZWN0b3Igd2l0aCBgY29uZmlnYCBhcyBpdHMgY29uZmlndXJhdGlvblxuICAgKiBzYXZlZCBpbiBgdGhpc2AgYXMgYGVudHJ5UG9pbnRgXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGNyZWF0ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZGlzcGxheU5hbWUgPSBvcHRpb25zLmRpc3BsYXlOYW1lIHx8IG9wdGlvbnMuZW50cnlQb2ludDtcbiAgICBjb25zb2xlLmxvZygnY3JlYXRpbmcgYSBnZW5lcmljIGNvbnRhaW5lciBmb3I6ICcgKyBkaXNwbGF5TmFtZSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIChsaWJyYXJpZXNbZGlzcGxheU5hbWVdID0gbmV3IEluc3BlY3RvcihvcHRpb25zKSk7XG4gIH0sXG4gIC8qKlxuICAgKiBFeGVjdXRlIGBmbmAgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgc2F2ZWQgaW4gYHRoaXNgXG4gICAqIEBwYXJhbSBmblxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBhbGw6IGZ1bmN0aW9uIChmbikge1xuICAgIF8uZm9yT3duKGxpYnJhcmllcywgZm4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvKipcbiAgICogTWFya3MgYWxsIHRoZSBwcm9wZXJ0aWVzIHNhdmVkIGluIGB0aGlzYCBhcyBkaXJ0eVxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXREaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWxsKGZ1bmN0aW9uICh2KSB7XG4gICAgICB2LnNldERpcnR5KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbmxpYnJhcmllcyA9IE9iamVjdC5jcmVhdGUocHJvdG8pO1xuLy9jb25zb2xlLmxvZyhsaWJyYXJpZXMpO1xuXy5tZXJnZShsaWJyYXJpZXMsIHtcbiAgb2JqZWN0OiBuZXcgUE9iamVjdCh7XG4gICAgZGlzcGxheU5hbWU6ICdPYmplY3QnXG4gIH0pLFxuICBidWlsdEluOiBuZXcgQnVpbHRJbih7XG4gICAgZGlzcGxheU5hbWU6ICdCdWlsdCBJbidcbiAgfSksXG4gIGdsb2JhbDogbmV3IEdsb2JhbCgpLFxuICAvL3BvcHVsYXJcbiAgYW5ndWxhcjogbmV3IEFuZ3VsYXIoKVxuICAvL2h1Z2VcbiAgLy90aHJlZTogbmV3IEluc3BlY3Rvcih7XG4gIC8vICBlbnRyeVBvaW50OiAnVEhSRUUnLFxuICAvLyAgYWx3YXlzRGlydHk6IHRydWVcbiAgLy99KVxufSk7XG5cbkluc3BlY3Rvci5pbnN0YW5jZXMgPSBsaWJyYXJpZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gbGlicmFyaWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuXG52YXIgSGFzaE1hcCA9IHJlcXVpcmUoJy4vdXRpbC9IYXNoTWFwJyk7XG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgbGFiZWxlciA9IHJlcXVpcmUoJy4vdXRpbC9sYWJlbGVyJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBHaXZlbiBhbiBvYmplY3QgYG9iamAsIHRoaXMgZnVuY3Rpb24gZXhlY3V0ZXMgYGZuYCBvbmx5IGlmIGBvYmpgIGlzXG4gKiBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbiwgaWYgaXQncyBhIGZ1bmN0aW9uIHRoZW4gYG9iai5wcm90b3R5cGVgIGlzIGFuYWx5emVkXG4gKiBpZiBpdCBleGlzdHMgdGhlbiBpdCB3aWxsIGV4ZWN1dGUgYGZuYCBhZ2FpblxuICpcbiAqIE5vdGUgdGhhdCB0aGUgb25seSBhcmd1bWVudCB3aGljaCBmbiBpcyBleGVjdXRlZCB3aXRoIGlzIG9iaiBmb3IgdGhlIGZpcnN0XG4gKiBjYWxsIGFuZCBvYmoucHJvdG90eXBlIGZvciB0aGUgc2Vjb25kIGNhbGwgaWYgaXQncyBwb3NzaWJsZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2l0aCBvYmovb2JqLnByb3RvdHlwZSBhY2NvcmRpbmdcbiAqIHRvIHRoZSBydWxlcyBjaXRlZCBhYm92ZVxuICovXG5mdW5jdGlvbiB3aXRoRnVuY3Rpb25BbmRQcm90b3R5cGUob2JqLCBmbikge1xuICBpZiAodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaikpIHtcbiAgICBmbihvYmopO1xuICAgIGlmICh1dGlscy5pc0Z1bmN0aW9uKG9iaikgJiZcbiAgICAgICAgdXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iai5wcm90b3R5cGUpKSB7XG4gICAgICBmbihvYmoucHJvdG90eXBlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBDbGFzcyBBbmFseXplciwgc2F2ZXMgb2JqZWN0cyBpbiBhbiBpbnRlcm5hbCBIYXNoTWFwIGFmdGVyIGRvaW5nXG4gKiBhIGRmcyB0cmF2ZXJzYWwgb2YgYSBzb3VyY2Ugb2JqZWN0IHRocm91Z2ggaXRzIGBhZGRgIG1ldGhvZC5cbiAqXG4gKiBXaGVuZXZlciBhIGdyYXBoIG5lZWRzIHRvIGJlIGFuYWx5emVkIGFuIGluc3RhbmNlIG9mIEFuYWx5emVyIGlzIGNyZWF0ZWQgYW5kXG4gKiBhIGRmcyByb3V0aW5lIGlzIHJ1biBzdGFydGluZyAocHJlc3VtYWJseSkgaW4gdGhlIHJvb3Qgbm9kZTpcbiAqXG4gKiBlLmcuXG4gKlxuICogICAgICB2YXIgYW5hbHl6ZXIgPSBuZXcgQW5hbHl6ZXIoKTtcbiAqICAgICAgYW5hbHl6ZXIuYWRkKFtPYmplY3RdKTtcbiAqXG4gKiBUaGUgaW50ZXJuYWwgaGFzaE1hcCB3aWxsIHNhdmUgdGhlIGZvbGxvd2luZyB0cmF2ZXJzYWJsZSB2YWx1ZXM6XG4gKlxuICogLSBPYmplY3RcbiAqIC0gT2JqZWN0LnByb3RvdHlwZSAoUmVhY2hhYmxlIGZyb20gT2JqZWN0KVxuICogLSBGdW5jdGlvbiAoUmVhY2hhYmxlIGZyb20gRnVuY3Rpb24ucHJvdG90eXBlKVxuICogLSBGdW5jdGlvbi5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdCB0aHJvdWdoIHRoZSBfX3Byb3RvX18gbGluaylcbiAqXG4gKiBUaGVyZSBhcmUgc29tZSB0cm91Ymxlc29tZSBzdHJ1Y3R1cmVzIGRvIHdoaWNoIGluY2x1ZGUgaHVnZSBvYmplY3RzIGxpa2VcbiAqIHdpbmRvdyBvciBkb2N1bWVudCwgdG8gYXZvaWQgYW5hbHl6aW5nIHRoaXMga2luZCBvZiBvYmplY3RzIHRoZSBhbmFseXplciBjYW5cbiAqIGJlIGluc3RydWN0ZWQgdG8gZm9yYmlkIHRoZSBhZGRpdGlvbiBvZiBzb21lIG9iamVjdHM6XG4gKlxuICogZS5nLlxuICpcbiAqICAgICAgdmFyIGFuYWx5emVyID0gbmV3IEFuYWx5emVyKCk7XG4gKiAgICAgIGFuYWx5emVyLmZvcmJpZChbRnVuY3Rpb25dKVxuICogICAgICBhbmFseXplci5hZGQoW1xuICogICAgICAgIE9iamVjdFxuICogICAgICBdKTtcbiAqXG4gKiAtIE9iamVjdFxuICogLSBPYmplY3QucHJvdG90eXBlIChSZWFjaGFibGUgZnJvbSBPYmplY3QpXG4gKiAtIEZ1bmN0aW9uLnByb3RvdHlwZSAoUmVhY2hhYmxlIGZyb20gT2JqZWN0IHRocm91Z2ggdGhlIF9fcHJvdG9fXyBsaW5rKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLml0ZW1zID0gbmV3IEhhc2hNYXBdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5mb3JiaWRkZW4gPSBuZXcgSGFzaE1hcF1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLmNhY2hlID0gdHJ1ZV1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLmxldmVscyA9IEFuYWx5emVyLkRGU19MRVZFTFNdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy52aXNpdENvbnN0cnVjdG9ycyA9IEFuYWx5emVyLlZJU0lUX0NPTlNUUlVDVE9SU11cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnLnZpc2l0U2ltcGxlRnVuY3Rpb25zID0gQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OU11cbiAqL1xuZnVuY3Rpb24gQW5hbHl6ZXIoY29uZmlnKSB7XG4gIGNvbmZpZyA9IF8ubWVyZ2UoXy5jbG9uZShBbmFseXplci5ERUZBVUxUX0NPTkZJRywgdHJ1ZSksIGNvbmZpZyk7XG5cbiAgLyoqXG4gICAqIGl0ZW1zIHJlZ2lzdGVyZWQgaW4gdGhpcyBpbnN0YW5jZVxuICAgKiBAdHlwZSB7SGFzaE1hcH1cbiAgICovXG4gIHRoaXMuaXRlbXMgPSBjb25maWcuaXRlbXMgfHwgbmV3IEhhc2hNYXAoKTtcblxuICAvKipcbiAgICogRm9yYmlkZGVuIG9iamVjdHNcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlbiA9IGNvbmZpZy5mb3JiaWRkZW4gfHwgbmV3IEhhc2hNYXAoKTtcblxuICAvKipcbiAgICogUHJpbnQgZGVidWcgaW5mbyBpbiB0aGUgY29uc29sZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGVidWcgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUcnVlIHRvIHNhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdHMgYW5hbHl6ZWQgaW4gYW5cbiAgICogaW50ZXJuYWwgY2FjaGVcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqIEBjZmcge2Jvb2xlYW59IFtjYWNoZT10cnVlXVxuICAgKi9cbiAgdGhpcy5jYWNoZSA9IGNvbmZpZy5jYWNoZTtcblxuICAvKipcbiAgICogRGZzIGxldmVsc1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5sZXZlbHMgPSBjb25maWcubGV2ZWxzO1xuXG4gIC8qKlxuICAgKiBUcnVlIHRvIGluY2x1ZGUgZnVuY3Rpb24gY29uc3RydWN0b3JzIGluIHRoZSBhbmFseXNpcyBncmFwaFxuICAgKiBpLmUuIHRoZSBmdW5jdGlvbnMgdGhhdCBoYXZlIGEgcHJvdG90eXBlXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbdmlzaXRDb25zdHJ1Y3RvcnM9ZmFsc2VdXG4gICAqL1xuICB0aGlzLnZpc2l0Q29uc3RydWN0b3JzID0gY29uZmlnLnZpc2l0Q29uc3RydWN0b3JzO1xuXG4gIC8qKlxuICAgKiBUcnVlIHRvIGluY2x1ZGUgYWxsIHRoZSBmdW5jdGlvbnMgaW4gdGhlIGFuYWx5c2lzIGdyYXBoLFxuICAgKiBzZWUgI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllc1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGNmZyB7Ym9vbGVhbn0gW3Zpc2l0U2ltcGxlRnVuY3Rpb25zPWZhbHNlXVxuICAgKi9cbiAgdGhpcy52aXNpdFNpbXBsZUZ1bmN0aW9ucyA9IGNvbmZpZy52aXNpdFNpbXBsZUZ1bmN0aW9ucztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGFsbCB0aGUgZnVuY3Rpb25zIGluIHRoZSBhbmFseXNpcyBncmFwaCxcbiAgICogc2VlICN0cmF2ZXJzYWJsZU9iamVjdFByb3BlcnRpZXNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBjZmcge2Jvb2xlYW59IFt2aXNpdFNpbXBsZUZ1bmN0aW9ucz1mYWxzZV1cbiAgICovXG4gIHRoaXMudmlzaXRBcnJheXMgPSBjb25maWcudmlzaXRBcnJheXM7XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEludGVybmFsIHByb3BlcnR5IGNhY2hlLCBlYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIG9iamVjdHNcbiAgICogZ2VuZXJhdGVkIGluICNnZXRQcm9wZXJ0aWVzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB0aGlzLl9fb2JqZWN0c0NhY2hlX18gPSB7fTtcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogSW50ZXJuYWwgbGlua3MgY2FjaGUsIGVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0c1xuICAgKiBnZW5lcmF0ZWQgaW4gI2dldE93bkxpbmtzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB0aGlzLl9fbGlua3NDYWNoZV9fID0ge307XG59XG5cbi8qKlxuICogVHJ1ZSB0byBhZGQgYW4gYWRkaXRpb25hbCBmbGFnIHRvIHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxuICogaWYgdGhlIG5vZGUgaXMgYSBjb25zdHJ1Y3RvclxuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbkFuYWx5emVyLlZJU0lUX0NPTlNUUlVDVE9SUyA9IHRydWU7XG5cbi8qKlxuICogVHJ1ZSB0byB2aXNpdCBzaW1wbGUgZnVuY3Rpb25zIHdoaWNoIGRvbid0IGhhdmUgYWRkaXRpb25hbCBsaW5rcywgc2VlXG4gKiAjdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OUyA9IGZhbHNlO1xuXG4vKipcbiAqIFRydWUgdG8gdmlzaXQgYXJyYXlzXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuQW5hbHl6ZXIuVklTSVRfQVJSQVlTID0gdHJ1ZTtcblxuLyoqXG4gKiBEZWZhdWx0IG51bWJlciBvZiBsZXZlbHMgdG8gYmUgYW5hbHl6ZWQgYnkgdGhpcyBjb25zdHJ1Y3RvclxuICogQHR5cGUge251bWJlcn1cbiAqL1xuQW5hbHl6ZXIuREZTX0xFVkVMUyA9IDE1O1xuXG4vKipcbiAqIERlZmF1bHQgY29uZmlnIHVzZWQgd2hlbmV2ZXIgYW4gaW5zdGFuY2Ugb2YgQW5hbHl6ZXIgaXMgY3JlYXRlZFxuICogQHR5cGUge09iamVjdH1cbiAqL1xuQW5hbHl6ZXIuREVGQVVMVF9DT05GSUcgPSB7XG4gIGNhY2hlOiB0cnVlLFxuICB2aXNpdENvbnN0cnVjdG9yczogQW5hbHl6ZXIuVklTSVRfQ09OU1RSVUNUT1JTLFxuICB2aXNpdFNpbXBsZUZ1bmN0aW9uczogQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OUyxcbiAgdmlzaXRBcnJheXM6IEFuYWx5emVyLlZJU0lUX0FSUkFZUyxcbiAgbGV2ZWxzOiBBbmFseXplci5ERlNfTEVWRUxTXG59O1xuXG5BbmFseXplci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBBbmFseXplcixcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFuIG9iamVjdCBpcyBpbiB0aGUgZm9yYmlkZGVuIGhhc2hcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0ZvcmJpZGRlbjogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiB0aGlzLmZvcmJpZGRlbi5nZXQob2JqKTtcbiAgfSxcblxuICAvKipcbiAgICogTGV0IGB2YWx1ZWAgYmUgdGhlIHJlc3VsdCBvZiBleGVjdXRpbmcgb2JqW3Byb3BlcnR5XSwgdGhpcyBtZXRob2RcbiAgICogcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhIHN1bW1hcnkgb2YgdGhlIHByb3BlcnRpZXMgb2YgYHZhbHVlYCB3aGljaCBhcmVcbiAgICogdXNlZnVsIHRvIGtub3cgZm9yIHRoZSBhbmFseXplcjpcbiAgICpcbiAgICogLSBwYXJlbnQgICAgICAgICB7c3RyaW5nfSB0aGUgaGFzaEtleSBvZiB0aGUgcGFyZW50XG4gICAqIC0gcHJvcGVydHkgICAgICAge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHVzZWQgdG8gcmVhY2ggdmFsdWUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGkuZS4gcGFyZW50W3Byb3BlcnR5XSA9IHZhbHVlXG4gICAqIC0gdmFsdWUgICAgICAgICAgeyp9IHRoZSB2YWx1ZSBpdHNlbGZcbiAgICogLSB0eXBlICAgICAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgYHR5cGVvZiB2YWx1ZWBcbiAgICogLSBpc1RyYXZlcnNhYmxlICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIHRyYXZlcnNhYmxlXG4gICAqIC0gaXNGdW5jdGlvbiAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uXG4gICAqIC0gaXNPYmplY3QgICAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3RcbiAgICogLSB0b1N0cmluZyAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcge30udG9TdHJpbmcgd2l0aCBgdmFsdWVgXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSB2YWx1ZVxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gcGFyZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgYnVpbGROb2RlUHJvcGVydGllczogZnVuY3Rpb24gKHZhbHVlLCBwYXJlbnQsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhcmVudDogaGFzaEtleShwYXJlbnQpLFxuICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgLy92YWx1ZTogdmFsdWUsXG4gICAgICB0eXBlOiB0eXBlb2YgdmFsdWUsXG4gICAgICBpc1RyYXZlcnNhYmxlOiB1dGlscy5pc1RyYXZlcnNhYmxlKHZhbHVlKSxcbiAgICAgIGlzRnVuY3Rpb246IHV0aWxzLmlzRnVuY3Rpb24odmFsdWUpLFxuICAgICAgaXNPYmplY3Q6IHV0aWxzLmlzT2JqZWN0KHZhbHVlKSxcbiAgICAgIHRvU3RyaW5nOiB1dGlscy5pbnRlcm5hbENsYXNzUHJvcGVydHkodmFsdWUpXG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgcHJvcGVydGllcyB0aGF0IG9ialtwcm9wZXJ0eV0gaGFzIHdoaWNoIGFyZVxuICAgKiB1c2VmdWwgZm9yIG90aGVyIG1ldGhvZHMgbGlrZSAjZ2V0UHJvcGVydGllcywgdGhlIHByb3BlcnRpZXMgYXJlXG4gICAqIHJldHVybmVkIGluIGEgc2ltcGxlIG9iamVjdCBhbmQgYXJlIHRoZSBvbmVzIGRlY2xhcmVkIGluXG4gICAqICNnZXROb2RlUHJvcGVydGllc1xuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIHByb3BlcnRpZXMgbWlnaHQgYmUgc2V0IGRlcGVuZGluZyBvbiB3aGF0IGB2YWx1ZWAgaXM6XG4gICAqXG4gICAqIC0gdW5yZWFjaGFibGUgICAgICAgIHtib29sZWFufSB0cnVlIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBleGVjdXRpbmcgYHZhbHVlYFxuICAgKiAtIGlzU2ltcGxlRnVuY3Rpb24gICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgc2ltcGxlIGZ1bmN0aW9uXG4gICAqIC0gaXNDb25zdHJ1Y3RvciAgICAgIHtib29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYSBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gb2JqXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzOiBmdW5jdGlvbiAob2JqLCBwcm9wZXJ0eSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHZhbHVlO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IG9ialtwcm9wZXJ0eV07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGFyZW50OiBoYXNoS2V5KG9iaiksXG4gICAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgICAgdW5yZWFjaGFibGU6IHRydWUsXG4gICAgICAgIGlzVHJhdmVyc2FibGU6IGZhbHNlXG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBzZWxmLCBwYXJlbnQsIHByb3BlcnR5XG4gICAgdmFyIHByb3BlcnRpZXMgPSBtZS5idWlsZE5vZGVQcm9wZXJ0aWVzKHZhbHVlLCBvYmosIHByb3BlcnR5KTtcblxuICAgIC8vIGlmIHRoZSBjdXJyZW50IHByb3BlcnR5IGlzIGEgZnVuY3Rpb24gYW5kIGl0J3Mgbm90IGFsbG93ZWQgdG9cbiAgICAvLyB2aXNpdCBzaW1wbGUgZnVuY3Rpb25zIG1hcmsgdGhlIHByb3BlcnR5IGFzIG5vdCB0cmF2ZXJzYWJsZVxuICAgIGlmIChwcm9wZXJ0aWVzLmlzRnVuY3Rpb24gJiYgIXRoaXMudmlzaXRTaW1wbGVGdW5jdGlvbnMpIHtcbiAgICAgIHZhciBvd25Qcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICAgICAgdmFyIGxlbmd0aCA9IG93blByb3BlcnRpZXMubGVuZ3RoO1xuICAgICAgLy8gdGhlIG1pbmltdW0gbnVtYmVyIG9mIHByb3BlcnRpZXMgYSBub3JtYWwgZnVuY3Rpb24gaGFzIGlzIDVcbiAgICAgIC8vIC0gW1wibGVuZ3RoXCIsIFwibmFtZVwiLCBcImFyZ3VtZW50c1wiLCBcImNhbGxlclwiLCBcInByb3RvdHlwZVwiXVxuXG4gICAgICAvLyBhbiBhZGRpdGlvbmFsIHByb3BlcnR5IHJldHJpZXZlZCBpcyB0aGUgaGlkZGVuIGtleSB0aGF0XG4gICAgICAvLyB0aGUgaGFzaCBmdW5jdGlvbiBtYXkgaGF2ZSBhbHJlYWR5IHNldFxuICAgICAgaWYgKG93blByb3BlcnRpZXMuaW5kZXhPZihoYXNoS2V5LmhpZGRlbktleSkgPiAtMSkge1xuICAgICAgICAtLWxlbmd0aDtcbiAgICAgIH1cbiAgICAgIC8vIGRpc2NhcmQgdGhlIHByb3RvdHlwZSBsaW5rIHRvIGNvbnNpZGVyIGEgcHJvcGVydHkgc2ltcGxlXG4gICAgICBpZiAob3duUHJvcGVydGllcy5pbmRleE9mKCdwcm90b3R5cGUnKSA+IC0xKSB7XG4gICAgICAgIC0tbGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGxlbmd0aCA8PSA0KSB7XG4gICAgICAgIC8vIGl0J3Mgc2ltcGxlIGlmIGl0IG9ubHkgaGFzXG4gICAgICAgIC8vIC0gW1wibGVuZ3RoXCIsIFwibmFtZVwiLCBcImFyZ3VtZW50c1wiLCBcImNhbGxlclwiXVxuICAgICAgICBwcm9wZXJ0aWVzLmlzVHJhdmVyc2FibGUgPSBmYWxzZTtcbiAgICAgICAgcHJvcGVydGllcy5pc1NpbXBsZUZ1bmN0aW9uID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiB0aGUgY3VycmVudCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIGFuZCBpdCdzIGFsbG93ZWQgdG9cbiAgICAvLyB2aXNpdCBmdW5jdGlvbiBjb25zdHJ1Y3RvcnMgdmVyaWZ5IGlmIGB2YWx1ZWAgaXMgYVxuICAgIC8vIGZ1bmN0aW9uIGNvbnN0cnVjdG9yIChpdCdzIG5hbWUgbXVzdCBiZSBjYXBpdGFsaXplZCB0byBiZSBvbmUpXG4gICAgaWYgKHByb3BlcnRpZXMuaXNGdW5jdGlvbiAmJiB0aGlzLnZpc2l0Q29uc3RydWN0b3JzKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlLm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgdmFsdWUubmFtZS5zZWFyY2goL15bQS1aXS8pID4gLTEpIHtcbiAgICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gdHJ1ZTtcbiAgICAgICAgcHJvcGVydGllcy5pc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB2ZXJpZmljYXRpb24gb2YgdGhlIGZsYWcgdmlzaXRBcnJheXMgd2hlbiBpdCdzIHNldCB0byBmYWxzZVxuICAgIGlmIChwcm9wZXJ0aWVzLnRvU3RyaW5nID09PSAnQXJyYXknICYmICF0aGlzLnZpc2l0QXJyYXlzKSB7XG4gICAgICBwcm9wZXJ0aWVzLmlzVHJhdmVyc2FibGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCB0aGUgcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0IGBvYmpgLCBlYWNoIHByb3BlcnR5IGlzIHJldHVybmVkXG4gICAqIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIHNldCBpbiAjdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzLFxuICAgKiBhZGRpdGlvbmFsbHkgdGhpcyBmdW5jdGlvbiBzZXRzIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogLSBoaWRkZW4gICAgICAge2Jvb2xlYW59ICh0cnVlIGlmIGl0J3MgYSBoaWRkZW4gcHJvcGVydHkgbGlrZSBbW1Byb3RvdHlwZV1dKVxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9ialxuICAgKiBAcGFyYW0gIHtib29sZWFufSBbdHJhdmVyc2FibGVPbmx5XSBUcnVlIHRvIHJldHVybiBvbmx5IHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBvZiBvYmplY3RzIHdpdGggdGhlIHByb3BlcnRpZXMgZGVzY3JpYmVkIGFib3ZlXG4gICAqL1xuICBnZXRQcm9wZXJ0aWVzOiBmdW5jdGlvbiAob2JqLCB0cmF2ZXJzYWJsZU9ubHkpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBoayA9IGhhc2hLZXkob2JqKTtcbiAgICB2YXIgYWxsUHJvcGVydGllcztcbiAgICB2YXIgbm9kZVByb3BlcnRpZXM7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgdGhyb3cgJ3RoaXMgbWV0aG9kIG5lZWRzIGFuIG9iamVjdCB0byBhbmFseXplJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jYWNoZSkge1xuICAgICAgaWYgKCF0cmF2ZXJzYWJsZU9ubHkgJiYgdGhpcy5fX29iamVjdHNDYWNoZV9fW2hrXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29iamVjdHNDYWNoZV9fW2hrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyByZXR1cm5zIGFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0aWVzIChlbnVtZXJhYmxlIG9yIG5vdClcbiAgICBhbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKTtcblxuICAgIGFsbFByb3BlcnRpZXMgPSBhbGxQcm9wZXJ0aWVzXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBmaWx0ZXIgb3V0IGZvcmJpZGRlbiBwcm9wZXJ0aWVzXG4gICAgICAgIHJldHVybiAhdXRpbHMub2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbihvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBvYnRhaW4gZGV0YWlsZWQgaW5mbyBvZiBhbGwgdGhlIHZhbGlkIHByb3BlcnRpZXNcbiAgICAgICAgcmV0dXJuIG1lLnRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyhvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eURlc2NyaXB0aW9uKSB7XG4gICAgICAgIGlmICh0cmF2ZXJzYWJsZU9ubHkpIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgb3V0IG5vbiB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgcmV0dXJuIHByb3BlcnR5RGVzY3JpcHRpb24uaXNUcmF2ZXJzYWJsZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgLy8gPGxhYmVsZXI+XG4gICAgLy8gc2V0IGEgbmFtZSBvbiBpdHNlbGYgaWYgaXQncyBhIGNvbnN0cnVjdG9yXG4gICAgbGFiZWxlcihvYmopO1xuICAgIC8vIHNldCBhIG5hbWUgb24gZWFjaCBwcm9wZXJ0eVxuICAgIGFsbFByb3BlcnRpZXNcbiAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eURlc2NyaXB0aW9uKSB7XG4gICAgICAgIGxhYmVsZXIob2JqLCBwcm9wZXJ0eURlc2NyaXB0aW9uLnByb3BlcnR5KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gc3BlY2lhbCBwcm9wZXJ0aWVzXG4gICAgLy8gX19wcm90b19fXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvKSB7XG4gICAgICBub2RlUHJvcGVydGllcyA9IG1lLmJ1aWxkTm9kZVByb3BlcnRpZXMocHJvdG8sIG9iaiwgJ1tbUHJvdG90eXBlXV0nKTtcbiAgICAgIG5vZGVQcm9wZXJ0aWVzLmhpZGRlbiA9IHRydWU7XG4gICAgICBhbGxQcm9wZXJ0aWVzLnB1c2gobm9kZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlICYmICF0cmF2ZXJzYWJsZU9ubHkpIHtcbiAgICAgIHRoaXMuX19vYmplY3RzQ2FjaGVfX1toa10gPSBhbGxQcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBhbGxQcm9wZXJ0aWVzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYWluIERGUyByb3V0aW5lLCBpdCBhbmFseXplcyBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdCB1bnRpbFxuICAgKiB0aGUgcmVjdXJzaW9uIGxldmVsIGhhcyBiZWVuIHJlYWNoZWQgb3IgdGhlcmUgYXJlIG5vIG9iamVjdHNcbiAgICogdG8gYmUgYW5hbHl6ZWRcbiAgICpcbiAgICogLSBmb3IgZWFjaCBvYmplY3QgaW4gYG9iamVjdHNgXG4gICAqICAtIGlmIGl0IHdhc24ndCBhbmFseXplZCB5ZXRcbiAgICogIC0gaWYgaXQncyBub3QgZm9yYmlkZGVuXG4gICAqICAgLSBhZGQgdGhlIGl0ZW0gdG8gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogICAtIGZpbmQgYWxsIHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAqICAgLSBjYWxsIGBhbmFseXplYCBvYmplY3Qgd2l0aCBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdFxuICAgKiAgICAgdGhhdCBjYW4gYmUgcmVhY2hlZCBmcm9tIHRoZSBjdXJyZW50IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0gIHtBcnJheX0gb2JqZWN0cyAgICAgIEFycmF5IG9mIG9iamVjdHMgdG8gYmUgYW5hbHl6ZWRcbiAgICogQHBhcmFtICB7bnVtYmVyfSBjdXJyZW50TGV2ZWwgQ3VycmVudCBkZnMgbGV2ZWxcbiAgICovXG4gIGFuYWx5emVPYmplY3RzOiBmdW5jdGlvbiAob2JqZWN0cywgY3VycmVudExldmVsKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBpZiAoY3VycmVudExldmVsIDw9IG1lLmxldmVscykge1xuICAgICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICghbWUuaXRlbXMuZ2V0KHYpICYmICAgICAgICAgICAvLyByZWdpc3RlcmVkIGNoZWNrXG4gICAgICAgICAgIW1lLmlzRm9yYmlkZGVuKHYpICAgICAgICAgICAgLy8gZm9yYmlkZGVuIGNoZWNrXG4gICAgICAgICkge1xuXG4gICAgICAgICAgLy8gYWRkIHRoZSBpdGVtIHRvIHRoZSByZWdpc3RlcmVkIGl0ZW1zIHBvb2xcbiAgICAgICAgICBtZS5pdGVtcy5wdXQodik7XG5cbiAgICAgICAgICAvLyBkZnMgdG8gdGhlIG5leHQgbGV2ZWxcbiAgICAgICAgICBtZS5hbmFseXplT2JqZWN0cyhcbiAgICAgICAgICAgIC8vIGdldCBhbGwgdGhlIGxpbmtzIG91dGdvaW5nIGZyb20gYHZgXG4gICAgICAgICAgICBtZS5nZXRPd25MaW5rcyh2KVxuICAgICAgICAgICAgICAvLyB0byBhbmFseXplIHRoZSB0cmVlIG9ubHkgdGhlIGB0b2AgcHJvcGVydHkgaXMgbmVlZGVkXG4gICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluay50bztcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjdXJyZW50TGV2ZWwgKyAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiB0cmF2ZXJzYWJsZSBvYmplY3QgYG9iamAsIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gYXJyYXkgb2YgZGlyZWN0IHRyYXZlcnNhYmxlXG4gICAqIG9iamVjdCB3aGljaCBjYW4gYmUgcmVhY2hlZCBmcm9tIGBvYmpgLCBlYWNoIG9iamVjdCBoYXMgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAtIGZyb20gICAgIHtvYmplY3R9IChgdGhpc2ApXG4gICAqIC0gZnJvbUhhc2gge3N0cmluZ30gKGZyb20ncyBoYXNoKVxuICAgKiAtIHRvICAgICAgIHtvYmplY3R9IChhIHJlYWNoYWJsZSB0cmF2ZXJzYWJsZSBvYmplY3QgZnJvbSBgdGhpc2ApXG4gICAqIC0gdG9IYXNoICAge3N0cmluZ30gKHRvJ3MgaGFzaClcbiAgICogLSBwcm9wZXJ0eSB7c3RyaW5nfSAodGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHdoaWNoIGxpbmtzIGBmcm9tYCB3aXRoIGB0b2AsIGkuZS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eV0gPSB0bylcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBnZXRPd25MaW5rczogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIGxpbmtzID0gW107XG4gICAgdmFyIHByb3BlcnRpZXM7XG4gICAgdmFyIG5hbWUgPSBoYXNoS2V5KG9iaik7XG5cbiAgICAvLyA8ZGVidWc+XG4gICAgLy9jb25zb2xlLmxvZyhuYW1lKTtcbiAgICAvLyA8L2RlYnVnPlxuXG4gICAgaWYgKG1lLmNhY2hlICYmIG1lLl9fbGlua3NDYWNoZV9fW25hbWVdKSB7XG4gICAgICByZXR1cm4gbWUuX19saW5rc0NhY2hlX19bbmFtZV07XG4gICAgfVxuXG4gICAgLy8gYXJnczpcbiAgICAvLyAtIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHdpbGwgYmUgYW5hbHl6ZWRcbiAgICAvLyAtIHRyYXZlcnNhYmxlIHByb3BlcnRpZXMgb25seVxuICAgIHByb3BlcnRpZXMgPSBtZS5nZXRQcm9wZXJ0aWVzKG9iaiwgdHJ1ZSk7XG5cbiAgICAvLyBnaXZlbiBhbiBgb2JqYCBsZXQncyBmaW5kIG91dCBpZiBpdCBoYXMgYSBoYXNoIG9yIG5vdFxuICAgIC8vIGlmIGl0IGRvZXNuJ3QgaGF2ZSBhIGhhc2ggdGhlbiB3ZSBoYXZlIHRvIGFuYWx5emUgdGhlIG5hbWUgb2ZcbiAgICAvLyB0aGUgcHJvcGVydHkgd2hpY2ggd2hlbiBhcHBsaWVkIG9uIGFuIGV4dGVybmFsIG9iamVjdHMgZ2l2ZXMgb2JqXG4gICAgLy9cbiAgICAvLyBpdCdzIG5vdCBuZWVkZWQgdG8gc2V0IGEgaGFzaCBmb3IgYHByb3RvdHlwZWAgb3IgYGNvbnN0cnVjdG9yYFxuICAgIC8vIHNpbmNlIHRoZSBoYXNoS2V5IGZ1bmN0aW9uIHRha2VzIGNhcmUgb2YgYXNzaWduaW5nIGl0XG4gICAgZnVuY3Rpb24gZ2V0QXVnbWVudGVkSGFzaChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghaGFzaEtleS5oYXMob2JqKSAmJlxuICAgICAgICAgIG5hbWUgIT09ICdwcm90b3R5cGUnICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKG9iaiwgbmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzaEtleShvYmopO1xuICAgIH1cblxuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgJ3RoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSBhIGhhc2hrZXknO1xuICAgIH1cblxuICAgIHByb3BlcnRpZXNcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGRlc2MpIHtcbiAgICAgICAgLy8gZGVzYy5wcm9wZXJ0eSBtaWdodCBiZSBbW1Byb3RvdHlwZV1dLCBzaW5jZSBvYmpbXCJbW1Byb3RvdHlwZV1dXCJdXG4gICAgICAgIC8vIGRvZXNuJ3QgZXhpc3QgaXQncyBub3QgdmFsaWQgYSBwcm9wZXJ0eSB0byBiZSBhY2Nlc3NlZFxuICAgICAgICByZXR1cm4gZGVzYy5wcm9wZXJ0eSAhPT0gJ1tbUHJvdG90eXBlXV0nO1xuICAgICAgfSlcbiAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICAgIHZhciByZWYgPSBvYmpbZGVzYy5wcm9wZXJ0eV07XG4gICAgICAgIGFzc2VydChyZWYsICdvYmpbcHJvcGVydHldIHNob3VsZCBleGlzdCcpO1xuICAgICAgICAvLyBpZiB0aGUgb2JqZWN0IGRvZXNuJ3QgaGF2ZSBhIGhhc2hLZXlcbiAgICAgICAgLy8gbGV0J3MgZ2l2ZSBpdCBhIG5hbWUgZXF1YWwgdG8gdGhlIHByb3BlcnR5IGJlaW5nIGFuYWx5emVkXG4gICAgICAgIC8vZ2V0QXVnbWVudGVkSGFzaChyZWYsIGRlc2MucHJvcGVydHkpO1xuXG4gICAgICAgIGlmICghbWUuaXNGb3JiaWRkZW4ocmVmKSkge1xuICAgICAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICAgICAgZnJvbUhhc2g6IGhhc2hLZXkob2JqKSxcbiAgICAgICAgICAgIHRvOiByZWYsXG4gICAgICAgICAgICB0b0hhc2g6IGhhc2hLZXkocmVmKSxcbiAgICAgICAgICAgIHByb3BlcnR5OiBkZXNjLnByb3BlcnR5XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvICYmICFtZS5pc0ZvcmJpZGRlbihwcm90bykpIHtcbiAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICBmcm9tOiBvYmosXG4gICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgIHRvOiBwcm90byxcbiAgICAgICAgdG9IYXNoOiBoYXNoS2V5KHByb3RvKSxcbiAgICAgICAgcHJvcGVydHk6ICdbW1Byb3RvdHlwZV1dJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIHRoaXMuX19saW5rc0NhY2hlX19bbmFtZV0gPSBsaW5rcztcbiAgICB9XG5cbiAgICByZXR1cm4gbGlua3M7XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoaXMgYW5hbHl6ZXIgYXMgZGlydHlcbiAgICovXG4gIG1ha2VEaXJ0eTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG51bWJlciBvZiBsZXZlbHMgZm9yIHRoZSBkZnMgcm91dGluZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbFxuICAgKi9cbiAgc2V0TGV2ZWxzOiBmdW5jdGlvbiAobCkge1xuICAgIHRoaXMubGV2ZWxzID0gbDtcbiAgfSxcblxuICAvKipcbiAgICogU2V0cyB0aGUgZGlydHkgc3RhdGUgb2YgdGhpcyBhbmFseXplclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRcbiAgICovXG4gIHNldERpcnR5OiBmdW5jdGlvbiAoZCkge1xuICAgIHRoaXMuZGlydHkgPSBkO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpdGVtcyBzdG9yZWQgaW4gdGhpcyBBbmFseXplclxuICAgKiBAcmV0dXJucyB7SGFzaE1hcH1cbiAgICovXG4gIGdldEl0ZW1zOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIFJldHVybnMgdGhlIGxhYmVscyBvZiB0aGUgb2JqZWN0IGBvYmpgLCBlYWNoIGxhYmVsIGlzIHN0b3JlZCBpblxuICAgKiB0aGUgbGFiZWxlciB1dGlsXG4gICAqXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0TGFiZWxzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIGxhYmVscyA9IGxhYmVsZXIob2JqKTtcbiAgICBhc3NlcnQobGFiZWxzLnNpemUoKSwgJ29iamVjdCBtdXN0IGhhdmUgbGFiZWxzJyk7XG4gICAgcmV0dXJuIGxhYmVscy5nZXRWYWx1ZXMoKTtcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogVGhpcyBtZXRob2Qgc3RyaW5naWZpZXMgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBgb2JqYCwgdG8gYXZvaWRcbiAgICogZ2V0dGluZyB0aGUgSlNPTi5zdHJpbmdpZnkgY3ljbGljIGVycm9yIGxldCdzIGRlbGV0ZSBzb21lIHByb3BlcnRpZXNcbiAgICogdGhhdCBhcmUga25vdyB0byBiZSBvYmplY3RzL2Z1bmN0aW9uc1xuICAgKlxuICAgKiBAcGFyYW0gIG9ialxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdFByb3BlcnRpZXM6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9wZXJ0aWVzKG9iaik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIFJldHVybnMgYSByZXByZXNlbnRhdGlvbiBvZiB0aGUgb3V0Z29pbmcgbGlua3Mgb2ZcbiAgICogYW4gb2JqZWN0XG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdExpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICByZXR1cm4gbWUuZ2V0T3duTGlua3Mob2JqKS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIC8vIGRpc2NhcmRlZDogZnJvbSwgdG9cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZyb206IGxpbmsuZnJvbUhhc2gsXG4gICAgICAgIHRvOiBsaW5rLnRvSGFzaCxcbiAgICAgICAgcHJvcGVydHk6IGxpbmsucHJvcGVydHlcbiAgICAgIH07XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIHRoZSBvYmplY3RzIHNhdmVkIGluIHRoaXMgYW5hbHl6ZXJcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgIGxhYmVscyA9IHt9LFxuICAgICAgbm9kZXMgPSB7fSxcbiAgICAgIGVkZ2VzID0ge307XG4gICAgaWYgKG1lLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZyhtZSk7XG4gICAgfVxuICAgIG1lLmRlYnVnICYmIGNvbnNvbGUudGltZSgnc3RyaW5naWZ5Jyk7XG4gICAgXy5mb3JPd24obWUuaXRlbXMsIGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgaGsgPSBoYXNoS2V5KHYpO1xuICAgICAgbGFiZWxzW2hrXSA9IG1lLnN0cmluZ2lmeU9iamVjdExhYmVscyh2KTtcbiAgICAgIG5vZGVzW2hrXSA9IG1lLnN0cmluZ2lmeU9iamVjdFByb3BlcnRpZXModik7XG4gICAgICBlZGdlc1toa10gPSBtZS5zdHJpbmdpZnlPYmplY3RMaW5rcyh2KTtcbiAgICB9KTtcbiAgICBpZiAobWUuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdub2RlcycsIG5vZGVzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdlZGdlcycsIGVkZ2VzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdsYWJlbHMnLCBsYWJlbHMpO1xuICAgIH1cbiAgICBtZS5kZWJ1ZyAmJiBjb25zb2xlLnRpbWVFbmQoJ3N0cmluZ2lmeScpO1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbHM6IGxhYmVscyxcbiAgICAgIGVkZ2VzOiBlZGdlcyxcbiAgICAgIG5vZGVzOiBub2Rlc1xuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFsaWFzIGZvciAjYW5hbHl6ZU9iamVjdHNcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBhZGQ6IGZ1bmN0aW9uIChvYmplY3RzKSB7XG4gICAgLy9jb25zb2xlLnRpbWUoJ2FuYWx5emUnKTtcbiAgICB0aGlzLmFuYWx5emVPYmplY3RzKG9iamVjdHMsIDApO1xuICAgIC8vY29uc29sZS50aW1lRW5kKCdhbmFseXplJyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgc29tZSBleGlzdGluZyBvYmplY3RzIGZyb20gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdpdGhQcm90b3R5cGUgVHJ1ZSB0byByZW1vdmUgdGhlIHByb3RvdHlwZVxuICAgKiBpZiB0aGUgY3VycmVudCBvYmplY3QgYmVpbmcgcmVtb3ZlZCBpcyBhIGZ1bmN0aW9uXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJlbW92ZTogZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZG9SZW1vdmUob2JqKSB7XG4gICAgICBtZS5pdGVtcy5yZW1vdmUob2JqKTtcbiAgICB9XG5cbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUpIHtcbiAgICAgICAgd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZG9SZW1vdmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9SZW1vdmUob2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZvcmJpZHMgc29tZSBvYmplY3RzIHRvIGJlIGFkZGVkIHRvIHRoZSBpdGVtcyBIYXNoTWFwXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQHBhcmFtIHtib29sZWFufSB3aXRoUHJvdG90eXBlIFRydWUgdG8gZm9yYmlkIHRoZSBwcm90b3R5cGVcbiAgICogaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGJlaW5nIGZvcmJpZGRlbiBpcyBhIGZ1bmN0aW9uXG4gICAqL1xuICBmb3JiaWQ6IGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBtZS5yZW1vdmUob2JqZWN0cywgd2l0aFByb3RvdHlwZSk7XG5cbiAgICBmdW5jdGlvbiBkb0ZvcmJpZChvYmopIHtcbiAgICAgIG1lLmZvcmJpZGRlbi5wdXQob2JqKTtcbiAgICB9XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmICh3aXRoUHJvdG90eXBlKSB7XG4gICAgICAgIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGRvRm9yYmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvRm9yYmlkKG9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFsbG93cyBzb21lIG9iamVjdHMgdG8gYmUgYWRkZWQgdG8gdGhlIGl0ZW1zIEhhc2hNYXAsIGNhbGwgdGhpcyB0b1xuICAgKiByZW1vdmUgc29tZSBleGlzdGluZyBvYmplY3RzIGZyb20gdGhlIGZvcmJpZGRlbiBIYXNoTWFwIChzbyB0aGF0IHdoZW5cbiAgICogdGhlIHRyZWUgaXMgYW5hbHl6ZWQgYWdhaW4pXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQHBhcmFtIHtib29sZWFufSB3aXRoUHJvdG90eXBlIFRydWUgdG8gZm9yYmlkIHRoZSBwcm90b3R5cGVcbiAgICogaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGJlaW5nIGZvcmJpZGRlbiBpcyBhIGZ1bmN0aW9uXG4gICAqL1xuICBhbGxvdzogZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZG9BbGxvdyhvYmopIHtcbiAgICAgIG1lLmZvcmJpZGRlbi5yZW1vdmUob2JqKTtcbiAgICB9XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmICh3aXRoUHJvdG90eXBlKSB7XG4gICAgICAgIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGRvQWxsb3cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9BbGxvdyhvYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBFbXB0aWVzIGFsbCB0aGUgaW5mbyBzdG9yZWQgaW4gdGhpcyBhbmFseXplclxuICAgKi9cbiAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9fbGlua3NDYWNoZV9fID0ge307XG4gICAgdGhpcy5fX29iamVjdHNDYWNoZV9fID0ge307XG4gICAgdGhpcy5mb3JiaWRkZW4uZW1wdHkoKTtcbiAgICB0aGlzLml0ZW1zLmVtcHR5KCk7XG4gIH1cbn07XG5cbnZhciBwcm90byA9IEFuYWx5emVyLnByb3RvdHlwZTtcbmZ1bmN0aW9uIGNoYWluKG1ldGhvZCkge1xuICBwcm90b1ttZXRob2RdID1cbiAgICB1dGlscy5mdW5jdGlvbkNoYWluKClcbiAgICAgIC5jaGFpbihwcm90by5tYWtlRGlydHkpXG4gICAgICAuY2hhaW4ocHJvdG9bbWV0aG9kXSk7XG59XG5cbi8vIGNhbGwgI21ha2VEaXJ0eSBiZWZvcmUgYWxsIHRoZXNlIG1ldGhvZHMgYXJlIGNhbGxlZFxuY2hhaW4oJ2FkZCcpO1xuY2hhaW4oJ3JlbW92ZScpO1xuY2hhaW4oJ2ZvcmJpZCcpO1xuY2hhaW4oJ2FsbG93Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQW5hbHl6ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIEFuZ3VsYXIoY29uZmlnKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIF8ubWVyZ2Uoe1xuICAgIGVudHJ5UG9pbnQ6ICdhbmd1bGFyJyxcbiAgICBkaXNwbGF5TmFtZTogJ0FuZ3VsYXJKUycsXG4gICAgYWx3YXlzRGlydHk6IHRydWUsXG4gICAgYWRkaXRpb25hbEZvcmJpZGRlblRva2VuczogJ2dsb2JhbDpqUXVlcnknXG4gIH0sIGNvbmZpZykpO1xuXG4gIHRoaXMuc2VydmljZXMgPSBbXG4gICAgJyRhbmltYXRlJyxcbiAgICAnJGNhY2hlRmFjdG9yeScsXG4gICAgJyRjb21waWxlJyxcbiAgICAnJGNvbnRyb2xsZXInLFxuICAgIC8vICckZG9jdW1lbnQnLFxuICAgICckZXhjZXB0aW9uSGFuZGxlcicsXG4gICAgJyRmaWx0ZXInLFxuICAgICckaHR0cCcsXG4gICAgJyRodHRwQmFja2VuZCcsXG4gICAgJyRpbnRlcnBvbGF0ZScsXG4gICAgJyRpbnRlcnZhbCcsXG4gICAgJyRsb2NhbGUnLFxuICAgICckbG9nJyxcbiAgICAnJHBhcnNlJyxcbiAgICAnJHEnLFxuICAgICckcm9vdFNjb3BlJyxcbiAgICAnJHNjZScsXG4gICAgJyRzY2VEZWxlZ2F0ZScsXG4gICAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgICAnJHRpbWVvdXQnXG4gICAgLy8gJyR3aW5kb3cnXG4gIF0ubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgcmV0dXJuIHsgY2hlY2tlZDogdHJ1ZSwgbmFtZTogdiB9O1xuICB9KTtcbn1cblxuQW5ndWxhci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3BlY3Rvci5wcm90b3R5cGUpO1xuXG5Bbmd1bGFyLnByb3RvdHlwZS5nZXRTZWxlY3RlZFNlcnZpY2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzLFxuICAgIHRvQW5hbHl6ZSA9IFtdO1xuXG4gIGdsb2JhbC5hbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZyddKTtcbiAgdGhpcy5pbmplY3RvciA9IGdsb2JhbC5hbmd1bGFyLmluamVjdG9yKFsnYXBwJ10pO1xuXG4gIG1lLnNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICBpZiAocy5jaGVja2VkKSB7XG4gICAgICB2YXIgb2JqID0gbWUuaW5qZWN0b3IuZ2V0KHMubmFtZSk7XG4gICAgICB0b0FuYWx5emUucHVzaChvYmopO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0b0FuYWx5emU7XG59O1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICovXG5Bbmd1bGFyLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBhbmd1bGFyJyk7XG5cbiAgLy8gZ2V0IHRoZSBvYmplY3RzIHRoYXQgbmVlZCB0byBiZSBmb3JiaWRkZW5cbiAgdmFyIHRvRm9yYmlkID0gbWUucGFyc2VGb3JiaWRkZW5Ub2tlbnMoKTtcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnZm9yYmlkZGluZzogJywgdG9Gb3JiaWQpO1xuICB0aGlzLmFuYWx5emVyLmZvcmJpZCh0b0ZvcmJpZCwgdHJ1ZSk7XG5cbiAgdGhpcy5hbmFseXplci5hZGQoXG4gICAgW2dsb2JhbC5hbmd1bGFyXS5jb25jYXQodGhpcy5nZXRTZWxlY3RlZFNlcnZpY2VzKCkpXG4gICk7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogU2luY2UgQW5ndWxhciBpcyBhIHNjcmlwdCByZXRyaWV2ZWQgb24gZGVtYW5kIGJ1dCB0aGUgaW5zdGFuY2VcbiAqIGlzIGFscmVhZHkgY3JlYXRlZCBpbiBJbnNwZWN0ZWRJbnN0YW5jZSwgbGV0J3MgYWx0ZXIgdGhlXG4gKiBwcm9wZXJ0aWVzIGl0IGhhcyBiZWZvcmUgbWFraW5nIHRoZSByZXF1ZXN0XG4gKi9cbkFuZ3VsYXIucHJvdG90eXBlLm1vZGlmeUluc3RhbmNlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgdGhpcy5zcmMgPSBvcHRpb25zLnNyYztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQW5ndWxhcjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZW5lcmljQW5hbHl6ZXIgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpLFxuICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvJyk7XG5cbnZhciB0b0luc3BlY3QgPSBbXG4gIE9iamVjdCwgRnVuY3Rpb24sXG4gIEFycmF5LCBEYXRlLCBCb29sZWFuLCBOdW1iZXIsIE1hdGgsIFN0cmluZywgUmVnRXhwLCBKU09OLFxuICBFcnJvclxuXTtcblxuZnVuY3Rpb24gQnVpbHRJbihvcHRpb25zKSB7XG4gIEdlbmVyaWNBbmFseXplci5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5CdWlsdEluLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2VuZXJpY0FuYWx5emVyLnByb3RvdHlwZSk7XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKi9cbkJ1aWx0SW4ucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGJ1aWx0SW4gb2JqZWN0cycpO1xuICB0aGlzLmFuYWx5emVyLmFkZCh0aGlzLmdldEl0ZW1zKCkpO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuQnVpbHRJbi5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0b0luc3BlY3Q7XG59O1xuXG5CdWlsdEluLnByb3RvdHlwZS5zaG93U2VhcmNoID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBub2RlUHJvcGVydHkpIHtcbiAgdmFyIHVybCA9ICdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9zZWFyY2g/JyArXG4gICAgdXRpbHMudG9RdWVyeVN0cmluZyh7XG4gICAgICBxOiBlbmNvZGVVUklDb21wb25lbnQobm9kZU5hbWUgKyAnICcgKyBub2RlUHJvcGVydHkpXG4gICAgfSk7XG4gIHdpbmRvdy5vcGVuKHVybCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1aWx0SW47IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKTtcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpO1xuXG52YXIgdG9JbnNwZWN0ID0gW2dsb2JhbF07XG5cbmZ1bmN0aW9uIEdsb2JhbCgpIHtcbiAgSW5zcGVjdG9yLmNhbGwodGhpcywge1xuICAgIGFuYWx5emVyQ29uZmlnOiB7XG4gICAgICBsZXZlbHM6IDEsXG4gICAgICB2aXNpdENvbnN0cnVjdG9yczogZmFsc2VcbiAgICB9LFxuICAgIGFsd2F5c0RpcnR5OiB0cnVlXG4gIH0pO1xufVxuXG5HbG9iYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJbnNwZWN0b3IucHJvdG90eXBlKTtcblxuR2xvYmFsLnByb3RvdHlwZS5nZXRJdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRvSW5zcGVjdDtcbn07XG5cbkdsb2JhbC5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ2luc3BlY3RpbmcgZ2xvYmFsJyk7XG4gIC8vdmFyIG1lID0gdGhpcyxcbiAgLy8gIGhhc2hlcyA9IHJlcXVpcmUoJy4uL0luc3BlY3RlZEluc3RhbmNlcycpO1xuICAvL1xuICAvL18uZm9yT3duKGhhc2hlcywgZnVuY3Rpb24gKHYsIGspIHtcbiAgLy8gIGlmICh2LmdldEl0ZW1zKCkpIHtcbiAgLy8gICAgbWUuYW5hbHl6ZXIuZm9yYmlkKFt2LmdldEl0ZW1zKCldLCB0cnVlKTtcbiAgLy8gIH1cbiAgLy99KTtcbiAgdGhpcy5hbmFseXplci5pdGVtcy5lbXB0eSgpO1xuICB0aGlzLmFuYWx5emVyLmFkZChtZS5nZXRJdGVtcygpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2xvYmFsOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsLycpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKTtcbnZhciBBbmFseXplciA9IHJlcXVpcmUoJy4uL09iamVjdEFuYWx5emVyJyk7XG5cbnZhciBzZWFyY2hFbmdpbmUgPSAnaHR0cHM6Ly9kdWNrZHVja2dvLmNvbS8/cT0nO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEluc3RhbmNlcyBvZiB0aGUgY2xhc3MgaW5zcGVjdG9yIGRlY2lkZSB3aGljaCBvYmplY3RzIHdpbGwgYmVcbiAqIGFuYWx5emVkIGJ5IHRoZSBpbnRlcm5hbCBhbmFseXplciBpdCBob2xkcywgYmVzaWRlcyBkb2luZyB0aGF0XG4gKiB0aGlzIGluc3BlY3RvciBpcyBhYmxlIHRvOlxuICpcbiAqIC0gZG8gZGVmZXJyZWQgYW5hbHlzaXMgKGFuYWx5c2lzIG9uIGRlbWFuZClcbiAqIC0gZmV0Y2ggZXh0ZXJuYWwgc2NyaXB0cyBpbiBzZXJpZXMgKHRoZSBhbmFseXNpcyBpcyBtYWRlXG4gKiAgIHdoZW4gYWxsIHRoZSBzY3JpcHMgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nKVxuICogLSBtYXJrIGl0c2VsZiBhcyBhbiBhbHJlYWR5IGluc3BlY3RlZCBpbnN0YW5jZSBzbyB0aGF0XG4gKiAgIGZ1cnRoZXIgaW5zcGVjdGlvbiBjYWxscyBhcmUgbm90IG1hZGVcbiAqIC0gcmVjZWl2ZSBhIGNvbmZpZ3VyYXRpb24gdG8gZm9yYmlkIGNvbXBsZXRlIGdyYXBocyBmcm9tXG4gKiAgIHRoZSBhbmFseXNpcyBzdGVwXG4gKlxuICogU2FtcGxlIHVzYWdlOlxuICpcbiAqIEFuYWx5c2lzIG9mIGEgc2ltcGxlIG9iamVjdDpcbiAqXG4gKiAgICB2YXIgeCA9IHt9O1xuICogICAgdmFyIGluc3BlY3RvciA9IG5ldyBJbnNwZWN0b3IoKTtcbiAqICAgIGluc3BlY3RvclxuICogICAgICAuaW5pdCgpXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgICAvLyB4IGlzIHJlYWR5IGFuYWx5emVkIGF0IHRoaXMgcG9pbnQhXG4gKiAgICAgICAgLy8gb2JqZWN0cyBzYXZlZCBpbiBpbnNwZWN0b3IuYW5hbHl6ZXIgPSB7eH1cbiAqICAgICAgfSlcbiAqXG4gKiBBcyBzZWVuIGluIHRoZSBjb2RlIHRoZXJlIGlzIGEgZGVmYXVsdCB2YXJpYWJsZSB3aGljaCBzcGVjaWZpZXNcbiAqIHRoZSBvYmplY3RzIHRoYXQgd2lsbCBiZSBmb3JiaWRkZW4sIHRoZSB2YWx1ZSBpcyBhIHBpcGUgc2VwYXJhdGVkXG4gKiBsaXN0IG9mIGNvbW1hbmRzIChzZWUgQGZvcmJpZGRlblRva2Vucykgd2hpY2ggaXMgbWFraW5nIHRoZVxuICogaW5zcGVjdG9yIGF2b2lkIHRoZSBidWlsdEluIHByb3BlcnRpZXMsIGxldCdzIGF2b2lkIHRoYXQgYnkgbWFraW5nXG4gKiBmb3JiaWRkZW5Ub2tlbnMgbnVsbDpcbiAqXG4gKiAgICB2YXIgeCA9IHt9O1xuICogICAgdmFyIGluc3BlY3RvciA9IG5ldyBJbnNwZWN0b3Ioe1xuICogICAgICBmb3JiaWRkZW5Ub2tlbnM6IG51bGxcbiAqICAgIH0pO1xuICogICAgaW5zcGVjdG9yXG4gKiAgICAgIC5pbml0KClcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICogICAgICAgIC8vIHggaXMgcmVhZHkgYW5hbHl6ZWQgYXQgdGhpcyBwb2ludCFcbiAqICAgICAgICAvLyBvYmplY3RzIHNhdmVkIGluIGluc3BlY3Rvci5hbmFseXplciA9IHt4LCBPYmplY3QsXG4gKiAgICAgICAgICBPYmplY3QucHJvdG90eXBlLCBGdW5jdGlvbiwgRnVuY3Rpb24ucHJvdG90eXBlfVxuICogICAgICB9KVxuICpcbiAqIFRvIGV4ZWN1dGUgbW9yZSBjb21wbGV4IGFuYWx5c2lzIGNvbnNpZGVyIG92ZXJyaWRpbmc6XG4gKlxuICogLSBpbnNwZWN0U2VsZlxuICogLSBnZXRJdGVtc1xuICpcbiAqIFNlZSBCdWlsdEluLmpzIGZvciBhIGJhc2ljIG92ZXJyaWRlIG9mIHRoZSBtZXRob2RzIGFib3ZlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuZW50cnlQb2ludF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNyY11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmRpc3BsYXlOYW1lXVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuZm9yYmlkZGVuVG9rZW5zPUluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlNdXG4gKi9cbmZ1bmN0aW9uIEluc3BlY3Rvcihjb25maWcpIHtcbiAgY29uZmlnID0gXy5tZXJnZShfLmNsb25lKEluc3BlY3Rvci5ERUZBVUxUX0NPTkZJRywgdHJ1ZSksIGNvbmZpZyk7XG5cbiAgLyoqXG4gICAqIElmIHByb3ZpZGVkIGl0J2xsIGJlIHVzZWQgYXMgdGhlIHN0YXJ0aW5nIG9iamVjdCBmcm9tIHRoZVxuICAgKiBnbG9iYWwgb2JqZWN0IHRvIGJlIGFuYWx5emVkLCBuZXN0ZWQgb2JqZWN0cyBjYW4gYmUgc3BlY2lmaWVkXG4gICAqIHdpdGggdGhlIGRvdCBub3RhdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5lbnRyeVBvaW50ID0gY29uZmlnLmVudHJ5UG9pbnQ7XG5cbiAgLyoqXG4gICAqIE5hbWUgdG8gYmUgZGlzcGxheWVkXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLmRpc3BsYXlOYW1lID0gY29uZmlnLmRpc3BsYXlOYW1lO1xuXG4gIC8qKlxuICAgKiBJZiB0aGUgaW5zcGVjdG9yIG5lZWRzIHRvIGZldGNoIGV4dGVybmFsIHJlc291cmNlcyB1c2VcbiAgICogYSBzdHJpbmcgc2VwYXJhdGVkIHdpdGggdGhlIHBpcGUgfCBjaGFyYWN0ZXIsIHRoZSBzY3JpcHRzXG4gICAqIGFyZSBsb2FkZWQgaW4gc2VyaWVzIGJlY2F1c2Ugb25lIHNjcmlwdCBtaWdodCBuZWVkIHRoZSBleGlzdGVuY2VcbiAgICogb2YgYW5vdGhlciBiZWZvcmUgaXQncyBmZXRjaGVkXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLnNyYyA9IGNvbmZpZy5zcmM7XG5cbiAgLyoqXG4gICAqIEVhY2ggdG9rZW4gZGV0ZXJtaW5lcyB3aGljaCBvYmplY3RzIHdpbGwgYmUgZm9yYmlkZGVuXG4gICAqIHdoZW4gdGhlIGFuYWx5emVyIGlzIHJ1bi5cbiAgICpcbiAgICogVG9rZW4gZXhhbXBsZXM6XG4gICAqXG4gICAqIC0gcG9qb3Zpejp7c3RyaW5nfVxuICAgKiAgIEZvcmJpZHMgYWxsIHRoZSBpdGVtcyBzYXZlZCBpbiB0aGUge3N0cmluZ30gaW5zdGFuY2Ugd2hpY2hcbiAgICogICBpcyBzdG9yZWQgaW4gdGhlIEluc3BlY3RlZEluc3RhbmNlcyBvYmplY3QsXG4gICAqICAgYXNzdW1pbmcgdGhhdCBlYWNoIGlzIGEgc3ViY2xhc3Mgb2YgYEluc3BlY3RvcmBcbiAgICpcbiAgICogZS5nLlxuICAgKlxuICAgKiAgIC8vIGZvcmJpZCBhbGwgdGhlIGl0ZW1zIGZvdW5kIGluIHRoZSBidWlsdEluIGluc3BlY3RvclxuICAgKiAgIHBvam92aXo6YnVpbHRJblxuICAgKlxuICAgKiAtIGdsb2JhbDp7c3RyaW5nfVxuICAgKiAgIEZvcmJpZHMgYW4gb2JqZWN0IHdoaWNoIGlzIGluIHRoZSBnbG9iYWwgb2JqZWN0LCB7c3RyaW5nfSBtaWdodFxuICAgKiAgIGFsc28gaW5kaWNhdGUgYSBuZXN0ZWQgb2JqZWN0IHVzaW5nIC4gYXMgYSBub3JtYWwgcHJvcGVydHlcbiAgICogICByZXRyaWV2YWxcbiAgICpcbiAgICogZS5nLlxuICAgKlxuICAgKiAgIGdsb2JhbDpkb2N1bWVudFxuICAgKiAgIGdsb2JhbDpkb2N1bWVudC5ib2R5XG4gICAqICAgZ2xvYmFsOmRvY3VtZW50LmhlYWRcbiAgICpcbiAgICogRm9yYmlkZGVuVG9rZW5zIGV4YW1wbGU6XG4gICAqXG4gICAqICBwb2pvdml6OmJ1aWx0SW58cG9qb3Zpejp3aW5kb3d8Z2xvYmFsOmRvY3VtZW50XG4gICAqXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlblRva2VucyA9IFtjb25maWcuZm9yYmlkZGVuVG9rZW5zLCBjb25maWcuYWRkaXRpb25hbEZvcmJpZGRlblRva2Vuc11cbiAgICAuZmlsdGVyKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgcmV0dXJuICEhdG9rZW47XG4gICAgfSlcbiAgICAuam9pbignfCcpO1xuXG4gIC8qKlxuICAgKiBUaGlzIGluc3BlY3RvciBpcyBpbml0aWFsbHkgaW4gYSBkaXJ0eSBzdGF0ZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGlydHkgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBQcmludCBkZWJ1ZyBpbmZvXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgdGhpcy5kZWJ1ZyA9IGNvbmZpZy5kZWJ1ZztcblxuICAvKipcbiAgICogVG8gYXZvaWQgcmVhbmFseXppbmcgdGhlIHNhbWUgc3RydWN0dXJlIG11bHRpcGxlIHRpbWVzIGEgc21hbGxcbiAgICogb3B0aW1pemF0aW9uIGlzIHRvIG1hcmsgdGhlIGluc3BlY3RvciBhcyBpbnNwZWN0ZWQsIHRvIGF2b2lkXG4gICAqIHRoaXMgb3B0aW1pemF0aW9uIHBhc3MgYWx3YXlzRGlydHkgYXMgdHJ1ZSBpbiB0aGUgb3B0aW9uc1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuYWx3YXlzRGlydHkgPSBjb25maWcuYWx3YXlzRGlydHk7XG5cbiAgLyoqXG4gICAqIEFuIGluc3RhbmNlIG9mIE9iamVjdEFuYWx5emVyIHdoaWNoIHdpbGwgc2F2ZSBhbGxcbiAgICogdGhlIGluc3BlY3RlZCBvYmplY3RzXG4gICAqIEB0eXBlIHtPYmplY3RBbmFseXplcn1cbiAgICovXG4gIHRoaXMuYW5hbHl6ZXIgPSBuZXcgQW5hbHl6ZXIoY29uZmlnLmFuYWx5emVyQ29uZmlnKTtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3Qgd2hpY2ggaG9sZHMgYWxsIHRoZSBpbnNwZWN0b3IgaW5zdGFuY2VzIGNyZWF0ZWRcbiAqIChmaWxsZWQgaW4gdGhlIGZpbGUgSW5zcGVjdGVkSW5zdGFuY2VzKVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuSW5zcGVjdG9yLmluc3RhbmNlcyA9IG51bGw7XG5cbi8qKlxuICogRGVmYXVsdCBmb3JiaWRkZW4gY29tbWFuZHMgKGluIG5vZGUgZ2xvYmFsIGlzIHRoZSBnbG9iYWwgb2JqZWN0KVxuICogQHR5cGUge3N0cmluZ1tdfVxuICovXG5JbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TX0FSUkFZID0gW1xuICAncG9qb3ZpejpnbG9iYWwnLFxuICAncG9qb3ZpejpidWlsdEluJyxcbiAgJ2dsb2JhbDpkb2N1bWVudCdcbl07XG5cbi8qKlxuICogRm9yYmlkZGVuIHRva2VucyB3aGljaCBhcmUgc2V0IGJ5IGRlZmF1bHQgb24gYW55IEluc3BlY3RvciBpbnN0YW5jZVxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuSW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOUyA9XG4gIEluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlNfQVJSQVkuam9pbignfCcpO1xuXG4vKipcbiAqIERlZmF1bHQgY29uZmlnIHVzZWQgd2hlbmV2ZXIgYW4gaW5zdGFuY2Ugb2YgSW5zcGVjdG9yIGlzIGNyZWF0ZWRcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkluc3BlY3Rvci5ERUZBVUxUX0NPTkZJRyA9IHtcbiAgc3JjOiBudWxsLFxuICBlbnRyeVBvaW50OiAnJyxcbiAgZGlzcGxheU5hbWU6ICcnLFxuICBhbHdheXNEaXJ0eTogZmFsc2UsXG4gIGRlYnVnOiAhIWdsb2JhbC53aW5kb3csXG4gIGZvcmJpZGRlblRva2VuczogSW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOUyxcbiAgYWRkaXRpb25hbEZvcmJpZGRlblRva2VuczogbnVsbCxcbiAgYW5hbHl6ZXJDb25maWc6IHt9XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgYnVpbHRJbiB2aXNpYmlsaXR5IG9mIGFsbCB0aGUgbmV3IGluc3RhbmNlcyB0byBiZSBjcmVhdGVkXG4gKiBAcGFyYW0gdmlzaWJsZVxuICovXG5JbnNwZWN0b3Iuc2V0QnVpbHRJblZpc2liaWxpdHkgPSBmdW5jdGlvbiAodmlzaWJsZSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgdG9rZW4gPSAncG9qb3ZpejpidWlsdEluJztcbiAgdmFyIGFyciA9IG1lLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOU19BUlJBWTtcbiAgaWYgKHZpc2libGUpIHtcbiAgICBhcnIucHVzaCh0b2tlbik7XG4gIH0gZWxzZSB7XG4gICAgYXJyLnNwbGljZShhcnIuaW5kZXhPZih0b2tlbiksIDEpO1xuICB9XG4gIG1lLkRFRkFVTFRfQ09ORklHLmZvcmJpZGRlblRva2VucyA9IGFyci5qb2luKCd8Jyk7XG59O1xuXG4vKipcbiAqIEluaXQgcm91dGluZSwgc2hvdWxkIGJlIGNhbGxlZCBvbiBkZW1hbmQgdG8gaW5pdGlhbGl6ZSB0aGVcbiAqIGFuYWx5c2lzIHByb2Nlc3MsIGl0IG9yY2hlc3RyYXRlcyB0aGUgZm9sbG93aW5nOlxuICpcbiAqIC0gZmV0Y2hpbmcgb2YgZXh0ZXJuYWwgcmVzb3VyY2VzXG4gKiAtIGluc3BlY3Rpb24gb2YgZWxlbWVudHMgaWYgdGhlIGluc3BlY3RvciBpcyBpbiBhIGRpcnR5IHN0YXRlXG4gKlxuICogQHJldHVybnMge1Byb21pc2V9XG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJyVjUG9qb1ZpeicsICdmb250LXNpemU6IDE1cHg7IGNvbG9yOiAnKTtcbiAgcmV0dXJuIG1lLmZldGNoKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAobWUuYWx3YXlzRGlydHkpIHtcbiAgICAgICAgbWUuc2V0RGlydHkoKTtcbiAgICAgIH1cbiAgICAgIGlmIChtZS5kaXJ0eSkge1xuICAgICAgICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnJWNJbnNwZWN0aW5nOiAlcycsICdjb2xvcjogcmVkJywgbWUuZW50cnlQb2ludCB8fCBtZS5kaXNwbGF5TmFtZSk7XG4gICAgICAgIG1lLmluc3BlY3QoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogUGVyZm9ybXMgdGhlIGFuYWx5c2lzIG9mIGFuIG9iamVjdCBnaXZlbiBhbiBlbnRyeVBvaW50LCBiZWZvcmVcbiAqIHBlcmZvcm1pbmcgdGhlIGFuYWx5c2lzIGl0IGlkZW50aWZpZXMgd2hpY2ggb2JqZWN0IG5lZWQgdG8gYmVcbiAqIGZvcmJpZGRlbiAoZm9yYmlkZGVuVG9rZW5zKVxuICpcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHN0YXJ0ID0gbWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwobWUuZW50cnlQb2ludCk7XG4gIHZhciBhbmFseXplciA9IHRoaXMuYW5hbHl6ZXI7XG5cbiAgaWYgKCFzdGFydCkge1xuICAgIGNvbnNvbGUuZXJyb3IodGhpcyk7XG4gICAgdGhyb3cgJ2VudHJ5IHBvaW50IG5vdCBmb3VuZCEnO1xuICB9XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCdhbmFseXppbmcgZ2xvYmFsLicgKyBtZS5lbnRyeVBvaW50KTtcblxuICAvLyBiZWZvcmUgaW5zcGVjdCBob29rXG4gIG1lLmJlZm9yZUluc3BlY3RTZWxmKCk7XG5cbiAgLy8gZ2V0IHRoZSBvYmplY3RzIHRoYXQgbmVlZCB0byBiZSBmb3JiaWRkZW5cbiAgdmFyIHRvRm9yYmlkID0gbWUucGFyc2VGb3JiaWRkZW5Ub2tlbnMoKTtcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2ZvcmJpZGRpbmc6ICcsIHRvRm9yYmlkKTtcbiAgYW5hbHl6ZXIuZm9yYmlkKHRvRm9yYmlkLCB0cnVlKTtcblxuICAvLyBwZXJmb3JtIHRoZSBhbmFseXNpc1xuICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnYWRkaW5nOiAnICsgc3RhcnQpO1xuICBhbmFseXplci5hZGQoW3N0YXJ0XSk7XG5cbiAgLy8gYWZ0ZXIgaW5zcGVjdCBob29rXG4gIG1lLmFmdGVySW5zcGVjdFNlbGYoKTtcbiAgcmV0dXJuIG1lO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIGJlZm9yZSBpbnNwZWN0IHNlbGYgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmJlZm9yZUluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIGFmdGVyIGluc3BlY3Qgc2VsZiBob29rXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuYWZ0ZXJJbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbn07XG5cbi8qKlxuICogUGFyc2VzIHRoZSBmb3JiaWRkZW5Ub2tlbnMgc3RyaW5nIGFuZCBpZGVudGlmaWVzIHdoaWNoXG4gKiBvYmplY3RzIHNob3VsZCBiZSBmb3JiaWRkZW4gZnJvbSB0aGUgYW5hbHlzaXMgcGhhc2VcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5wYXJzZUZvcmJpZGRlblRva2VucyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIGZvcmJpZGRlbiA9IHRoaXMuZm9yYmlkZGVuVG9rZW5zLnNwbGl0KCd8Jyk7XG4gIHZhciB0b0ZvcmJpZCA9IFtdO1xuICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnYWJvdXQgdG8gZm9yYmlkOiAnLCBmb3JiaWRkZW4pO1xuICBmb3JiaWRkZW5cbiAgICAuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiAhIXY7IH0pXG4gICAgLmZvckVhY2goZnVuY3Rpb24odG9rZW4pIHtcbiAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgIHZhciB0b2tlbnM7XG4gICAgICBpZiAodG9rZW4uc2VhcmNoKC9ecG9qb3ZpejovKSA+IC0xKSB7XG4gICAgICAgIHRva2VucyA9IHRva2VuLnNwbGl0KCc6Jyk7XG5cbiAgICAgICAgLy8gaWYgaXQncyBhIGNvbW1hbmQgZm9yIHRoZSBsaWJyYXJ5IHRoZW4gbWFrZSBzdXJlIGl0IGV4aXN0c1xuICAgICAgICBhc3NlcnQoSW5zcGVjdG9yLmluc3RhbmNlc1t0b2tlbnNbMV1dKTtcbiAgICAgICAgYXJyID0gSW5zcGVjdG9yLmluc3RhbmNlc1t0b2tlbnNbMV1dLmdldEl0ZW1zKCk7XG4gICAgICB9IGVsc2UgaWYgKHRva2VuLnNlYXJjaCgvXmdsb2JhbDovKSA+IC0xKSB7XG4gICAgICAgIHRva2VucyA9IHRva2VuLnNwbGl0KCc6Jyk7XG4gICAgICAgIGFyciA9IFttZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbCh0b2tlbnNbMV0pXTtcbiAgICAgIH1cblxuICAgICAgdG9Gb3JiaWQgPSB0b0ZvcmJpZC5jb25jYXQoYXJyKTtcbiAgICB9KTtcbiAgcmV0dXJuIHRvRm9yYmlkO1xufTtcblxuLyoqXG4gKiBNYXJrcyB0aGlzIGluc3BlY3RvciBhcyBkaXJ0eVxuICogQGNoYWluYWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnNldERpcnR5ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgdGhpcy5hbmFseXplci5pdGVtcy5lbXB0eSgpO1xuICB0aGlzLmFuYWx5emVyLmZvcmJpZGRlbi5lbXB0eSgpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWFya3MgdGhpcyBpbnNwZWN0b3IgYXMgbm90IGRpcnR5IChzbyB0aGF0IGZ1cnRoZXIgY2FsbHNcbiAqIHRvIGluc3BlY3QgYXJlIG5vdCBtYWRlKVxuICogQGNoYWluYWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnVuc2V0RGlydHkgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogU2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5zdGFuY2UgaXMgY3JlYXRlZCB0byBtb2RpZnkgaXQgd2l0aFxuICogYWRkaXRpb25hbCBvcHRpb25zXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUubW9kaWZ5SW5zdGFuY2UgPSBmdW5jdGlvbiAob3B0aW9ucykge1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogUGVyZm9ybXMgdGhlIGluc3BlY3Rpb24gb24gc2VsZlxuICogQGNoYWluYWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzXG4gICAgLnVuc2V0RGlydHkoKVxuICAgIC5pbnNwZWN0U2VsZigpO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFByZXJlbmRlciBob29rXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUucHJlUmVuZGVyID0gZnVuY3Rpb24gKCkge1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFBvc3RyZW5kZXIgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnBvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZXNcbiAqIFJldHVybnMgdGhlIHByZWRlZmluZWQgaXRlbXMgdGhhdCB0aGlzIGluc3BlY3RvciBpcyBpbiBjaGFyZ2Ugb2ZcbiAqIGl0J3MgdXNlZnVsIHRvIGRldGVybWluZSB3aGljaCBvYmplY3RzIG5lZWQgdG8gYmUgZGlzY2FyZGVkIGluXG4gKiAjaW5zcGVjdFNlbGZcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5nZXRJdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFtdO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIHN0cmluZyB3aGljaCBoYXZlIHRva2VucyBzZXBhcmF0ZWQgYnkgdGhlIC4gc3ltYm9sXG4gKiB0aGlzIG1ldGhvZHMgY2hlY2tzIGlmIGl0J3MgYSB2YWxpZCB2YWx1ZSB1bmRlciB0aGUgZ2xvYmFsIG9iamVjdFxuICpcbiAqIGUuZy5cbiAqICAgICAgICAnZG9jdW1lbnQuYm9keSdcbiAqICAgICAgICByZXR1cm5zIGdsb2JhbC5kb2N1bWVudC5ib2R5IHNpbmNlIGl0J3MgYSB2YWxpZCBvYmplY3RcbiAqICAgICAgICB1bmRlciB0aGUgZ2xvYmFsIG9iamVjdFxuICpcbiAqIEBwYXJhbSBuZXN0ZWRDb25maWd1cmF0aW9uXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbCA9IGZ1bmN0aW9uIChuZXN0ZWRDb25maWd1cmF0aW9uKSB7XG4gIHZhciB0b2tlbnMgPSBuZXN0ZWRDb25maWd1cmF0aW9uLnNwbGl0KCcuJyk7XG4gIHZhciBzdGFydCA9IGdsb2JhbDtcbiAgd2hpbGUgKHRva2Vucy5sZW5ndGgpIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnMuc2hpZnQoKTtcbiAgICBpZiAoIXN0YXJ0Lmhhc093blByb3BlcnR5KHRva2VuKSkge1xuICAgICAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLndhcm4oJ25lc3RlZENvbmZpZyBub3QgZm91bmQhJyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc3RhcnQgPSBzdGFydFt0b2tlbl07XG4gIH1cbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuLyoqXG4gKiBGZXRjaGVzIGFsbCB0aGUgcmVzb3VyY2VzIHJlcXVpcmVkIHRvIHBlcmZvcm0gdGhlIGluc3BlY3Rpb24sXG4gKiAod2hpY2ggYXJlIHNhdmVkIGluIGB0aGlzLnNyY2ApLCByZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpc1xuICogcmVzb2x2ZWQgd2hlbiBhbGwgdGhlIHNjcmlwcyBoYXZlIGZpbmlzaGVkIGxvYWRpbmdcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZyBgdmAgaXQgZmV0Y2hlcyBpdCBhbiBhbiBhc3luYyB3YXksXG4gICAqIHNpbmNlIHRoaXMgbWV0aG9kIHJldHVybnMgYSBwcm9taXNlIGl0IGFsbG93cyBlYXN5IGNoYWluaW5nXG4gICAqIHNlZSB0aGUgcmVkdWNlIHBhcnQgYmVsb3dcbiAgICogQHBhcmFtIHZcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5KHYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdmZXRjaGluZyBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0LnNyYyA9IHY7XG4gICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlZCBmZXRjaGluZyBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKG1lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKG1lLmVudHJ5UG9pbnQpKTtcbiAgICAgIH07XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKG1lLnNyYykge1xuICAgIGlmIChtZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbChtZS5lbnRyeVBvaW50KSkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc291cmNlIGFscmVhZHkgZmV0Y2hlZDogJyArIG1lLmVudHJ5UG9pbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3JjcyA9IHRoaXMuc3JjLnNwbGl0KCd8Jyk7XG4gICAgICByZXR1cm4gc3Jjcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHByZXYudGhlbihwcm9taXNpZnkoY3VycmVudCkpO1xuICAgICAgfSwgUSgncmVkdWNlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBRLmRlbGF5KDApO1xufTtcblxuLyoqXG4gKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBidWlsdEluIG9iamVjdHNcbiAqIEBwYXJhbSB2aXNpYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuc2V0QnVpbHRJblZpc2liaWxpdHkgPSBmdW5jdGlvbiAodmlzaWJsZSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgdG9rZW4gPSAncG9qb3ZpejpidWlsdEluJztcbiAgdmFyIGFyciA9IG1lLmZvcmJpZGRlblRva2VucztcbiAgaWYgKHZpc2libGUpIHtcbiAgICBhcnIucHVzaCh0b2tlbik7XG4gIH0gZWxzZSB7XG4gICAgYXJyLnNwbGljZShhcnIuaW5kZXhPZih0b2tlbiksIDEpO1xuICB9XG59O1xuXG5JbnNwZWN0b3IucHJvdG90eXBlLnNob3dTZWFyY2ggPSBmdW5jdGlvbiAobm9kZU5hbWUsIG5vZGVQcm9wZXJ0eSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgdHBsID0gXy50ZW1wbGF0ZSgnJHtzZWFyY2hFbmdpbmV9JHtsdWNreX0ke2xpYnJhcnlOYW1lfSAke25vZGVOYW1lfSAke25vZGVQcm9wZXJ0eX0nKTtcbiAgdmFyIGNvbXBpbGVkID0gdHBsKHtcbiAgICBzZWFyY2hFbmdpbmU6IHNlYXJjaEVuZ2luZSxcbiAgICBsdWNreTogSW5zcGVjdG9yLmx1Y2t5ID8gJyFkdWNreScgOiAnJyxcbiAgICBsaWJyYXJ5TmFtZTogbWUuZW50cnlQb2ludCxcbiAgICBub2RlTmFtZTogbm9kZU5hbWUsXG4gICAgbm9kZVByb3BlcnR5OiBub2RlUHJvcGVydHlcbiAgfSk7XG4gIHdpbmRvdy5vcGVuKGNvbXBpbGVkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5zcGVjdG9yOyIsIid1c2Ugc3RyaWN0JztcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpO1xuZnVuY3Rpb24gUE9iamVjdChvcHRpb25zKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5QT2JqZWN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cblBPYmplY3QucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIE9iamVjdCBvYmplY3RzJyk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKHRoaXMuZ2V0SXRlbXMoKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUE9iamVjdC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbT2JqZWN0XTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUE9iamVjdDsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8xNy8xNS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbe1xuICBlbnRyeVBvaW50OiAnZ2xvYmFsJ1xufSwge1xuICBsYWJlbDogJ0V4dEpTJyxcbiAgc3JjOiAnLy9jZG4uc2VuY2hhLmNvbS9leHQvZ3BsLzQuMi4xL2V4dC1hbGwuanMnLFxuICBlbnRyeVBvaW50OiAnRXh0JyxcbiAgYW5hbHl6ZXJDb25maWc6IHtcbiAgICBsZXZlbHM6IDFcbiAgfVxufSwge1xuICBlbnRyeVBvaW50OiAnVEhSRUUnXG59LCB7XG4gIGVudHJ5UG9pbnQ6ICdQaGFzZXInLFxuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9waGFzZXIvMi4wLjYvcGhhc2VyLm1pbi5qcycsXG4gIGFuYWx5emVyQ29uZmlnOiB7XG4gICAgdmlzaXRTaW1wbGVGdW5jdGlvbnM6IHRydWVcbiAgfVxufV07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTcvMTUuXG4gKi9cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBwcm90byA9IHtcbiAgZmluZDogZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgZnVuY3Rpb24gcHJlZGljYXRlKHYpIHtcbiAgICAgIHJldHVybiB2LmRpc3BsYXlOYW1lID09PSBlbnRyeSB8fCB2LmVudHJ5UG9pbnQgPT09IGVudHJ5O1xuICAgIH1cbiAgICB2YXIgcmVzdWx0O1xuICAgIF8uZm9yT3duKHRoaXMsIGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCB8fCBfLmZpbmQoc2NoZW1hLCBwcmVkaWNhdGUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn07XG5cbnZhciBzY2hlbWFzID0gT2JqZWN0LmNyZWF0ZShwcm90byk7XG5cbl8ubWVyZ2Uoc2NoZW1hcywge1xuICBrbm93blNjaGVtYXM6IHJlcXVpcmUoJy4va25vd25TY2hlbWFzJyksXG4gIG5vdGFibGVMaWJyYXJpZXM6IHJlcXVpcmUoJy4vbm90YWJsZUxpYnJhcmllcycpLFxuICBteUxpYnJhcmllczogcmVxdWlyZSgnLi9teUxpYnJhcmllcycpLFxuICBodWdlU2NoZW1hczogcmVxdWlyZSgnLi9odWdlU2NoZW1hcycpLFxuICBkb3dubG9hZGVkOiBbXVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NoZW1hczsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8xNy8xNS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbe1xuICBsYWJlbDogJ09iamVjdCcsXG4gIGRpc3BsYXlOYW1lOiAnb2JqZWN0J1xufSwge1xuICBsYWJlbDogJ0J1aWx0SW4gT2JqZWN0cycsXG4gIGRpc3BsYXlOYW1lOiAnYnVpbHRJbidcbn1dOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE3LzE1LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFt7XG4gIGxhYmVsOiAnUG9qb1ZpeicsXG4gIGVudHJ5UG9pbnQ6ICdwb2pvdml6JyxcbiAgYWx3YXlzRGlydHk6IHRydWUsXG4gIGFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnM6ICdnbG9iYWw6cG9qb3Zpei5JbnNwZWN0ZWRJbnN0YW5jZXMucG9qb3Zpei5hbmFseXplci5pdGVtcycsXG4gIGFuYWx5emVyQ29uZmlnOiB7XG4gICAgdmlzaXRBcnJheXM6IGZhbHNlXG4gIH1cbn0sIHtcbiAgZW50cnlQb2ludDogJ3QzJ1xufV07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTcvMTUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gW3tcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS4xL2pxdWVyeS5taW4uanMnLFxuICBlbnRyeVBvaW50OiAnalF1ZXJ5J1xufSwge1xuICBlbnRyeVBvaW50OiAnUG9seW1lcicsXG4gIGFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnM6ICdnbG9iYWw6UG9seW1lci5lbGVtZW50cydcbn0sIHtcbiAgZW50cnlQb2ludDogJ2QzJ1xufSwge1xuICBkaXNwbGF5TmFtZTogJ0xvLURhc2gnLFxuICBlbnRyeVBvaW50OiAnXycsXG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2xvZGFzaC5qcy8yLjQuMS9sb2Rhc2guanMnXG59LCB7XG4gIHNyYzogJy8vZmIubWUvcmVhY3QtMC4xMi4yLmpzJyxcbiAgZW50cnlQb2ludDogJ1JlYWN0J1xufSwge1xuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9hbmd1bGFyLmpzLzEuMi4yMC9hbmd1bGFyLmpzJyxcbiAgZW50cnlQb2ludDogJ2FuZ3VsYXInLFxuICBsYWJlbDogJ0FuZ3VsYXIgSlMnXG59LCB7XG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL21vZGVybml6ci8yLjguMi9tb2Rlcm5penIuanMnLFxuICBlbnRyeVBvaW50OiAnTW9kZXJuaXpyJ1xufSwge1xuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9oYW5kbGViYXJzLmpzLzEuMS4yL2hhbmRsZWJhcnMuanMnLFxuICBlbnRyeVBvaW50OiAnSGFuZGxlYmFycydcbn0sIHtcbiAgbGFiZWw6ICdFbWJlckpTJyxcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS4xL2pxdWVyeS5taW4uanN8Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvaGFuZGxlYmFycy5qcy8xLjEuMi9oYW5kbGViYXJzLmpzfC8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2VtYmVyLmpzLzEuNi4xL2VtYmVyLmpzJyxcbiAgZW50cnlQb2ludDogJ0VtYmVyJyxcbiAgZm9yYmlkZGVuVG9rZW5zOiAnZ2xvYmFsOiR8Z2xvYmFsOkhhbmRsZWJhcnN8cG9qb3ZpejpidWlsdElufGdsb2JhbDp3aW5kb3d8Z2xvYmFsOmRvY3VtZW50J1xufSwge1xuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9sb2Rhc2guanMvMi40LjEvbG9kYXNoLmpzfC8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2JhY2tib25lLmpzLzEuMS4yL2JhY2tib25lLmpzJyxcbiAgZW50cnlQb2ludDogJ0JhY2tib25lJ1xufSwge1xuICBsYWJlbDogJ01hcmlvbmV0dGUuanMnLFxuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjEvanF1ZXJ5Lm1pbi5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9sb2Rhc2guanMvMi40LjEvbG9kYXNoLmpzfC8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2JhY2tib25lLmpzLzEuMS4yL2JhY2tib25lLmpzfGh0dHA6Ly9tYXJpb25ldHRlanMuY29tL2Rvd25sb2Fkcy9iYWNrYm9uZS5tYXJpb25ldHRlLmpzJyxcbiAgZW50cnlQb2ludDogJ01hcmlvbmV0dGUnXG59XTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi9oYXNoS2V5Jyk7XG5cbmZ1bmN0aW9uIEhhc2hNYXAoKSB7XG59XG5cbkhhc2hNYXAucHJvdG90eXBlID0ge1xuICBwdXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdGhpc1toYXNoS2V5KGtleSldID0gKHZhbHVlIHx8IGtleSk7XG4gIH0sXG4gIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzW2hhc2hLZXkoa2V5KV07XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciB2ID0gdGhpc1toYXNoS2V5KGtleSldO1xuICAgIGRlbGV0ZSB0aGlzW2hhc2hLZXkoa2V5KV07XG4gICAgcmV0dXJuIHY7XG4gIH0sXG4gIGVtcHR5OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHAsXG4gICAgICAgIG1lID0gdGhpcztcbiAgICBmb3IgKHAgaW4gbWUpIHtcbiAgICAgIGlmIChtZS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICBkZWxldGUgdGhpc1twXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIGFsaWFzXG5IYXNoTWFwLnByb3RvdHlwZS5zZXQgPSBIYXNoTWFwLnByb3RvdHlwZS5wdXQ7XG5cbm1vZHVsZS5leHBvcnRzID0gSGFzaE1hcDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLycpO1xudmFyIG1lLCBoYXNoS2V5O1xudmFyIGRvR2V0LCBkb1NldDtcblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHVpZCA9IHY7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIW1lLmhhcyh2KSkge1xuICAgICAgZG9TZXQodiwgXy51bmlxdWVJZCgpKTtcbiAgICB9XG4gICAgdWlkID0gZG9HZXQodik7XG4gICAgaWYgKCFtZS5oYXModikpIHtcbiAgICAgIHRocm93IEVycm9yKHYgKyAnIHNob3VsZCBoYXZlIGEgaGFzaEtleSBhdCB0aGlzIHBvaW50IDooJyk7XG4gICAgfVxuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEdldHMgdGhlIHN0b3JlZCBoYXNoa2V5LCBzaW5jZSB0aGVyZSBhcmUgb2JqZWN0IHRoYXQgbWlnaHQgbm90IGhhdmUgYSBjaGFpblxuICogdXAgdG8gT2JqZWN0LnByb3RvdHlwZSB0aGUgY2hlY2sgaXMgZG9uZSB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkgZXhwbGljaXRseVxuICpcbiAqIEBwYXJhbSAgeyp9IG9ialxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5kb0dldCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgYXNzZXJ0KHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBtZS5oaWRkZW5LZXkpICYmXG4gICAgb2JqW21lLmhpZGRlbktleV07XG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBTZXRzIGEgaGlkZGVuIGtleSBvbiBhbiBvYmplY3QsIHRoZSBoaWRkZW4ga2V5IGlzIGRldGVybWluZWQgYXMgZm9sbG93czpcbiAqXG4gKiAtIG51bGwgb2JqZWN0LW51bGxcbiAqIC0gbnVtYmVyczogbnVtYmVyLXt2YWx1ZX1cbiAqIC0gYm9vbGVhbjogYm9vbGVhbi17dHJ1ZXxmYWxzZX1cbiAqIC0gc3RyaW5nOiBzdHJpbmcte3ZhbHVlfVxuICogLSB1bmRlZmluZWQgdW5kZWZpbmVkLXVuZGVmaW5lZFxuICogLSBmdW5jdGlvbjogZnVuY3Rpb24te2lkfSBpZCA9IF8udW5pcXVlSWRcbiAqIC0gb2JqZWN0OiBvYmplY3Qte2lkfSBpZCA9IF8udW5pcXVlSWRcbiAqXG4gKiBAcGFyYW0geyp9IG9iaiBUaGUgb2JqZWN0IHRvIHNldCB0aGUgaGlkZGVuS2V5XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gYmUgc2V0IGluIHRoZSBvYmplY3RcbiAqL1xuZG9TZXQgPSBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgYXNzZXJ0KHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopLCAnb2JqIG11c3QgYmUgYW4gb2JqZWN0fGZ1bmN0aW9uJyk7XG4gIGFzc2VydChcbiAgICB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyxcbiAgICAnVGhlIGtleSBuZWVkcyB0byBiZSBhIHZhbGlkIHN0cmluZydcbiAgKTtcbiAgdmFyIHZhbHVlO1xuICBpZiAoIW1lLmhhcyhvYmopKSB7XG4gICAgdmFsdWUgPSB0eXBlb2Ygb2JqICsgJy0nICsga2V5O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG1lLmhpZGRlbktleSwge1xuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gICAgaWYgKCFvYmpbbWUuaGlkZGVuS2V5XSkge1xuICAgICAgLy8gaW4gbm9kZSBzZXR0aW5nIHRoZSBpbnN0cnVjdGlvbiBhYm92ZSBtaWdodCBub3QgaGF2ZSB3b3JrZWRcbiAgICAgIGNvbnNvbGUud2FybignaGFzaEtleSNkb1NldCgpIHNldHRpbmcgdGhlIHZhbHVlIG9uIHRoZSBvYmplY3QgZGlyZWN0bHknKTtcbiAgICAgIG9ialttZS5oaWRkZW5LZXldID0gdmFsdWU7XG4gICAgfVxuICAgIGFzc2VydChvYmpbbWUuaGlkZGVuS2V5XSwgJ09iamVjdC5kZWZpbmVQcm9wZXJ0eSBkaWQgbm90IHdvcmshJyk7XG4gIH1cbiAgcmV0dXJuIG1lO1xufTtcblxubWUuaGlkZGVuS2V5ID0gJ19fcG9qb3ZpektleV9fJztcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiBkb0dldCh2KSA9PT0gJ3N0cmluZyc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZnVuY3Rpb24gdHlwZSh2KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikuc2xpY2UoOCwgLTEpO1xufVxuXG52YXIgdXRpbHMgPSB7fTtcblxuLyoqXG4gKiBBZnRlciBjYWxsaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCB3aXRoIGB2YCBhcyB0aGUgc2NvcGVcbiAqIHRoZSByZXR1cm4gdmFsdWUgd291bGQgYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgJ1tPYmplY3QgJyxcbiAqIGNsYXNzIGFuZCAnXScsIGBjbGFzc2AgaXMgdGhlIHJldHVybmluZyB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKlxuICogZS5nLiAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXSkgPT0gW29iamVjdCBBcnJheV0sXG4gKiAgICAgICAgdGhlIHJldHVybmluZyB2YWx1ZSBpcyB0aGUgc3RyaW5nIEFycmF5XG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG51dGlscy5pbnRlcm5hbENsYXNzUHJvcGVydHkgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZSh2KTtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiAhIXYgJiYgdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYSBjb25zdHJ1Y3RvcixcbiAqIE5PVEU6IGZvciB0aGUgc2FrZSBvZiB0aGlzIGxpYnJhcnkgYSBjb25zdHJ1Y3RvciBpcyBhIGZ1bmN0aW9uXG4gKiB0aGF0IGhhcyBhIG5hbWUgd2hpY2ggc3RhcnRzIHdpdGggYW4gdXBwZXJjYXNlIGxldHRlciBhbmQgYWxzb1xuICogdGhhdCB0aGUgcHJvdG90eXBlJ3MgY29uc3RydWN0b3IgaXMgaXRzZWxmXG4gKiBAcGFyYW0geyp9IHZcbiAqL1xudXRpbHMuaXNDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB0aGlzLmlzRnVuY3Rpb24odikgJiYgdHlwZW9mIHYubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgIHYubmFtZS5sZW5ndGggJiYgdi5wcm90b3R5cGUgJiYgdi5wcm90b3R5cGUuY29uc3RydWN0b3IgPT09IHY7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGFuIG9iamVjdCwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIE5PVEU6IGEgZnVuY3Rpb24gd2lsbCBub3QgcGFzcyB0aGlzIHRlc3RcbiAqIGkuZS5cbiAqICAgICAgICB1dGlscy5pc09iamVjdChmdW5jdGlvbigpIHt9KSBpcyBmYWxzZSFcbiAqXG4gKiBTcGVjaWFsIHZhbHVlcyB3aG9zZSBgdHlwZW9mYCByZXN1bHRzIGluIGFuIG9iamVjdDpcbiAqIC0gbnVsbFxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3QgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnb2JqZWN0Jztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbiAobm90ZSB0aGF0IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnkgQXJyYXlzIGFyZSBub3Qgb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc09iamVjdE9yRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3QodikgfHwgdXRpbHMuaXNGdW5jdGlvbih2KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyB0cmF2ZXJzYWJsZSwgZm9yIHRoZSBzYWtlIG9mIHRoZSBsaWJyYXJ5IGFuXG4gKiBvYmplY3QgKHdoaWNoIGlzIG5vdCBhbiBhcnJheSkgb3IgYSBmdW5jdGlvbiBpcyB0cmF2ZXJzYWJsZSwgc2luY2UgdGhpcyBmdW5jdGlvblxuICogaXMgdXNlZCBieSB0aGUgb2JqZWN0IGFuYWx5emVyIG92ZXJyaWRpbmcgaXQgd2lsbCBkZXRlcm1pbmUgd2hpY2ggb2JqZWN0c1xuICogYXJlIHRyYXZlcnNhYmxlXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNUcmF2ZXJzYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzcGVjaWFsIGZ1bmN0aW9uIHdoaWNoIGlzIGFibGUgdG8gZXhlY3V0ZSBhIHNlcmllcyBvZiBmdW5jdGlvbnMgdGhyb3VnaFxuICogY2hhaW5pbmcsIHRvIHJ1biBhbGwgdGhlIGZ1bmN0aW9ucyBzdG9yZWQgaW4gdGhlIGNoYWluIGV4ZWN1dGUgdGhlIHJlc3VsdGluZyB2YWx1ZVxuICpcbiAqIC0gZWFjaCBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggdGhlIG9yaWdpbmFsIGFyZ3VtZW50cyB3aGljaCBgZnVuY3Rpb25DaGFpbmAgd2FzXG4gKiBpbnZva2VkIHdpdGggKyB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIHRoZSBsYXN0IG9wZXJhdGlvbiBhcyB0aGUgbGFzdCBhcmd1bWVudFxuICogLSB0aGUgc2NvcGUgb2YgZWFjaCBmdW5jdGlvbiBpcyB0aGUgc2FtZSBzY29wZSBhcyB0aGUgb25lIHRoYXQgdGhlIHJlc3VsdGluZ1xuICogZnVuY3Rpb24gd2lsbCBoYXZlXG4gKlxuICogICAgdmFyIGZucyA9IHV0aWxzLmZ1bmN0aW9uQ2hhaW4oKVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ2ZpcnN0JztcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAqICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiAnc2Vjb25kO1xuICogICAgICAgICAgICAgICAgfSlcbiAqICAgIGZucygxLCAyKTsgIC8vIHJldHVybnMgJ3NlY29uZCdcbiAqICAgIC8vIGxvZ3MgMSwgMlxuICogICAgLy8gbG9ncyAxLCAyLCAnZmlyc3QnXG4gKlxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG51dGlscy5mdW5jdGlvbkNoYWluID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhY2sgPSBbXTtcbiAgdmFyIGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhbHVlID0gc3RhY2tbaV0uYXBwbHkodGhpcywgYXJncy5jb25jYXQodmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBpbm5lci5jaGFpbiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgc3RhY2sucHVzaCh2KTtcbiAgICByZXR1cm4gaW5uZXI7XG4gIH07XG4gIHJldHVybiBpbm5lcjtcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBzdHIgbWFkZSBvZiBhbnkgY2hhcmFjdGVycyB0aGlzIG1ldGhvZCByZXR1cm5zIGEgc3RyaW5nXG4gKiByZXByZXNlbnRhdGlvbiBvZiBhIHNpZ25lZCBpbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqL1xudXRpbHMuaGFzaENvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBpLCBsZW5ndGgsIGNoYXIsIGhhc2ggPSAwO1xuICBmb3IgKGkgPSAwLCBsZW5ndGggPSBzdHIubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjaGFyID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hhcjtcbiAgICBoYXNoID0gaGFzaCAmIGhhc2g7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyhoYXNoKTtcbn07XG5cbnV0aWxzLmNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgIGRldGFpbDogZGV0YWlsc1xuICB9KTtcbn07XG51dGlscy5ub3RpZmljYXRpb24gPSBmdW5jdGlvbiAobWVzc2FnZSwgY29uc29sZVRvbykge1xuICB2YXIgZXYgPSB1dGlscy5jcmVhdGVFdmVudCgncG9qb3Zpei1ub3RpZmljYXRpb24nLCBtZXNzYWdlKTtcbiAgY29uc29sZVRvbyAmJiBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG59O1xudXRpbHMuY3JlYXRlSnNvbnBDYWxsYmFjayA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQuc3JjID0gdXJsO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59O1xudXRpbHMudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHMgPSAnJyxcbiAgICBpID0gMDtcbiAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgIGlmIChpKSB7XG4gICAgICBzICs9ICcmJztcbiAgICB9XG4gICAgcyArPSBrICsgJz0nICsgdjtcbiAgICBpICs9IDE7XG4gIH0pO1xuICByZXR1cm4gcztcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogR2l2ZW4gYSBwcm9wZXJ0eSBuYW1lIHRoaXMgbWV0aG9kIGlkZW50aWZpZXMgaWYgaXQncyBhIHZhbGlkIHByb3BlcnR5IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnksIGEgdmFsaWQgcHJvcGVydHkgaXMgYSBwcm9wZXJ0eSB3aGljaCBkb2VzIG5vdCBwcm92b2tlIGFuIGVycm9yXG4gKiB3aGVuIHRyeWluZyB0byBhY2Nlc3MgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gaXQgZnJvbSBhbnkgb2JqZWN0XG4gKlxuICogRm9yIGV4YW1wbGUgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgY29kZSBpbiBzdHJpY3QgbW9kZSB3aWxsIHlpZWxkIGFuIGVycm9yOlxuICpcbiAqICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkge307XG4gKiAgICBmbi5hcmd1bWVudHNcbiAqXG4gKiBTaW5jZSBhcmd1bWVudHMgaXMgcHJvaGliaXRlZCBpbiBzdHJpY3QgbW9kZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvU3RyaWN0X21vZGVcbiAqXG4gKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICovXG51dGlscy5vYmplY3RQcm9wZXJ0eUlzRm9yYmlkZGVuID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgdmFyIGtleTtcbiAgdmFyIHJ1bGVzID0gdXRpbHMucHJvcGVydHlGb3JiaWRkZW5SdWxlcztcbiAgZm9yIChrZXkgaW4gcnVsZXMpIHtcbiAgICBpZiAocnVsZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgaWYgKHJ1bGVzW2tleV0ob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogTW9kaWZ5IHRoaXMgb2JqZWN0IHRvIGFkZC9yZW1vdmUgcnVsZXMgdGhhdCB3aWwgYmUgcnVuIGJ5XG4gKiAjb2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbiwgdG8gZGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgaXMgaW52YWxpZFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnV0aWxzLnByb3BlcnR5Rm9yYmlkZGVuUnVsZXMgPSB7XG4gIC8qKlxuICAgKiBgY2FsbGVyYCBhbmQgYGFyZ3VtZW50c2AgYXJlIGludmFsaWQgcHJvcGVydGllcyBvZiBhIGZ1bmN0aW9uIGluIHN0cmljdCBtb2RlXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIHN0cmljdE1vZGU6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24ob2JqZWN0KSkge1xuICAgICAgcmV0dXJuIHByb3BlcnR5ID09PSAnY2FsbGVyJyB8fCBwcm9wZXJ0eSA9PT0gJ2FyZ3VtZW50cyc7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogUHJvcGVydGllcyB0aGF0IHN0YXJ0IGFuZCBlbmQgd2l0aCBfXyBhcmUgc3BlY2lhbCBwcm9wZXJ0aWVzLFxuICAgKiBpbiBzb21lIGNhc2VzIHRoZXkgYXJlIHZhbGlkIChsaWtlIF9fcHJvdG9fXykgb3IgZGVwcmVjYXRlZFxuICAgKiBsaWtlIF9fZGVmaW5lR2V0dGVyX19cbiAgICpcbiAgICogZS5nLlxuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fcHJvdG9fX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19sb29rdXBHZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fbG9va3VwU2V0dGVyX19cbiAgICpcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaGlkZGVuUHJvcGVydHk6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvXl9fLio/X18kLykgPiAtMTtcbiAgfSxcblxuICAvKipcbiAgICogQW5ndWxhciBoaWRkZW4gcHJvcGVydGllcyBzdGFydCBhbmQgZW5kIHdpdGggJCQsIGZvciB0aGUgc2FrZVxuICAgKiBvZiB0aGUgbGlicmFyeSB0aGVzZSBhcmUgaW52YWxpZCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGFuZ3VsYXJIaWRkZW5Qcm9wZXJ0eTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9eXFwkXFwkLio/XFwkXFwkJC8pID4gLTE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoZSBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0aGUgZm9sbG93aW5nIHN5bWJvbHMgYXJlIGZvcmJpZGRlbjpcbiAgICogWzorfiE+PD0vL1xcW1xcXUBcXC4gXVxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICAvL3N5bWJvbHM6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gIC8vICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9bOit+IT48PS8vXFxdQFxcLiBdLykgPiAtMTtcbiAgLy99XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzIxLzE1LlxuICovXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuL2hhc2hLZXknKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vJyk7XG52YXIgbWUsIGxhYmVsZXI7XG52YXIgZG9JbnNlcnQsIGRvR2V0O1xuXG4vLyBsYWJlbHMgcGVyIGVhY2ggb2JqZWN0IHdpbGwgYmUgc2F2ZWQgaW5zaWRlIHRoaXMgb2JqZWN0XG52YXIgbGFiZWxDYWNoZSA9IHt9O1xuXG52YXIgcHJvdG8gPSB7XG4gIGZpcnN0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzWzBdO1xuICB9LFxuICBzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmxlbmd0aDtcbiAgfSxcbiAgZ2V0VmFsdWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3BlcnR5XVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWddXG4gKlxuICogIC0gY29uZmlnLmxhYmVsT3ZlcnJpZGUgT3ZlcnJpZGVzIHRoZSBwcm9wZXJ0eSBsYWJlbCB3aXRoIHRoaXMgdmFsdWVcbiAqICAtIGNvbmZpZy5oaWdoUHJpb3JpdHkge2Jvb2xlYW59IGlmIHNldCB0byB0cnVlIHRoZW4gdGhlIGxhYmVsIHdpbGwgYmVcbiAqICBwcmVwZW5kZWQgaW5zdGVhZCBvZiBiZWluZyBhcHBlbmRcbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cbm1lID0gbGFiZWxlciA9IGZ1bmN0aW9uIChmcm9tLCBwcm9wZXJ0eSwgY29uZmlnKSB7XG4gIGFzc2VydCh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24oZnJvbSksICdmcm9tIG5lZWRzIHRvIGJlIGFuIG9iamVjdCBvciBhIGZ1bmN0aW9uJyk7XG4gIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgdmFyIG9iajtcbiAgdmFyIGxhYmVsO1xuXG4gIGZ1bmN0aW9uIGF0dGVtcFRvSW5zZXJ0KG9iaiwgZnJvbSwgbGFiZWwpIHtcbiAgICBpZiAodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaikpIHtcbiAgICAgIHZhciBvYmpIYXNoID0gaGFzaEtleShvYmopO1xuICAgICAgdmFyIGZyb21IYXNoID0gZnJvbSA/IGhhc2hLZXkoZnJvbSkgOiBudWxsO1xuICAgICAgdmFyIGxhYmVsQ2ZnID0ge1xuICAgICAgICBmcm9tOiBmcm9tSGFzaCxcbiAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICB9O1xuICAgICAgaWYgKCFfLmZpbmQobGFiZWxDYWNoZVtvYmpIYXNoXSB8fCBbXSwgbGFiZWxDZmcpKSB7XG4gICAgICAgIGRvSW5zZXJ0KG9iaiwgbGFiZWxDZmcsIGNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBpZiAocHJvcGVydHkpIHtcbiAgICBvYmogPSBmcm9tW3Byb3BlcnR5XTtcbiAgICBsYWJlbCA9IHByb3BlcnR5O1xuICAgIC8vIGlmIHRoZSBwcm9wZXJ0eSBpcyBgcHJvdG90eXBlYCBhcHBlbmQgdGhlIG5hbWUgb2YgdGhlIGNvbnN0cnVjdG9yXG4gICAgLy8gdGhpcyBtZWFucyB0aGF0IGl0IGhhcyBhIGhpZ2hlciBwcmlvcml0eSBzbyB0aGUgaXRlbSBzaG91bGQgYmUgcHJlcGVuZGVkXG4gICAgaWYgKHByb3BlcnR5ID09PSAncHJvdG90eXBlJyAmJiB1dGlscy5pc0NvbnN0cnVjdG9yKGZyb20pKSB7XG4gICAgICBjb25maWcuaGlnaFByaW9yaXR5ID0gdHJ1ZTtcbiAgICAgIGxhYmVsID0gZnJvbS5uYW1lICsgJy4nICsgcHJvcGVydHk7XG4gICAgfVxuICAgIGF0dGVtcFRvSW5zZXJ0KG9iaiwgZnJvbSwgbGFiZWwpO1xuICB9IGVsc2Uge1xuICAgIC8vIHRoZSBkZWZhdWx0IGxhYmVsIGZvciBhbiBpdGVyYWJsZSBpcyB0aGUgaGFzaGtleVxuICAgIGF0dGVtcFRvSW5zZXJ0KGZyb20sIG51bGwsIGhhc2hLZXkoZnJvbSkpO1xuXG4gICAgLy8gaWYgaXQncyBjYWxsZWQgd2l0aCB0aGUgc2Vjb25kIGFyZyA9PT0gdW5kZWZpbmVkIHRoZW4gb25seVxuICAgIC8vIHNldCBhIGxhYmVsIGlmIGl0J3MgYSBjb25zdHJ1Y3RvclxuICAgIGlmICh1dGlscy5pc0NvbnN0cnVjdG9yKGZyb20pKSB7XG4gICAgICBjb25maWcuaGlnaFByaW9yaXR5ID0gdHJ1ZTtcbiAgICAgIGF0dGVtcFRvSW5zZXJ0KGZyb20sIG51bGwsIGZyb20ubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRvR2V0KGZyb20sIHByb3BlcnR5KTtcbn07XG5cbm1lLmhpZGRlbkxhYmVsID0gJ19fcG9qb3ZpekxhYmVsX18nO1xuXG4vKipcbiAqIFRoZSBvYmplY3QgaGFzIGEgaGlkZGVuIGtleSBpZiBpdCBleGlzdHMgYW5kIGlzXG4gKiBhbiBhcnJheVxuICogQHBhcmFtIHZcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5tZS5oYXMgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZW9mIGxhYmVsQ2FjaGVbaGFzaEtleSh2KV0gIT09ICd1bmRlZmluZWQnO1xufTtcblxuZG9HZXQgPSBmdW5jdGlvbiAoZnJvbSwgcHJvcGVydHkpIHtcbiAgdmFyIG9iaiA9IHByb3BlcnR5ID8gZnJvbVtwcm9wZXJ0eV0gOiBmcm9tO1xuICB2YXIgciA9IE9iamVjdC5jcmVhdGUocHJvdG8pO1xuICByLnZhbHVlcyA9ICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqKSAmJiBsYWJlbENhY2hlW2hhc2hLZXkob2JqKV0pIHx8IFtdO1xuICByZXR1cm4gcjtcbn07XG4nbGVuZ3RoJywgJ25hbWUnLCAncHJvdG90eXBlJyxcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogU2V0cyBhIGhpZGRlbiBrZXkgb24gYW4gb2JqZWN0LCB0aGUgaGlkZGVuIGtleSBpcyBhbiBhcnJheSBvZiBvYmplY3RzLFxuICogZWFjaCBvYmplY3QgaGFzIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxuICpcbiAqICB7XG4gKiAgICBmcm9tOiBzdHJpbmcsXG4gKiAgICBsYWJlbDogc3RyaW5nXG4gKiAgfVxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqIFRoZSBvYmplY3Qgd2hvc2UgbGFiZWwgbmVlZCB0byBiZSBzYXZlZFxuICogQHBhcmFtIHtPYmplY3R9IHByb3BlcnRpZXMgVGhlIHByb3BlcnRpZXMgb2YgdGhlIGxhYmVsc1xuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBhZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICovXG5kb0luc2VydCA9IGZ1bmN0aW9uIChvYmosIHByb3BlcnRpZXMsIGNvbmZpZykge1xuICB2YXIgaGtPYmogPSBoYXNoS2V5KG9iaik7XG4gIGxhYmVsQ2FjaGVbaGtPYmpdID0gbGFiZWxDYWNoZVtoa09ial0gfHwgW107XG4gIHZhciBhcnIgPSBsYWJlbENhY2hlW2hrT2JqXTtcbiAgdmFyIGluZGV4ID0gY29uZmlnLmhpZ2hQcmlvcml0eSA/IDAgOiBhcnIubGVuZ3RoO1xuXG4gIC8vIGxhYmVsIG92ZXJyaWRlXG4gIGlmIChjb25maWcubGFiZWxPdmVycmlkZSkge1xuICAgIHByb3BlcnRpZXMubGFiZWwgPSBjb25maWcubGFiZWxPdmVycmlkZTtcbiAgfVxuXG4gIC8vIGluc2VydGlvbiBlaXRoZXIgYXQgc3RhcnQgb3IgZW5kXG4gIGFyci5zcGxpY2UoaW5kZXgsIDAsIHByb3BlcnRpZXMpO1xufTtcblxuLy9tZS5sYWJlbENhY2hlID0gbGFiZWxDYWNoZTtcbm1vZHVsZS5leHBvcnRzID0gbWU7Il19
