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
  object: new PObject(),
  builtIn: new BuiltIn(),
  global: new Global(),
  //popular
  angular: new Angular(),
  //mine
  t3: new Inspector({ entryPoint: 't3' }),
  //huge
  three: new Inspector({
    entryPoint: 'THREE',
    alwaysDirty: true
  })
});

Inspector.instances = libraries;

module.exports = libraries;

},{"./analyzer/Angular":9,"./analyzer/BuiltIn":10,"./analyzer/Global":11,"./analyzer/Inspector":12,"./analyzer/Object":13,"lodash":undefined}],8:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var assert = require('assert');

var HashMap = require('./util/HashMap');
var hashKey = require('./util/hashKey');
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
  this.__objectsCache = {};

  /**
   * @private
   * Internal links cache, each value is an array of objects
   * generated in #getOwnLinks
   * @type {Object}
   */
  this.__linksCache = {};
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
   * - parent         {*} an predecessor of value (an object which can reach value)
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
      parent: parent,
      property: property,
      value: value,
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
        parent: obj,
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
      if (!traversableOnly && this.__objectsCache[hk]) {
        return this.__objectsCache[hk];
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

    // special properties
    // __proto__
    var proto = Object.getPrototypeOf(obj);
    if (proto) {
      nodeProperties = me.buildNodeProperties(proto, obj, '[[Prototype]]');
      nodeProperties.hidden = true;
      allProperties.push(nodeProperties);
    }

    // constructor (if it's a function)
    //var isConstructor = obj.hasOwnProperty &&
    //  obj.hasOwnProperty('constructor') &&
    //  typeof obj.constructor === 'function';
    //if (isConstructor &&
    //    _.findIndex(allProperties, { property: 'constructor' }) === -1) {
    //  nodeProperties = me.buildNodeProperties();
    //
    //  allProperties.push({
    //    // cls: hashKey(obj),
    //    name: 'constructor',
    //    type: 'function',
    //    linkeable: true
    //  });
    //}

    if (this.cache && !traversableOnly) {
      this.__objectsCache[hk] = allProperties;
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

    if (me.cache && me.__linksCache[name]) {
      return me.__linksCache[name];
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

    _.forEach(properties, function (desc) {
      var ref = obj[desc.property];
      // because of the levels a reference might not exist
      if (!ref) {
        return;
      }

      // if the object doesn't have a hashKey
      // let's give it a name equal to the property being analyzed
      getAugmentedHash(ref, desc.property);

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
      this.__linksCache[name] = links;
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
   * Alias for #getProperties
   * @param  obj
   * @param  plain True to return only primitive properties
   * @return {Array}
   */
  stringifyObjectProperties: function (obj, plain) {
    var properties = this.getProperties(obj);

    if (plain) {
    // delete non primitive properties
      properties.forEach(function (property) {
        _.forOwn(property, function (value, key) {
          if (value && (typeof value === 'object' || typeof value === 'function')) {
            delete property[key];
          }
        });
      });
    }
    return properties;
  },

  /**
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
   * @param {boolean} plain True to return a plain output (without links to objects/functions)
   * @return {Object}
   */
  stringify: function (plain) {
    var me = this,
      nodes = {},
      edges = {};
    me.debug && console.time('stringify');
    _.forOwn(me.items, function (v) {
      var hk = hashKey(v);
      nodes[hk] = me.stringifyObjectProperties(v, plain);
      edges[hk] = me.stringifyObjectLinks(v);
    });
    me.debug && console.timeEnd('stringify');
    return {
      nodes: nodes,
      edges: edges
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
    this.__linksCache = {};
    this.__objectsCache = {};
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

},{"./util":21,"./util/HashMap":19,"./util/hashKey":20,"assert":2,"lodash":undefined}],9:[function(require,module,exports){
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
      hashKey.createHashKeysFor(obj, s.name);
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
  hashKey.createHashKeysFor(global.angular, 'angular');

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
   * @type {Array}
   */
  this.forbiddenTokens = (config.forbiddenTokens || '').split('|').concat(
    (config.additionalForbiddenTokens || '').split('|')
  );

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
Inspector.DEFAULT_FORBIDDEN_TOKENS_ARRAY = ['pojoviz:global', 'pojoviz:builtIn', 'global:document'];

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
  debug: false,
  forbiddenTokens: Inspector.DEFAULT_FORBIDDEN_TOKENS,
  additionalForbiddenTokens: '',
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
      if (me.alwaysDirty || me.dirty) {
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

  // set a predefined global name (so that it's known as entryPoint)
  hashKey.createHashKeysFor(start, me.entryPoint);

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
 * Cleans the items stored in the analyzer
 */
Inspector.prototype.beforeInspectSelf = function () {
  // clean the analyzer
  this.analyzer.items.empty();
  //this.analyzer.forbidden.empty();
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
  var forbidden = [].concat(this.forbiddenTokens);
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
  entryPoint: 'window'
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
  alwaysDirty: true
}, {
  displayName: 't3'
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
/**
 * Gets a store hashkey only if it's an object
 * @param  {[type]} obj
 * @return {[type]}
 */
function get(obj) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  return Object.prototype.hasOwnProperty.call(obj, me.hiddenKey) &&
    obj[me.hiddenKey];
}

/**
 * TODO: document
 * Sets a key on an object
 * @param {[type]} obj [description]
 * @param {[type]} key [description]
 */
function set(obj, key) {
  assert(utils.isObjectOrFunction(obj), 'obj must be an object|function');
  assert(
    key && typeof key === 'string',
    'The key needs to be a valid string'
  );
  var value;
  if (!get(obj)) {
    value = typeof obj + '-' + key;
    Object.defineProperty(obj, me.hiddenKey, {
      value: value
    });
    if (!obj[me.hiddenKey]) {
      console.warn('Object.defineProperty did not work! setting the value on the object directly');
      obj[me.hiddenKey] = value;
    }
    assert(obj[me.hiddenKey], 'Object.defineProperty did not work!');
  }
  return me;
}

me = hashKey = function (v) {
  var uid = v;
  if (utils.isObjectOrFunction(v)) {
    if (!get(v)) {
      me.createHashKeysFor(v);
    }
    uid = get(v);
    if (!uid) {
      throw Error(v + ' should have a hashKey at this point :(');
    }
    assert(uid, 'error getting the key');
    return uid;
  }

  // v is a primitive
  return typeof v + '-' + uid;
};

me.hiddenKey = '__pojovizKey__';

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
  symbols: function (object, property) {
    return property.search(/[:+~!><=//\]@\. ]/) > -1;
  }
};

module.exports = utils;
},{"lodash":undefined}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9JbnNwZWN0ZWRJbnN0YW5jZXMuanMiLCJzcmMvT2JqZWN0QW5hbHl6ZXIuanMiLCJzcmMvYW5hbHl6ZXIvQW5ndWxhci5qcyIsInNyYy9hbmFseXplci9CdWlsdEluLmpzIiwic3JjL2FuYWx5emVyL0dsb2JhbC5qcyIsInNyYy9hbmFseXplci9JbnNwZWN0b3IuanMiLCJzcmMvYW5hbHl6ZXIvT2JqZWN0LmpzIiwic3JjL3NjaGVtYXMvaHVnZVNjaGVtYXMuanMiLCJzcmMvc2NoZW1hcy9pbmRleC5qcyIsInNyYy9zY2hlbWFzL2tub3duU2NoZW1hcy5qcyIsInNyYy9zY2hlbWFzL215TGlicmFyaWVzLmpzIiwic3JjL3NjaGVtYXMvbm90YWJsZUxpYnJhcmllcy5qcyIsInNyYy91dGlsL0hhc2hNYXAuanMiLCJzcmMvdXRpbC9oYXNoS2V5LmpzIiwic3JjL3V0aWwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3B0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWwvJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5cbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL2FuYWx5emVyL0luc3BlY3RvcicpO1xudmFyIEluc3BlY3RlZEluc3RhbmNlcyA9IHJlcXVpcmUoJy4vSW5zcGVjdGVkSW5zdGFuY2VzJyk7XG5cbi8vIGVuYWJsZSBwcm9taXNlIGNoYWluIGRlYnVnXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgaW5zcGVjdG9yLCBvbGRJbnNwZWN0b3I7XG52YXIgcG9qb3ZpejtcblxuLy8gcHVibGljIGFwaVxucG9qb3ZpeiA9IHtcbiAgLyoqXG4gICAqIENsZWFycyB0aGUgaW5zcGVjdG9yIHZhcmlhYmxlXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHVuc2V0SW5zcGVjdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgb2xkSW5zcGVjdG9yID0gaW5zcGVjdG9yO1xuICAgIGluc3BlY3RvciA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGluc3BlY3RvciAoc2V0IHRocm91Z2ggI3NldEN1cnJlbnRJbnNwZWN0b3IpXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0Q3VycmVudEluc3BlY3RvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBpbnNwZWN0b3I7XG4gIH0sXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIG9mIGFcbiAgICogcG9zc2libGUgbmV3IGluc3RhbmNlIG9mIEluc3BlY3RvciwgdGhpcyBtZXRob2QgY2hlY2tzIGlmIHRoZXJlJ3NcbiAgICogYWxyZWFkeSBhbiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGRpc3BsYXlOYW1lL2VudHJ5UG9pbnQgdG8gYXZvaWRcbiAgICogY3JlYXRpbmcgbW9yZSBJbnN0YW5jZXMgb2YgdGhlIHNhbWUgdHlwZSwgY2FsbHMgdGhlIGhvb2tcbiAgICogYG1vZGlmeUluc3RhbmNlYCBhZnRlciB0aGUgaW5zcGVjdG9yIGlzIHJldHJpZXZlZC9jcmVhdGVkXG4gICAqXG4gICAqIEBwYXJhbSB7Y29uZmlnfSBvcHRpb25zIE9wdGlvbnMgcGFzc2VkIHRvIGFuIEluc3BlY3RvciBpbnN0YW5jZVxuICAgKiBpZiB0aGUgZW50cnlQb2ludC9kaXNwbGF5TmFtZSB3YXNuJ3QgY3JlYXRlZCB5ZXQgaW5cbiAgICogSW5zcGVjdG9ySW5zdGFuY2VzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcnVuOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGFzc2VydChvcHRpb25zKTtcbiAgICB2YXIgZW50cnlQb2ludCA9IG9wdGlvbnMuZGlzcGxheU5hbWUgfHwgb3B0aW9ucy5lbnRyeVBvaW50O1xuICAgIGFzc2VydChlbnRyeVBvaW50KTtcbiAgICBvbGRJbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG4gICAgaW5zcGVjdG9yID0gSW5zcGVjdGVkSW5zdGFuY2VzW2VudHJ5UG9pbnRdO1xuXG4gICAgaWYgKCFpbnNwZWN0b3IpIHtcbiAgICAgIGluc3BlY3RvciA9IEluc3BlY3RlZEluc3RhbmNlcy5jcmVhdGUob3B0aW9ucyk7XG4gICAgfVxuICAgIGluc3BlY3Rvci5tb2RpZnlJbnN0YW5jZShvcHRpb25zKTtcbiAgICByZXR1cm4gaW5zcGVjdG9yLmluaXQoKTtcbiAgfSxcblxuICAvLyBleHBvc2UgaW5uZXIgbW9kdWxlc1xuICBPYmplY3RBbmFseXplcjogcmVxdWlyZSgnLi9PYmplY3RBbmFseXplcicpLFxuICBJbnNwZWN0ZWRJbnN0YW5jZXM6IEluc3BlY3RlZEluc3RhbmNlcyxcbiAgYW5hbHl6ZXI6IHtcbiAgICBJbnNwZWN0b3I6IEluc3BlY3RvclxuICB9LFxuICBJbnNwZWN0b3I6IEluc3BlY3RvcixcbiAgdXRpbHM6IHJlcXVpcmUoJy4vdXRpbCcpLFxuXG4gIC8vIGtub3duIGNvbmZpZ3VyYXRpb25zXG4gIHNjaGVtYXM6IHJlcXVpcmUoJy4vc2NoZW1hcycpXG59O1xuXG4vLyBhbGlhc1xucG9qb3Zpei5zZXRDdXJyZW50SW5zcGVjdG9yID0gcG9qb3Zpei5ydW47XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3ZpejsiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IHRydWU7XG4gICAgdmFyIGN1cnJlbnRRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xufVxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICBxdWV1ZS5wdXNoKGZ1bik7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL2FuYWx5emVyL0luc3BlY3RvcicpO1xudmFyIFBPYmplY3QgPSByZXF1aXJlKCcuL2FuYWx5emVyL09iamVjdCcpO1xudmFyIEJ1aWx0SW4gPSByZXF1aXJlKCcuL2FuYWx5emVyL0J1aWx0SW4nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuL2FuYWx5emVyL0dsb2JhbCcpO1xudmFyIEFuZ3VsYXIgPSByZXF1aXJlKCcuL2FuYWx5emVyL0FuZ3VsYXInKTtcbnZhciBsaWJyYXJpZXM7XG5cbnZhciBwcm90byA9IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSW5zcGVjdG9yIHdpdGggYGNvbmZpZ2AgYXMgaXRzIGNvbmZpZ3VyYXRpb25cbiAgICogc2F2ZWQgaW4gYHRoaXNgIGFzIGBlbnRyeVBvaW50YFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjcmVhdGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIGRpc3BsYXlOYW1lID0gb3B0aW9ucy5kaXNwbGF5TmFtZSB8fCBvcHRpb25zLmVudHJ5UG9pbnQ7XG4gICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIGEgZ2VuZXJpYyBjb250YWluZXIgZm9yOiAnICsgZGlzcGxheU5hbWUsIG9wdGlvbnMpO1xuICAgIHJldHVybiAobGlicmFyaWVzW2Rpc3BsYXlOYW1lXSA9IG5ldyBJbnNwZWN0b3Iob3B0aW9ucykpO1xuICB9LFxuICAvKipcbiAgICogRXhlY3V0ZSBgZm5gIHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIHNhdmVkIGluIGB0aGlzYFxuICAgKiBAcGFyYW0gZm5cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgYWxsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICBfLmZvck93bihsaWJyYXJpZXMsIGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIE1hcmtzIGFsbCB0aGUgcHJvcGVydGllcyBzYXZlZCBpbiBgdGhpc2AgYXMgZGlydHlcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0RGlydHk6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFsbChmdW5jdGlvbiAodikge1xuICAgICAgdi5zZXREaXJ0eSgpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuXG5saWJyYXJpZXMgPSBPYmplY3QuY3JlYXRlKHByb3RvKTtcbi8vY29uc29sZS5sb2cobGlicmFyaWVzKTtcbl8ubWVyZ2UobGlicmFyaWVzLCB7XG4gIG9iamVjdDogbmV3IFBPYmplY3QoKSxcbiAgYnVpbHRJbjogbmV3IEJ1aWx0SW4oKSxcbiAgZ2xvYmFsOiBuZXcgR2xvYmFsKCksXG4gIC8vcG9wdWxhclxuICBhbmd1bGFyOiBuZXcgQW5ndWxhcigpLFxuICAvL21pbmVcbiAgdDM6IG5ldyBJbnNwZWN0b3IoeyBlbnRyeVBvaW50OiAndDMnIH0pLFxuICAvL2h1Z2VcbiAgdGhyZWU6IG5ldyBJbnNwZWN0b3Ioe1xuICAgIGVudHJ5UG9pbnQ6ICdUSFJFRScsXG4gICAgYWx3YXlzRGlydHk6IHRydWVcbiAgfSlcbn0pO1xuXG5JbnNwZWN0b3IuaW5zdGFuY2VzID0gbGlicmFyaWVzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpYnJhcmllcztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcblxudmFyIEhhc2hNYXAgPSByZXF1aXJlKCcuL3V0aWwvSGFzaE1hcCcpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuL3V0aWwvaGFzaEtleScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogR2l2ZW4gYW4gb2JqZWN0IGBvYmpgLCB0aGlzIGZ1bmN0aW9uIGV4ZWN1dGVzIGBmbmAgb25seSBpZiBgb2JqYCBpc1xuICogYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb24sIGlmIGl0J3MgYSBmdW5jdGlvbiB0aGVuIGBvYmoucHJvdG90eXBlYCBpcyBhbmFseXplZFxuICogaWYgaXQgZXhpc3RzIHRoZW4gaXQgd2lsbCBleGVjdXRlIGBmbmAgYWdhaW5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIG9ubHkgYXJndW1lbnQgd2hpY2ggZm4gaXMgZXhlY3V0ZWQgd2l0aCBpcyBvYmogZm9yIHRoZSBmaXJzdFxuICogY2FsbCBhbmQgb2JqLnByb3RvdHlwZSBmb3IgdGhlIHNlY29uZCBjYWxsIGlmIGl0J3MgcG9zc2libGVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIHdpdGggb2JqL29iai5wcm90b3R5cGUgYWNjb3JkaW5nXG4gKiB0byB0aGUgcnVsZXMgY2l0ZWQgYWJvdmVcbiAqL1xuZnVuY3Rpb24gd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZm4pIHtcbiAgaWYgKHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopKSB7XG4gICAgZm4ob2JqKTtcbiAgICBpZiAodXRpbHMuaXNGdW5jdGlvbihvYmopICYmXG4gICAgICAgIHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmoucHJvdG90eXBlKSkge1xuICAgICAgZm4ob2JqLnByb3RvdHlwZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQ2xhc3MgQW5hbHl6ZXIsIHNhdmVzIG9iamVjdHMgaW4gYW4gaW50ZXJuYWwgSGFzaE1hcCBhZnRlciBkb2luZ1xuICogYSBkZnMgdHJhdmVyc2FsIG9mIGEgc291cmNlIG9iamVjdCB0aHJvdWdoIGl0cyBgYWRkYCBtZXRob2QuXG4gKlxuICogV2hlbmV2ZXIgYSBncmFwaCBuZWVkcyB0byBiZSBhbmFseXplZCBhbiBpbnN0YW5jZSBvZiBBbmFseXplciBpcyBjcmVhdGVkIGFuZFxuICogYSBkZnMgcm91dGluZSBpcyBydW4gc3RhcnRpbmcgKHByZXN1bWFibHkpIGluIHRoZSByb290IG5vZGU6XG4gKlxuICogZS5nLlxuICpcbiAqICAgICAgdmFyIGFuYWx5emVyID0gbmV3IEFuYWx5emVyKCk7XG4gKiAgICAgIGFuYWx5emVyLmFkZChbT2JqZWN0XSk7XG4gKlxuICogVGhlIGludGVybmFsIGhhc2hNYXAgd2lsbCBzYXZlIHRoZSBmb2xsb3dpbmcgdHJhdmVyc2FibGUgdmFsdWVzOlxuICpcbiAqIC0gT2JqZWN0XG4gKiAtIE9iamVjdC5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdClcbiAqIC0gRnVuY3Rpb24gKFJlYWNoYWJsZSBmcm9tIEZ1bmN0aW9uLnByb3RvdHlwZSlcbiAqIC0gRnVuY3Rpb24ucHJvdG90eXBlIChSZWFjaGFibGUgZnJvbSBPYmplY3QgdGhyb3VnaCB0aGUgX19wcm90b19fIGxpbmspXG4gKlxuICogVGhlcmUgYXJlIHNvbWUgdHJvdWJsZXNvbWUgc3RydWN0dXJlcyBkbyB3aGljaCBpbmNsdWRlIGh1Z2Ugb2JqZWN0cyBsaWtlXG4gKiB3aW5kb3cgb3IgZG9jdW1lbnQsIHRvIGF2b2lkIGFuYWx5emluZyB0aGlzIGtpbmQgb2Ygb2JqZWN0cyB0aGUgYW5hbHl6ZXIgY2FuXG4gKiBiZSBpbnN0cnVjdGVkIHRvIGZvcmJpZCB0aGUgYWRkaXRpb24gb2Ygc29tZSBvYmplY3RzOlxuICpcbiAqIGUuZy5cbiAqXG4gKiAgICAgIHZhciBhbmFseXplciA9IG5ldyBBbmFseXplcigpO1xuICogICAgICBhbmFseXplci5mb3JiaWQoW0Z1bmN0aW9uXSlcbiAqICAgICAgYW5hbHl6ZXIuYWRkKFtcbiAqICAgICAgICBPYmplY3RcbiAqICAgICAgXSk7XG4gKlxuICogLSBPYmplY3RcbiAqIC0gT2JqZWN0LnByb3RvdHlwZSAoUmVhY2hhYmxlIGZyb20gT2JqZWN0KVxuICogLSBGdW5jdGlvbi5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdCB0aHJvdWdoIHRoZSBfX3Byb3RvX18gbGluaylcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5pdGVtcyA9IG5ldyBIYXNoTWFwXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcuZm9yYmlkZGVuID0gbmV3IEhhc2hNYXBdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5jYWNoZSA9IHRydWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5sZXZlbHMgPSBBbmFseXplci5ERlNfTEVWRUxTXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcudmlzaXRDb25zdHJ1Y3RvcnMgPSBBbmFseXplci5WSVNJVF9DT05TVFJVQ1RPUlNdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy52aXNpdFNpbXBsZUZ1bmN0aW9ucyA9IEFuYWx5emVyLlZJU0lUX1NJTVBMRV9GVU5DVElPTlNdXG4gKi9cbmZ1bmN0aW9uIEFuYWx5emVyKGNvbmZpZykge1xuICBjb25maWcgPSBfLm1lcmdlKF8uY2xvbmUoQW5hbHl6ZXIuREVGQVVMVF9DT05GSUcsIHRydWUpLCBjb25maWcpO1xuXG4gIC8qKlxuICAgKiBpdGVtcyByZWdpc3RlcmVkIGluIHRoaXMgaW5zdGFuY2VcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLml0ZW1zID0gY29uZmlnLml0ZW1zIHx8IG5ldyBIYXNoTWFwKCk7XG5cbiAgLyoqXG4gICAqIEZvcmJpZGRlbiBvYmplY3RzXG4gICAqIEB0eXBlIHtIYXNoTWFwfVxuICAgKi9cbiAgdGhpcy5mb3JiaWRkZW4gPSBjb25maWcuZm9yYmlkZGVuIHx8IG5ldyBIYXNoTWFwKCk7XG5cbiAgLyoqXG4gICAqIFByaW50IGRlYnVnIGluZm8gaW4gdGhlIGNvbnNvbGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRlYnVnID0gdHJ1ZTtcblxuICAvKipcbiAgICogVHJ1ZSB0byBzYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3RzIGFuYWx5emVkIGluIGFuXG4gICAqIGludGVybmFsIGNhY2hlXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbY2FjaGU9dHJ1ZV1cbiAgICovXG4gIHRoaXMuY2FjaGUgPSBjb25maWcuY2FjaGU7XG5cbiAgLyoqXG4gICAqIERmcyBsZXZlbHNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMubGV2ZWxzID0gY29uZmlnLmxldmVscztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGZ1bmN0aW9uIGNvbnN0cnVjdG9ycyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGhcbiAgICogaS5lLiB0aGUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhIHByb3RvdHlwZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGNmZyB7Ym9vbGVhbn0gW3Zpc2l0Q29uc3RydWN0b3JzPWZhbHNlXVxuICAgKi9cbiAgdGhpcy52aXNpdENvbnN0cnVjdG9ycyA9IGNvbmZpZy52aXNpdENvbnN0cnVjdG9ycztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGFsbCB0aGUgZnVuY3Rpb25zIGluIHRoZSBhbmFseXNpcyBncmFwaCxcbiAgICogc2VlICN0cmF2ZXJzYWJsZU9iamVjdFByb3BlcnRpZXNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBjZmcge2Jvb2xlYW59IFt2aXNpdFNpbXBsZUZ1bmN0aW9ucz1mYWxzZV1cbiAgICovXG4gIHRoaXMudmlzaXRTaW1wbGVGdW5jdGlvbnMgPSBjb25maWcudmlzaXRTaW1wbGVGdW5jdGlvbnM7XG5cbiAgLyoqXG4gICAqIFRydWUgdG8gaW5jbHVkZSBhbGwgdGhlIGZ1bmN0aW9ucyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGgsXG4gICAqIHNlZSAjdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbdmlzaXRTaW1wbGVGdW5jdGlvbnM9ZmFsc2VdXG4gICAqL1xuICB0aGlzLnZpc2l0QXJyYXlzID0gY29uZmlnLnZpc2l0QXJyYXlzO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBJbnRlcm5hbCBwcm9wZXJ0eSBjYWNoZSwgZWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBvYmplY3RzXG4gICAqIGdlbmVyYXRlZCBpbiAjZ2V0UHJvcGVydGllc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5fX29iamVjdHNDYWNoZSA9IHt9O1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBJbnRlcm5hbCBsaW5rcyBjYWNoZSwgZWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBvYmplY3RzXG4gICAqIGdlbmVyYXRlZCBpbiAjZ2V0T3duTGlua3NcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMuX19saW5rc0NhY2hlID0ge307XG59XG5cbi8qKlxuICogVHJ1ZSB0byBhZGQgYW4gYWRkaXRpb25hbCBmbGFnIHRvIHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzIG9mIGEgbm9kZVxuICogaWYgdGhlIG5vZGUgaXMgYSBjb25zdHJ1Y3RvclxuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbkFuYWx5emVyLlZJU0lUX0NPTlNUUlVDVE9SUyA9IHRydWU7XG5cbi8qKlxuICogVHJ1ZSB0byB2aXNpdCBzaW1wbGUgZnVuY3Rpb25zIHdoaWNoIGRvbid0IGhhdmUgYWRkaXRpb25hbCBsaW5rcywgc2VlXG4gKiAjdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OUyA9IGZhbHNlO1xuXG4vKipcbiAqIFRydWUgdG8gdmlzaXQgYXJyYXlzXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuQW5hbHl6ZXIuVklTSVRfQVJSQVlTID0gdHJ1ZTtcblxuLyoqXG4gKiBEZWZhdWx0IG51bWJlciBvZiBsZXZlbHMgdG8gYmUgYW5hbHl6ZWQgYnkgdGhpcyBjb25zdHJ1Y3RvclxuICogQHR5cGUge251bWJlcn1cbiAqL1xuQW5hbHl6ZXIuREZTX0xFVkVMUyA9IDE1O1xuXG4vKipcbiAqIERlZmF1bHQgY29uZmlnIHVzZWQgd2hlbmV2ZXIgYW4gaW5zdGFuY2Ugb2YgQW5hbHl6ZXIgaXMgY3JlYXRlZFxuICogQHR5cGUge09iamVjdH1cbiAqL1xuQW5hbHl6ZXIuREVGQVVMVF9DT05GSUcgPSB7XG4gIGNhY2hlOiB0cnVlLFxuICB2aXNpdENvbnN0cnVjdG9yczogQW5hbHl6ZXIuVklTSVRfQ09OU1RSVUNUT1JTLFxuICB2aXNpdFNpbXBsZUZ1bmN0aW9uczogQW5hbHl6ZXIuVklTSVRfU0lNUExFX0ZVTkNUSU9OUyxcbiAgdmlzaXRBcnJheXM6IEFuYWx5emVyLlZJU0lUX0FSUkFZUyxcbiAgbGV2ZWxzOiBBbmFseXplci5ERlNfTEVWRUxTXG59O1xuXG5BbmFseXplci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBBbmFseXplcixcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFuIG9iamVjdCBpcyBpbiB0aGUgZm9yYmlkZGVuIGhhc2hcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgb2JqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0ZvcmJpZGRlbjogZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiB0aGlzLmZvcmJpZGRlbi5nZXQob2JqKTtcbiAgfSxcblxuICAvKipcbiAgICogTGV0IGB2YWx1ZWAgYmUgdGhlIHJlc3VsdCBvZiBleGVjdXRpbmcgb2JqW3Byb3BlcnR5XSwgdGhpcyBtZXRob2RcbiAgICogcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhIHN1bW1hcnkgb2YgdGhlIHByb3BlcnRpZXMgb2YgYHZhbHVlYCB3aGljaCBhcmVcbiAgICogdXNlZnVsIHRvIGtub3cgZm9yIHRoZSBhbmFseXplcjpcbiAgICpcbiAgICogLSBwYXJlbnQgICAgICAgICB7Kn0gYW4gcHJlZGVjZXNzb3Igb2YgdmFsdWUgKGFuIG9iamVjdCB3aGljaCBjYW4gcmVhY2ggdmFsdWUpXG4gICAqIC0gcHJvcGVydHkgICAgICAge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHVzZWQgdG8gcmVhY2ggdmFsdWUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGkuZS4gcGFyZW50W3Byb3BlcnR5XSA9IHZhbHVlXG4gICAqIC0gdmFsdWUgICAgICAgICAgeyp9IHRoZSB2YWx1ZSBpdHNlbGZcbiAgICogLSB0eXBlICAgICAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgYHR5cGVvZiB2YWx1ZWBcbiAgICogLSBpc1RyYXZlcnNhYmxlICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIHRyYXZlcnNhYmxlXG4gICAqIC0gaXNGdW5jdGlvbiAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uXG4gICAqIC0gaXNPYmplY3QgICAgICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3RcbiAgICogLSB0b1N0cmluZyAgICAgICB7c3RyaW5nfSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcge30udG9TdHJpbmcgd2l0aCBgdmFsdWVgXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSB2YWx1ZVxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gcGFyZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgYnVpbGROb2RlUHJvcGVydGllczogZnVuY3Rpb24gKHZhbHVlLCBwYXJlbnQsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhcmVudDogcGFyZW50LFxuICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgdHlwZTogdHlwZW9mIHZhbHVlLFxuICAgICAgaXNUcmF2ZXJzYWJsZTogdXRpbHMuaXNUcmF2ZXJzYWJsZSh2YWx1ZSksXG4gICAgICBpc0Z1bmN0aW9uOiB1dGlscy5pc0Z1bmN0aW9uKHZhbHVlKSxcbiAgICAgIGlzT2JqZWN0OiB1dGlscy5pc09iamVjdCh2YWx1ZSksXG4gICAgICB0b1N0cmluZzogdXRpbHMuaW50ZXJuYWxDbGFzc1Byb3BlcnR5KHZhbHVlKVxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHByb3BlcnRpZXMgdGhhdCBvYmpbcHJvcGVydHldIGhhcyB3aGljaCBhcmVcbiAgICogdXNlZnVsIGZvciBvdGhlciBtZXRob2RzIGxpa2UgI2dldFByb3BlcnRpZXMsIHRoZSBwcm9wZXJ0aWVzIGFyZVxuICAgKiByZXR1cm5lZCBpbiBhIHNpbXBsZSBvYmplY3QgYW5kIGFyZSB0aGUgb25lcyBkZWNsYXJlZCBpblxuICAgKiAjZ2V0Tm9kZVByb3BlcnRpZXNcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIG1pZ2h0IGJlIHNldCBkZXBlbmRpbmcgb24gd2hhdCBgdmFsdWVgIGlzOlxuICAgKlxuICAgKiAtIHVucmVhY2hhYmxlICAgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgZXhlY3V0aW5nIGB2YWx1ZWBcbiAgICogLSBpc1NpbXBsZUZ1bmN0aW9uICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIHNpbXBsZSBmdW5jdGlvblxuICAgKiAtIGlzQ29uc3RydWN0b3IgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgY29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIG9ialxuICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgcHJvcGVydHkpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciB2YWx1ZTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBvYmpbcHJvcGVydHldO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhcmVudDogb2JqLFxuICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgIHVucmVhY2hhYmxlOiB0cnVlLFxuICAgICAgICBpc1RyYXZlcnNhYmxlOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gc2VsZiwgcGFyZW50LCBwcm9wZXJ0eVxuICAgIHZhciBwcm9wZXJ0aWVzID0gbWUuYnVpbGROb2RlUHJvcGVydGllcyh2YWx1ZSwgb2JqLCBwcm9wZXJ0eSk7XG5cbiAgICAvLyBpZiB0aGUgY3VycmVudCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIGFuZCBpdCdzIG5vdCBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgc2ltcGxlIGZ1bmN0aW9ucyBtYXJrIHRoZSBwcm9wZXJ0eSBhcyBub3QgdHJhdmVyc2FibGVcbiAgICBpZiAocHJvcGVydGllcy5pc0Z1bmN0aW9uICYmICF0aGlzLnZpc2l0U2ltcGxlRnVuY3Rpb25zKSB7XG4gICAgICB2YXIgb3duUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSBvd25Qcm9wZXJ0aWVzLmxlbmd0aDtcbiAgICAgIC8vIHRoZSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIGEgbm9ybWFsIGZ1bmN0aW9uIGhhcyBpcyA1XG4gICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIiwgXCJwcm90b3R5cGVcIl1cblxuICAgICAgLy8gYW4gYWRkaXRpb25hbCBwcm9wZXJ0eSByZXRyaWV2ZWQgaXMgdGhlIGhpZGRlbiBrZXkgdGhhdFxuICAgICAgLy8gdGhlIGhhc2ggZnVuY3Rpb24gbWF5IGhhdmUgYWxyZWFkeSBzZXRcbiAgICAgIGlmIChvd25Qcm9wZXJ0aWVzLmluZGV4T2YoaGFzaEtleS5oaWRkZW5LZXkpID4gLTEpIHtcbiAgICAgICAgLS1sZW5ndGg7XG4gICAgICB9XG4gICAgICAvLyBkaXNjYXJkIHRoZSBwcm90b3R5cGUgbGluayB0byBjb25zaWRlciBhIHByb3BlcnR5IHNpbXBsZVxuICAgICAgaWYgKG93blByb3BlcnRpZXMuaW5kZXhPZigncHJvdG90eXBlJykgPiAtMSkge1xuICAgICAgICAtLWxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChsZW5ndGggPD0gNCkge1xuICAgICAgICAvLyBpdCdzIHNpbXBsZSBpZiBpdCBvbmx5IGhhc1xuICAgICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIl1cbiAgICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gZmFsc2U7XG4gICAgICAgIHByb3BlcnRpZXMuaXNTaW1wbGVGdW5jdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlIGN1cnJlbnQgcHJvcGVydHkgaXMgYSBmdW5jdGlvbiBhbmQgaXQncyBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgZnVuY3Rpb24gY29uc3RydWN0b3JzIHZlcmlmeSBpZiBgdmFsdWVgIGlzIGFcbiAgICAvLyBmdW5jdGlvbiBjb25zdHJ1Y3RvciAoaXQncyBuYW1lIG11c3QgYmUgY2FwaXRhbGl6ZWQgdG8gYmUgb25lKVxuICAgIGlmIChwcm9wZXJ0aWVzLmlzRnVuY3Rpb24gJiYgdGhpcy52aXNpdENvbnN0cnVjdG9ycykge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZS5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgIHZhbHVlLm5hbWUuc2VhcmNoKC9eW0EtWl0vKSA+IC0xKSB7XG4gICAgICAgIHByb3BlcnRpZXMuaXNUcmF2ZXJzYWJsZSA9IHRydWU7XG4gICAgICAgIHByb3BlcnRpZXMuaXNDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdmVyaWZpY2F0aW9uIG9mIHRoZSBmbGFnIHZpc2l0QXJyYXlzIHdoZW4gaXQncyBzZXQgdG8gZmFsc2VcbiAgICBpZiAocHJvcGVydGllcy50b1N0cmluZyA9PT0gJ0FycmF5JyAmJiAhdGhpcy52aXNpdEFycmF5cykge1xuICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBgb2JqYCwgZWFjaCBwcm9wZXJ0eSBpcyByZXR1cm5lZFxuICAgKiBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBzZXQgaW4gI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyxcbiAgICogYWRkaXRpb25hbGx5IHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqIC0gaGlkZGVuICAgICAgIHtib29sZWFufSAodHJ1ZSBpZiBpdCdzIGEgaGlkZGVuIHByb3BlcnR5IGxpa2UgW1tQcm90b3R5cGVdXSlcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gW3RyYXZlcnNhYmxlT25seV0gVHJ1ZSB0byByZXR1cm4gb25seSB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgb2Ygb2JqZWN0cyB3aXRoIHRoZSBwcm9wZXJ0aWVzIGRlc2NyaWJlZCBhYm92ZVxuICAgKi9cbiAgZ2V0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgdHJhdmVyc2FibGVPbmx5KSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB2YXIgaGsgPSBoYXNoS2V5KG9iaik7XG4gICAgdmFyIGFsbFByb3BlcnRpZXM7XG4gICAgdmFyIG5vZGVQcm9wZXJ0aWVzO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHRocm93ICd0aGlzIG1ldGhvZCBuZWVkcyBhbiBvYmplY3QgdG8gYW5hbHl6ZSc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIGlmICghdHJhdmVyc2FibGVPbmx5ICYmIHRoaXMuX19vYmplY3RzQ2FjaGVbaGtdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fb2JqZWN0c0NhY2hlW2hrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyByZXR1cm5zIGFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0aWVzIChlbnVtZXJhYmxlIG9yIG5vdClcbiAgICBhbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKTtcblxuICAgIGFsbFByb3BlcnRpZXMgPSBhbGxQcm9wZXJ0aWVzXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBmaWx0ZXIgb3V0IGZvcmJpZGRlbiBwcm9wZXJ0aWVzXG4gICAgICAgIHJldHVybiAhdXRpbHMub2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbihvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAvLyBvYnRhaW4gZGV0YWlsZWQgaW5mbyBvZiBhbGwgdGhlIHZhbGlkIHByb3BlcnRpZXNcbiAgICAgICAgcmV0dXJuIG1lLnRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyhvYmosIHByb3BlcnR5KTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChwcm9wZXJ0eURlc2NyaXB0aW9uKSB7XG4gICAgICAgIGlmICh0cmF2ZXJzYWJsZU9ubHkpIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgb3V0IG5vbiB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgcmV0dXJuIHByb3BlcnR5RGVzY3JpcHRpb24uaXNUcmF2ZXJzYWJsZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgLy8gc3BlY2lhbCBwcm9wZXJ0aWVzXG4gICAgLy8gX19wcm90b19fXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgaWYgKHByb3RvKSB7XG4gICAgICBub2RlUHJvcGVydGllcyA9IG1lLmJ1aWxkTm9kZVByb3BlcnRpZXMocHJvdG8sIG9iaiwgJ1tbUHJvdG90eXBlXV0nKTtcbiAgICAgIG5vZGVQcm9wZXJ0aWVzLmhpZGRlbiA9IHRydWU7XG4gICAgICBhbGxQcm9wZXJ0aWVzLnB1c2gobm9kZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIC8vIGNvbnN0cnVjdG9yIChpZiBpdCdzIGEgZnVuY3Rpb24pXG4gICAgLy92YXIgaXNDb25zdHJ1Y3RvciA9IG9iai5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgIC8vICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAvLyAgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJztcbiAgICAvL2lmIChpc0NvbnN0cnVjdG9yICYmXG4gICAgLy8gICAgXy5maW5kSW5kZXgoYWxsUHJvcGVydGllcywgeyBwcm9wZXJ0eTogJ2NvbnN0cnVjdG9yJyB9KSA9PT0gLTEpIHtcbiAgICAvLyAgbm9kZVByb3BlcnRpZXMgPSBtZS5idWlsZE5vZGVQcm9wZXJ0aWVzKCk7XG4gICAgLy9cbiAgICAvLyAgYWxsUHJvcGVydGllcy5wdXNoKHtcbiAgICAvLyAgICAvLyBjbHM6IGhhc2hLZXkob2JqKSxcbiAgICAvLyAgICBuYW1lOiAnY29uc3RydWN0b3InLFxuICAgIC8vICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgLy8gICAgbGlua2VhYmxlOiB0cnVlXG4gICAgLy8gIH0pO1xuICAgIC8vfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUgJiYgIXRyYXZlcnNhYmxlT25seSkge1xuICAgICAgdGhpcy5fX29iamVjdHNDYWNoZVtoa10gPSBhbGxQcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBhbGxQcm9wZXJ0aWVzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYWluIERGUyByb3V0aW5lLCBpdCBhbmFseXplcyBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdCB1bnRpbFxuICAgKiB0aGUgcmVjdXJzaW9uIGxldmVsIGhhcyBiZWVuIHJlYWNoZWQgb3IgdGhlcmUgYXJlIG5vIG9iamVjdHNcbiAgICogdG8gYmUgYW5hbHl6ZWRcbiAgICpcbiAgICogLSBmb3IgZWFjaCBvYmplY3QgaW4gYG9iamVjdHNgXG4gICAqICAtIGlmIGl0IHdhc24ndCBhbmFseXplZCB5ZXRcbiAgICogIC0gaWYgaXQncyBub3QgZm9yYmlkZGVuXG4gICAqICAgLSBhZGQgdGhlIGl0ZW0gdG8gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogICAtIGZpbmQgYWxsIHRoZSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzXG4gICAqICAgLSBjYWxsIGBhbmFseXplYCBvYmplY3Qgd2l0aCBlYWNoIHRyYXZlcnNhYmxlIG9iamVjdFxuICAgKiAgICAgdGhhdCBjYW4gYmUgcmVhY2hlZCBmcm9tIHRoZSBjdXJyZW50IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0gIHtBcnJheX0gb2JqZWN0cyAgICAgIEFycmF5IG9mIG9iamVjdHMgdG8gYmUgYW5hbHl6ZWRcbiAgICogQHBhcmFtICB7bnVtYmVyfSBjdXJyZW50TGV2ZWwgQ3VycmVudCBkZnMgbGV2ZWxcbiAgICovXG4gIGFuYWx5emVPYmplY3RzOiBmdW5jdGlvbiAob2JqZWN0cywgY3VycmVudExldmVsKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBpZiAoY3VycmVudExldmVsIDw9IG1lLmxldmVscykge1xuICAgICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICghbWUuaXRlbXMuZ2V0KHYpICYmICAgICAgICAgICAvLyByZWdpc3RlcmVkIGNoZWNrXG4gICAgICAgICAgIW1lLmlzRm9yYmlkZGVuKHYpICAgICAgICAgICAgLy8gZm9yYmlkZGVuIGNoZWNrXG4gICAgICAgICkge1xuXG4gICAgICAgICAgLy8gYWRkIHRoZSBpdGVtIHRvIHRoZSByZWdpc3RlcmVkIGl0ZW1zIHBvb2xcbiAgICAgICAgICBtZS5pdGVtcy5wdXQodik7XG5cbiAgICAgICAgICAvLyBkZnMgdG8gdGhlIG5leHQgbGV2ZWxcbiAgICAgICAgICBtZS5hbmFseXplT2JqZWN0cyhcbiAgICAgICAgICAgIC8vIGdldCBhbGwgdGhlIGxpbmtzIG91dGdvaW5nIGZyb20gYHZgXG4gICAgICAgICAgICBtZS5nZXRPd25MaW5rcyh2KVxuICAgICAgICAgICAgICAvLyB0byBhbmFseXplIHRoZSB0cmVlIG9ubHkgdGhlIGB0b2AgcHJvcGVydHkgaXMgbmVlZGVkXG4gICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluay50bztcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjdXJyZW50TGV2ZWwgKyAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiB0cmF2ZXJzYWJsZSBvYmplY3QgYG9iamAsIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gYXJyYXkgb2YgZGlyZWN0IHRyYXZlcnNhYmxlXG4gICAqIG9iamVjdCB3aGljaCBjYW4gYmUgcmVhY2hlZCBmcm9tIGBvYmpgLCBlYWNoIG9iamVjdCBoYXMgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAtIGZyb20gICAgIHtvYmplY3R9IChgdGhpc2ApXG4gICAqIC0gZnJvbUhhc2gge3N0cmluZ30gKGZyb20ncyBoYXNoKVxuICAgKiAtIHRvICAgICAgIHtvYmplY3R9IChhIHJlYWNoYWJsZSB0cmF2ZXJzYWJsZSBvYmplY3QgZnJvbSBgdGhpc2ApXG4gICAqIC0gdG9IYXNoICAge3N0cmluZ30gKHRvJ3MgaGFzaClcbiAgICogLSBwcm9wZXJ0eSB7c3RyaW5nfSAodGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHdoaWNoIGxpbmtzIGBmcm9tYCB3aXRoIGB0b2AsIGkuZS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eV0gPSB0bylcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBnZXRPd25MaW5rczogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIGxpbmtzID0gW107XG4gICAgdmFyIHByb3BlcnRpZXM7XG4gICAgdmFyIG5hbWUgPSBoYXNoS2V5KG9iaik7XG5cbiAgICAvLyA8ZGVidWc+XG4gICAgLy9jb25zb2xlLmxvZyhuYW1lKTtcbiAgICAvLyA8L2RlYnVnPlxuXG4gICAgaWYgKG1lLmNhY2hlICYmIG1lLl9fbGlua3NDYWNoZVtuYW1lXSkge1xuICAgICAgcmV0dXJuIG1lLl9fbGlua3NDYWNoZVtuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBhcmdzOlxuICAgIC8vIC0gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgd2lsbCBiZSBhbmFseXplZFxuICAgIC8vIC0gdHJhdmVyc2FibGUgcHJvcGVydGllcyBvbmx5XG4gICAgcHJvcGVydGllcyA9IG1lLmdldFByb3BlcnRpZXMob2JqLCB0cnVlKTtcblxuICAgIC8vIGdpdmVuIGFuIGBvYmpgIGxldCdzIGZpbmQgb3V0IGlmIGl0IGhhcyBhIGhhc2ggb3Igbm90XG4gICAgLy8gaWYgaXQgZG9lc24ndCBoYXZlIGEgaGFzaCB0aGVuIHdlIGhhdmUgdG8gYW5hbHl6ZSB0aGUgbmFtZSBvZlxuICAgIC8vIHRoZSBwcm9wZXJ0eSB3aGljaCB3aGVuIGFwcGxpZWQgb24gYW4gZXh0ZXJuYWwgb2JqZWN0cyBnaXZlcyBvYmpcbiAgICAvL1xuICAgIC8vIGl0J3Mgbm90IG5lZWRlZCB0byBzZXQgYSBoYXNoIGZvciBgcHJvdG90eXBlYCBvciBgY29uc3RydWN0b3JgXG4gICAgLy8gc2luY2UgdGhlIGhhc2hLZXkgZnVuY3Rpb24gdGFrZXMgY2FyZSBvZiBhc3NpZ25pbmcgaXRcbiAgICBmdW5jdGlvbiBnZXRBdWdtZW50ZWRIYXNoKG9iaiwgbmFtZSkge1xuICAgICAgaWYgKCFoYXNoS2V5LmhhcyhvYmopICYmXG4gICAgICAgICAgbmFtZSAhPT0gJ3Byb3RvdHlwZScgJiZcbiAgICAgICAgICBuYW1lICE9PSAnY29uc3RydWN0b3InKSB7XG4gICAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNoS2V5KG9iaik7XG4gICAgfVxuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyAndGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIGEgaGFzaGtleSc7XG4gICAgfVxuXG4gICAgXy5mb3JFYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICB2YXIgcmVmID0gb2JqW2Rlc2MucHJvcGVydHldO1xuICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgbGV2ZWxzIGEgcmVmZXJlbmNlIG1pZ2h0IG5vdCBleGlzdFxuICAgICAgaWYgKCFyZWYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb2JqZWN0IGRvZXNuJ3QgaGF2ZSBhIGhhc2hLZXlcbiAgICAgIC8vIGxldCdzIGdpdmUgaXQgYSBuYW1lIGVxdWFsIHRvIHRoZSBwcm9wZXJ0eSBiZWluZyBhbmFseXplZFxuICAgICAgZ2V0QXVnbWVudGVkSGFzaChyZWYsIGRlc2MucHJvcGVydHkpO1xuXG4gICAgICBpZiAoIW1lLmlzRm9yYmlkZGVuKHJlZikpIHtcbiAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgICAgdG86IHJlZixcbiAgICAgICAgICB0b0hhc2g6IGhhc2hLZXkocmVmKSxcbiAgICAgICAgICBwcm9wZXJ0eTogZGVzYy5wcm9wZXJ0eVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIGlmIChwcm90byAmJiAhbWUuaXNGb3JiaWRkZW4ocHJvdG8pKSB7XG4gICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICBmcm9tSGFzaDogaGFzaEtleShvYmopLFxuICAgICAgICB0bzogcHJvdG8sXG4gICAgICAgIHRvSGFzaDogaGFzaEtleShwcm90byksXG4gICAgICAgIHByb3BlcnR5OiAnW1tQcm90b3R5cGVdXSdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlKSB7XG4gICAgICB0aGlzLl9fbGlua3NDYWNoZVtuYW1lXSA9IGxpbmtzO1xuICAgIH1cblxuICAgIHJldHVybiBsaW5rcztcbiAgfSxcblxuICAvKipcbiAgICogTWFya3MgdGhpcyBhbmFseXplciBhcyBkaXJ0eVxuICAgKi9cbiAgbWFrZURpcnR5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbnVtYmVyIG9mIGxldmVscyBmb3IgdGhlIGRmcyByb3V0aW5lXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsXG4gICAqL1xuICBzZXRMZXZlbHM6IGZ1bmN0aW9uIChsKSB7XG4gICAgdGhpcy5sZXZlbHMgPSBsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGlzIGFuYWx5emVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZFxuICAgKi9cbiAgc2V0RGlydHk6IGZ1bmN0aW9uIChkKSB7XG4gICAgdGhpcy5kaXJ0eSA9IGQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGl0ZW1zIHN0b3JlZCBpbiB0aGlzIEFuYWx5emVyXG4gICAqIEByZXR1cm5zIHtIYXNoTWFwfVxuICAgKi9cbiAgZ2V0SXRlbXM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcztcbiAgfSxcblxuICAvKipcbiAgICogQWxpYXMgZm9yICNnZXRQcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEBwYXJhbSAgcGxhaW4gVHJ1ZSB0byByZXR1cm4gb25seSBwcmltaXRpdmUgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdFByb3BlcnRpZXM6IGZ1bmN0aW9uIChvYmosIHBsYWluKSB7XG4gICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLmdldFByb3BlcnRpZXMob2JqKTtcblxuICAgIGlmIChwbGFpbikge1xuICAgIC8vIGRlbGV0ZSBub24gcHJpbWl0aXZlIHByb3BlcnRpZXNcbiAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgXy5mb3JPd24ocHJvcGVydHksIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgaWYgKHZhbHVlICYmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0eVtrZXldO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZXByZXNlbnRhdGlvbiBvZiB0aGUgb3V0Z29pbmcgbGlua3Mgb2ZcbiAgICogYW4gb2JqZWN0XG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIHN0cmluZ2lmeU9iamVjdExpbmtzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICByZXR1cm4gbWUuZ2V0T3duTGlua3Mob2JqKS5tYXAoZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgIC8vIGRpc2NhcmRlZDogZnJvbSwgdG9cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZyb206IGxpbmsuZnJvbUhhc2gsXG4gICAgICAgIHRvOiBsaW5rLnRvSGFzaCxcbiAgICAgICAgcHJvcGVydHk6IGxpbmsucHJvcGVydHlcbiAgICAgIH07XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFN0cmluZ2lmaWVzIHRoZSBvYmplY3RzIHNhdmVkIGluIHRoaXMgYW5hbHl6ZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBwbGFpbiBUcnVlIHRvIHJldHVybiBhIHBsYWluIG91dHB1dCAod2l0aG91dCBsaW5rcyB0byBvYmplY3RzL2Z1bmN0aW9ucylcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAocGxhaW4pIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgbm9kZXMgPSB7fSxcbiAgICAgIGVkZ2VzID0ge307XG4gICAgbWUuZGVidWcgJiYgY29uc29sZS50aW1lKCdzdHJpbmdpZnknKTtcbiAgICBfLmZvck93bihtZS5pdGVtcywgZnVuY3Rpb24gKHYpIHtcbiAgICAgIHZhciBoayA9IGhhc2hLZXkodik7XG4gICAgICBub2Rlc1toa10gPSBtZS5zdHJpbmdpZnlPYmplY3RQcm9wZXJ0aWVzKHYsIHBsYWluKTtcbiAgICAgIGVkZ2VzW2hrXSA9IG1lLnN0cmluZ2lmeU9iamVjdExpbmtzKHYpO1xuICAgIH0pO1xuICAgIG1lLmRlYnVnICYmIGNvbnNvbGUudGltZUVuZCgnc3RyaW5naWZ5Jyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGVzOiBub2RlcyxcbiAgICAgIGVkZ2VzOiBlZGdlc1xuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFsaWFzIGZvciAjYW5hbHl6ZU9iamVjdHNcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBhZGQ6IGZ1bmN0aW9uIChvYmplY3RzKSB7XG4gICAgLy9jb25zb2xlLnRpbWUoJ2FuYWx5emUnKTtcbiAgICB0aGlzLmFuYWx5emVPYmplY3RzKG9iamVjdHMsIDApO1xuICAgIC8vY29uc29sZS50aW1lRW5kKCdhbmFseXplJyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgc29tZSBleGlzdGluZyBvYmplY3RzIGZyb20gdGhlIGl0ZW1zIEhhc2hNYXBcbiAgICogQHBhcmFtIHtBcnJheX0gb2JqZWN0c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdpdGhQcm90b3R5cGUgVHJ1ZSB0byByZW1vdmUgdGhlIHByb3RvdHlwZVxuICAgKiBpZiB0aGUgY3VycmVudCBvYmplY3QgYmVpbmcgcmVtb3ZlZCBpcyBhIGZ1bmN0aW9uXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHJlbW92ZTogZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZG9SZW1vdmUob2JqKSB7XG4gICAgICBtZS5pdGVtcy5yZW1vdmUob2JqKTtcbiAgICB9XG5cbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKHdpdGhQcm90b3R5cGUpIHtcbiAgICAgICAgd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZG9SZW1vdmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9SZW1vdmUob2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZvcmJpZHMgc29tZSBvYmplY3RzIHRvIGJlIGFkZGVkIHRvIHRoZSBpdGVtcyBIYXNoTWFwXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQHBhcmFtIHtib29sZWFufSB3aXRoUHJvdG90eXBlIFRydWUgdG8gZm9yYmlkIHRoZSBwcm90b3R5cGVcbiAgICogaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGJlaW5nIGZvcmJpZGRlbiBpcyBhIGZ1bmN0aW9uXG4gICAqL1xuICBmb3JiaWQ6IGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBtZS5yZW1vdmUob2JqZWN0cywgd2l0aFByb3RvdHlwZSk7XG5cbiAgICBmdW5jdGlvbiBkb0ZvcmJpZChvYmopIHtcbiAgICAgIG1lLmZvcmJpZGRlbi5wdXQob2JqKTtcbiAgICB9XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmICh3aXRoUHJvdG90eXBlKSB7XG4gICAgICAgIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGRvRm9yYmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvRm9yYmlkKG9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFsbG93cyBzb21lIG9iamVjdHMgdG8gYmUgYWRkZWQgdG8gdGhlIGl0ZW1zIEhhc2hNYXAsIGNhbGwgdGhpcyB0b1xuICAgKiByZW1vdmUgc29tZSBleGlzdGluZyBvYmplY3RzIGZyb20gdGhlIGZvcmJpZGRlbiBIYXNoTWFwIChzbyB0aGF0IHdoZW5cbiAgICogdGhlIHRyZWUgaXMgYW5hbHl6ZWQgYWdhaW4pXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQHBhcmFtIHtib29sZWFufSB3aXRoUHJvdG90eXBlIFRydWUgdG8gZm9yYmlkIHRoZSBwcm90b3R5cGVcbiAgICogaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGJlaW5nIGZvcmJpZGRlbiBpcyBhIGZ1bmN0aW9uXG4gICAqL1xuICBhbGxvdzogZnVuY3Rpb24gKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZG9BbGxvdyhvYmopIHtcbiAgICAgIG1lLmZvcmJpZGRlbi5yZW1vdmUob2JqKTtcbiAgICB9XG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmICh3aXRoUHJvdG90eXBlKSB7XG4gICAgICAgIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGRvQWxsb3cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9BbGxvdyhvYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBFbXB0aWVzIGFsbCB0aGUgaW5mbyBzdG9yZWQgaW4gdGhpcyBhbmFseXplclxuICAgKi9cbiAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9fbGlua3NDYWNoZSA9IHt9O1xuICAgIHRoaXMuX19vYmplY3RzQ2FjaGUgPSB7fTtcbiAgICB0aGlzLmZvcmJpZGRlbi5lbXB0eSgpO1xuICAgIHRoaXMuaXRlbXMuZW1wdHkoKTtcbiAgfVxufTtcblxudmFyIHByb3RvID0gQW5hbHl6ZXIucHJvdG90eXBlO1xuZnVuY3Rpb24gY2hhaW4obWV0aG9kKSB7XG4gIHByb3RvW21ldGhvZF0gPVxuICAgIHV0aWxzLmZ1bmN0aW9uQ2hhaW4oKVxuICAgICAgLmNoYWluKHByb3RvLm1ha2VEaXJ0eSlcbiAgICAgIC5jaGFpbihwcm90b1ttZXRob2RdKTtcbn1cblxuLy8gY2FsbCAjbWFrZURpcnR5IGJlZm9yZSBhbGwgdGhlc2UgbWV0aG9kcyBhcmUgY2FsbGVkXG5jaGFpbignYWRkJyk7XG5jaGFpbigncmVtb3ZlJyk7XG5jaGFpbignZm9yYmlkJyk7XG5jaGFpbignYWxsb3cnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmFseXplcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuLi91dGlsL2hhc2hLZXknKTtcblxuZnVuY3Rpb24gQW5ndWxhcihjb25maWcpIHtcbiAgSW5zcGVjdG9yLmNhbGwodGhpcywgXy5tZXJnZSh7XG4gICAgZW50cnlQb2ludDogJ2FuZ3VsYXInLFxuICAgIGRpc3BsYXlOYW1lOiAnQW5ndWxhckpTJyxcbiAgICBhbHdheXNEaXJ0eTogdHJ1ZSxcbiAgICBhZGRpdGlvbmFsRm9yYmlkZGVuVG9rZW5zOiAnZ2xvYmFsOmpRdWVyeSdcbiAgfSwgY29uZmlnKSk7XG5cbiAgdGhpcy5zZXJ2aWNlcyA9IFtcbiAgICAnJGFuaW1hdGUnLFxuICAgICckY2FjaGVGYWN0b3J5JyxcbiAgICAnJGNvbXBpbGUnLFxuICAgICckY29udHJvbGxlcicsXG4gICAgLy8gJyRkb2N1bWVudCcsXG4gICAgJyRleGNlcHRpb25IYW5kbGVyJyxcbiAgICAnJGZpbHRlcicsXG4gICAgJyRodHRwJyxcbiAgICAnJGh0dHBCYWNrZW5kJyxcbiAgICAnJGludGVycG9sYXRlJyxcbiAgICAnJGludGVydmFsJyxcbiAgICAnJGxvY2FsZScsXG4gICAgJyRsb2cnLFxuICAgICckcGFyc2UnLFxuICAgICckcScsXG4gICAgJyRyb290U2NvcGUnLFxuICAgICckc2NlJyxcbiAgICAnJHNjZURlbGVnYXRlJyxcbiAgICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAgICckdGltZW91dCdcbiAgICAvLyAnJHdpbmRvdydcbiAgXS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICByZXR1cm4geyBjaGVja2VkOiB0cnVlLCBuYW1lOiB2IH07XG4gIH0pO1xufVxuXG5Bbmd1bGFyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cbkFuZ3VsYXIucHJvdG90eXBlLmdldFNlbGVjdGVkU2VydmljZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXMsXG4gICAgdG9BbmFseXplID0gW107XG5cbiAgZ2xvYmFsLmFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nJ10pO1xuICB0aGlzLmluamVjdG9yID0gZ2xvYmFsLmFuZ3VsYXIuaW5qZWN0b3IoWydhcHAnXSk7XG5cbiAgbWUuc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIGlmIChzLmNoZWNrZWQpIHtcbiAgICAgIHZhciBvYmogPSBtZS5pbmplY3Rvci5nZXQocy5uYW1lKTtcbiAgICAgIGhhc2hLZXkuY3JlYXRlSGFzaEtleXNGb3Iob2JqLCBzLm5hbWUpO1xuICAgICAgdG9BbmFseXplLnB1c2gob2JqKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9BbmFseXplO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqL1xuQW5ndWxhci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ2luc3BlY3RpbmcgYW5ndWxhcicpO1xuICBoYXNoS2V5LmNyZWF0ZUhhc2hLZXlzRm9yKGdsb2JhbC5hbmd1bGFyLCAnYW5ndWxhcicpO1xuXG4gIC8vIGdldCB0aGUgb2JqZWN0cyB0aGF0IG5lZWQgdG8gYmUgZm9yYmlkZGVuXG4gIHZhciB0b0ZvcmJpZCA9IG1lLnBhcnNlRm9yYmlkZGVuVG9rZW5zKCk7XG4gIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ2ZvcmJpZGRpbmc6ICcsIHRvRm9yYmlkKTtcbiAgdGhpcy5hbmFseXplci5mb3JiaWQodG9Gb3JiaWQsIHRydWUpO1xuXG4gIHRoaXMuYW5hbHl6ZXIuYWRkKFxuICAgIFtnbG9iYWwuYW5ndWxhcl0uY29uY2F0KHRoaXMuZ2V0U2VsZWN0ZWRTZXJ2aWNlcygpKVxuICApO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFNpbmNlIEFuZ3VsYXIgaXMgYSBzY3JpcHQgcmV0cmlldmVkIG9uIGRlbWFuZCBidXQgdGhlIGluc3RhbmNlXG4gKiBpcyBhbHJlYWR5IGNyZWF0ZWQgaW4gSW5zcGVjdGVkSW5zdGFuY2UsIGxldCdzIGFsdGVyIHRoZVxuICogcHJvcGVydGllcyBpdCBoYXMgYmVmb3JlIG1ha2luZyB0aGUgcmVxdWVzdFxuICovXG5Bbmd1bGFyLnByb3RvdHlwZS5tb2RpZnlJbnN0YW5jZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHRoaXMuc3JjID0gb3B0aW9ucy5zcmM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuZ3VsYXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsLycpO1xuXG52YXIgdG9JbnNwZWN0ID0gW1xuICBPYmplY3QsIEZ1bmN0aW9uLFxuICBBcnJheSwgRGF0ZSwgQm9vbGVhbiwgTnVtYmVyLCBNYXRoLCBTdHJpbmcsIFJlZ0V4cCwgSlNPTixcbiAgRXJyb3Jcbl07XG5cbmZ1bmN0aW9uIEJ1aWx0SW4ob3B0aW9ucykge1xuICBHZW5lcmljQW5hbHl6ZXIuY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuQnVpbHRJbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICovXG5CdWlsdEluLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBidWlsdEluIG9iamVjdHMnKTtcbiAgdGhpcy5hbmFseXplci5hZGQodGhpcy5nZXRJdGVtcygpKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbkJ1aWx0SW4ucHJvdG90eXBlLmdldEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoPycgK1xuICAgIHV0aWxzLnRvUXVlcnlTdHJpbmcoe1xuICAgICAgcTogZW5jb2RlVVJJQ29tcG9uZW50KG5vZGVOYW1lICsgJyAnICsgbm9kZVByb3BlcnR5KVxuICAgIH0pO1xuICB3aW5kb3cub3Blbih1cmwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWlsdEluOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcblxudmFyIHRvSW5zcGVjdCA9IFtnbG9iYWxdO1xuXG5mdW5jdGlvbiBHbG9iYWwoKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIHtcbiAgICBhbmFseXplckNvbmZpZzoge1xuICAgICAgbGV2ZWxzOiAxLFxuICAgICAgdmlzaXRDb25zdHJ1Y3RvcnM6IGZhbHNlXG4gICAgfSxcbiAgICBhbHdheXNEaXJ0eTogdHJ1ZVxuICB9KTtcbn1cblxuR2xvYmFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cbkdsb2JhbC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0b0luc3BlY3Q7XG59O1xuXG5HbG9iYWwucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGdsb2JhbCcpO1xuICAvL3ZhciBtZSA9IHRoaXMsXG4gIC8vICBoYXNoZXMgPSByZXF1aXJlKCcuLi9JbnNwZWN0ZWRJbnN0YW5jZXMnKTtcbiAgLy9cbiAgLy9fLmZvck93bihoYXNoZXMsIGZ1bmN0aW9uICh2LCBrKSB7XG4gIC8vICBpZiAodi5nZXRJdGVtcygpKSB7XG4gIC8vICAgIG1lLmFuYWx5emVyLmZvcmJpZChbdi5nZXRJdGVtcygpXSwgdHJ1ZSk7XG4gIC8vICB9XG4gIC8vfSk7XG4gIHRoaXMuYW5hbHl6ZXIuaXRlbXMuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5hZGQobWUuZ2V0SXRlbXMoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBRID0gcmVxdWlyZSgncScpO1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC8nKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgQW5hbHl6ZXIgPSByZXF1aXJlKCcuLi9PYmplY3RBbmFseXplcicpO1xuXG52YXIgc2VhcmNoRW5naW5lID0gJ2h0dHBzOi8vZHVja2R1Y2tnby5jb20vP3E9JztcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBJbnN0YW5jZXMgb2YgdGhlIGNsYXNzIGluc3BlY3RvciBkZWNpZGUgd2hpY2ggb2JqZWN0cyB3aWxsIGJlXG4gKiBhbmFseXplZCBieSB0aGUgaW50ZXJuYWwgYW5hbHl6ZXIgaXQgaG9sZHMsIGJlc2lkZXMgZG9pbmcgdGhhdFxuICogdGhpcyBpbnNwZWN0b3IgaXMgYWJsZSB0bzpcbiAqXG4gKiAtIGRvIGRlZmVycmVkIGFuYWx5c2lzIChhbmFseXNpcyBvbiBkZW1hbmQpXG4gKiAtIGZldGNoIGV4dGVybmFsIHNjcmlwdHMgaW4gc2VyaWVzICh0aGUgYW5hbHlzaXMgaXMgbWFkZVxuICogICB3aGVuIGFsbCB0aGUgc2NyaXBzIGhhdmUgZmluaXNoZWQgbG9hZGluZylcbiAqIC0gbWFyayBpdHNlbGYgYXMgYW4gYWxyZWFkeSBpbnNwZWN0ZWQgaW5zdGFuY2Ugc28gdGhhdFxuICogICBmdXJ0aGVyIGluc3BlY3Rpb24gY2FsbHMgYXJlIG5vdCBtYWRlXG4gKiAtIHJlY2VpdmUgYSBjb25maWd1cmF0aW9uIHRvIGZvcmJpZCBjb21wbGV0ZSBncmFwaHMgZnJvbVxuICogICB0aGUgYW5hbHlzaXMgc3RlcFxuICpcbiAqIFNhbXBsZSB1c2FnZTpcbiAqXG4gKiBBbmFseXNpcyBvZiBhIHNpbXBsZSBvYmplY3Q6XG4gKlxuICogICAgdmFyIHggPSB7fTtcbiAqICAgIHZhciBpbnNwZWN0b3IgPSBuZXcgSW5zcGVjdG9yKCk7XG4gKiAgICBpbnNwZWN0b3JcbiAqICAgICAgLmluaXQoKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gKiAgICAgICAgLy8geCBpcyByZWFkeSBhbmFseXplZCBhdCB0aGlzIHBvaW50IVxuICogICAgICAgIC8vIG9iamVjdHMgc2F2ZWQgaW4gaW5zcGVjdG9yLmFuYWx5emVyID0ge3h9XG4gKiAgICAgIH0pXG4gKlxuICogQXMgc2VlbiBpbiB0aGUgY29kZSB0aGVyZSBpcyBhIGRlZmF1bHQgdmFyaWFibGUgd2hpY2ggc3BlY2lmaWVzXG4gKiB0aGUgb2JqZWN0cyB0aGF0IHdpbGwgYmUgZm9yYmlkZGVuLCB0aGUgdmFsdWUgaXMgYSBwaXBlIHNlcGFyYXRlZFxuICogbGlzdCBvZiBjb21tYW5kcyAoc2VlIEBmb3JiaWRkZW5Ub2tlbnMpIHdoaWNoIGlzIG1ha2luZyB0aGVcbiAqIGluc3BlY3RvciBhdm9pZCB0aGUgYnVpbHRJbiBwcm9wZXJ0aWVzLCBsZXQncyBhdm9pZCB0aGF0IGJ5IG1ha2luZ1xuICogZm9yYmlkZGVuVG9rZW5zIG51bGw6XG4gKlxuICogICAgdmFyIHggPSB7fTtcbiAqICAgIHZhciBpbnNwZWN0b3IgPSBuZXcgSW5zcGVjdG9yKHtcbiAqICAgICAgZm9yYmlkZGVuVG9rZW5zOiBudWxsXG4gKiAgICB9KTtcbiAqICAgIGluc3BlY3RvclxuICogICAgICAuaW5pdCgpXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgICAvLyB4IGlzIHJlYWR5IGFuYWx5emVkIGF0IHRoaXMgcG9pbnQhXG4gKiAgICAgICAgLy8gb2JqZWN0cyBzYXZlZCBpbiBpbnNwZWN0b3IuYW5hbHl6ZXIgPSB7eCwgT2JqZWN0LFxuICogICAgICAgICAgT2JqZWN0LnByb3RvdHlwZSwgRnVuY3Rpb24sIEZ1bmN0aW9uLnByb3RvdHlwZX1cbiAqICAgICAgfSlcbiAqXG4gKiBUbyBleGVjdXRlIG1vcmUgY29tcGxleCBhbmFseXNpcyBjb25zaWRlciBvdmVycmlkaW5nOlxuICpcbiAqIC0gaW5zcGVjdFNlbGZcbiAqIC0gZ2V0SXRlbXNcbiAqXG4gKiBTZWUgQnVpbHRJbi5qcyBmb3IgYSBiYXNpYyBvdmVycmlkZSBvZiB0aGUgbWV0aG9kcyBhYm92ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmVudHJ5UG9pbnRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zcmNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5kaXNwbGF5TmFtZV1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmZvcmJpZGRlblRva2Vucz1JbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TXVxuICovXG5mdW5jdGlvbiBJbnNwZWN0b3IoY29uZmlnKSB7XG4gIGNvbmZpZyA9IF8ubWVyZ2UoXy5jbG9uZShJbnNwZWN0b3IuREVGQVVMVF9DT05GSUcsIHRydWUpLCBjb25maWcpO1xuXG4gIC8qKlxuICAgKiBJZiBwcm92aWRlZCBpdCdsbCBiZSB1c2VkIGFzIHRoZSBzdGFydGluZyBvYmplY3QgZnJvbSB0aGVcbiAgICogZ2xvYmFsIG9iamVjdCB0byBiZSBhbmFseXplZCwgbmVzdGVkIG9iamVjdHMgY2FuIGJlIHNwZWNpZmllZFxuICAgKiB3aXRoIHRoZSBkb3Qgbm90YXRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMuZW50cnlQb2ludCA9IGNvbmZpZy5lbnRyeVBvaW50O1xuXG4gIC8qKlxuICAgKiBOYW1lIHRvIGJlIGRpc3BsYXllZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5kaXNwbGF5TmFtZSA9IGNvbmZpZy5kaXNwbGF5TmFtZTtcblxuICAvKipcbiAgICogSWYgdGhlIGluc3BlY3RvciBuZWVkcyB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXMgdXNlXG4gICAqIGEgc3RyaW5nIHNlcGFyYXRlZCB3aXRoIHRoZSBwaXBlIHwgY2hhcmFjdGVyLCB0aGUgc2NyaXB0c1xuICAgKiBhcmUgbG9hZGVkIGluIHNlcmllcyBiZWNhdXNlIG9uZSBzY3JpcHQgbWlnaHQgbmVlZCB0aGUgZXhpc3RlbmNlXG4gICAqIG9mIGFub3RoZXIgYmVmb3JlIGl0J3MgZmV0Y2hlZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5zcmMgPSBjb25maWcuc3JjO1xuXG4gIC8qKlxuICAgKiBFYWNoIHRva2VuIGRldGVybWluZXMgd2hpY2ggb2JqZWN0cyB3aWxsIGJlIGZvcmJpZGRlblxuICAgKiB3aGVuIHRoZSBhbmFseXplciBpcyBydW4uXG4gICAqXG4gICAqIFRva2VuIGV4YW1wbGVzOlxuICAgKlxuICAgKiAtIHBvam92aXo6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFsbCB0aGUgaXRlbXMgc2F2ZWQgaW4gdGhlIHtzdHJpbmd9IGluc3RhbmNlIHdoaWNoXG4gICAqICAgaXMgc3RvcmVkIGluIHRoZSBJbnNwZWN0ZWRJbnN0YW5jZXMgb2JqZWN0LFxuICAgKiAgIGFzc3VtaW5nIHRoYXQgZWFjaCBpcyBhIHN1YmNsYXNzIG9mIGBJbnNwZWN0b3JgXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICAvLyBmb3JiaWQgYWxsIHRoZSBpdGVtcyBmb3VuZCBpbiB0aGUgYnVpbHRJbiBpbnNwZWN0b3JcbiAgICogICBwb2pvdml6OmJ1aWx0SW5cbiAgICpcbiAgICogLSBnbG9iYWw6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFuIG9iamVjdCB3aGljaCBpcyBpbiB0aGUgZ2xvYmFsIG9iamVjdCwge3N0cmluZ30gbWlnaHRcbiAgICogICBhbHNvIGluZGljYXRlIGEgbmVzdGVkIG9iamVjdCB1c2luZyAuIGFzIGEgbm9ybWFsIHByb3BlcnR5XG4gICAqICAgcmV0cmlldmFsXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICBnbG9iYWw6ZG9jdW1lbnRcbiAgICogICBnbG9iYWw6ZG9jdW1lbnQuYm9keVxuICAgKiAgIGdsb2JhbDpkb2N1bWVudC5oZWFkXG4gICAqXG4gICAqIEZvcmJpZGRlblRva2VucyBleGFtcGxlOlxuICAgKlxuICAgKiAgcG9qb3ZpejpidWlsdElufHBvam92aXo6d2luZG93fGdsb2JhbDpkb2N1bWVudFxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLmZvcmJpZGRlblRva2VucyA9IChjb25maWcuZm9yYmlkZGVuVG9rZW5zIHx8ICcnKS5zcGxpdCgnfCcpLmNvbmNhdChcbiAgICAoY29uZmlnLmFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnMgfHwgJycpLnNwbGl0KCd8JylcbiAgKTtcblxuICAvKipcbiAgICogVGhpcyBpbnNwZWN0b3IgaXMgaW5pdGlhbGx5IGluIGEgZGlydHkgc3RhdGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuICAvKipcbiAgICogUHJpbnQgZGVidWcgaW5mb1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGVidWcgPSBjb25maWcuZGVidWc7XG5cbiAgLyoqXG4gICAqIFRvIGF2b2lkIHJlYW5hbHl6aW5nIHRoZSBzYW1lIHN0cnVjdHVyZSBtdWx0aXBsZSB0aW1lcyBhIHNtYWxsXG4gICAqIG9wdGltaXphdGlvbiBpcyB0byBtYXJrIHRoZSBpbnNwZWN0b3IgYXMgaW5zcGVjdGVkLCB0byBhdm9pZFxuICAgKiB0aGlzIG9wdGltaXphdGlvbiBwYXNzIGFsd2F5c0RpcnR5IGFzIHRydWUgaW4gdGhlIG9wdGlvbnNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmFsd2F5c0RpcnR5ID0gY29uZmlnLmFsd2F5c0RpcnR5O1xuXG4gIC8qKlxuICAgKiBBbiBpbnN0YW5jZSBvZiBPYmplY3RBbmFseXplciB3aGljaCB3aWxsIHNhdmUgYWxsXG4gICAqIHRoZSBpbnNwZWN0ZWQgb2JqZWN0c1xuICAgKiBAdHlwZSB7T2JqZWN0QW5hbHl6ZXJ9XG4gICAqL1xuICB0aGlzLmFuYWx5emVyID0gbmV3IEFuYWx5emVyKGNvbmZpZy5hbmFseXplckNvbmZpZyk7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHdoaWNoIGhvbGRzIGFsbCB0aGUgaW5zcGVjdG9yIGluc3RhbmNlcyBjcmVhdGVkXG4gKiAoZmlsbGVkIGluIHRoZSBmaWxlIEluc3BlY3RlZEluc3RhbmNlcylcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkluc3BlY3Rvci5pbnN0YW5jZXMgPSBudWxsO1xuXG4vKipcbiAqIERlZmF1bHQgZm9yYmlkZGVuIGNvbW1hbmRzIChpbiBub2RlIGdsb2JhbCBpcyB0aGUgZ2xvYmFsIG9iamVjdClcbiAqIEB0eXBlIHtzdHJpbmdbXX1cbiAqL1xuSW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOU19BUlJBWSA9IFsncG9qb3ZpejpnbG9iYWwnLCAncG9qb3ZpejpidWlsdEluJywgJ2dsb2JhbDpkb2N1bWVudCddO1xuXG4vKipcbiAqIEZvcmJpZGRlbiB0b2tlbnMgd2hpY2ggYXJlIHNldCBieSBkZWZhdWx0IG9uIGFueSBJbnNwZWN0b3IgaW5zdGFuY2VcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbkluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlMgPVxuICBJbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TX0FSUkFZLmpvaW4oJ3wnKTtcblxuLyoqXG4gKiBEZWZhdWx0IGNvbmZpZyB1c2VkIHdoZW5ldmVyIGFuIGluc3RhbmNlIG9mIEluc3BlY3RvciBpcyBjcmVhdGVkXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5JbnNwZWN0b3IuREVGQVVMVF9DT05GSUcgPSB7XG4gIHNyYzogbnVsbCxcbiAgZW50cnlQb2ludDogJycsXG4gIGRpc3BsYXlOYW1lOiAnJyxcbiAgYWx3YXlzRGlydHk6IGZhbHNlLFxuICBkZWJ1ZzogZmFsc2UsXG4gIGZvcmJpZGRlblRva2VuczogSW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOUyxcbiAgYWRkaXRpb25hbEZvcmJpZGRlblRva2VuczogJycsXG4gIGFuYWx5emVyQ29uZmlnOiB7fVxufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGJ1aWx0SW4gdmlzaWJpbGl0eSBvZiBhbGwgdGhlIG5ldyBpbnN0YW5jZXMgdG8gYmUgY3JlYXRlZFxuICogQHBhcmFtIHZpc2libGVcbiAqL1xuSW5zcGVjdG9yLnNldEJ1aWx0SW5WaXNpYmlsaXR5ID0gZnVuY3Rpb24gKHZpc2libGUpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHRva2VuID0gJ3Bvam92aXo6YnVpbHRJbic7XG4gIHZhciBhcnIgPSBtZS5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlNfQVJSQVk7XG4gIGlmICh2aXNpYmxlKSB7XG4gICAgYXJyLnB1c2godG9rZW4pO1xuICB9IGVsc2Uge1xuICAgIGFyci5zcGxpY2UoYXJyLmluZGV4T2YodG9rZW4pLCAxKTtcbiAgfVxuICBtZS5ERUZBVUxUX0NPTkZJRy5mb3JiaWRkZW5Ub2tlbnMgPSBhcnIuam9pbignfCcpO1xufTtcblxuLyoqXG4gKiBJbml0IHJvdXRpbmUsIHNob3VsZCBiZSBjYWxsZWQgb24gZGVtYW5kIHRvIGluaXRpYWxpemUgdGhlXG4gKiBhbmFseXNpcyBwcm9jZXNzLCBpdCBvcmNoZXN0cmF0ZXMgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiAtIGZldGNoaW5nIG9mIGV4dGVybmFsIHJlc291cmNlc1xuICogLSBpbnNwZWN0aW9uIG9mIGVsZW1lbnRzIGlmIHRoZSBpbnNwZWN0b3IgaXMgaW4gYSBkaXJ0eSBzdGF0ZVxuICpcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCclY1Bvam9WaXonLCAnZm9udC1zaXplOiAxNXB4OyBjb2xvcjogJyk7XG4gIHJldHVybiBtZS5mZXRjaCgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG1lLmFsd2F5c0RpcnR5IHx8IG1lLmRpcnR5KSB7XG4gICAgICAgIG1lLmluc3BlY3QoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogUGVyZm9ybXMgdGhlIGFuYWx5c2lzIG9mIGFuIG9iamVjdCBnaXZlbiBhbiBlbnRyeVBvaW50LCBiZWZvcmVcbiAqIHBlcmZvcm1pbmcgdGhlIGFuYWx5c2lzIGl0IGlkZW50aWZpZXMgd2hpY2ggb2JqZWN0IG5lZWQgdG8gYmVcbiAqIGZvcmJpZGRlbiAoZm9yYmlkZGVuVG9rZW5zKVxuICpcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHN0YXJ0ID0gbWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwobWUuZW50cnlQb2ludCk7XG4gIHZhciBhbmFseXplciA9IHRoaXMuYW5hbHl6ZXI7XG5cbiAgaWYgKCFzdGFydCkge1xuICAgIGNvbnNvbGUuZXJyb3IodGhpcyk7XG4gICAgdGhyb3cgJ2VudHJ5IHBvaW50IG5vdCBmb3VuZCEnO1xuICB9XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCdhbmFseXppbmcgZ2xvYmFsLicgKyBtZS5lbnRyeVBvaW50KTtcblxuICAvLyBzZXQgYSBwcmVkZWZpbmVkIGdsb2JhbCBuYW1lIChzbyB0aGF0IGl0J3Mga25vd24gYXMgZW50cnlQb2ludClcbiAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0ZvcihzdGFydCwgbWUuZW50cnlQb2ludCk7XG5cbiAgLy8gYmVmb3JlIGluc3BlY3QgaG9va1xuICBtZS5iZWZvcmVJbnNwZWN0U2VsZigpO1xuXG4gIC8vIGdldCB0aGUgb2JqZWN0cyB0aGF0IG5lZWQgdG8gYmUgZm9yYmlkZGVuXG4gIHZhciB0b0ZvcmJpZCA9IG1lLnBhcnNlRm9yYmlkZGVuVG9rZW5zKCk7XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCdmb3JiaWRkaW5nOiAnLCB0b0ZvcmJpZCk7XG4gIGFuYWx5emVyLmZvcmJpZCh0b0ZvcmJpZCwgdHJ1ZSk7XG5cbiAgLy8gcGVyZm9ybSB0aGUgYW5hbHlzaXNcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2FkZGluZzogJyArIHN0YXJ0KTtcbiAgYW5hbHl6ZXIuYWRkKFtzdGFydF0pO1xuXG4gIC8vIGFmdGVyIGluc3BlY3QgaG9va1xuICBtZS5hZnRlckluc3BlY3RTZWxmKCk7XG4gIHJldHVybiBtZTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBiZWZvcmUgaW5zcGVjdCBzZWxmIGhvb2tcbiAqIENsZWFucyB0aGUgaXRlbXMgc3RvcmVkIGluIHRoZSBhbmFseXplclxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmJlZm9yZUluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICAvLyBjbGVhbiB0aGUgYW5hbHl6ZXJcbiAgdGhpcy5hbmFseXplci5pdGVtcy5lbXB0eSgpO1xuICAvL3RoaXMuYW5hbHl6ZXIuZm9yYmlkZGVuLmVtcHR5KCk7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogYWZ0ZXIgaW5zcGVjdCBzZWxmIGhvb2tcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5hZnRlckluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xufTtcblxuLyoqXG4gKiBQYXJzZXMgdGhlIGZvcmJpZGRlblRva2VucyBzdHJpbmcgYW5kIGlkZW50aWZpZXMgd2hpY2hcbiAqIG9iamVjdHMgc2hvdWxkIGJlIGZvcmJpZGRlbiBmcm9tIHRoZSBhbmFseXNpcyBwaGFzZVxuICogQHJldHVybnMge0FycmF5fVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnBhcnNlRm9yYmlkZGVuVG9rZW5zID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgZm9yYmlkZGVuID0gW10uY29uY2F0KHRoaXMuZm9yYmlkZGVuVG9rZW5zKTtcbiAgdmFyIHRvRm9yYmlkID0gW107XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCdhYm91dCB0byBmb3JiaWQ6ICcsIGZvcmJpZGRlbik7XG4gIGZvcmJpZGRlblxuICAgIC5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICEhdjsgfSlcbiAgICAuZm9yRWFjaChmdW5jdGlvbih0b2tlbikge1xuICAgICAgdmFyIGFyciA9IFtdO1xuICAgICAgdmFyIHRva2VucztcbiAgICAgIGlmICh0b2tlbi5zZWFyY2goL15wb2pvdml6Oi8pID4gLTEpIHtcbiAgICAgICAgdG9rZW5zID0gdG9rZW4uc3BsaXQoJzonKTtcblxuICAgICAgICAvLyBpZiBpdCdzIGEgY29tbWFuZCBmb3IgdGhlIGxpYnJhcnkgdGhlbiBtYWtlIHN1cmUgaXQgZXhpc3RzXG4gICAgICAgIGFzc2VydChJbnNwZWN0b3IuaW5zdGFuY2VzW3Rva2Vuc1sxXV0pO1xuICAgICAgICBhcnIgPSBJbnNwZWN0b3IuaW5zdGFuY2VzW3Rva2Vuc1sxXV0uZ2V0SXRlbXMoKTtcbiAgICAgIH0gZWxzZSBpZiAodG9rZW4uc2VhcmNoKC9eZ2xvYmFsOi8pID4gLTEpIHtcbiAgICAgICAgdG9rZW5zID0gdG9rZW4uc3BsaXQoJzonKTtcbiAgICAgICAgYXJyID0gW21lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKHRva2Vuc1sxXSldO1xuICAgICAgfVxuXG4gICAgICB0b0ZvcmJpZCA9IHRvRm9yYmlkLmNvbmNhdChhcnIpO1xuICAgIH0pO1xuICByZXR1cm4gdG9Gb3JiaWQ7XG59O1xuXG4vKipcbiAqIE1hcmtzIHRoaXMgaW5zcGVjdG9yIGFzIGRpcnR5XG4gKiBAY2hhaW5hYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuc2V0RGlydHkgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWFya3MgdGhpcyBpbnNwZWN0b3IgYXMgbm90IGRpcnR5IChzbyB0aGF0IGZ1cnRoZXIgY2FsbHNcbiAqIHRvIGluc3BlY3QgYXJlIG5vdCBtYWRlKVxuICogQGNoYWluYWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnVuc2V0RGlydHkgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICogU2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5zdGFuY2UgaXMgY3JlYXRlZCB0byBtb2RpZnkgaXQgd2l0aFxuICogYWRkaXRpb25hbCBvcHRpb25zXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUubW9kaWZ5SW5zdGFuY2UgPSBmdW5jdGlvbiAob3B0aW9ucykge1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogUGVyZm9ybXMgdGhlIGluc3BlY3Rpb24gb24gc2VsZlxuICogQGNoYWluYWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzXG4gICAgLnVuc2V0RGlydHkoKVxuICAgIC5pbnNwZWN0U2VsZigpO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFByZXJlbmRlciBob29rXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUucHJlUmVuZGVyID0gZnVuY3Rpb24gKCkge1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFBvc3RyZW5kZXIgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnBvc3RSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZXNcbiAqIFJldHVybnMgdGhlIHByZWRlZmluZWQgaXRlbXMgdGhhdCB0aGlzIGluc3BlY3RvciBpcyBpbiBjaGFyZ2Ugb2ZcbiAqIGl0J3MgdXNlZnVsIHRvIGRldGVybWluZSB3aGljaCBvYmplY3RzIG5lZWQgdG8gYmUgZGlzY2FyZGVkIGluXG4gKiAjaW5zcGVjdFNlbGZcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5nZXRJdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFtdO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIHN0cmluZyB3aGljaCBoYXZlIHRva2VucyBzZXBhcmF0ZWQgYnkgdGhlIC4gc3ltYm9sXG4gKiB0aGlzIG1ldGhvZHMgY2hlY2tzIGlmIGl0J3MgYSB2YWxpZCB2YWx1ZSB1bmRlciB0aGUgZ2xvYmFsIG9iamVjdFxuICpcbiAqIGUuZy5cbiAqICAgICAgICAnZG9jdW1lbnQuYm9keSdcbiAqICAgICAgICByZXR1cm5zIGdsb2JhbC5kb2N1bWVudC5ib2R5IHNpbmNlIGl0J3MgYSB2YWxpZCBvYmplY3RcbiAqICAgICAgICB1bmRlciB0aGUgZ2xvYmFsIG9iamVjdFxuICpcbiAqIEBwYXJhbSBuZXN0ZWRDb25maWd1cmF0aW9uXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbCA9IGZ1bmN0aW9uIChuZXN0ZWRDb25maWd1cmF0aW9uKSB7XG4gIHZhciB0b2tlbnMgPSBuZXN0ZWRDb25maWd1cmF0aW9uLnNwbGl0KCcuJyk7XG4gIHZhciBzdGFydCA9IGdsb2JhbDtcbiAgd2hpbGUgKHRva2Vucy5sZW5ndGgpIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnMuc2hpZnQoKTtcbiAgICBpZiAoIXN0YXJ0Lmhhc093blByb3BlcnR5KHRva2VuKSkge1xuICAgICAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLndhcm4oJ25lc3RlZENvbmZpZyBub3QgZm91bmQhJyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc3RhcnQgPSBzdGFydFt0b2tlbl07XG4gIH1cbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuLyoqXG4gKiBGZXRjaGVzIGFsbCB0aGUgcmVzb3VyY2VzIHJlcXVpcmVkIHRvIHBlcmZvcm0gdGhlIGluc3BlY3Rpb24sXG4gKiAod2hpY2ggYXJlIHNhdmVkIGluIGB0aGlzLnNyY2ApLCByZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpc1xuICogcmVzb2x2ZWQgd2hlbiBhbGwgdGhlIHNjcmlwcyBoYXZlIGZpbmlzaGVkIGxvYWRpbmdcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZyBgdmAgaXQgZmV0Y2hlcyBpdCBhbiBhbiBhc3luYyB3YXksXG4gICAqIHNpbmNlIHRoaXMgbWV0aG9kIHJldHVybnMgYSBwcm9taXNlIGl0IGFsbG93cyBlYXN5IGNoYWluaW5nXG4gICAqIHNlZSB0aGUgcmVkdWNlIHBhcnQgYmVsb3dcbiAgICogQHBhcmFtIHZcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgKi9cbiAgZnVuY3Rpb24gcHJvbWlzaWZ5KHYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdmZXRjaGluZyBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0LnNyYyA9IHY7XG4gICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB1dGlscy5ub3RpZmljYXRpb24oJ2NvbXBsZXRlZCBmZXRjaGluZyBzY3JpcHQgJyArIHYsIHRydWUpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKG1lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKG1lLmVudHJ5UG9pbnQpKTtcbiAgICAgIH07XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKG1lLnNyYykge1xuICAgIGlmIChtZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbChtZS5lbnRyeVBvaW50KSkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc291cmNlIGFscmVhZHkgZmV0Y2hlZDogJyArIG1lLmVudHJ5UG9pbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3JjcyA9IHRoaXMuc3JjLnNwbGl0KCd8Jyk7XG4gICAgICByZXR1cm4gc3Jjcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHByZXYudGhlbihwcm9taXNpZnkoY3VycmVudCkpO1xuICAgICAgfSwgUSgncmVkdWNlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBRLmRlbGF5KDApO1xufTtcblxuLyoqXG4gKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBidWlsdEluIG9iamVjdHNcbiAqIEBwYXJhbSB2aXNpYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuc2V0QnVpbHRJblZpc2liaWxpdHkgPSBmdW5jdGlvbiAodmlzaWJsZSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgdG9rZW4gPSAncG9qb3ZpejpidWlsdEluJztcbiAgdmFyIGFyciA9IG1lLmZvcmJpZGRlblRva2VucztcbiAgaWYgKHZpc2libGUpIHtcbiAgICBhcnIucHVzaCh0b2tlbik7XG4gIH0gZWxzZSB7XG4gICAgYXJyLnNwbGljZShhcnIuaW5kZXhPZih0b2tlbiksIDEpO1xuICB9XG59O1xuXG5JbnNwZWN0b3IucHJvdG90eXBlLnNob3dTZWFyY2ggPSBmdW5jdGlvbiAobm9kZU5hbWUsIG5vZGVQcm9wZXJ0eSkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgdHBsID0gXy50ZW1wbGF0ZSgnJHtzZWFyY2hFbmdpbmV9JHtsdWNreX0ke2xpYnJhcnlOYW1lfSAke25vZGVOYW1lfSAke25vZGVQcm9wZXJ0eX0nKTtcbiAgdmFyIGNvbXBpbGVkID0gdHBsKHtcbiAgICBzZWFyY2hFbmdpbmU6IHNlYXJjaEVuZ2luZSxcbiAgICBsdWNreTogSW5zcGVjdG9yLmx1Y2t5ID8gJyFkdWNreScgOiAnJyxcbiAgICBsaWJyYXJ5TmFtZTogbWUuZW50cnlQb2ludCxcbiAgICBub2RlTmFtZTogbm9kZU5hbWUsXG4gICAgbm9kZVByb3BlcnR5OiBub2RlUHJvcGVydHlcbiAgfSk7XG4gIHdpbmRvdy5vcGVuKGNvbXBpbGVkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5zcGVjdG9yOyIsIid1c2Ugc3RyaWN0JztcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL0luc3BlY3RvcicpO1xuZnVuY3Rpb24gUE9iamVjdChvcHRpb25zKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5QT2JqZWN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cblBPYmplY3QucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIE9iamVjdCBvYmplY3RzJyk7XG4gIHRoaXMuYW5hbHl6ZXIuYWRkKHRoaXMuZ2V0SXRlbXMoKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUE9iamVjdC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbT2JqZWN0XTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUE9iamVjdDsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8xNy8xNS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbe1xuICBlbnRyeVBvaW50OiAnd2luZG93J1xufSwge1xuICBsYWJlbDogJ0V4dEpTJyxcbiAgc3JjOiAnLy9jZG4uc2VuY2hhLmNvbS9leHQvZ3BsLzQuMi4xL2V4dC1hbGwuanMnLFxuICBlbnRyeVBvaW50OiAnRXh0JyxcbiAgYW5hbHl6ZXJDb25maWc6IHtcbiAgICBsZXZlbHM6IDFcbiAgfVxufSwge1xuICBlbnRyeVBvaW50OiAnVEhSRUUnXG59LCB7XG4gIGVudHJ5UG9pbnQ6ICdQaGFzZXInLFxuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9waGFzZXIvMi4wLjYvcGhhc2VyLm1pbi5qcycsXG4gIGFuYWx5emVyQ29uZmlnOiB7XG4gICAgdmlzaXRTaW1wbGVGdW5jdGlvbnM6IHRydWVcbiAgfVxufV07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTcvMTUuXG4gKi9cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbnZhciBwcm90byA9IHtcbiAgZmluZDogZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgZnVuY3Rpb24gcHJlZGljYXRlKHYpIHtcbiAgICAgIHJldHVybiB2LmRpc3BsYXlOYW1lID09PSBlbnRyeSB8fCB2LmVudHJ5UG9pbnQgPT09IGVudHJ5O1xuICAgIH1cbiAgICB2YXIgcmVzdWx0O1xuICAgIF8uZm9yT3duKHRoaXMsIGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCB8fCBfLmZpbmQoc2NoZW1hLCBwcmVkaWNhdGUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn07XG5cbnZhciBzY2hlbWFzID0gT2JqZWN0LmNyZWF0ZShwcm90byk7XG5cbl8ubWVyZ2Uoc2NoZW1hcywge1xuICBrbm93blNjaGVtYXM6IHJlcXVpcmUoJy4va25vd25TY2hlbWFzJyksXG4gIG5vdGFibGVMaWJyYXJpZXM6IHJlcXVpcmUoJy4vbm90YWJsZUxpYnJhcmllcycpLFxuICBteUxpYnJhcmllczogcmVxdWlyZSgnLi9teUxpYnJhcmllcycpLFxuICBodWdlU2NoZW1hczogcmVxdWlyZSgnLi9odWdlU2NoZW1hcycpLFxuICBkb3dubG9hZGVkOiBbXVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NoZW1hczsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8xNy8xNS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbe1xuICBsYWJlbDogJ09iamVjdCcsXG4gIGRpc3BsYXlOYW1lOiAnb2JqZWN0J1xufSwge1xuICBsYWJlbDogJ0J1aWx0SW4gT2JqZWN0cycsXG4gIGRpc3BsYXlOYW1lOiAnYnVpbHRJbidcbn1dOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE3LzE1LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFt7XG4gIGxhYmVsOiAnUG9qb1ZpeicsXG4gIGVudHJ5UG9pbnQ6ICdwb2pvdml6JyxcbiAgYWx3YXlzRGlydHk6IHRydWVcbn0sIHtcbiAgZGlzcGxheU5hbWU6ICd0Mydcbn1dOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE3LzE1LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFt7XG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuMS9qcXVlcnkubWluLmpzJyxcbiAgZW50cnlQb2ludDogJ2pRdWVyeSdcbn0sIHtcbiAgZW50cnlQb2ludDogJ1BvbHltZXInLFxuICBhZGRpdGlvbmFsRm9yYmlkZGVuVG9rZW5zOiAnZ2xvYmFsOlBvbHltZXIuZWxlbWVudHMnXG59LCB7XG4gIGVudHJ5UG9pbnQ6ICdkMydcbn0sIHtcbiAgZGlzcGxheU5hbWU6ICdMby1EYXNoJyxcbiAgZW50cnlQb2ludDogJ18nLFxuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9sb2Rhc2guanMvMi40LjEvbG9kYXNoLmpzJ1xufSwge1xuICBzcmM6ICcvL2ZiLm1lL3JlYWN0LTAuMTIuMi5qcycsXG4gIGVudHJ5UG9pbnQ6ICdSZWFjdCdcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvYW5ndWxhci5qcy8xLjIuMjAvYW5ndWxhci5qcycsXG4gIGVudHJ5UG9pbnQ6ICdhbmd1bGFyJyxcbiAgbGFiZWw6ICdBbmd1bGFyIEpTJ1xufSwge1xuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9tb2Rlcm5penIvMi44LjIvbW9kZXJuaXpyLmpzJyxcbiAgZW50cnlQb2ludDogJ01vZGVybml6cidcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvaGFuZGxlYmFycy5qcy8xLjEuMi9oYW5kbGViYXJzLmpzJyxcbiAgZW50cnlQb2ludDogJ0hhbmRsZWJhcnMnXG59LCB7XG4gIGxhYmVsOiAnRW1iZXJKUycsXG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuMS9qcXVlcnkubWluLmpzfC8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2hhbmRsZWJhcnMuanMvMS4xLjIvaGFuZGxlYmFycy5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9lbWJlci5qcy8xLjYuMS9lbWJlci5qcycsXG4gIGVudHJ5UG9pbnQ6ICdFbWJlcicsXG4gIGZvcmJpZGRlblRva2VuczogJ2dsb2JhbDokfGdsb2JhbDpIYW5kbGViYXJzfHBvam92aXo6YnVpbHRJbnxnbG9iYWw6d2luZG93fGdsb2JhbDpkb2N1bWVudCdcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvbG9kYXNoLmpzLzIuNC4xL2xvZGFzaC5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9iYWNrYm9uZS5qcy8xLjEuMi9iYWNrYm9uZS5qcycsXG4gIGVudHJ5UG9pbnQ6ICdCYWNrYm9uZSdcbn0sIHtcbiAgbGFiZWw6ICdNYXJpb25ldHRlLmpzJyxcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS4xL2pxdWVyeS5taW4uanN8Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvbG9kYXNoLmpzLzIuNC4xL2xvZGFzaC5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9iYWNrYm9uZS5qcy8xLjEuMi9iYWNrYm9uZS5qc3xodHRwOi8vbWFyaW9uZXR0ZWpzLmNvbS9kb3dubG9hZHMvYmFja2JvbmUubWFyaW9uZXR0ZS5qcycsXG4gIGVudHJ5UG9pbnQ6ICdNYXJpb25ldHRlJ1xufV07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4vaGFzaEtleScpO1xuXG5mdW5jdGlvbiBIYXNoTWFwKCkge1xufVxuXG5IYXNoTWFwLnByb3RvdHlwZSA9IHtcbiAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXNbaGFzaEtleShrZXkpXSA9ICh2YWx1ZSB8fCBrZXkpO1xuICB9LFxuICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpc1toYXNoS2V5KGtleSldO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgdiA9IHRoaXNbaGFzaEtleShrZXkpXTtcbiAgICBkZWxldGUgdGhpc1toYXNoS2V5KGtleSldO1xuICAgIHJldHVybiB2O1xuICB9LFxuICBlbXB0eTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwLFxuICAgICAgICBtZSA9IHRoaXM7XG4gICAgZm9yIChwIGluIG1lKSB7XG4gICAgICBpZiAobWUuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vLyBhbGlhc1xuSGFzaE1hcC5wcm90b3R5cGUuc2V0ID0gSGFzaE1hcC5wcm90b3R5cGUucHV0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhhc2hNYXA7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8nKTtcbnZhciBtZSwgaGFzaEtleTtcbi8qKlxuICogR2V0cyBhIHN0b3JlIGhhc2hrZXkgb25seSBpZiBpdCdzIGFuIG9iamVjdFxuICogQHBhcmFtICB7W3R5cGVdfSBvYmpcbiAqIEByZXR1cm4ge1t0eXBlXX1cbiAqL1xuZnVuY3Rpb24gZ2V0KG9iaikge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIG1lLmhpZGRlbktleSkgJiZcbiAgICBvYmpbbWUuaGlkZGVuS2V5XTtcbn1cblxuLyoqXG4gKiBUT0RPOiBkb2N1bWVudFxuICogU2V0cyBhIGtleSBvbiBhbiBvYmplY3RcbiAqIEBwYXJhbSB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtbdHlwZV19IGtleSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIHNldChvYmosIGtleSkge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaiksICdvYmogbXVzdCBiZSBhbiBvYmplY3R8ZnVuY3Rpb24nKTtcbiAgYXNzZXJ0KFxuICAgIGtleSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyxcbiAgICAnVGhlIGtleSBuZWVkcyB0byBiZSBhIHZhbGlkIHN0cmluZydcbiAgKTtcbiAgdmFyIHZhbHVlO1xuICBpZiAoIWdldChvYmopKSB7XG4gICAgdmFsdWUgPSB0eXBlb2Ygb2JqICsgJy0nICsga2V5O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG1lLmhpZGRlbktleSwge1xuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gICAgaWYgKCFvYmpbbWUuaGlkZGVuS2V5XSkge1xuICAgICAgY29uc29sZS53YXJuKCdPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlkIG5vdCB3b3JrISBzZXR0aW5nIHRoZSB2YWx1ZSBvbiB0aGUgb2JqZWN0IGRpcmVjdGx5Jyk7XG4gICAgICBvYmpbbWUuaGlkZGVuS2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICBhc3NlcnQob2JqW21lLmhpZGRlbktleV0sICdPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlkIG5vdCB3b3JrIScpO1xuICB9XG4gIHJldHVybiBtZTtcbn1cblxubWUgPSBoYXNoS2V5ID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHVpZCA9IHY7XG4gIGlmICh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odikpIHtcbiAgICBpZiAoIWdldCh2KSkge1xuICAgICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iodik7XG4gICAgfVxuICAgIHVpZCA9IGdldCh2KTtcbiAgICBpZiAoIXVpZCkge1xuICAgICAgdGhyb3cgRXJyb3IodiArICcgc2hvdWxkIGhhdmUgYSBoYXNoS2V5IGF0IHRoaXMgcG9pbnQgOignKTtcbiAgICB9XG4gICAgYXNzZXJ0KHVpZCwgJ2Vycm9yIGdldHRpbmcgdGhlIGtleScpO1xuICAgIHJldHVybiB1aWQ7XG4gIH1cblxuICAvLyB2IGlzIGEgcHJpbWl0aXZlXG4gIHJldHVybiB0eXBlb2YgdiArICctJyArIHVpZDtcbn07XG5cbm1lLmhpZGRlbktleSA9ICdfX3Bvam92aXpLZXlfXyc7XG5cbm1lLmNyZWF0ZUhhc2hLZXlzRm9yID0gZnVuY3Rpb24gKG9iaiwgbmFtZSkge1xuXG4gIGZ1bmN0aW9uIGxvY2FsVG9TdHJpbmcob2JqKSB7XG4gICAgdmFyIG1hdGNoO1xuICAgIHRyeSB7XG4gICAgICBtYXRjaCA9IHt9LnRvU3RyaW5nLmNhbGwob2JqKS5tYXRjaCgvXlxcW29iamVjdCAoXFxTKj8pXFxdLyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emUgdGhlIGludGVybmFsIHByb3BlcnR5IFtbQ2xhc3NdXSB0byBndWVzcyB0aGUgbmFtZVxuICAgKiBvZiB0aGlzIG9iamVjdCwgZS5nLiBbb2JqZWN0IERhdGVdLCBbb2JqZWN0IE1hdGhdXG4gICAqIE1hbnkgb2JqZWN0IHdpbGwgZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgKHRoZXkgd2lsbCBtYXRjaCBbb2JqZWN0IE9iamVjdF0pXG4gICAqIHNvIGxldCdzIGNvbnNpZGVyIE9iamVjdCBhcyB0aGUgbmFtZSBvbmx5IGlmIGl0J3MgZXF1YWwgdG9cbiAgICogT2JqZWN0LnByb3RvdHlwZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBvYmpcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGZ1bmN0aW9uIGhhc0FDbGFzc05hbWUob2JqKSB7XG4gICAgdmFyIG1hdGNoID0gbG9jYWxUb1N0cmluZyhvYmopO1xuICAgIGlmIChtYXRjaCA9PT0gJ09iamVjdCcpIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdC5wcm90b3R5cGUgJiYgJ09iamVjdCc7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5hbWUob2JqKSB7XG4gICAgdmFyIG5hbWUsIGNsYXNzTmFtZTtcblxuICAgIC8vIHJldHVybiB0aGUgYWxyZWFkeSBnZW5lcmF0ZWQgaGFzaEtleVxuICAgIGlmIChnZXQob2JqKSkge1xuICAgICAgcmV0dXJuIGdldChvYmopO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGEgbmV3IGtleSBiYXNlZCBvblxuICAgIC8vIC0gdGhlIG5hbWUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gICAgLy8gLSBhIHVuaXF1ZSBpZFxuICAgIG5hbWUgPSB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmXG4gICAgICB0eXBlb2Ygb2JqLm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICBvYmoubmFtZTtcblxuICAgIGNsYXNzTmFtZSA9IGhhc0FDbGFzc05hbWUob2JqKTtcbiAgICBpZiAoIW5hbWUgJiYgY2xhc3NOYW1lKSB7XG4gICAgICBuYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cblxuICAgIG5hbWUgPSBuYW1lIHx8IF8udW5pcXVlSWQoKTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIHRoZSBuYW1lIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQgbmFtZSBvciB0aGVcbiAgLy8gZ2VuZXJhdGVkIG5hbWVcbiAgbmFtZSA9IG5hbWUgfHwgZ2V0TmFtZShvYmopO1xuICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFwuIF0vaW1nLCAnLScpO1xuXG4gIC8vIGlmIHRoZSBvYmogaXMgYSBwcm90b3R5cGUgdGhlbiB0cnkgdG8gYW5hbHl6ZVxuICAvLyB0aGUgY29uc3RydWN0b3IgZmlyc3Qgc28gdGhhdCB0aGUgcHJvdG90eXBlIGJlY29tZXNcbiAgLy8gW25hbWVdLnByb3RvdHlwZVxuICAvLyBzcGVjaWFsIGNhc2U6IG9iamVjdC5jb25zdHJ1Y3RvciA9IG9iamVjdFxuICBpZiAob2JqLmhhc093blByb3BlcnR5ICYmXG4gICAgICBvYmouaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3RvciAhPT0gb2JqKSB7XG4gICAgbWUuY3JlYXRlSGFzaEtleXNGb3Iob2JqLmNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIC8vIHNldCBuYW1lIG9uIHNlbGZcbiAgc2V0KG9iaiwgbmFtZSk7XG5cbiAgLy8gc2V0IG5hbWUgb24gdGhlIHByb3RvdHlwZVxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmhhc093blByb3BlcnR5KCdwcm90b3R5cGUnKSkge1xuICAgIHNldChvYmoucHJvdG90eXBlLCBuYW1lICsgJy1wcm90b3R5cGUnKTtcbiAgfVxufTtcblxubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHYuaGFzT3duUHJvcGVydHkgJiZcbiAgICB2Lmhhc093blByb3BlcnR5KG1lLmhpZGRlbktleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZnVuY3Rpb24gdHlwZSh2KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikuc2xpY2UoOCwgLTEpO1xufVxuXG52YXIgdXRpbHMgPSB7fTtcblxuLyoqXG4gKiBBZnRlciBjYWxsaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCB3aXRoIGB2YCBhcyB0aGUgc2NvcGVcbiAqIHRoZSByZXR1cm4gdmFsdWUgd291bGQgYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgJ1tPYmplY3QgJyxcbiAqIGNsYXNzIGFuZCAnXScsIGBjbGFzc2AgaXMgdGhlIHJldHVybmluZyB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKlxuICogZS5nLiAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXSkgPT0gW29iamVjdCBBcnJheV0sXG4gKiAgICAgICAgdGhlIHJldHVybmluZyB2YWx1ZSBpcyB0aGUgc3RyaW5nIEFycmF5XG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG51dGlscy5pbnRlcm5hbENsYXNzUHJvcGVydHkgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdHlwZSh2KTtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiAhIXYgJiYgdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGFuIG9iamVjdCwgdGhlIGxpYnJhcnkgb25seSBuZWVkc1xuICogdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2YgcHJpbWl0aXZlIHR5cGVzIChubyBuZWVkIHRvXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBvYmplY3RzKVxuICpcbiAqIE5PVEU6IGEgZnVuY3Rpb24gd2lsbCBub3QgcGFzcyB0aGlzIHRlc3RcbiAqIGkuZS5cbiAqICAgICAgICB1dGlscy5pc09iamVjdChmdW5jdGlvbigpIHt9KSBpcyBmYWxzZSFcbiAqXG4gKiBTcGVjaWFsIHZhbHVlcyB3aG9zZSBgdHlwZW9mYCByZXN1bHRzIGluIGFuIG9iamVjdDpcbiAqIC0gbnVsbFxuICpcbiAqIEBwYXJhbSAgeyp9ICB2IFRoZSB2YWx1ZSB0byBiZSBjaGVja2VkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3QgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnb2JqZWN0Jztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbiAobm90ZSB0aGF0IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnkgQXJyYXlzIGFyZSBub3Qgb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0geyp9IHZcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG51dGlscy5pc09iamVjdE9yRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3QodikgfHwgdXRpbHMuaXNGdW5jdGlvbih2KTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyB0cmF2ZXJzYWJsZSwgZm9yIHRoZSBzYWtlIG9mIHRoZSBsaWJyYXJ5IGFuXG4gKiBvYmplY3QgKHdoaWNoIGlzIG5vdCBhbiBhcnJheSkgb3IgYSBmdW5jdGlvbiBpcyB0cmF2ZXJzYWJsZSwgc2luY2UgdGhpcyBmdW5jdGlvblxuICogaXMgdXNlZCBieSB0aGUgb2JqZWN0IGFuYWx5emVyIG92ZXJyaWRpbmcgaXQgd2lsbCBkZXRlcm1pbmUgd2hpY2ggb2JqZWN0c1xuICogYXJlIHRyYXZlcnNhYmxlXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNUcmF2ZXJzYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB1dGlscy5pc09iamVjdE9yRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzcGVjaWFsIGZ1bmN0aW9uIHdoaWNoIGlzIGFibGUgdG8gZXhlY3V0ZSBhIHNlcmllcyBvZiBmdW5jdGlvbnMgdGhyb3VnaFxuICogY2hhaW5pbmcsIHRvIHJ1biBhbGwgdGhlIGZ1bmN0aW9ucyBzdG9yZWQgaW4gdGhlIGNoYWluIGV4ZWN1dGUgdGhlIHJlc3VsdGluZyB2YWx1ZVxuICpcbiAqIC0gZWFjaCBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggdGhlIG9yaWdpbmFsIGFyZ3VtZW50cyB3aGljaCBgZnVuY3Rpb25DaGFpbmAgd2FzXG4gKiBpbnZva2VkIHdpdGggKyB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIHRoZSBsYXN0IG9wZXJhdGlvbiBhcyB0aGUgbGFzdCBhcmd1bWVudFxuICogLSB0aGUgc2NvcGUgb2YgZWFjaCBmdW5jdGlvbiBpcyB0aGUgc2FtZSBzY29wZSBhcyB0aGUgb25lIHRoYXQgdGhlIHJlc3VsdGluZ1xuICogZnVuY3Rpb24gd2lsbCBoYXZlXG4gKlxuICogICAgdmFyIGZucyA9IHV0aWxzLmZ1bmN0aW9uQ2hhaW4oKVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ2ZpcnN0JztcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICAgICAgICAgICAgICAuY2hhaW4oZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAqICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7XG4gKiAgICAgICAgICAgICAgICAgIHJldHVybiAnc2Vjb25kO1xuICogICAgICAgICAgICAgICAgfSlcbiAqICAgIGZucygxLCAyKTsgIC8vIHJldHVybnMgJ3NlY29uZCdcbiAqICAgIC8vIGxvZ3MgMSwgMlxuICogICAgLy8gbG9ncyAxLCAyLCAnZmlyc3QnXG4gKlxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG51dGlscy5mdW5jdGlvbkNoYWluID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhY2sgPSBbXTtcbiAgdmFyIGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHZhbHVlID0gc3RhY2tbaV0uYXBwbHkodGhpcywgYXJncy5jb25jYXQodmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuICBpbm5lci5jaGFpbiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgc3RhY2sucHVzaCh2KTtcbiAgICByZXR1cm4gaW5uZXI7XG4gIH07XG4gIHJldHVybiBpbm5lcjtcbn07XG5cbnV0aWxzLmNyZWF0ZUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGV0YWlscykge1xuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgIGRldGFpbDogZGV0YWlsc1xuICB9KTtcbn07XG51dGlscy5ub3RpZmljYXRpb24gPSBmdW5jdGlvbiAobWVzc2FnZSwgY29uc29sZVRvbykge1xuICB2YXIgZXYgPSB1dGlscy5jcmVhdGVFdmVudCgncG9qb3Zpei1ub3RpZmljYXRpb24nLCBtZXNzYWdlKTtcbiAgY29uc29sZVRvbyAmJiBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldik7XG59O1xudXRpbHMuY3JlYXRlSnNvbnBDYWxsYmFjayA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQuc3JjID0gdXJsO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59O1xudXRpbHMudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHMgPSAnJyxcbiAgICBpID0gMDtcbiAgXy5mb3JPd24ob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgIGlmIChpKSB7XG4gICAgICBzICs9ICcmJztcbiAgICB9XG4gICAgcyArPSBrICsgJz0nICsgdjtcbiAgICBpICs9IDE7XG4gIH0pO1xuICByZXR1cm4gcztcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogR2l2ZW4gYSBwcm9wZXJ0eSBuYW1lIHRoaXMgbWV0aG9kIGlkZW50aWZpZXMgaWYgaXQncyBhIHZhbGlkIHByb3BlcnR5IGZvciB0aGUgc2FrZVxuICogb2YgdGhlIGxpYnJhcnksIGEgdmFsaWQgcHJvcGVydHkgaXMgYSBwcm9wZXJ0eSB3aGljaCBkb2VzIG5vdCBwcm92b2tlIGFuIGVycm9yXG4gKiB3aGVuIHRyeWluZyB0byBhY2Nlc3MgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gaXQgZnJvbSBhbnkgb2JqZWN0XG4gKlxuICogRm9yIGV4YW1wbGUgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgY29kZSBpbiBzdHJpY3QgbW9kZSB3aWxsIHlpZWxkIGFuIGVycm9yOlxuICpcbiAqICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkge307XG4gKiAgICBmbi5hcmd1bWVudHNcbiAqXG4gKiBTaW5jZSBhcmd1bWVudHMgaXMgcHJvaGliaXRlZCBpbiBzdHJpY3QgbW9kZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvU3RyaWN0X21vZGVcbiAqXG4gKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICovXG51dGlscy5vYmplY3RQcm9wZXJ0eUlzRm9yYmlkZGVuID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgdmFyIGtleTtcbiAgdmFyIHJ1bGVzID0gdXRpbHMucHJvcGVydHlGb3JiaWRkZW5SdWxlcztcbiAgZm9yIChrZXkgaW4gcnVsZXMpIHtcbiAgICBpZiAocnVsZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgaWYgKHJ1bGVzW2tleV0ob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKlxuICogTW9kaWZ5IHRoaXMgb2JqZWN0IHRvIGFkZC9yZW1vdmUgcnVsZXMgdGhhdCB3aWwgYmUgcnVuIGJ5XG4gKiAjb2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbiwgdG8gZGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgaXMgaW52YWxpZFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnV0aWxzLnByb3BlcnR5Rm9yYmlkZGVuUnVsZXMgPSB7XG4gIC8qKlxuICAgKiBgY2FsbGVyYCBhbmQgYGFyZ3VtZW50c2AgYXJlIGludmFsaWQgcHJvcGVydGllcyBvZiBhIGZ1bmN0aW9uIGluIHN0cmljdCBtb2RlXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIHN0cmljdE1vZGU6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24ob2JqZWN0KSkge1xuICAgICAgcmV0dXJuIHByb3BlcnR5ID09PSAnY2FsbGVyJyB8fCBwcm9wZXJ0eSA9PT0gJ2FyZ3VtZW50cyc7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogUHJvcGVydGllcyB0aGF0IHN0YXJ0IGFuZCBlbmQgd2l0aCBfXyBhcmUgc3BlY2lhbCBwcm9wZXJ0aWVzLFxuICAgKiBpbiBzb21lIGNhc2VzIHRoZXkgYXJlIHZhbGlkIChsaWtlIF9fcHJvdG9fXykgb3IgZGVwcmVjYXRlZFxuICAgKiBsaWtlIF9fZGVmaW5lR2V0dGVyX19cbiAgICpcbiAgICogZS5nLlxuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fcHJvdG9fX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19sb29rdXBHZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fbG9va3VwU2V0dGVyX19cbiAgICpcbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaGlkZGVuUHJvcGVydHk6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvXl9fLio/X18kLykgPiAtMTtcbiAgfSxcblxuICAvKipcbiAgICogQW5ndWxhciBoaWRkZW4gcHJvcGVydGllcyBzdGFydCBhbmQgZW5kIHdpdGggJCQsIGZvciB0aGUgc2FrZVxuICAgKiBvZiB0aGUgbGlicmFyeSB0aGVzZSBhcmUgaW52YWxpZCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGFuZ3VsYXJIaWRkZW5Qcm9wZXJ0eTogZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkuc2VhcmNoKC9eXFwkXFwkLio/XFwkXFwkJC8pID4gLTE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoZSBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0aGUgZm9sbG93aW5nIHN5bWJvbHMgYXJlIGZvcmJpZGRlbjpcbiAgICogWzorfiE+PD0vL1xcW1xcXUBcXC4gXVxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzeW1ib2xzOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL1s6K34hPjw9Ly9cXF1AXFwuIF0vKSA+IC0xO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyJdfQ==
