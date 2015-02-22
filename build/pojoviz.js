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
   * This method stringifies the properties of the object `obj`, to avoid
   * getting the JSON.stringify cyclic error let's delete some properties
   * that are know to be objects/functions
   *
   * @param  obj
   * @return {Array}
   */
  stringifyObjectProperties: function (obj) {
    var properties = this.getProperties(obj);
    // append the labels created with labeler
    var labels = labeler(obj);
    assert(labels.size(), 'object must have labels');
    properties.labels = labels.getValues();
    return properties;
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
      nodes = {},
      edges = {};
    if (me.debug) {
      console.log(me);
    }
    me.debug && console.time('stringify');
    _.forOwn(me.items, function (v) {
      var hk = hashKey(v);
      nodes[hk] = me.stringifyObjectProperties(v);
      edges[hk] = me.stringifyObjectLinks(v);
    });
    if (me.debug) {
      console.log('nodes', nodes);
      console.log('edges', edges);
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInNyYy9JbnNwZWN0ZWRJbnN0YW5jZXMuanMiLCJzcmMvT2JqZWN0QW5hbHl6ZXIuanMiLCJzcmMvYW5hbHl6ZXIvQW5ndWxhci5qcyIsInNyYy9hbmFseXplci9CdWlsdEluLmpzIiwic3JjL2FuYWx5emVyL0dsb2JhbC5qcyIsInNyYy9hbmFseXplci9JbnNwZWN0b3IuanMiLCJzcmMvYW5hbHl6ZXIvT2JqZWN0LmpzIiwic3JjL3NjaGVtYXMvaHVnZVNjaGVtYXMuanMiLCJzcmMvc2NoZW1hcy9pbmRleC5qcyIsInNyYy9zY2hlbWFzL2tub3duU2NoZW1hcy5qcyIsInNyYy9zY2hlbWFzL215TGlicmFyaWVzLmpzIiwic3JjL3NjaGVtYXMvbm90YWJsZUxpYnJhcmllcy5qcyIsInNyYy91dGlsL0hhc2hNYXAuanMiLCJzcmMvdXRpbC9oYXNoS2V5LmpzIiwic3JjL3V0aWwvaW5kZXguanMiLCJzcmMvdXRpbC9sYWJlbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ250QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3plQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWwvJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5cbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL2FuYWx5emVyL0luc3BlY3RvcicpO1xudmFyIEluc3BlY3RlZEluc3RhbmNlcyA9IHJlcXVpcmUoJy4vSW5zcGVjdGVkSW5zdGFuY2VzJyk7XG5cbi8vIGVuYWJsZSBwcm9taXNlIGNoYWluIGRlYnVnXG5RLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xuXG52YXIgaW5zcGVjdG9yLCBvbGRJbnNwZWN0b3I7XG52YXIgcG9qb3ZpejtcblxuLy8gcHVibGljIGFwaVxucG9qb3ZpeiA9IHtcbiAgLyoqXG4gICAqIENsZWFycyB0aGUgaW5zcGVjdG9yIHZhcmlhYmxlXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHVuc2V0SW5zcGVjdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgb2xkSW5zcGVjdG9yID0gaW5zcGVjdG9yO1xuICAgIGluc3BlY3RvciA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGluc3BlY3RvciAoc2V0IHRocm91Z2ggI3NldEN1cnJlbnRJbnNwZWN0b3IpXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0Q3VycmVudEluc3BlY3RvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBpbnNwZWN0b3I7XG4gIH0sXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIG9mIGFcbiAgICogcG9zc2libGUgbmV3IGluc3RhbmNlIG9mIEluc3BlY3RvciwgdGhpcyBtZXRob2QgY2hlY2tzIGlmIHRoZXJlJ3NcbiAgICogYWxyZWFkeSBhbiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGRpc3BsYXlOYW1lL2VudHJ5UG9pbnQgdG8gYXZvaWRcbiAgICogY3JlYXRpbmcgbW9yZSBJbnN0YW5jZXMgb2YgdGhlIHNhbWUgdHlwZSwgY2FsbHMgdGhlIGhvb2tcbiAgICogYG1vZGlmeUluc3RhbmNlYCBhZnRlciB0aGUgaW5zcGVjdG9yIGlzIHJldHJpZXZlZC9jcmVhdGVkXG4gICAqXG4gICAqIEBwYXJhbSB7Y29uZmlnfSBvcHRpb25zIE9wdGlvbnMgcGFzc2VkIHRvIGFuIEluc3BlY3RvciBpbnN0YW5jZVxuICAgKiBpZiB0aGUgZW50cnlQb2ludC9kaXNwbGF5TmFtZSB3YXNuJ3QgY3JlYXRlZCB5ZXQgaW5cbiAgICogSW5zcGVjdG9ySW5zdGFuY2VzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcnVuOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGFzc2VydChvcHRpb25zKTtcbiAgICB2YXIgZW50cnlQb2ludCA9IG9wdGlvbnMuZGlzcGxheU5hbWUgfHwgb3B0aW9ucy5lbnRyeVBvaW50O1xuICAgIGFzc2VydChlbnRyeVBvaW50KTtcbiAgICBvbGRJbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG4gICAgaW5zcGVjdG9yID0gSW5zcGVjdGVkSW5zdGFuY2VzW2VudHJ5UG9pbnRdO1xuXG4gICAgaWYgKCFpbnNwZWN0b3IpIHtcbiAgICAgIGluc3BlY3RvciA9IEluc3BlY3RlZEluc3RhbmNlcy5jcmVhdGUob3B0aW9ucyk7XG4gICAgfVxuICAgIGluc3BlY3Rvci5tb2RpZnlJbnN0YW5jZShvcHRpb25zKTtcbiAgICByZXR1cm4gaW5zcGVjdG9yLmluaXQoKTtcbiAgfSxcblxuICAvLyBleHBvc2UgaW5uZXIgbW9kdWxlc1xuICBPYmplY3RBbmFseXplcjogcmVxdWlyZSgnLi9PYmplY3RBbmFseXplcicpLFxuICBJbnNwZWN0ZWRJbnN0YW5jZXM6IEluc3BlY3RlZEluc3RhbmNlcyxcbiAgYW5hbHl6ZXI6IHtcbiAgICBJbnNwZWN0b3I6IEluc3BlY3RvclxuICB9LFxuICBJbnNwZWN0b3I6IEluc3BlY3RvcixcbiAgdXRpbHM6IHJlcXVpcmUoJy4vdXRpbCcpLFxuXG4gIC8vIGtub3duIGNvbmZpZ3VyYXRpb25zXG4gIHNjaGVtYXM6IHJlcXVpcmUoJy4vc2NoZW1hcycpXG59O1xuXG4vLyBhbGlhc1xucG9qb3Zpei5zZXRDdXJyZW50SW5zcGVjdG9yID0gcG9qb3Zpei5ydW47XG5cbm1vZHVsZS5leHBvcnRzID0gcG9qb3ZpejsiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IHRydWU7XG4gICAgdmFyIGN1cnJlbnRRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xufVxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICBxdWV1ZS5wdXNoKGZ1bik7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBJbnNwZWN0b3IgPSByZXF1aXJlKCcuL2FuYWx5emVyL0luc3BlY3RvcicpO1xudmFyIFBPYmplY3QgPSByZXF1aXJlKCcuL2FuYWx5emVyL09iamVjdCcpO1xudmFyIEJ1aWx0SW4gPSByZXF1aXJlKCcuL2FuYWx5emVyL0J1aWx0SW4nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuL2FuYWx5emVyL0dsb2JhbCcpO1xudmFyIEFuZ3VsYXIgPSByZXF1aXJlKCcuL2FuYWx5emVyL0FuZ3VsYXInKTtcbnZhciBsaWJyYXJpZXM7XG5cbnZhciBwcm90byA9IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSW5zcGVjdG9yIHdpdGggYGNvbmZpZ2AgYXMgaXRzIGNvbmZpZ3VyYXRpb25cbiAgICogc2F2ZWQgaW4gYHRoaXNgIGFzIGBlbnRyeVBvaW50YFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjcmVhdGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIGRpc3BsYXlOYW1lID0gb3B0aW9ucy5kaXNwbGF5TmFtZSB8fCBvcHRpb25zLmVudHJ5UG9pbnQ7XG4gICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIGEgZ2VuZXJpYyBjb250YWluZXIgZm9yOiAnICsgZGlzcGxheU5hbWUsIG9wdGlvbnMpO1xuICAgIHJldHVybiAobGlicmFyaWVzW2Rpc3BsYXlOYW1lXSA9IG5ldyBJbnNwZWN0b3Iob3B0aW9ucykpO1xuICB9LFxuICAvKipcbiAgICogRXhlY3V0ZSBgZm5gIHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIHNhdmVkIGluIGB0aGlzYFxuICAgKiBAcGFyYW0gZm5cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgYWxsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICBfLmZvck93bihsaWJyYXJpZXMsIGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLyoqXG4gICAqIE1hcmtzIGFsbCB0aGUgcHJvcGVydGllcyBzYXZlZCBpbiBgdGhpc2AgYXMgZGlydHlcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0RGlydHk6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFsbChmdW5jdGlvbiAodikge1xuICAgICAgdi5zZXREaXJ0eSgpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuXG5saWJyYXJpZXMgPSBPYmplY3QuY3JlYXRlKHByb3RvKTtcbi8vY29uc29sZS5sb2cobGlicmFyaWVzKTtcbl8ubWVyZ2UobGlicmFyaWVzLCB7XG4gIG9iamVjdDogbmV3IFBPYmplY3Qoe1xuICAgIGRpc3BsYXlOYW1lOiAnT2JqZWN0J1xuICB9KSxcbiAgYnVpbHRJbjogbmV3IEJ1aWx0SW4oe1xuICAgIGRpc3BsYXlOYW1lOiAnQnVpbHQgSW4nXG4gIH0pLFxuICBnbG9iYWw6IG5ldyBHbG9iYWwoKSxcbiAgLy9wb3B1bGFyXG4gIGFuZ3VsYXI6IG5ldyBBbmd1bGFyKClcbiAgLy9odWdlXG4gIC8vdGhyZWU6IG5ldyBJbnNwZWN0b3Ioe1xuICAvLyAgZW50cnlQb2ludDogJ1RIUkVFJyxcbiAgLy8gIGFsd2F5c0RpcnR5OiB0cnVlXG4gIC8vfSlcbn0pO1xuXG5JbnNwZWN0b3IuaW5zdGFuY2VzID0gbGlicmFyaWVzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpYnJhcmllcztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcblxudmFyIEhhc2hNYXAgPSByZXF1aXJlKCcuL3V0aWwvSGFzaE1hcCcpO1xudmFyIGhhc2hLZXkgPSByZXF1aXJlKCcuL3V0aWwvaGFzaEtleScpO1xudmFyIGxhYmVsZXIgPSByZXF1aXJlKCcuL3V0aWwvbGFiZWxlcicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogR2l2ZW4gYW4gb2JqZWN0IGBvYmpgLCB0aGlzIGZ1bmN0aW9uIGV4ZWN1dGVzIGBmbmAgb25seSBpZiBgb2JqYCBpc1xuICogYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb24sIGlmIGl0J3MgYSBmdW5jdGlvbiB0aGVuIGBvYmoucHJvdG90eXBlYCBpcyBhbmFseXplZFxuICogaWYgaXQgZXhpc3RzIHRoZW4gaXQgd2lsbCBleGVjdXRlIGBmbmAgYWdhaW5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIG9ubHkgYXJndW1lbnQgd2hpY2ggZm4gaXMgZXhlY3V0ZWQgd2l0aCBpcyBvYmogZm9yIHRoZSBmaXJzdFxuICogY2FsbCBhbmQgb2JqLnByb3RvdHlwZSBmb3IgdGhlIHNlY29uZCBjYWxsIGlmIGl0J3MgcG9zc2libGVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIHdpdGggb2JqL29iai5wcm90b3R5cGUgYWNjb3JkaW5nXG4gKiB0byB0aGUgcnVsZXMgY2l0ZWQgYWJvdmVcbiAqL1xuZnVuY3Rpb24gd2l0aEZ1bmN0aW9uQW5kUHJvdG90eXBlKG9iaiwgZm4pIHtcbiAgaWYgKHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopKSB7XG4gICAgZm4ob2JqKTtcbiAgICBpZiAodXRpbHMuaXNGdW5jdGlvbihvYmopICYmXG4gICAgICAgIHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmoucHJvdG90eXBlKSkge1xuICAgICAgZm4ob2JqLnByb3RvdHlwZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQ2xhc3MgQW5hbHl6ZXIsIHNhdmVzIG9iamVjdHMgaW4gYW4gaW50ZXJuYWwgSGFzaE1hcCBhZnRlciBkb2luZ1xuICogYSBkZnMgdHJhdmVyc2FsIG9mIGEgc291cmNlIG9iamVjdCB0aHJvdWdoIGl0cyBgYWRkYCBtZXRob2QuXG4gKlxuICogV2hlbmV2ZXIgYSBncmFwaCBuZWVkcyB0byBiZSBhbmFseXplZCBhbiBpbnN0YW5jZSBvZiBBbmFseXplciBpcyBjcmVhdGVkIGFuZFxuICogYSBkZnMgcm91dGluZSBpcyBydW4gc3RhcnRpbmcgKHByZXN1bWFibHkpIGluIHRoZSByb290IG5vZGU6XG4gKlxuICogZS5nLlxuICpcbiAqICAgICAgdmFyIGFuYWx5emVyID0gbmV3IEFuYWx5emVyKCk7XG4gKiAgICAgIGFuYWx5emVyLmFkZChbT2JqZWN0XSk7XG4gKlxuICogVGhlIGludGVybmFsIGhhc2hNYXAgd2lsbCBzYXZlIHRoZSBmb2xsb3dpbmcgdHJhdmVyc2FibGUgdmFsdWVzOlxuICpcbiAqIC0gT2JqZWN0XG4gKiAtIE9iamVjdC5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdClcbiAqIC0gRnVuY3Rpb24gKFJlYWNoYWJsZSBmcm9tIEZ1bmN0aW9uLnByb3RvdHlwZSlcbiAqIC0gRnVuY3Rpb24ucHJvdG90eXBlIChSZWFjaGFibGUgZnJvbSBPYmplY3QgdGhyb3VnaCB0aGUgX19wcm90b19fIGxpbmspXG4gKlxuICogVGhlcmUgYXJlIHNvbWUgdHJvdWJsZXNvbWUgc3RydWN0dXJlcyBkbyB3aGljaCBpbmNsdWRlIGh1Z2Ugb2JqZWN0cyBsaWtlXG4gKiB3aW5kb3cgb3IgZG9jdW1lbnQsIHRvIGF2b2lkIGFuYWx5emluZyB0aGlzIGtpbmQgb2Ygb2JqZWN0cyB0aGUgYW5hbHl6ZXIgY2FuXG4gKiBiZSBpbnN0cnVjdGVkIHRvIGZvcmJpZCB0aGUgYWRkaXRpb24gb2Ygc29tZSBvYmplY3RzOlxuICpcbiAqIGUuZy5cbiAqXG4gKiAgICAgIHZhciBhbmFseXplciA9IG5ldyBBbmFseXplcigpO1xuICogICAgICBhbmFseXplci5mb3JiaWQoW0Z1bmN0aW9uXSlcbiAqICAgICAgYW5hbHl6ZXIuYWRkKFtcbiAqICAgICAgICBPYmplY3RcbiAqICAgICAgXSk7XG4gKlxuICogLSBPYmplY3RcbiAqIC0gT2JqZWN0LnByb3RvdHlwZSAoUmVhY2hhYmxlIGZyb20gT2JqZWN0KVxuICogLSBGdW5jdGlvbi5wcm90b3R5cGUgKFJlYWNoYWJsZSBmcm9tIE9iamVjdCB0aHJvdWdoIHRoZSBfX3Byb3RvX18gbGluaylcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5pdGVtcyA9IG5ldyBIYXNoTWFwXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcuZm9yYmlkZGVuID0gbmV3IEhhc2hNYXBdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5jYWNoZSA9IHRydWVdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy5sZXZlbHMgPSBBbmFseXplci5ERlNfTEVWRUxTXVxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWcudmlzaXRDb25zdHJ1Y3RvcnMgPSBBbmFseXplci5WSVNJVF9DT05TVFJVQ1RPUlNdXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZy52aXNpdFNpbXBsZUZ1bmN0aW9ucyA9IEFuYWx5emVyLlZJU0lUX1NJTVBMRV9GVU5DVElPTlNdXG4gKi9cbmZ1bmN0aW9uIEFuYWx5emVyKGNvbmZpZykge1xuICBjb25maWcgPSBfLm1lcmdlKF8uY2xvbmUoQW5hbHl6ZXIuREVGQVVMVF9DT05GSUcsIHRydWUpLCBjb25maWcpO1xuXG4gIC8qKlxuICAgKiBpdGVtcyByZWdpc3RlcmVkIGluIHRoaXMgaW5zdGFuY2VcbiAgICogQHR5cGUge0hhc2hNYXB9XG4gICAqL1xuICB0aGlzLml0ZW1zID0gY29uZmlnLml0ZW1zIHx8IG5ldyBIYXNoTWFwKCk7XG5cbiAgLyoqXG4gICAqIEZvcmJpZGRlbiBvYmplY3RzXG4gICAqIEB0eXBlIHtIYXNoTWFwfVxuICAgKi9cbiAgdGhpcy5mb3JiaWRkZW4gPSBjb25maWcuZm9yYmlkZGVuIHx8IG5ldyBIYXNoTWFwKCk7XG5cbiAgLyoqXG4gICAqIFByaW50IGRlYnVnIGluZm8gaW4gdGhlIGNvbnNvbGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRlYnVnID0gdHJ1ZTtcblxuICAvKipcbiAgICogVHJ1ZSB0byBzYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3RzIGFuYWx5emVkIGluIGFuXG4gICAqIGludGVybmFsIGNhY2hlXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbY2FjaGU9dHJ1ZV1cbiAgICovXG4gIHRoaXMuY2FjaGUgPSBjb25maWcuY2FjaGU7XG5cbiAgLyoqXG4gICAqIERmcyBsZXZlbHNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMubGV2ZWxzID0gY29uZmlnLmxldmVscztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGZ1bmN0aW9uIGNvbnN0cnVjdG9ycyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGhcbiAgICogaS5lLiB0aGUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhIHByb3RvdHlwZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGNmZyB7Ym9vbGVhbn0gW3Zpc2l0Q29uc3RydWN0b3JzPWZhbHNlXVxuICAgKi9cbiAgdGhpcy52aXNpdENvbnN0cnVjdG9ycyA9IGNvbmZpZy52aXNpdENvbnN0cnVjdG9ycztcblxuICAvKipcbiAgICogVHJ1ZSB0byBpbmNsdWRlIGFsbCB0aGUgZnVuY3Rpb25zIGluIHRoZSBhbmFseXNpcyBncmFwaCxcbiAgICogc2VlICN0cmF2ZXJzYWJsZU9iamVjdFByb3BlcnRpZXNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBjZmcge2Jvb2xlYW59IFt2aXNpdFNpbXBsZUZ1bmN0aW9ucz1mYWxzZV1cbiAgICovXG4gIHRoaXMudmlzaXRTaW1wbGVGdW5jdGlvbnMgPSBjb25maWcudmlzaXRTaW1wbGVGdW5jdGlvbnM7XG5cbiAgLyoqXG4gICAqIFRydWUgdG8gaW5jbHVkZSBhbGwgdGhlIGZ1bmN0aW9ucyBpbiB0aGUgYW5hbHlzaXMgZ3JhcGgsXG4gICAqIHNlZSAjdHJhdmVyc2FibGVPYmplY3RQcm9wZXJ0aWVzXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAY2ZnIHtib29sZWFufSBbdmlzaXRTaW1wbGVGdW5jdGlvbnM9ZmFsc2VdXG4gICAqL1xuICB0aGlzLnZpc2l0QXJyYXlzID0gY29uZmlnLnZpc2l0QXJyYXlzO1xuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBJbnRlcm5hbCBwcm9wZXJ0eSBjYWNoZSwgZWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBvYmplY3RzXG4gICAqIGdlbmVyYXRlZCBpbiAjZ2V0UHJvcGVydGllc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5fX29iamVjdHNDYWNoZV9fID0ge307XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEludGVybmFsIGxpbmtzIGNhY2hlLCBlYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIG9iamVjdHNcbiAgICogZ2VuZXJhdGVkIGluICNnZXRPd25MaW5rc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5fX2xpbmtzQ2FjaGVfXyA9IHt9O1xufVxuXG4vKipcbiAqIFRydWUgdG8gYWRkIGFuIGFkZGl0aW9uYWwgZmxhZyB0byB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllcyBvZiBhIG5vZGVcbiAqIGlmIHRoZSBub2RlIGlzIGEgY29uc3RydWN0b3JcbiAqIEB0eXBlIHtib29sZWFufVxuICovXG5BbmFseXplci5WSVNJVF9DT05TVFJVQ1RPUlMgPSB0cnVlO1xuXG4vKipcbiAqIFRydWUgdG8gdmlzaXQgc2ltcGxlIGZ1bmN0aW9ucyB3aGljaCBkb24ndCBoYXZlIGFkZGl0aW9uYWwgbGlua3MsIHNlZVxuICogI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllc1xuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbkFuYWx5emVyLlZJU0lUX1NJTVBMRV9GVU5DVElPTlMgPSBmYWxzZTtcblxuLyoqXG4gKiBUcnVlIHRvIHZpc2l0IGFycmF5c1xuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbkFuYWx5emVyLlZJU0lUX0FSUkFZUyA9IHRydWU7XG5cbi8qKlxuICogRGVmYXVsdCBudW1iZXIgb2YgbGV2ZWxzIHRvIGJlIGFuYWx5emVkIGJ5IHRoaXMgY29uc3RydWN0b3JcbiAqIEB0eXBlIHtudW1iZXJ9XG4gKi9cbkFuYWx5emVyLkRGU19MRVZFTFMgPSAxNTtcblxuLyoqXG4gKiBEZWZhdWx0IGNvbmZpZyB1c2VkIHdoZW5ldmVyIGFuIGluc3RhbmNlIG9mIEFuYWx5emVyIGlzIGNyZWF0ZWRcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkFuYWx5emVyLkRFRkFVTFRfQ09ORklHID0ge1xuICBjYWNoZTogdHJ1ZSxcbiAgdmlzaXRDb25zdHJ1Y3RvcnM6IEFuYWx5emVyLlZJU0lUX0NPTlNUUlVDVE9SUyxcbiAgdmlzaXRTaW1wbGVGdW5jdGlvbnM6IEFuYWx5emVyLlZJU0lUX1NJTVBMRV9GVU5DVElPTlMsXG4gIHZpc2l0QXJyYXlzOiBBbmFseXplci5WSVNJVF9BUlJBWVMsXG4gIGxldmVsczogQW5hbHl6ZXIuREZTX0xFVkVMU1xufTtcblxuQW5hbHl6ZXIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQW5hbHl6ZXIsXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgaW4gdGhlIGZvcmJpZGRlbiBoYXNoXG4gICAqIEBwYXJhbSAge09iamVjdH0gIG9ialxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNGb3JiaWRkZW46IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gdGhpcy5mb3JiaWRkZW4uZ2V0KG9iaik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIExldCBgdmFsdWVgIGJlIHRoZSByZXN1bHQgb2YgZXhlY3V0aW5nIG9ialtwcm9wZXJ0eV0sIHRoaXMgbWV0aG9kXG4gICAqIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYSBzdW1tYXJ5IG9mIHRoZSBwcm9wZXJ0aWVzIG9mIGB2YWx1ZWAgd2hpY2ggYXJlXG4gICAqIHVzZWZ1bCB0byBrbm93IGZvciB0aGUgYW5hbHl6ZXI6XG4gICAqXG4gICAqIC0gcGFyZW50ICAgICAgICAge3N0cmluZ30gdGhlIGhhc2hLZXkgb2YgdGhlIHBhcmVudFxuICAgKiAtIHByb3BlcnR5ICAgICAgIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB1c2VkIHRvIHJlYWNoIHZhbHVlLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBpLmUuIHBhcmVudFtwcm9wZXJ0eV0gPSB2YWx1ZVxuICAgKiAtIHZhbHVlICAgICAgICAgIHsqfSB0aGUgdmFsdWUgaXRzZWxmXG4gICAqIC0gdHlwZSAgICAgICAgICAge3N0cmluZ30gdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGB0eXBlb2YgdmFsdWVgXG4gICAqIC0gaXNUcmF2ZXJzYWJsZSAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyB0cmF2ZXJzYWJsZVxuICAgKiAtIGlzRnVuY3Rpb24gICAgIHtib29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYSBmdW5jdGlvblxuICAgKiAtIGlzT2JqZWN0ICAgICAgIHtib29sZWFufSB0cnVlIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0XG4gICAqIC0gdG9TdHJpbmcgICAgICAge3N0cmluZ30gdGhlIHJlc3VsdCBvZiBjYWxsaW5nIHt9LnRvU3RyaW5nIHdpdGggYHZhbHVlYFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gdmFsdWVcbiAgICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IHBhcmVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGJ1aWxkTm9kZVByb3BlcnRpZXM6IGZ1bmN0aW9uICh2YWx1ZSwgcGFyZW50LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXJlbnQ6IGhhc2hLZXkocGFyZW50KSxcbiAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgIC8vdmFsdWU6IHZhbHVlLFxuICAgICAgdHlwZTogdHlwZW9mIHZhbHVlLFxuICAgICAgaXNUcmF2ZXJzYWJsZTogdXRpbHMuaXNUcmF2ZXJzYWJsZSh2YWx1ZSksXG4gICAgICBpc0Z1bmN0aW9uOiB1dGlscy5pc0Z1bmN0aW9uKHZhbHVlKSxcbiAgICAgIGlzT2JqZWN0OiB1dGlscy5pc09iamVjdCh2YWx1ZSksXG4gICAgICB0b1N0cmluZzogdXRpbHMuaW50ZXJuYWxDbGFzc1Byb3BlcnR5KHZhbHVlKVxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHByb3BlcnRpZXMgdGhhdCBvYmpbcHJvcGVydHldIGhhcyB3aGljaCBhcmVcbiAgICogdXNlZnVsIGZvciBvdGhlciBtZXRob2RzIGxpa2UgI2dldFByb3BlcnRpZXMsIHRoZSBwcm9wZXJ0aWVzIGFyZVxuICAgKiByZXR1cm5lZCBpbiBhIHNpbXBsZSBvYmplY3QgYW5kIGFyZSB0aGUgb25lcyBkZWNsYXJlZCBpblxuICAgKiAjZ2V0Tm9kZVByb3BlcnRpZXNcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzIG1pZ2h0IGJlIHNldCBkZXBlbmRpbmcgb24gd2hhdCBgdmFsdWVgIGlzOlxuICAgKlxuICAgKiAtIHVucmVhY2hhYmxlICAgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgZXhlY3V0aW5nIGB2YWx1ZWBcbiAgICogLSBpc1NpbXBsZUZ1bmN0aW9uICAge2Jvb2xlYW59IHRydWUgaWYgYHZhbHVlYCBpcyBhIHNpbXBsZSBmdW5jdGlvblxuICAgKiAtIGlzQ29uc3RydWN0b3IgICAgICB7Ym9vbGVhbn0gdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgY29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIG9ialxuICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHRyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgcHJvcGVydHkpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciB2YWx1ZTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBvYmpbcHJvcGVydHldO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhcmVudDogaGFzaEtleShvYmopLFxuICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgIHVucmVhY2hhYmxlOiB0cnVlLFxuICAgICAgICBpc1RyYXZlcnNhYmxlOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gc2VsZiwgcGFyZW50LCBwcm9wZXJ0eVxuICAgIHZhciBwcm9wZXJ0aWVzID0gbWUuYnVpbGROb2RlUHJvcGVydGllcyh2YWx1ZSwgb2JqLCBwcm9wZXJ0eSk7XG5cbiAgICAvLyBpZiB0aGUgY3VycmVudCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIGFuZCBpdCdzIG5vdCBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgc2ltcGxlIGZ1bmN0aW9ucyBtYXJrIHRoZSBwcm9wZXJ0eSBhcyBub3QgdHJhdmVyc2FibGVcbiAgICBpZiAocHJvcGVydGllcy5pc0Z1bmN0aW9uICYmICF0aGlzLnZpc2l0U2ltcGxlRnVuY3Rpb25zKSB7XG4gICAgICB2YXIgb3duUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSBvd25Qcm9wZXJ0aWVzLmxlbmd0aDtcbiAgICAgIC8vIHRoZSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIGEgbm9ybWFsIGZ1bmN0aW9uIGhhcyBpcyA1XG4gICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIiwgXCJwcm90b3R5cGVcIl1cblxuICAgICAgLy8gYW4gYWRkaXRpb25hbCBwcm9wZXJ0eSByZXRyaWV2ZWQgaXMgdGhlIGhpZGRlbiBrZXkgdGhhdFxuICAgICAgLy8gdGhlIGhhc2ggZnVuY3Rpb24gbWF5IGhhdmUgYWxyZWFkeSBzZXRcbiAgICAgIGlmIChvd25Qcm9wZXJ0aWVzLmluZGV4T2YoaGFzaEtleS5oaWRkZW5LZXkpID4gLTEpIHtcbiAgICAgICAgLS1sZW5ndGg7XG4gICAgICB9XG4gICAgICAvLyBkaXNjYXJkIHRoZSBwcm90b3R5cGUgbGluayB0byBjb25zaWRlciBhIHByb3BlcnR5IHNpbXBsZVxuICAgICAgaWYgKG93blByb3BlcnRpZXMuaW5kZXhPZigncHJvdG90eXBlJykgPiAtMSkge1xuICAgICAgICAtLWxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChsZW5ndGggPD0gNCkge1xuICAgICAgICAvLyBpdCdzIHNpbXBsZSBpZiBpdCBvbmx5IGhhc1xuICAgICAgICAvLyAtIFtcImxlbmd0aFwiLCBcIm5hbWVcIiwgXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIl1cbiAgICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gZmFsc2U7XG4gICAgICAgIHByb3BlcnRpZXMuaXNTaW1wbGVGdW5jdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlIGN1cnJlbnQgcHJvcGVydHkgaXMgYSBmdW5jdGlvbiBhbmQgaXQncyBhbGxvd2VkIHRvXG4gICAgLy8gdmlzaXQgZnVuY3Rpb24gY29uc3RydWN0b3JzIHZlcmlmeSBpZiBgdmFsdWVgIGlzIGFcbiAgICAvLyBmdW5jdGlvbiBjb25zdHJ1Y3RvciAoaXQncyBuYW1lIG11c3QgYmUgY2FwaXRhbGl6ZWQgdG8gYmUgb25lKVxuICAgIGlmIChwcm9wZXJ0aWVzLmlzRnVuY3Rpb24gJiYgdGhpcy52aXNpdENvbnN0cnVjdG9ycykge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZS5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgIHZhbHVlLm5hbWUuc2VhcmNoKC9eW0EtWl0vKSA+IC0xKSB7XG4gICAgICAgIHByb3BlcnRpZXMuaXNUcmF2ZXJzYWJsZSA9IHRydWU7XG4gICAgICAgIHByb3BlcnRpZXMuaXNDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdmVyaWZpY2F0aW9uIG9mIHRoZSBmbGFnIHZpc2l0QXJyYXlzIHdoZW4gaXQncyBzZXQgdG8gZmFsc2VcbiAgICBpZiAocHJvcGVydGllcy50b1N0cmluZyA9PT0gJ0FycmF5JyAmJiAhdGhpcy52aXNpdEFycmF5cykge1xuICAgICAgcHJvcGVydGllcy5pc1RyYXZlcnNhYmxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBgb2JqYCwgZWFjaCBwcm9wZXJ0eSBpcyByZXR1cm5lZFxuICAgKiBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBzZXQgaW4gI3RyYXZlcnNhYmxlT2JqZWN0UHJvcGVydGllcyxcbiAgICogYWRkaXRpb25hbGx5IHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqIC0gaGlkZGVuICAgICAgIHtib29sZWFufSAodHJ1ZSBpZiBpdCdzIGEgaGlkZGVuIHByb3BlcnR5IGxpa2UgW1tQcm90b3R5cGVdXSlcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gW3RyYXZlcnNhYmxlT25seV0gVHJ1ZSB0byByZXR1cm4gb25seSB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgb2Ygb2JqZWN0cyB3aXRoIHRoZSBwcm9wZXJ0aWVzIGRlc2NyaWJlZCBhYm92ZVxuICAgKi9cbiAgZ2V0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaiwgdHJhdmVyc2FibGVPbmx5KSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB2YXIgaGsgPSBoYXNoS2V5KG9iaik7XG4gICAgdmFyIGFsbFByb3BlcnRpZXM7XG4gICAgdmFyIG5vZGVQcm9wZXJ0aWVzO1xuXG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHRocm93ICd0aGlzIG1ldGhvZCBuZWVkcyBhbiBvYmplY3QgdG8gYW5hbHl6ZSc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FjaGUpIHtcbiAgICAgIGlmICghdHJhdmVyc2FibGVPbmx5ICYmIHRoaXMuX19vYmplY3RzQ2FjaGVfX1toa10pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RzQ2FjaGVfX1toa107XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgcmV0dXJucyBhbiBhcnJheSBvZiBzdHJpbmdzXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydGllcyAoZW51bWVyYWJsZSBvciBub3QpXG4gICAgYWxsUHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaik7XG5cbiAgICBhbGxQcm9wZXJ0aWVzID0gYWxsUHJvcGVydGllc1xuICAgICAgLmZpbHRlcihmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgLy8gZmlsdGVyIG91dCBmb3JiaWRkZW4gcHJvcGVydGllc1xuICAgICAgICByZXR1cm4gIXV0aWxzLm9iamVjdFByb3BlcnR5SXNGb3JiaWRkZW4ob2JqLCBwcm9wZXJ0eSk7XG4gICAgICB9KVxuICAgICAgLm1hcChmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgLy8gb2J0YWluIGRldGFpbGVkIGluZm8gb2YgYWxsIHRoZSB2YWxpZCBwcm9wZXJ0aWVzXG4gICAgICAgIHJldHVybiBtZS50cmF2ZXJzYWJsZU9iamVjdFByb3BlcnRpZXMob2JqLCBwcm9wZXJ0eSk7XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAocHJvcGVydHlEZXNjcmlwdGlvbikge1xuICAgICAgICBpZiAodHJhdmVyc2FibGVPbmx5KSB7XG4gICAgICAgICAgLy8gZmlsdGVyIG91dCBub24gdHJhdmVyc2FibGUgcHJvcGVydGllc1xuICAgICAgICAgIHJldHVybiBwcm9wZXJ0eURlc2NyaXB0aW9uLmlzVHJhdmVyc2FibGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcblxuICAgIC8vIDxsYWJlbGVyPlxuICAgIC8vIHNldCBhIG5hbWUgb24gaXRzZWxmIGlmIGl0J3MgYSBjb25zdHJ1Y3RvclxuICAgIGxhYmVsZXIob2JqKTtcbiAgICAvLyBzZXQgYSBuYW1lIG9uIGVhY2ggcHJvcGVydHlcbiAgICBhbGxQcm9wZXJ0aWVzXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHlEZXNjcmlwdGlvbikge1xuICAgICAgICBsYWJlbGVyKG9iaiwgcHJvcGVydHlEZXNjcmlwdGlvbi5wcm9wZXJ0eSk7XG4gICAgICB9KTtcblxuICAgIC8vIHNwZWNpYWwgcHJvcGVydGllc1xuICAgIC8vIF9fcHJvdG9fX1xuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIGlmIChwcm90bykge1xuICAgICAgbm9kZVByb3BlcnRpZXMgPSBtZS5idWlsZE5vZGVQcm9wZXJ0aWVzKHByb3RvLCBvYmosICdbW1Byb3RvdHlwZV1dJyk7XG4gICAgICBub2RlUHJvcGVydGllcy5oaWRkZW4gPSB0cnVlO1xuICAgICAgYWxsUHJvcGVydGllcy5wdXNoKG5vZGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jYWNoZSAmJiAhdHJhdmVyc2FibGVPbmx5KSB7XG4gICAgICB0aGlzLl9fb2JqZWN0c0NhY2hlX19baGtdID0gYWxsUHJvcGVydGllcztcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsUHJvcGVydGllcztcbiAgfSxcblxuICAvKipcbiAgICogTWFpbiBERlMgcm91dGluZSwgaXQgYW5hbHl6ZXMgZWFjaCB0cmF2ZXJzYWJsZSBvYmplY3QgdW50aWxcbiAgICogdGhlIHJlY3Vyc2lvbiBsZXZlbCBoYXMgYmVlbiByZWFjaGVkIG9yIHRoZXJlIGFyZSBubyBvYmplY3RzXG4gICAqIHRvIGJlIGFuYWx5emVkXG4gICAqXG4gICAqIC0gZm9yIGVhY2ggb2JqZWN0IGluIGBvYmplY3RzYFxuICAgKiAgLSBpZiBpdCB3YXNuJ3QgYW5hbHl6ZWQgeWV0XG4gICAqICAtIGlmIGl0J3Mgbm90IGZvcmJpZGRlblxuICAgKiAgIC0gYWRkIHRoZSBpdGVtIHRvIHRoZSBpdGVtcyBIYXNoTWFwXG4gICAqICAgLSBmaW5kIGFsbCB0aGUgdHJhdmVyc2FibGUgcHJvcGVydGllc1xuICAgKiAgIC0gY2FsbCBgYW5hbHl6ZWAgb2JqZWN0IHdpdGggZWFjaCB0cmF2ZXJzYWJsZSBvYmplY3RcbiAgICogICAgIHRoYXQgY2FuIGJlIHJlYWNoZWQgZnJvbSB0aGUgY3VycmVudCBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtICB7QXJyYXl9IG9iamVjdHMgICAgICBBcnJheSBvZiBvYmplY3RzIHRvIGJlIGFuYWx5emVkXG4gICAqIEBwYXJhbSAge251bWJlcn0gY3VycmVudExldmVsIEN1cnJlbnQgZGZzIGxldmVsXG4gICAqL1xuICBhbmFseXplT2JqZWN0czogZnVuY3Rpb24gKG9iamVjdHMsIGN1cnJlbnRMZXZlbCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBtZS5sZXZlbHMpIHtcbiAgICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIW1lLml0ZW1zLmdldCh2KSAmJiAgICAgICAgICAgLy8gcmVnaXN0ZXJlZCBjaGVja1xuICAgICAgICAgICFtZS5pc0ZvcmJpZGRlbih2KSAgICAgICAgICAgIC8vIGZvcmJpZGRlbiBjaGVja1xuICAgICAgICApIHtcblxuICAgICAgICAgIC8vIGFkZCB0aGUgaXRlbSB0byB0aGUgcmVnaXN0ZXJlZCBpdGVtcyBwb29sXG4gICAgICAgICAgbWUuaXRlbXMucHV0KHYpO1xuXG4gICAgICAgICAgLy8gZGZzIHRvIHRoZSBuZXh0IGxldmVsXG4gICAgICAgICAgbWUuYW5hbHl6ZU9iamVjdHMoXG4gICAgICAgICAgICAvLyBnZXQgYWxsIHRoZSBsaW5rcyBvdXRnb2luZyBmcm9tIGB2YFxuICAgICAgICAgICAgbWUuZ2V0T3duTGlua3ModilcbiAgICAgICAgICAgICAgLy8gdG8gYW5hbHl6ZSB0aGUgdHJlZSBvbmx5IHRoZSBgdG9gIHByb3BlcnR5IGlzIG5lZWRlZFxuICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmsudG87XG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY3VycmVudExldmVsICsgMVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2l2ZW4gYW4gdHJhdmVyc2FibGUgb2JqZWN0IGBvYmpgLCB0aGlzIG1ldGhvZCByZXR1cm5zIGFuIGFycmF5IG9mIGRpcmVjdCB0cmF2ZXJzYWJsZVxuICAgKiBvYmplY3Qgd2hpY2ggY2FuIGJlIHJlYWNoZWQgZnJvbSBgb2JqYCwgZWFjaCBvYmplY3QgaGFzIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogLSBmcm9tICAgICB7b2JqZWN0fSAoYHRoaXNgKVxuICAgKiAtIGZyb21IYXNoIHtzdHJpbmd9IChmcm9tJ3MgaGFzaClcbiAgICogLSB0byAgICAgICB7b2JqZWN0fSAoYSByZWFjaGFibGUgdHJhdmVyc2FibGUgb2JqZWN0IGZyb20gYHRoaXNgKVxuICAgKiAtIHRvSGFzaCAgIHtzdHJpbmd9ICh0bydzIGhhc2gpXG4gICAqIC0gcHJvcGVydHkge3N0cmluZ30gKHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB3aGljaCBsaW5rcyBgZnJvbWAgd2l0aCBgdG9gLCBpLmUuXG4gICAqICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHldID0gdG8pXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgZ2V0T3duTGlua3M6IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBsaW5rcyA9IFtdO1xuICAgIHZhciBwcm9wZXJ0aWVzO1xuICAgIHZhciBuYW1lID0gaGFzaEtleShvYmopO1xuXG4gICAgLy8gPGRlYnVnPlxuICAgIC8vY29uc29sZS5sb2cobmFtZSk7XG4gICAgLy8gPC9kZWJ1Zz5cblxuICAgIGlmIChtZS5jYWNoZSAmJiBtZS5fX2xpbmtzQ2FjaGVfX1tuYW1lXSkge1xuICAgICAgcmV0dXJuIG1lLl9fbGlua3NDYWNoZV9fW25hbWVdO1xuICAgIH1cblxuICAgIC8vIGFyZ3M6XG4gICAgLy8gLSBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyB3aWxsIGJlIGFuYWx5emVkXG4gICAgLy8gLSB0cmF2ZXJzYWJsZSBwcm9wZXJ0aWVzIG9ubHlcbiAgICBwcm9wZXJ0aWVzID0gbWUuZ2V0UHJvcGVydGllcyhvYmosIHRydWUpO1xuXG4gICAgLy8gZ2l2ZW4gYW4gYG9iamAgbGV0J3MgZmluZCBvdXQgaWYgaXQgaGFzIGEgaGFzaCBvciBub3RcbiAgICAvLyBpZiBpdCBkb2Vzbid0IGhhdmUgYSBoYXNoIHRoZW4gd2UgaGF2ZSB0byBhbmFseXplIHRoZSBuYW1lIG9mXG4gICAgLy8gdGhlIHByb3BlcnR5IHdoaWNoIHdoZW4gYXBwbGllZCBvbiBhbiBleHRlcm5hbCBvYmplY3RzIGdpdmVzIG9ialxuICAgIC8vXG4gICAgLy8gaXQncyBub3QgbmVlZGVkIHRvIHNldCBhIGhhc2ggZm9yIGBwcm90b3R5cGVgIG9yIGBjb25zdHJ1Y3RvcmBcbiAgICAvLyBzaW5jZSB0aGUgaGFzaEtleSBmdW5jdGlvbiB0YWtlcyBjYXJlIG9mIGFzc2lnbmluZyBpdFxuICAgIGZ1bmN0aW9uIGdldEF1Z21lbnRlZEhhc2gob2JqLCBuYW1lKSB7XG4gICAgICBpZiAoIWhhc2hLZXkuaGFzKG9iaikgJiZcbiAgICAgICAgICBuYW1lICE9PSAncHJvdG90eXBlJyAmJlxuICAgICAgICAgIG5hbWUgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgICAgaGFzaEtleS5jcmVhdGVIYXNoS2V5c0ZvcihvYmosIG5hbWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc2hLZXkob2JqKTtcbiAgICB9XG5cbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHRocm93ICd0aGUgb2JqZWN0IG5lZWRzIHRvIGhhdmUgYSBoYXNoa2V5JztcbiAgICB9XG5cbiAgICBwcm9wZXJ0aWVzXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICAgIC8vIGRlc2MucHJvcGVydHkgbWlnaHQgYmUgW1tQcm90b3R5cGVdXSwgc2luY2Ugb2JqW1wiW1tQcm90b3R5cGVdXVwiXVxuICAgICAgICAvLyBkb2Vzbid0IGV4aXN0IGl0J3Mgbm90IHZhbGlkIGEgcHJvcGVydHkgdG8gYmUgYWNjZXNzZWRcbiAgICAgICAgcmV0dXJuIGRlc2MucHJvcGVydHkgIT09ICdbW1Byb3RvdHlwZV1dJztcbiAgICAgIH0pXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbiAoZGVzYykge1xuICAgICAgICB2YXIgcmVmID0gb2JqW2Rlc2MucHJvcGVydHldO1xuICAgICAgICBhc3NlcnQocmVmLCAnb2JqW3Byb3BlcnR5XSBzaG91bGQgZXhpc3QnKTtcbiAgICAgICAgLy8gaWYgdGhlIG9iamVjdCBkb2Vzbid0IGhhdmUgYSBoYXNoS2V5XG4gICAgICAgIC8vIGxldCdzIGdpdmUgaXQgYSBuYW1lIGVxdWFsIHRvIHRoZSBwcm9wZXJ0eSBiZWluZyBhbmFseXplZFxuICAgICAgICAvL2dldEF1Z21lbnRlZEhhc2gocmVmLCBkZXNjLnByb3BlcnR5KTtcblxuICAgICAgICBpZiAoIW1lLmlzRm9yYmlkZGVuKHJlZikpIHtcbiAgICAgICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgICAgIGZyb206IG9iaixcbiAgICAgICAgICAgIGZyb21IYXNoOiBoYXNoS2V5KG9iaiksXG4gICAgICAgICAgICB0bzogcmVmLFxuICAgICAgICAgICAgdG9IYXNoOiBoYXNoS2V5KHJlZiksXG4gICAgICAgICAgICBwcm9wZXJ0eTogZGVzYy5wcm9wZXJ0eVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIGlmIChwcm90byAmJiAhbWUuaXNGb3JiaWRkZW4ocHJvdG8pKSB7XG4gICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgZnJvbTogb2JqLFxuICAgICAgICBmcm9tSGFzaDogaGFzaEtleShvYmopLFxuICAgICAgICB0bzogcHJvdG8sXG4gICAgICAgIHRvSGFzaDogaGFzaEtleShwcm90byksXG4gICAgICAgIHByb3BlcnR5OiAnW1tQcm90b3R5cGVdXSdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNhY2hlKSB7XG4gICAgICB0aGlzLl9fbGlua3NDYWNoZV9fW25hbWVdID0gbGlua3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmtzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGlzIGFuYWx5emVyIGFzIGRpcnR5XG4gICAqL1xuICBtYWtlRGlydHk6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfSxcblxuICAvKipcbiAgICogU2V0IHRoZSBudW1iZXIgb2YgbGV2ZWxzIGZvciB0aGUgZGZzIHJvdXRpbmVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxcbiAgICovXG4gIHNldExldmVsczogZnVuY3Rpb24gKGwpIHtcbiAgICB0aGlzLmxldmVscyA9IGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRpcnR5IHN0YXRlIG9mIHRoaXMgYW5hbHl6ZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBkXG4gICAqL1xuICBzZXREaXJ0eTogZnVuY3Rpb24gKGQpIHtcbiAgICB0aGlzLmRpcnR5ID0gZDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgaXRlbXMgc3RvcmVkIGluIHRoaXMgQW5hbHl6ZXJcbiAgICogQHJldHVybnMge0hhc2hNYXB9XG4gICAqL1xuICBnZXRJdGVtczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLml0ZW1zO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBUaGlzIG1ldGhvZCBzdHJpbmdpZmllcyB0aGUgcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0IGBvYmpgLCB0byBhdm9pZFxuICAgKiBnZXR0aW5nIHRoZSBKU09OLnN0cmluZ2lmeSBjeWNsaWMgZXJyb3IgbGV0J3MgZGVsZXRlIHNvbWUgcHJvcGVydGllc1xuICAgKiB0aGF0IGFyZSBrbm93IHRvIGJlIG9iamVjdHMvZnVuY3Rpb25zXG4gICAqXG4gICAqIEBwYXJhbSAgb2JqXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0UHJvcGVydGllczogZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5nZXRQcm9wZXJ0aWVzKG9iaik7XG4gICAgLy8gYXBwZW5kIHRoZSBsYWJlbHMgY3JlYXRlZCB3aXRoIGxhYmVsZXJcbiAgICB2YXIgbGFiZWxzID0gbGFiZWxlcihvYmopO1xuICAgIGFzc2VydChsYWJlbHMuc2l6ZSgpLCAnb2JqZWN0IG11c3QgaGF2ZSBsYWJlbHMnKTtcbiAgICBwcm9wZXJ0aWVzLmxhYmVscyA9IGxhYmVscy5nZXRWYWx1ZXMoKTtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfSxcblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogUmV0dXJucyBhIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvdXRnb2luZyBsaW5rcyBvZlxuICAgKiBhbiBvYmplY3RcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RyaW5naWZ5T2JqZWN0TGlua3M6IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHJldHVybiBtZS5nZXRPd25MaW5rcyhvYmopLm1hcChmdW5jdGlvbiAobGluaykge1xuICAgICAgLy8gZGlzY2FyZGVkOiBmcm9tLCB0b1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogbGluay5mcm9tSGFzaCxcbiAgICAgICAgdG86IGxpbmsudG9IYXNoLFxuICAgICAgICBwcm9wZXJ0eTogbGluay5wcm9wZXJ0eVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogU3RyaW5naWZpZXMgdGhlIG9iamVjdHMgc2F2ZWQgaW4gdGhpcyBhbmFseXplclxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgbm9kZXMgPSB7fSxcbiAgICAgIGVkZ2VzID0ge307XG4gICAgaWYgKG1lLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZyhtZSk7XG4gICAgfVxuICAgIG1lLmRlYnVnICYmIGNvbnNvbGUudGltZSgnc3RyaW5naWZ5Jyk7XG4gICAgXy5mb3JPd24obWUuaXRlbXMsIGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgaGsgPSBoYXNoS2V5KHYpO1xuICAgICAgbm9kZXNbaGtdID0gbWUuc3RyaW5naWZ5T2JqZWN0UHJvcGVydGllcyh2KTtcbiAgICAgIGVkZ2VzW2hrXSA9IG1lLnN0cmluZ2lmeU9iamVjdExpbmtzKHYpO1xuICAgIH0pO1xuICAgIGlmIChtZS5kZWJ1Zykge1xuICAgICAgY29uc29sZS5sb2coJ25vZGVzJywgbm9kZXMpO1xuICAgICAgY29uc29sZS5sb2coJ2VkZ2VzJywgZWRnZXMpO1xuICAgIH1cbiAgICBtZS5kZWJ1ZyAmJiBjb25zb2xlLnRpbWVFbmQoJ3N0cmluZ2lmeScpO1xuICAgIHJldHVybiB7XG4gICAgICBub2Rlczogbm9kZXMsXG4gICAgICBlZGdlczogZWRnZXNcbiAgICB9O1xuICB9LFxuXG4gIC8qKlxuICAgKiBBbGlhcyBmb3IgI2FuYWx5emVPYmplY3RzXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgYWRkOiBmdW5jdGlvbiAob2JqZWN0cykge1xuICAgIC8vY29uc29sZS50aW1lKCdhbmFseXplJyk7XG4gICAgdGhpcy5hbmFseXplT2JqZWN0cyhvYmplY3RzLCAwKTtcbiAgICAvL2NvbnNvbGUudGltZUVuZCgnYW5hbHl6ZScpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHNvbWUgZXhpc3Rpbmcgb2JqZWN0cyBmcm9tIHRoZSBpdGVtcyBIYXNoTWFwXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9iamVjdHNcbiAgICogQHBhcmFtIHtib29sZWFufSB3aXRoUHJvdG90eXBlIFRydWUgdG8gcmVtb3ZlIHRoZSBwcm90b3R5cGVcbiAgICogaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGJlaW5nIHJlbW92ZWQgaXMgYSBmdW5jdGlvblxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICByZW1vdmU6IGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGRvUmVtb3ZlKG9iaikge1xuICAgICAgbWUuaXRlbXMucmVtb3ZlKG9iaik7XG4gICAgfVxuXG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmICh3aXRoUHJvdG90eXBlKSB7XG4gICAgICAgIHdpdGhGdW5jdGlvbkFuZFByb3RvdHlwZShvYmosIGRvUmVtb3ZlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvUmVtb3ZlKG9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lO1xuICB9LFxuXG4gIC8qKlxuICAgKiBGb3JiaWRzIHNvbWUgb2JqZWN0cyB0byBiZSBhZGRlZCB0byB0aGUgaXRlbXMgSGFzaE1hcFxuICAgKiBAcGFyYW0ge0FycmF5fSBvYmplY3RzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZSBUcnVlIHRvIGZvcmJpZCB0aGUgcHJvdG90eXBlXG4gICAqIGlmIHRoZSBjdXJyZW50IG9iamVjdCBiZWluZyBmb3JiaWRkZW4gaXMgYSBmdW5jdGlvblxuICAgKi9cbiAgZm9yYmlkOiBmdW5jdGlvbiAob2JqZWN0cywgd2l0aFByb3RvdHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgbWUucmVtb3ZlKG9iamVjdHMsIHdpdGhQcm90b3R5cGUpO1xuXG4gICAgZnVuY3Rpb24gZG9Gb3JiaWQob2JqKSB7XG4gICAgICBtZS5mb3JiaWRkZW4ucHV0KG9iaik7XG4gICAgfVxuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSkge1xuICAgICAgICB3aXRoRnVuY3Rpb25BbmRQcm90b3R5cGUob2JqLCBkb0ZvcmJpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb0ZvcmJpZChvYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgc29tZSBvYmplY3RzIHRvIGJlIGFkZGVkIHRvIHRoZSBpdGVtcyBIYXNoTWFwLCBjYWxsIHRoaXMgdG9cbiAgICogcmVtb3ZlIHNvbWUgZXhpc3Rpbmcgb2JqZWN0cyBmcm9tIHRoZSBmb3JiaWRkZW4gSGFzaE1hcCAoc28gdGhhdCB3aGVuXG4gICAqIHRoZSB0cmVlIGlzIGFuYWx5emVkIGFnYWluKVxuICAgKiBAcGFyYW0ge0FycmF5fSBvYmplY3RzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gd2l0aFByb3RvdHlwZSBUcnVlIHRvIGZvcmJpZCB0aGUgcHJvdG90eXBlXG4gICAqIGlmIHRoZSBjdXJyZW50IG9iamVjdCBiZWluZyBmb3JiaWRkZW4gaXMgYSBmdW5jdGlvblxuICAgKi9cbiAgYWxsb3c6IGZ1bmN0aW9uIChvYmplY3RzLCB3aXRoUHJvdG90eXBlKSB7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGRvQWxsb3cob2JqKSB7XG4gICAgICBtZS5mb3JiaWRkZW4ucmVtb3ZlKG9iaik7XG4gICAgfVxuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAod2l0aFByb3RvdHlwZSkge1xuICAgICAgICB3aXRoRnVuY3Rpb25BbmRQcm90b3R5cGUob2JqLCBkb0FsbG93KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvQWxsb3cob2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogRW1wdGllcyBhbGwgdGhlIGluZm8gc3RvcmVkIGluIHRoaXMgYW5hbHl6ZXJcbiAgICovXG4gIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fX2xpbmtzQ2FjaGVfXyA9IHt9O1xuICAgIHRoaXMuX19vYmplY3RzQ2FjaGVfXyA9IHt9O1xuICAgIHRoaXMuZm9yYmlkZGVuLmVtcHR5KCk7XG4gICAgdGhpcy5pdGVtcy5lbXB0eSgpO1xuICB9XG59O1xuXG52YXIgcHJvdG8gPSBBbmFseXplci5wcm90b3R5cGU7XG5mdW5jdGlvbiBjaGFpbihtZXRob2QpIHtcbiAgcHJvdG9bbWV0aG9kXSA9XG4gICAgdXRpbHMuZnVuY3Rpb25DaGFpbigpXG4gICAgICAuY2hhaW4ocHJvdG8ubWFrZURpcnR5KVxuICAgICAgLmNoYWluKHByb3RvW21ldGhvZF0pO1xufVxuXG4vLyBjYWxsICNtYWtlRGlydHkgYmVmb3JlIGFsbCB0aGVzZSBtZXRob2RzIGFyZSBjYWxsZWRcbmNoYWluKCdhZGQnKTtcbmNoYWluKCdyZW1vdmUnKTtcbmNoYWluKCdmb3JiaWQnKTtcbmNoYWluKCdhbGxvdycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuYWx5emVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIEluc3BlY3RvciA9IHJlcXVpcmUoJy4vSW5zcGVjdG9yJyk7XG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4uL3V0aWwvaGFzaEtleScpO1xuXG5mdW5jdGlvbiBBbmd1bGFyKGNvbmZpZykge1xuICBJbnNwZWN0b3IuY2FsbCh0aGlzLCBfLm1lcmdlKHtcbiAgICBlbnRyeVBvaW50OiAnYW5ndWxhcicsXG4gICAgZGlzcGxheU5hbWU6ICdBbmd1bGFySlMnLFxuICAgIGFsd2F5c0RpcnR5OiB0cnVlLFxuICAgIGFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnM6ICdnbG9iYWw6alF1ZXJ5J1xuICB9LCBjb25maWcpKTtcblxuICB0aGlzLnNlcnZpY2VzID0gW1xuICAgICckYW5pbWF0ZScsXG4gICAgJyRjYWNoZUZhY3RvcnknLFxuICAgICckY29tcGlsZScsXG4gICAgJyRjb250cm9sbGVyJyxcbiAgICAvLyAnJGRvY3VtZW50JyxcbiAgICAnJGV4Y2VwdGlvbkhhbmRsZXInLFxuICAgICckZmlsdGVyJyxcbiAgICAnJGh0dHAnLFxuICAgICckaHR0cEJhY2tlbmQnLFxuICAgICckaW50ZXJwb2xhdGUnLFxuICAgICckaW50ZXJ2YWwnLFxuICAgICckbG9jYWxlJyxcbiAgICAnJGxvZycsXG4gICAgJyRwYXJzZScsXG4gICAgJyRxJyxcbiAgICAnJHJvb3RTY29wZScsXG4gICAgJyRzY2UnLFxuICAgICckc2NlRGVsZWdhdGUnLFxuICAgICckdGVtcGxhdGVDYWNoZScsXG4gICAgJyR0aW1lb3V0J1xuICAgIC8vICckd2luZG93J1xuICBdLm1hcChmdW5jdGlvbiAodikge1xuICAgIHJldHVybiB7IGNoZWNrZWQ6IHRydWUsIG5hbWU6IHYgfTtcbiAgfSk7XG59XG5cbkFuZ3VsYXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJbnNwZWN0b3IucHJvdG90eXBlKTtcblxuQW5ndWxhci5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRTZXJ2aWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcyxcbiAgICB0b0FuYWx5emUgPSBbXTtcblxuICBnbG9iYWwuYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmcnXSk7XG4gIHRoaXMuaW5qZWN0b3IgPSBnbG9iYWwuYW5ndWxhci5pbmplY3RvcihbJ2FwcCddKTtcblxuICBtZS5zZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgaWYgKHMuY2hlY2tlZCkge1xuICAgICAgdmFyIG9iaiA9IG1lLmluamVjdG9yLmdldChzLm5hbWUpO1xuICAgICAgdG9BbmFseXplLnB1c2gob2JqKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9BbmFseXplO1xufTtcblxuLyoqXG4gKiBAb3ZlcnJpZGVcbiAqL1xuQW5ndWxhci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ2luc3BlY3RpbmcgYW5ndWxhcicpO1xuXG4gIC8vIGdldCB0aGUgb2JqZWN0cyB0aGF0IG5lZWQgdG8gYmUgZm9yYmlkZGVuXG4gIHZhciB0b0ZvcmJpZCA9IG1lLnBhcnNlRm9yYmlkZGVuVG9rZW5zKCk7XG4gIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coJ2ZvcmJpZGRpbmc6ICcsIHRvRm9yYmlkKTtcbiAgdGhpcy5hbmFseXplci5mb3JiaWQodG9Gb3JiaWQsIHRydWUpO1xuXG4gIHRoaXMuYW5hbHl6ZXIuYWRkKFxuICAgIFtnbG9iYWwuYW5ndWxhcl0uY29uY2F0KHRoaXMuZ2V0U2VsZWN0ZWRTZXJ2aWNlcygpKVxuICApO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFNpbmNlIEFuZ3VsYXIgaXMgYSBzY3JpcHQgcmV0cmlldmVkIG9uIGRlbWFuZCBidXQgdGhlIGluc3RhbmNlXG4gKiBpcyBhbHJlYWR5IGNyZWF0ZWQgaW4gSW5zcGVjdGVkSW5zdGFuY2UsIGxldCdzIGFsdGVyIHRoZVxuICogcHJvcGVydGllcyBpdCBoYXMgYmVmb3JlIG1ha2luZyB0aGUgcmVxdWVzdFxuICovXG5Bbmd1bGFyLnByb3RvdHlwZS5tb2RpZnlJbnN0YW5jZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHRoaXMuc3JjID0gb3B0aW9ucy5zcmM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFuZ3VsYXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2VuZXJpY0FuYWx5emVyID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlsLycpO1xuXG52YXIgdG9JbnNwZWN0ID0gW1xuICBPYmplY3QsIEZ1bmN0aW9uLFxuICBBcnJheSwgRGF0ZSwgQm9vbGVhbiwgTnVtYmVyLCBNYXRoLCBTdHJpbmcsIFJlZ0V4cCwgSlNPTixcbiAgRXJyb3Jcbl07XG5cbmZ1bmN0aW9uIEJ1aWx0SW4ob3B0aW9ucykge1xuICBHZW5lcmljQW5hbHl6ZXIuY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuQnVpbHRJbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdlbmVyaWNBbmFseXplci5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBvdmVycmlkZVxuICovXG5CdWlsdEluLnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBidWlsdEluIG9iamVjdHMnKTtcbiAgdGhpcy5hbmFseXplci5hZGQodGhpcy5nZXRJdGVtcygpKTtcbn07XG5cbi8qKlxuICogQG92ZXJyaWRlXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbkJ1aWx0SW4ucHJvdG90eXBlLmdldEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdG9JbnNwZWN0O1xufTtcblxuQnVpbHRJbi5wcm90b3R5cGUuc2hvd1NlYXJjaCA9IGZ1bmN0aW9uIChub2RlTmFtZSwgbm9kZVByb3BlcnR5KSB7XG4gIHZhciB1cmwgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoPycgK1xuICAgIHV0aWxzLnRvUXVlcnlTdHJpbmcoe1xuICAgICAgcTogZW5jb2RlVVJJQ29tcG9uZW50KG5vZGVOYW1lICsgJyAnICsgbm9kZVByb3BlcnR5KVxuICAgIH0pO1xuICB3aW5kb3cub3Blbih1cmwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWlsdEluOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcblxudmFyIHRvSW5zcGVjdCA9IFtnbG9iYWxdO1xuXG5mdW5jdGlvbiBHbG9iYWwoKSB7XG4gIEluc3BlY3Rvci5jYWxsKHRoaXMsIHtcbiAgICBhbmFseXplckNvbmZpZzoge1xuICAgICAgbGV2ZWxzOiAxLFxuICAgICAgdmlzaXRDb25zdHJ1Y3RvcnM6IGZhbHNlXG4gICAgfSxcbiAgICBhbHdheXNEaXJ0eTogdHJ1ZVxuICB9KTtcbn1cblxuR2xvYmFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zcGVjdG9yLnByb3RvdHlwZSk7XG5cbkdsb2JhbC5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0b0luc3BlY3Q7XG59O1xuXG5HbG9iYWwucHJvdG90eXBlLmluc3BlY3RTZWxmID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCdpbnNwZWN0aW5nIGdsb2JhbCcpO1xuICAvL3ZhciBtZSA9IHRoaXMsXG4gIC8vICBoYXNoZXMgPSByZXF1aXJlKCcuLi9JbnNwZWN0ZWRJbnN0YW5jZXMnKTtcbiAgLy9cbiAgLy9fLmZvck93bihoYXNoZXMsIGZ1bmN0aW9uICh2LCBrKSB7XG4gIC8vICBpZiAodi5nZXRJdGVtcygpKSB7XG4gIC8vICAgIG1lLmFuYWx5emVyLmZvcmJpZChbdi5nZXRJdGVtcygpXSwgdHJ1ZSk7XG4gIC8vICB9XG4gIC8vfSk7XG4gIHRoaXMuYW5hbHl6ZXIuaXRlbXMuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5hZGQobWUuZ2V0SXRlbXMoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBRID0gcmVxdWlyZSgncScpO1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC8nKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi4vdXRpbC9oYXNoS2V5Jyk7XG52YXIgQW5hbHl6ZXIgPSByZXF1aXJlKCcuLi9PYmplY3RBbmFseXplcicpO1xuXG52YXIgc2VhcmNoRW5naW5lID0gJ2h0dHBzOi8vZHVja2R1Y2tnby5jb20vP3E9JztcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBJbnN0YW5jZXMgb2YgdGhlIGNsYXNzIGluc3BlY3RvciBkZWNpZGUgd2hpY2ggb2JqZWN0cyB3aWxsIGJlXG4gKiBhbmFseXplZCBieSB0aGUgaW50ZXJuYWwgYW5hbHl6ZXIgaXQgaG9sZHMsIGJlc2lkZXMgZG9pbmcgdGhhdFxuICogdGhpcyBpbnNwZWN0b3IgaXMgYWJsZSB0bzpcbiAqXG4gKiAtIGRvIGRlZmVycmVkIGFuYWx5c2lzIChhbmFseXNpcyBvbiBkZW1hbmQpXG4gKiAtIGZldGNoIGV4dGVybmFsIHNjcmlwdHMgaW4gc2VyaWVzICh0aGUgYW5hbHlzaXMgaXMgbWFkZVxuICogICB3aGVuIGFsbCB0aGUgc2NyaXBzIGhhdmUgZmluaXNoZWQgbG9hZGluZylcbiAqIC0gbWFyayBpdHNlbGYgYXMgYW4gYWxyZWFkeSBpbnNwZWN0ZWQgaW5zdGFuY2Ugc28gdGhhdFxuICogICBmdXJ0aGVyIGluc3BlY3Rpb24gY2FsbHMgYXJlIG5vdCBtYWRlXG4gKiAtIHJlY2VpdmUgYSBjb25maWd1cmF0aW9uIHRvIGZvcmJpZCBjb21wbGV0ZSBncmFwaHMgZnJvbVxuICogICB0aGUgYW5hbHlzaXMgc3RlcFxuICpcbiAqIFNhbXBsZSB1c2FnZTpcbiAqXG4gKiBBbmFseXNpcyBvZiBhIHNpbXBsZSBvYmplY3Q6XG4gKlxuICogICAgdmFyIHggPSB7fTtcbiAqICAgIHZhciBpbnNwZWN0b3IgPSBuZXcgSW5zcGVjdG9yKCk7XG4gKiAgICBpbnNwZWN0b3JcbiAqICAgICAgLmluaXQoKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gKiAgICAgICAgLy8geCBpcyByZWFkeSBhbmFseXplZCBhdCB0aGlzIHBvaW50IVxuICogICAgICAgIC8vIG9iamVjdHMgc2F2ZWQgaW4gaW5zcGVjdG9yLmFuYWx5emVyID0ge3h9XG4gKiAgICAgIH0pXG4gKlxuICogQXMgc2VlbiBpbiB0aGUgY29kZSB0aGVyZSBpcyBhIGRlZmF1bHQgdmFyaWFibGUgd2hpY2ggc3BlY2lmaWVzXG4gKiB0aGUgb2JqZWN0cyB0aGF0IHdpbGwgYmUgZm9yYmlkZGVuLCB0aGUgdmFsdWUgaXMgYSBwaXBlIHNlcGFyYXRlZFxuICogbGlzdCBvZiBjb21tYW5kcyAoc2VlIEBmb3JiaWRkZW5Ub2tlbnMpIHdoaWNoIGlzIG1ha2luZyB0aGVcbiAqIGluc3BlY3RvciBhdm9pZCB0aGUgYnVpbHRJbiBwcm9wZXJ0aWVzLCBsZXQncyBhdm9pZCB0aGF0IGJ5IG1ha2luZ1xuICogZm9yYmlkZGVuVG9rZW5zIG51bGw6XG4gKlxuICogICAgdmFyIHggPSB7fTtcbiAqICAgIHZhciBpbnNwZWN0b3IgPSBuZXcgSW5zcGVjdG9yKHtcbiAqICAgICAgZm9yYmlkZGVuVG9rZW5zOiBudWxsXG4gKiAgICB9KTtcbiAqICAgIGluc3BlY3RvclxuICogICAgICAuaW5pdCgpXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgICAvLyB4IGlzIHJlYWR5IGFuYWx5emVkIGF0IHRoaXMgcG9pbnQhXG4gKiAgICAgICAgLy8gb2JqZWN0cyBzYXZlZCBpbiBpbnNwZWN0b3IuYW5hbHl6ZXIgPSB7eCwgT2JqZWN0LFxuICogICAgICAgICAgT2JqZWN0LnByb3RvdHlwZSwgRnVuY3Rpb24sIEZ1bmN0aW9uLnByb3RvdHlwZX1cbiAqICAgICAgfSlcbiAqXG4gKiBUbyBleGVjdXRlIG1vcmUgY29tcGxleCBhbmFseXNpcyBjb25zaWRlciBvdmVycmlkaW5nOlxuICpcbiAqIC0gaW5zcGVjdFNlbGZcbiAqIC0gZ2V0SXRlbXNcbiAqXG4gKiBTZWUgQnVpbHRJbi5qcyBmb3IgYSBiYXNpYyBvdmVycmlkZSBvZiB0aGUgbWV0aG9kcyBhYm92ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmVudHJ5UG9pbnRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zcmNdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5kaXNwbGF5TmFtZV1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmZvcmJpZGRlblRva2Vucz1JbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TXVxuICovXG5mdW5jdGlvbiBJbnNwZWN0b3IoY29uZmlnKSB7XG4gIGNvbmZpZyA9IF8ubWVyZ2UoXy5jbG9uZShJbnNwZWN0b3IuREVGQVVMVF9DT05GSUcsIHRydWUpLCBjb25maWcpO1xuXG4gIC8qKlxuICAgKiBJZiBwcm92aWRlZCBpdCdsbCBiZSB1c2VkIGFzIHRoZSBzdGFydGluZyBvYmplY3QgZnJvbSB0aGVcbiAgICogZ2xvYmFsIG9iamVjdCB0byBiZSBhbmFseXplZCwgbmVzdGVkIG9iamVjdHMgY2FuIGJlIHNwZWNpZmllZFxuICAgKiB3aXRoIHRoZSBkb3Qgbm90YXRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMuZW50cnlQb2ludCA9IGNvbmZpZy5lbnRyeVBvaW50O1xuXG4gIC8qKlxuICAgKiBOYW1lIHRvIGJlIGRpc3BsYXllZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5kaXNwbGF5TmFtZSA9IGNvbmZpZy5kaXNwbGF5TmFtZTtcblxuICAvKipcbiAgICogSWYgdGhlIGluc3BlY3RvciBuZWVkcyB0byBmZXRjaCBleHRlcm5hbCByZXNvdXJjZXMgdXNlXG4gICAqIGEgc3RyaW5nIHNlcGFyYXRlZCB3aXRoIHRoZSBwaXBlIHwgY2hhcmFjdGVyLCB0aGUgc2NyaXB0c1xuICAgKiBhcmUgbG9hZGVkIGluIHNlcmllcyBiZWNhdXNlIG9uZSBzY3JpcHQgbWlnaHQgbmVlZCB0aGUgZXhpc3RlbmNlXG4gICAqIG9mIGFub3RoZXIgYmVmb3JlIGl0J3MgZmV0Y2hlZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5zcmMgPSBjb25maWcuc3JjO1xuXG4gIC8qKlxuICAgKiBFYWNoIHRva2VuIGRldGVybWluZXMgd2hpY2ggb2JqZWN0cyB3aWxsIGJlIGZvcmJpZGRlblxuICAgKiB3aGVuIHRoZSBhbmFseXplciBpcyBydW4uXG4gICAqXG4gICAqIFRva2VuIGV4YW1wbGVzOlxuICAgKlxuICAgKiAtIHBvam92aXo6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFsbCB0aGUgaXRlbXMgc2F2ZWQgaW4gdGhlIHtzdHJpbmd9IGluc3RhbmNlIHdoaWNoXG4gICAqICAgaXMgc3RvcmVkIGluIHRoZSBJbnNwZWN0ZWRJbnN0YW5jZXMgb2JqZWN0LFxuICAgKiAgIGFzc3VtaW5nIHRoYXQgZWFjaCBpcyBhIHN1YmNsYXNzIG9mIGBJbnNwZWN0b3JgXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICAvLyBmb3JiaWQgYWxsIHRoZSBpdGVtcyBmb3VuZCBpbiB0aGUgYnVpbHRJbiBpbnNwZWN0b3JcbiAgICogICBwb2pvdml6OmJ1aWx0SW5cbiAgICpcbiAgICogLSBnbG9iYWw6e3N0cmluZ31cbiAgICogICBGb3JiaWRzIGFuIG9iamVjdCB3aGljaCBpcyBpbiB0aGUgZ2xvYmFsIG9iamVjdCwge3N0cmluZ30gbWlnaHRcbiAgICogICBhbHNvIGluZGljYXRlIGEgbmVzdGVkIG9iamVjdCB1c2luZyAuIGFzIGEgbm9ybWFsIHByb3BlcnR5XG4gICAqICAgcmV0cmlldmFsXG4gICAqXG4gICAqIGUuZy5cbiAgICpcbiAgICogICBnbG9iYWw6ZG9jdW1lbnRcbiAgICogICBnbG9iYWw6ZG9jdW1lbnQuYm9keVxuICAgKiAgIGdsb2JhbDpkb2N1bWVudC5oZWFkXG4gICAqXG4gICAqIEZvcmJpZGRlblRva2VucyBleGFtcGxlOlxuICAgKlxuICAgKiAgcG9qb3ZpejpidWlsdElufHBvam92aXo6d2luZG93fGdsb2JhbDpkb2N1bWVudFxuICAgKlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy5mb3JiaWRkZW5Ub2tlbnMgPSBbY29uZmlnLmZvcmJpZGRlblRva2VucywgY29uZmlnLmFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnNdXG4gICAgLmZpbHRlcihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgIHJldHVybiAhIXRva2VuO1xuICAgIH0pXG4gICAgLmpvaW4oJ3wnKTtcblxuICAvKipcbiAgICogVGhpcyBpbnNwZWN0b3IgaXMgaW5pdGlhbGx5IGluIGEgZGlydHkgc3RhdGVcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuICAvKipcbiAgICogUHJpbnQgZGVidWcgaW5mb1xuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHRoaXMuZGVidWcgPSBjb25maWcuZGVidWc7XG5cbiAgLyoqXG4gICAqIFRvIGF2b2lkIHJlYW5hbHl6aW5nIHRoZSBzYW1lIHN0cnVjdHVyZSBtdWx0aXBsZSB0aW1lcyBhIHNtYWxsXG4gICAqIG9wdGltaXphdGlvbiBpcyB0byBtYXJrIHRoZSBpbnNwZWN0b3IgYXMgaW5zcGVjdGVkLCB0byBhdm9pZFxuICAgKiB0aGlzIG9wdGltaXphdGlvbiBwYXNzIGFsd2F5c0RpcnR5IGFzIHRydWUgaW4gdGhlIG9wdGlvbnNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICB0aGlzLmFsd2F5c0RpcnR5ID0gY29uZmlnLmFsd2F5c0RpcnR5O1xuXG4gIC8qKlxuICAgKiBBbiBpbnN0YW5jZSBvZiBPYmplY3RBbmFseXplciB3aGljaCB3aWxsIHNhdmUgYWxsXG4gICAqIHRoZSBpbnNwZWN0ZWQgb2JqZWN0c1xuICAgKiBAdHlwZSB7T2JqZWN0QW5hbHl6ZXJ9XG4gICAqL1xuICB0aGlzLmFuYWx5emVyID0gbmV3IEFuYWx5emVyKGNvbmZpZy5hbmFseXplckNvbmZpZyk7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHdoaWNoIGhvbGRzIGFsbCB0aGUgaW5zcGVjdG9yIGluc3RhbmNlcyBjcmVhdGVkXG4gKiAoZmlsbGVkIGluIHRoZSBmaWxlIEluc3BlY3RlZEluc3RhbmNlcylcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkluc3BlY3Rvci5pbnN0YW5jZXMgPSBudWxsO1xuXG4vKipcbiAqIERlZmF1bHQgZm9yYmlkZGVuIGNvbW1hbmRzIChpbiBub2RlIGdsb2JhbCBpcyB0aGUgZ2xvYmFsIG9iamVjdClcbiAqIEB0eXBlIHtzdHJpbmdbXX1cbiAqL1xuSW5zcGVjdG9yLkRFRkFVTFRfRk9SQklEREVOX1RPS0VOU19BUlJBWSA9IFtcbiAgJ3Bvam92aXo6Z2xvYmFsJyxcbiAgJ3Bvam92aXo6YnVpbHRJbicsXG4gICdnbG9iYWw6ZG9jdW1lbnQnXG5dO1xuXG4vKipcbiAqIEZvcmJpZGRlbiB0b2tlbnMgd2hpY2ggYXJlIHNldCBieSBkZWZhdWx0IG9uIGFueSBJbnNwZWN0b3IgaW5zdGFuY2VcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbkluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlMgPVxuICBJbnNwZWN0b3IuREVGQVVMVF9GT1JCSURERU5fVE9LRU5TX0FSUkFZLmpvaW4oJ3wnKTtcblxuLyoqXG4gKiBEZWZhdWx0IGNvbmZpZyB1c2VkIHdoZW5ldmVyIGFuIGluc3RhbmNlIG9mIEluc3BlY3RvciBpcyBjcmVhdGVkXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5JbnNwZWN0b3IuREVGQVVMVF9DT05GSUcgPSB7XG4gIHNyYzogbnVsbCxcbiAgZW50cnlQb2ludDogJycsXG4gIGRpc3BsYXlOYW1lOiAnJyxcbiAgYWx3YXlzRGlydHk6IGZhbHNlLFxuICBkZWJ1ZzogISFnbG9iYWwud2luZG93LFxuICBmb3JiaWRkZW5Ub2tlbnM6IEluc3BlY3Rvci5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlMsXG4gIGFkZGl0aW9uYWxGb3JiaWRkZW5Ub2tlbnM6IG51bGwsXG4gIGFuYWx5emVyQ29uZmlnOiB7fVxufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGJ1aWx0SW4gdmlzaWJpbGl0eSBvZiBhbGwgdGhlIG5ldyBpbnN0YW5jZXMgdG8gYmUgY3JlYXRlZFxuICogQHBhcmFtIHZpc2libGVcbiAqL1xuSW5zcGVjdG9yLnNldEJ1aWx0SW5WaXNpYmlsaXR5ID0gZnVuY3Rpb24gKHZpc2libGUpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHRva2VuID0gJ3Bvam92aXo6YnVpbHRJbic7XG4gIHZhciBhcnIgPSBtZS5ERUZBVUxUX0ZPUkJJRERFTl9UT0tFTlNfQVJSQVk7XG4gIGlmICh2aXNpYmxlKSB7XG4gICAgYXJyLnB1c2godG9rZW4pO1xuICB9IGVsc2Uge1xuICAgIGFyci5zcGxpY2UoYXJyLmluZGV4T2YodG9rZW4pLCAxKTtcbiAgfVxuICBtZS5ERUZBVUxUX0NPTkZJRy5mb3JiaWRkZW5Ub2tlbnMgPSBhcnIuam9pbignfCcpO1xufTtcblxuLyoqXG4gKiBJbml0IHJvdXRpbmUsIHNob3VsZCBiZSBjYWxsZWQgb24gZGVtYW5kIHRvIGluaXRpYWxpemUgdGhlXG4gKiBhbmFseXNpcyBwcm9jZXNzLCBpdCBvcmNoZXN0cmF0ZXMgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiAtIGZldGNoaW5nIG9mIGV4dGVybmFsIHJlc291cmNlc1xuICogLSBpbnNwZWN0aW9uIG9mIGVsZW1lbnRzIGlmIHRoZSBpbnNwZWN0b3IgaXMgaW4gYSBkaXJ0eSBzdGF0ZVxuICpcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCclY1Bvam9WaXonLCAnZm9udC1zaXplOiAxNXB4OyBjb2xvcjogJyk7XG4gIHJldHVybiBtZS5mZXRjaCgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG1lLmFsd2F5c0RpcnR5KSB7XG4gICAgICAgIG1lLnNldERpcnR5KCk7XG4gICAgICB9XG4gICAgICBpZiAobWUuZGlydHkpIHtcbiAgICAgICAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJyVjSW5zcGVjdGluZzogJXMnLCAnY29sb3I6IHJlZCcsIG1lLmVudHJ5UG9pbnQgfHwgbWUuZGlzcGxheU5hbWUpO1xuICAgICAgICBtZS5pbnNwZWN0KCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWU7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIFBlcmZvcm1zIHRoZSBhbmFseXNpcyBvZiBhbiBvYmplY3QgZ2l2ZW4gYW4gZW50cnlQb2ludCwgYmVmb3JlXG4gKiBwZXJmb3JtaW5nIHRoZSBhbmFseXNpcyBpdCBpZGVudGlmaWVzIHdoaWNoIG9iamVjdCBuZWVkIHRvIGJlXG4gKiBmb3JiaWRkZW4gKGZvcmJpZGRlblRva2VucylcbiAqXG4gKiBAY2hhaW5hYmxlXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuaW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBzdGFydCA9IG1lLmZpbmROZXN0ZWRWYWx1ZUluR2xvYmFsKG1lLmVudHJ5UG9pbnQpO1xuICB2YXIgYW5hbHl6ZXIgPSB0aGlzLmFuYWx5emVyO1xuXG4gIGlmICghc3RhcnQpIHtcbiAgICBjb25zb2xlLmVycm9yKHRoaXMpO1xuICAgIHRocm93ICdlbnRyeSBwb2ludCBub3QgZm91bmQhJztcbiAgfVxuICBtZS5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnYW5hbHl6aW5nIGdsb2JhbC4nICsgbWUuZW50cnlQb2ludCk7XG5cbiAgLy8gYmVmb3JlIGluc3BlY3QgaG9va1xuICBtZS5iZWZvcmVJbnNwZWN0U2VsZigpO1xuXG4gIC8vIGdldCB0aGUgb2JqZWN0cyB0aGF0IG5lZWQgdG8gYmUgZm9yYmlkZGVuXG4gIHZhciB0b0ZvcmJpZCA9IG1lLnBhcnNlRm9yYmlkZGVuVG9rZW5zKCk7XG4gIG1lLmRlYnVnICYmIGNvbnNvbGUubG9nKCdmb3JiaWRkaW5nOiAnLCB0b0ZvcmJpZCk7XG4gIGFuYWx5emVyLmZvcmJpZCh0b0ZvcmJpZCwgdHJ1ZSk7XG5cbiAgLy8gcGVyZm9ybSB0aGUgYW5hbHlzaXNcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2FkZGluZzogJyArIHN0YXJ0KTtcbiAgYW5hbHl6ZXIuYWRkKFtzdGFydF0pO1xuXG4gIC8vIGFmdGVyIGluc3BlY3QgaG9va1xuICBtZS5hZnRlckluc3BlY3RTZWxmKCk7XG4gIHJldHVybiBtZTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBiZWZvcmUgaW5zcGVjdCBzZWxmIGhvb2tcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5iZWZvcmVJbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBhZnRlciBpbnNwZWN0IHNlbGYgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLmFmdGVySW5zcGVjdFNlbGYgPSBmdW5jdGlvbiAoKSB7XG59O1xuXG4vKipcbiAqIFBhcnNlcyB0aGUgZm9yYmlkZGVuVG9rZW5zIHN0cmluZyBhbmQgaWRlbnRpZmllcyB3aGljaFxuICogb2JqZWN0cyBzaG91bGQgYmUgZm9yYmlkZGVuIGZyb20gdGhlIGFuYWx5c2lzIHBoYXNlXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUucGFyc2VGb3JiaWRkZW5Ub2tlbnMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBmb3JiaWRkZW4gPSB0aGlzLmZvcmJpZGRlblRva2Vucy5zcGxpdCgnfCcpO1xuICB2YXIgdG9Gb3JiaWQgPSBbXTtcbiAgbWUuZGVidWcgJiYgY29uc29sZS5sb2coJ2Fib3V0IHRvIGZvcmJpZDogJywgZm9yYmlkZGVuKTtcbiAgZm9yYmlkZGVuXG4gICAgLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gISF2OyB9KVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICB2YXIgYXJyID0gW107XG4gICAgICB2YXIgdG9rZW5zO1xuICAgICAgaWYgKHRva2VuLnNlYXJjaCgvXnBvam92aXo6LykgPiAtMSkge1xuICAgICAgICB0b2tlbnMgPSB0b2tlbi5zcGxpdCgnOicpO1xuXG4gICAgICAgIC8vIGlmIGl0J3MgYSBjb21tYW5kIGZvciB0aGUgbGlicmFyeSB0aGVuIG1ha2Ugc3VyZSBpdCBleGlzdHNcbiAgICAgICAgYXNzZXJ0KEluc3BlY3Rvci5pbnN0YW5jZXNbdG9rZW5zWzFdXSk7XG4gICAgICAgIGFyciA9IEluc3BlY3Rvci5pbnN0YW5jZXNbdG9rZW5zWzFdXS5nZXRJdGVtcygpO1xuICAgICAgfSBlbHNlIGlmICh0b2tlbi5zZWFyY2goL15nbG9iYWw6LykgPiAtMSkge1xuICAgICAgICB0b2tlbnMgPSB0b2tlbi5zcGxpdCgnOicpO1xuICAgICAgICBhcnIgPSBbbWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwodG9rZW5zWzFdKV07XG4gICAgICB9XG5cbiAgICAgIHRvRm9yYmlkID0gdG9Gb3JiaWQuY29uY2F0KGFycik7XG4gICAgfSk7XG4gIHJldHVybiB0b0ZvcmJpZDtcbn07XG5cbi8qKlxuICogTWFya3MgdGhpcyBpbnNwZWN0b3IgYXMgZGlydHlcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5zZXREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIHRoaXMuYW5hbHl6ZXIuaXRlbXMuZW1wdHkoKTtcbiAgdGhpcy5hbmFseXplci5mb3JiaWRkZW4uZW1wdHkoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1hcmtzIHRoaXMgaW5zcGVjdG9yIGFzIG5vdCBkaXJ0eSAoc28gdGhhdCBmdXJ0aGVyIGNhbGxzXG4gKiB0byBpbnNwZWN0IGFyZSBub3QgbWFkZSlcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS51bnNldERpcnR5ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVcbiAqIFNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGluc3RhbmNlIGlzIGNyZWF0ZWQgdG8gbW9kaWZ5IGl0IHdpdGhcbiAqIGFkZGl0aW9uYWwgb3B0aW9uc1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLm1vZGlmeUluc3RhbmNlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIFBlcmZvcm1zIHRoZSBpbnNwZWN0aW9uIG9uIHNlbGZcbiAqIEBjaGFpbmFibGVcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpc1xuICAgIC51bnNldERpcnR5KClcbiAgICAuaW5zcGVjdFNlbGYoKTtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBQcmVyZW5kZXIgaG9va1xuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnByZVJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlXG4gKiBQb3N0cmVuZGVyIGhvb2tcbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5wb3N0UmVuZGVyID0gZnVuY3Rpb24gKCkge1xufTtcblxuLyoqXG4gKiBAdGVtcGxhdGVzXG4gKiBSZXR1cm5zIHRoZSBwcmVkZWZpbmVkIGl0ZW1zIHRoYXQgdGhpcyBpbnNwZWN0b3IgaXMgaW4gY2hhcmdlIG9mXG4gKiBpdCdzIHVzZWZ1bCB0byBkZXRlcm1pbmUgd2hpY2ggb2JqZWN0cyBuZWVkIHRvIGJlIGRpc2NhcmRlZCBpblxuICogI2luc3BlY3RTZWxmXG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbXTtcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBzdHJpbmcgd2hpY2ggaGF2ZSB0b2tlbnMgc2VwYXJhdGVkIGJ5IHRoZSAuIHN5bWJvbFxuICogdGhpcyBtZXRob2RzIGNoZWNrcyBpZiBpdCdzIGEgdmFsaWQgdmFsdWUgdW5kZXIgdGhlIGdsb2JhbCBvYmplY3RcbiAqXG4gKiBlLmcuXG4gKiAgICAgICAgJ2RvY3VtZW50LmJvZHknXG4gKiAgICAgICAgcmV0dXJucyBnbG9iYWwuZG9jdW1lbnQuYm9keSBzaW5jZSBpdCdzIGEgdmFsaWQgb2JqZWN0XG4gKiAgICAgICAgdW5kZXIgdGhlIGdsb2JhbCBvYmplY3RcbiAqXG4gKiBAcGFyYW0gbmVzdGVkQ29uZmlndXJhdGlvblxuICogQHJldHVybnMgeyp9XG4gKi9cbkluc3BlY3Rvci5wcm90b3R5cGUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwgPSBmdW5jdGlvbiAobmVzdGVkQ29uZmlndXJhdGlvbikge1xuICB2YXIgdG9rZW5zID0gbmVzdGVkQ29uZmlndXJhdGlvbi5zcGxpdCgnLicpO1xuICB2YXIgc3RhcnQgPSBnbG9iYWw7XG4gIHdoaWxlICh0b2tlbnMubGVuZ3RoKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zLnNoaWZ0KCk7XG4gICAgaWYgKCFzdGFydC5oYXNPd25Qcm9wZXJ0eSh0b2tlbikpIHtcbiAgICAgIHRoaXMuZGVidWcgJiYgY29uc29sZS53YXJuKCduZXN0ZWRDb25maWcgbm90IGZvdW5kIScpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHN0YXJ0ID0gc3RhcnRbdG9rZW5dO1xuICB9XG4gIHJldHVybiBzdGFydDtcbn07XG5cbi8qKlxuICogRmV0Y2hlcyBhbGwgdGhlIHJlc291cmNlcyByZXF1aXJlZCB0byBwZXJmb3JtIHRoZSBpbnNwZWN0aW9uLFxuICogKHdoaWNoIGFyZSBzYXZlZCBpbiBgdGhpcy5zcmNgKSwgcmV0dXJucyBhIHByb21pc2Ugd2hpY2ggaXNcbiAqIHJlc29sdmVkIHdoZW4gYWxsIHRoZSBzY3JpcHMgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuSW5zcGVjdG9yLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lID0gdGhpcztcblxuICAvKipcbiAgICogR2l2ZW4gYSBzdHJpbmcgYHZgIGl0IGZldGNoZXMgaXQgYW4gYW4gYXN5bmMgd2F5LFxuICAgKiBzaW5jZSB0aGlzIG1ldGhvZCByZXR1cm5zIGEgcHJvbWlzZSBpdCBhbGxvd3MgZWFzeSBjaGFpbmluZ1xuICAgKiBzZWUgdGhlIHJlZHVjZSBwYXJ0IGJlbG93XG4gICAqIEBwYXJhbSB2XG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAgICovXG4gIGZ1bmN0aW9uIHByb21pc2lmeSh2KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHV0aWxzLm5vdGlmaWNhdGlvbignZmV0Y2hpbmcgc2NyaXB0ICcgKyB2LCB0cnVlKTtcbiAgICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgIHNjcmlwdC5zcmMgPSB2O1xuICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdXRpbHMubm90aWZpY2F0aW9uKCdjb21wbGV0ZWQgZmV0Y2hpbmcgc2NyaXB0ICcgKyB2LCB0cnVlKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShtZS5maW5kTmVzdGVkVmFsdWVJbkdsb2JhbChtZS5lbnRyeVBvaW50KSk7XG4gICAgICB9O1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChtZS5zcmMpIHtcbiAgICBpZiAobWUuZmluZE5lc3RlZFZhbHVlSW5HbG9iYWwobWUuZW50cnlQb2ludCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdyZXNvdXJjZSBhbHJlYWR5IGZldGNoZWQ6ICcgKyBtZS5lbnRyeVBvaW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHNyY3MgPSB0aGlzLnNyYy5zcGxpdCgnfCcpO1xuICAgICAgcmV0dXJuIHNyY3MucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7XG4gICAgICAgIHJldHVybiBwcmV2LnRoZW4ocHJvbWlzaWZ5KGN1cnJlbnQpKTtcbiAgICAgIH0sIFEoJ3JlZHVjZScpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gUS5kZWxheSgwKTtcbn07XG5cbi8qKlxuICogVG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgYnVpbHRJbiBvYmplY3RzXG4gKiBAcGFyYW0gdmlzaWJsZVxuICovXG5JbnNwZWN0b3IucHJvdG90eXBlLnNldEJ1aWx0SW5WaXNpYmlsaXR5ID0gZnVuY3Rpb24gKHZpc2libGUpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHRva2VuID0gJ3Bvam92aXo6YnVpbHRJbic7XG4gIHZhciBhcnIgPSBtZS5mb3JiaWRkZW5Ub2tlbnM7XG4gIGlmICh2aXNpYmxlKSB7XG4gICAgYXJyLnB1c2godG9rZW4pO1xuICB9IGVsc2Uge1xuICAgIGFyci5zcGxpY2UoYXJyLmluZGV4T2YodG9rZW4pLCAxKTtcbiAgfVxufTtcblxuSW5zcGVjdG9yLnByb3RvdHlwZS5zaG93U2VhcmNoID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBub2RlUHJvcGVydHkpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIHRwbCA9IF8udGVtcGxhdGUoJyR7c2VhcmNoRW5naW5lfSR7bHVja3l9JHtsaWJyYXJ5TmFtZX0gJHtub2RlTmFtZX0gJHtub2RlUHJvcGVydHl9Jyk7XG4gIHZhciBjb21waWxlZCA9IHRwbCh7XG4gICAgc2VhcmNoRW5naW5lOiBzZWFyY2hFbmdpbmUsXG4gICAgbHVja3k6IEluc3BlY3Rvci5sdWNreSA/ICchZHVja3knIDogJycsXG4gICAgbGlicmFyeU5hbWU6IG1lLmVudHJ5UG9pbnQsXG4gICAgbm9kZU5hbWU6IG5vZGVOYW1lLFxuICAgIG5vZGVQcm9wZXJ0eTogbm9kZVByb3BlcnR5XG4gIH0pO1xuICB3aW5kb3cub3Blbihjb21waWxlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluc3BlY3RvcjsiLCIndXNlIHN0cmljdCc7XG52YXIgSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9JbnNwZWN0b3InKTtcbmZ1bmN0aW9uIFBPYmplY3Qob3B0aW9ucykge1xuICBJbnNwZWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuUE9iamVjdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3BlY3Rvci5wcm90b3R5cGUpO1xuXG5QT2JqZWN0LnByb3RvdHlwZS5pbnNwZWN0U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnaW5zcGVjdGluZyBPYmplY3Qgb2JqZWN0cycpO1xuICB0aGlzLmFuYWx5emVyLmFkZCh0aGlzLmdldEl0ZW1zKCkpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBPYmplY3QucHJvdG90eXBlLmdldEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gW09iamVjdF07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBPYmplY3Q7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTcvMTUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gW3tcbiAgZW50cnlQb2ludDogJ2dsb2JhbCdcbn0sIHtcbiAgbGFiZWw6ICdFeHRKUycsXG4gIHNyYzogJy8vY2RuLnNlbmNoYS5jb20vZXh0L2dwbC80LjIuMS9leHQtYWxsLmpzJyxcbiAgZW50cnlQb2ludDogJ0V4dCcsXG4gIGFuYWx5emVyQ29uZmlnOiB7XG4gICAgbGV2ZWxzOiAxXG4gIH1cbn0sIHtcbiAgZW50cnlQb2ludDogJ1RIUkVFJ1xufSwge1xuICBlbnRyeVBvaW50OiAnUGhhc2VyJyxcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcGhhc2VyLzIuMC42L3BoYXNlci5taW4uanMnLFxuICBhbmFseXplckNvbmZpZzoge1xuICAgIHZpc2l0U2ltcGxlRnVuY3Rpb25zOiB0cnVlXG4gIH1cbn1dOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE3LzE1LlxuICovXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgcHJvdG8gPSB7XG4gIGZpbmQ6IGZ1bmN0aW9uIChlbnRyeSkge1xuICAgIGZ1bmN0aW9uIHByZWRpY2F0ZSh2KSB7XG4gICAgICByZXR1cm4gdi5kaXNwbGF5TmFtZSA9PT0gZW50cnkgfHwgdi5lbnRyeVBvaW50ID09PSBlbnRyeTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdDtcbiAgICBfLmZvck93bih0aGlzLCBmdW5jdGlvbiAoc2NoZW1hKSB7XG4gICAgICByZXN1bHQgPSByZXN1bHQgfHwgXy5maW5kKHNjaGVtYSwgcHJlZGljYXRlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59O1xuXG52YXIgc2NoZW1hcyA9IE9iamVjdC5jcmVhdGUocHJvdG8pO1xuXG5fLm1lcmdlKHNjaGVtYXMsIHtcbiAga25vd25TY2hlbWFzOiByZXF1aXJlKCcuL2tub3duU2NoZW1hcycpLFxuICBub3RhYmxlTGlicmFyaWVzOiByZXF1aXJlKCcuL25vdGFibGVMaWJyYXJpZXMnKSxcbiAgbXlMaWJyYXJpZXM6IHJlcXVpcmUoJy4vbXlMaWJyYXJpZXMnKSxcbiAgaHVnZVNjaGVtYXM6IHJlcXVpcmUoJy4vaHVnZVNjaGVtYXMnKSxcbiAgZG93bmxvYWRlZDogW11cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjaGVtYXM7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IG1hdXJpY2lvIG9uIDIvMTcvMTUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gW3tcbiAgbGFiZWw6ICdPYmplY3QnLFxuICBkaXNwbGF5TmFtZTogJ29iamVjdCdcbn0sIHtcbiAgbGFiZWw6ICdCdWlsdEluIE9iamVjdHMnLFxuICBkaXNwbGF5TmFtZTogJ2J1aWx0SW4nXG59XTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8xNy8xNS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbe1xuICBsYWJlbDogJ1Bvam9WaXonLFxuICBlbnRyeVBvaW50OiAncG9qb3ZpeicsXG4gIGFsd2F5c0RpcnR5OiB0cnVlLFxuICBhZGRpdGlvbmFsRm9yYmlkZGVuVG9rZW5zOiAnZ2xvYmFsOnBvam92aXouSW5zcGVjdGVkSW5zdGFuY2VzLnBvam92aXouYW5hbHl6ZXIuaXRlbXMnLFxuICBhbmFseXplckNvbmZpZzoge1xuICAgIHZpc2l0QXJyYXlzOiBmYWxzZVxuICB9XG59LCB7XG4gIGVudHJ5UG9pbnQ6ICd0Mydcbn1dOyIsIi8qKlxuICogQ3JlYXRlZCBieSBtYXVyaWNpbyBvbiAyLzE3LzE1LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFt7XG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuMS9qcXVlcnkubWluLmpzJyxcbiAgZW50cnlQb2ludDogJ2pRdWVyeSdcbn0sIHtcbiAgZW50cnlQb2ludDogJ1BvbHltZXInLFxuICBhZGRpdGlvbmFsRm9yYmlkZGVuVG9rZW5zOiAnZ2xvYmFsOlBvbHltZXIuZWxlbWVudHMnXG59LCB7XG4gIGVudHJ5UG9pbnQ6ICdkMydcbn0sIHtcbiAgZGlzcGxheU5hbWU6ICdMby1EYXNoJyxcbiAgZW50cnlQb2ludDogJ18nLFxuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9sb2Rhc2guanMvMi40LjEvbG9kYXNoLmpzJ1xufSwge1xuICBzcmM6ICcvL2ZiLm1lL3JlYWN0LTAuMTIuMi5qcycsXG4gIGVudHJ5UG9pbnQ6ICdSZWFjdCdcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvYW5ndWxhci5qcy8xLjIuMjAvYW5ndWxhci5qcycsXG4gIGVudHJ5UG9pbnQ6ICdhbmd1bGFyJyxcbiAgbGFiZWw6ICdBbmd1bGFyIEpTJ1xufSwge1xuICBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9tb2Rlcm5penIvMi44LjIvbW9kZXJuaXpyLmpzJyxcbiAgZW50cnlQb2ludDogJ01vZGVybml6cidcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvaGFuZGxlYmFycy5qcy8xLjEuMi9oYW5kbGViYXJzLmpzJyxcbiAgZW50cnlQb2ludDogJ0hhbmRsZWJhcnMnXG59LCB7XG4gIGxhYmVsOiAnRW1iZXJKUycsXG4gIHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuMS9qcXVlcnkubWluLmpzfC8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2hhbmRsZWJhcnMuanMvMS4xLjIvaGFuZGxlYmFycy5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9lbWJlci5qcy8xLjYuMS9lbWJlci5qcycsXG4gIGVudHJ5UG9pbnQ6ICdFbWJlcicsXG4gIGZvcmJpZGRlblRva2VuczogJ2dsb2JhbDokfGdsb2JhbDpIYW5kbGViYXJzfHBvam92aXo6YnVpbHRJbnxnbG9iYWw6d2luZG93fGdsb2JhbDpkb2N1bWVudCdcbn0sIHtcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvbG9kYXNoLmpzLzIuNC4xL2xvZGFzaC5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9iYWNrYm9uZS5qcy8xLjEuMi9iYWNrYm9uZS5qcycsXG4gIGVudHJ5UG9pbnQ6ICdCYWNrYm9uZSdcbn0sIHtcbiAgbGFiZWw6ICdNYXJpb25ldHRlLmpzJyxcbiAgc3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS4xL2pxdWVyeS5taW4uanN8Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvbG9kYXNoLmpzLzIuNC4xL2xvZGFzaC5qc3wvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9iYWNrYm9uZS5qcy8xLjEuMi9iYWNrYm9uZS5qc3xodHRwOi8vbWFyaW9uZXR0ZWpzLmNvbS9kb3dubG9hZHMvYmFja2JvbmUubWFyaW9uZXR0ZS5qcycsXG4gIGVudHJ5UG9pbnQ6ICdNYXJpb25ldHRlJ1xufV07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzaEtleSA9IHJlcXVpcmUoJy4vaGFzaEtleScpO1xuXG5mdW5jdGlvbiBIYXNoTWFwKCkge1xufVxuXG5IYXNoTWFwLnByb3RvdHlwZSA9IHtcbiAgcHV0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXNbaGFzaEtleShrZXkpXSA9ICh2YWx1ZSB8fCBrZXkpO1xuICB9LFxuICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpc1toYXNoS2V5KGtleSldO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgdiA9IHRoaXNbaGFzaEtleShrZXkpXTtcbiAgICBkZWxldGUgdGhpc1toYXNoS2V5KGtleSldO1xuICAgIHJldHVybiB2O1xuICB9LFxuICBlbXB0eTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwLFxuICAgICAgICBtZSA9IHRoaXM7XG4gICAgZm9yIChwIGluIG1lKSB7XG4gICAgICBpZiAobWUuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbcF07XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vLyBhbGlhc1xuSGFzaE1hcC5wcm90b3R5cGUuc2V0ID0gSGFzaE1hcC5wcm90b3R5cGUucHV0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhhc2hNYXA7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8nKTtcbnZhciBtZSwgaGFzaEtleTtcbnZhciBkb0dldCwgZG9TZXQ7XG5cbm1lID0gaGFzaEtleSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciB1aWQgPSB2O1xuICBpZiAodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKHYpKSB7XG4gICAgaWYgKCFtZS5oYXModikpIHtcbiAgICAgIGRvU2V0KHYsIF8udW5pcXVlSWQoKSk7XG4gICAgfVxuICAgIHVpZCA9IGRvR2V0KHYpO1xuICAgIGlmICghbWUuaGFzKHYpKSB7XG4gICAgICB0aHJvdyBFcnJvcih2ICsgJyBzaG91bGQgaGF2ZSBhIGhhc2hLZXkgYXQgdGhpcyBwb2ludCA6KCcpO1xuICAgIH1cbiAgICByZXR1cm4gdWlkO1xuICB9XG5cbiAgLy8gdiBpcyBhIHByaW1pdGl2ZVxuICByZXR1cm4gdHlwZW9mIHYgKyAnLScgKyB1aWQ7XG59O1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBHZXRzIHRoZSBzdG9yZWQgaGFzaGtleSwgc2luY2UgdGhlcmUgYXJlIG9iamVjdCB0aGF0IG1pZ2h0IG5vdCBoYXZlIGEgY2hhaW5cbiAqIHVwIHRvIE9iamVjdC5wcm90b3R5cGUgdGhlIGNoZWNrIGlzIGRvbmUgd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5IGV4cGxpY2l0bHlcbiAqXG4gKiBAcGFyYW0gIHsqfSBvYmpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZG9HZXQgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGFzc2VydCh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqKSwgJ29iaiBtdXN0IGJlIGFuIG9iamVjdHxmdW5jdGlvbicpO1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgbWUuaGlkZGVuS2V5KSAmJlxuICAgIG9ialttZS5oaWRkZW5LZXldO1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogU2V0cyBhIGhpZGRlbiBrZXkgb24gYW4gb2JqZWN0LCB0aGUgaGlkZGVuIGtleSBpcyBkZXRlcm1pbmVkIGFzIGZvbGxvd3M6XG4gKlxuICogLSBudWxsIG9iamVjdC1udWxsXG4gKiAtIG51bWJlcnM6IG51bWJlci17dmFsdWV9XG4gKiAtIGJvb2xlYW46IGJvb2xlYW4te3RydWV8ZmFsc2V9XG4gKiAtIHN0cmluZzogc3RyaW5nLXt2YWx1ZX1cbiAqIC0gdW5kZWZpbmVkIHVuZGVmaW5lZC11bmRlZmluZWRcbiAqIC0gZnVuY3Rpb246IGZ1bmN0aW9uLXtpZH0gaWQgPSBfLnVuaXF1ZUlkXG4gKiAtIG9iamVjdDogb2JqZWN0LXtpZH0gaWQgPSBfLnVuaXF1ZUlkXG4gKlxuICogQHBhcmFtIHsqfSBvYmogVGhlIG9iamVjdCB0byBzZXQgdGhlIGhpZGRlbktleVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIGJlIHNldCBpbiB0aGUgb2JqZWN0XG4gKi9cbmRvU2V0ID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gIGFzc2VydCh1dGlscy5pc09iamVjdE9yRnVuY3Rpb24ob2JqKSwgJ29iaiBtdXN0IGJlIGFuIG9iamVjdHxmdW5jdGlvbicpO1xuICBhc3NlcnQoXG4gICAgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycsXG4gICAgJ1RoZSBrZXkgbmVlZHMgdG8gYmUgYSB2YWxpZCBzdHJpbmcnXG4gICk7XG4gIHZhciB2YWx1ZTtcbiAgaWYgKCFtZS5oYXMob2JqKSkge1xuICAgIHZhbHVlID0gdHlwZW9mIG9iaiArICctJyArIGtleTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBtZS5oaWRkZW5LZXksIHtcbiAgICAgIHZhbHVlOiB2YWx1ZVxuICAgIH0pO1xuICAgIGlmICghb2JqW21lLmhpZGRlbktleV0pIHtcbiAgICAgIC8vIGluIG5vZGUgc2V0dGluZyB0aGUgaW5zdHJ1Y3Rpb24gYWJvdmUgbWlnaHQgbm90IGhhdmUgd29ya2VkXG4gICAgICBjb25zb2xlLndhcm4oJ2hhc2hLZXkjZG9TZXQoKSBzZXR0aW5nIHRoZSB2YWx1ZSBvbiB0aGUgb2JqZWN0IGRpcmVjdGx5Jyk7XG4gICAgICBvYmpbbWUuaGlkZGVuS2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICBhc3NlcnQob2JqW21lLmhpZGRlbktleV0sICdPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlkIG5vdCB3b3JrIScpO1xuICB9XG4gIHJldHVybiBtZTtcbn07XG5cbm1lLmhpZGRlbktleSA9ICdfX3Bvam92aXpLZXlfXyc7XG5cbm1lLmhhcyA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB0eXBlb2YgZG9HZXQodikgPT09ICdzdHJpbmcnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmZ1bmN0aW9uIHR5cGUodikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpLnNsaWNlKDgsIC0xKTtcbn1cblxudmFyIHV0aWxzID0ge307XG5cbi8qKlxuICogQWZ0ZXIgY2FsbGluZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2Agd2l0aCBgdmAgYXMgdGhlIHNjb3BlXG4gKiB0aGUgcmV0dXJuIHZhbHVlIHdvdWxkIGJlIHRoZSBjb25jYXRlbmF0aW9uIG9mICdbT2JqZWN0ICcsXG4gKiBjbGFzcyBhbmQgJ10nLCBgY2xhc3NgIGlzIHRoZSByZXR1cm5pbmcgdmFsdWUgb2YgdGhpcyBmdW5jdGlvblxuICpcbiAqIGUuZy4gICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoW10pID09IFtvYmplY3QgQXJyYXldLFxuICogICAgICAgIHRoZSByZXR1cm5pbmcgdmFsdWUgaXMgdGhlIHN0cmluZyBBcnJheVxuICpcbiAqIEBwYXJhbSB7Kn0gdlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xudXRpbHMuaW50ZXJuYWxDbGFzc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHR5cGUodik7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIHZhbHVlIGlzIGEgZnVuY3Rpb24sIHRoZSBsaWJyYXJ5IG9ubHkgbmVlZHNcbiAqIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIHByaW1pdGl2ZSB0eXBlcyAobm8gbmVlZCB0b1xuICogZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2Ygb2JqZWN0cylcbiAqXG4gKiBAcGFyYW0gIHsqfSAgdiBUaGUgdmFsdWUgdG8gYmUgY2hlY2tlZFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gISF2ICYmIHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGEgY29uc3RydWN0b3IsXG4gKiBOT1RFOiBmb3IgdGhlIHNha2Ugb2YgdGhpcyBsaWJyYXJ5IGEgY29uc3RydWN0b3IgaXMgYSBmdW5jdGlvblxuICogdGhhdCBoYXMgYSBuYW1lIHdoaWNoIHN0YXJ0cyB3aXRoIGFuIHVwcGVyY2FzZSBsZXR0ZXIgYW5kIGFsc29cbiAqIHRoYXQgdGhlIHByb3RvdHlwZSdzIGNvbnN0cnVjdG9yIGlzIGl0c2VsZlxuICogQHBhcmFtIHsqfSB2XG4gKi9cbnV0aWxzLmlzQ29uc3RydWN0b3IgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdGhpcy5pc0Z1bmN0aW9uKHYpICYmIHR5cGVvZiB2Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICB2Lm5hbWUubGVuZ3RoICYmIHYucHJvdG90eXBlICYmIHYucHJvdG90eXBlLmNvbnN0cnVjdG9yID09PSB2O1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3QsIHRoZSBsaWJyYXJ5IG9ubHkgbmVlZHNcbiAqIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGlmZmVyZW50IGtpbmRzIG9mIHByaW1pdGl2ZSB0eXBlcyAobm8gbmVlZCB0b1xuICogZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaWZmZXJlbnQga2luZHMgb2Ygb2JqZWN0cylcbiAqXG4gKiBOT1RFOiBhIGZ1bmN0aW9uIHdpbGwgbm90IHBhc3MgdGhpcyB0ZXN0XG4gKiBpLmUuXG4gKiAgICAgICAgdXRpbHMuaXNPYmplY3QoZnVuY3Rpb24oKSB7fSkgaXMgZmFsc2UhXG4gKlxuICogU3BlY2lhbCB2YWx1ZXMgd2hvc2UgYHR5cGVvZmAgcmVzdWx0cyBpbiBhbiBvYmplY3Q6XG4gKiAtIG51bGxcbiAqXG4gKiBAcGFyYW0gIHsqfSAgdiBUaGUgdmFsdWUgdG8gYmUgY2hlY2tlZFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuICEhdiAmJiB0eXBlb2YgdiA9PT0gJ29iamVjdCc7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gb2JqZWN0IG9yIGEgZnVuY3Rpb24gKG5vdGUgdGhhdCBmb3IgdGhlIHNha2VcbiAqIG9mIHRoZSBsaWJyYXJ5IEFycmF5cyBhcmUgbm90IG9iamVjdHMpXG4gKlxuICogQHBhcmFtIHsqfSB2XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xudXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHV0aWxzLmlzT2JqZWN0KHYpIHx8IHV0aWxzLmlzRnVuY3Rpb24odik7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgdHJhdmVyc2FibGUsIGZvciB0aGUgc2FrZSBvZiB0aGUgbGlicmFyeSBhblxuICogb2JqZWN0ICh3aGljaCBpcyBub3QgYW4gYXJyYXkpIG9yIGEgZnVuY3Rpb24gaXMgdHJhdmVyc2FibGUsIHNpbmNlIHRoaXMgZnVuY3Rpb25cbiAqIGlzIHVzZWQgYnkgdGhlIG9iamVjdCBhbmFseXplciBvdmVycmlkaW5nIGl0IHdpbGwgZGV0ZXJtaW5lIHdoaWNoIG9iamVjdHNcbiAqIGFyZSB0cmF2ZXJzYWJsZVxuICpcbiAqIEBwYXJhbSB7Kn0gdlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbnV0aWxzLmlzVHJhdmVyc2FibGUgPSBmdW5jdGlvbiAodikge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKHYpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgc3BlY2lhbCBmdW5jdGlvbiB3aGljaCBpcyBhYmxlIHRvIGV4ZWN1dGUgYSBzZXJpZXMgb2YgZnVuY3Rpb25zIHRocm91Z2hcbiAqIGNoYWluaW5nLCB0byBydW4gYWxsIHRoZSBmdW5jdGlvbnMgc3RvcmVkIGluIHRoZSBjaGFpbiBleGVjdXRlIHRoZSByZXN1bHRpbmcgdmFsdWVcbiAqXG4gKiAtIGVhY2ggZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIHRoZSBvcmlnaW5hbCBhcmd1bWVudHMgd2hpY2ggYGZ1bmN0aW9uQ2hhaW5gIHdhc1xuICogaW52b2tlZCB3aXRoICsgdGhlIHJlc3VsdGluZyB2YWx1ZSBvZiB0aGUgbGFzdCBvcGVyYXRpb24gYXMgdGhlIGxhc3QgYXJndW1lbnRcbiAqIC0gdGhlIHNjb3BlIG9mIGVhY2ggZnVuY3Rpb24gaXMgdGhlIHNhbWUgc2NvcGUgYXMgdGhlIG9uZSB0aGF0IHRoZSByZXN1bHRpbmdcbiAqIGZ1bmN0aW9uIHdpbGwgaGF2ZVxuICpcbiAqICAgIHZhciBmbnMgPSB1dGlscy5mdW5jdGlvbkNoYWluKClcbiAqICAgICAgICAgICAgICAgIC5jaGFpbihmdW5jdGlvbiAoYSwgYikge1xuICogICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhLCBiKTtcbiAqICAgICAgICAgICAgICAgICAgcmV0dXJuICdmaXJzdCc7XG4gKiAgICAgICAgICAgICAgICB9KVxuICogICAgICAgICAgICAgICAgLmNoYWluKGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gKiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGEsIGIsIGMpO1xuICogICAgICAgICAgICAgICAgICByZXR1cm4gJ3NlY29uZDtcbiAqICAgICAgICAgICAgICAgIH0pXG4gKiAgICBmbnMoMSwgMik7ICAvLyByZXR1cm5zICdzZWNvbmQnXG4gKiAgICAvLyBsb2dzIDEsIDJcbiAqICAgIC8vIGxvZ3MgMSwgMiwgJ2ZpcnN0J1xuICpcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xudXRpbHMuZnVuY3Rpb25DaGFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHN0YWNrID0gW107XG4gIHZhciBpbm5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIHZhbHVlID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB2YWx1ZSA9IHN0YWNrW2ldLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbiAgaW5uZXIuY2hhaW4gPSBmdW5jdGlvbiAodikge1xuICAgIHN0YWNrLnB1c2godik7XG4gICAgcmV0dXJuIGlubmVyO1xuICB9O1xuICByZXR1cm4gaW5uZXI7XG59O1xuXG4vKipcbiAqIEdpdmVuIGEgc3RyIG1hZGUgb2YgYW55IGNoYXJhY3RlcnMgdGhpcyBtZXRob2QgcmV0dXJucyBhIHN0cmluZ1xuICogcmVwcmVzZW50YXRpb24gb2YgYSBzaWduZWQgaW50XG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKi9cbnV0aWxzLmhhc2hDb2RlID0gZnVuY3Rpb24gKHN0cikge1xuICB2YXIgaSwgbGVuZ3RoLCBjaGFyLCBoYXNoID0gMDtcbiAgZm9yIChpID0gMCwgbGVuZ3RoID0gc3RyLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgY2hhciA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNoYXI7XG4gICAgaGFzaCA9IGhhc2ggJiBoYXNoO1xuICB9XG4gIHJldHVybiBTdHJpbmcoaGFzaCk7XG59O1xuXG51dGlscy5jcmVhdGVFdmVudCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGRldGFpbHMpIHtcbiAgcmV0dXJuIG5ldyBDdXN0b21FdmVudChldmVudE5hbWUsIHtcbiAgICBkZXRhaWw6IGRldGFpbHNcbiAgfSk7XG59O1xudXRpbHMubm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbnNvbGVUb28pIHtcbiAgdmFyIGV2ID0gdXRpbHMuY3JlYXRlRXZlbnQoJ3Bvam92aXotbm90aWZpY2F0aW9uJywgbWVzc2FnZSk7XG4gIGNvbnNvbGVUb28gJiYgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xufTtcbnV0aWxzLmNyZWF0ZUpzb25wQ2FsbGJhY2sgPSBmdW5jdGlvbiAodXJsKSB7XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnNyYyA9IHVybDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xufTtcbnV0aWxzLnRvUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBzID0gJycsXG4gICAgaSA9IDA7XG4gIF8uZm9yT3duKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICBpZiAoaSkge1xuICAgICAgcyArPSAnJic7XG4gICAgfVxuICAgIHMgKz0gayArICc9JyArIHY7XG4gICAgaSArPSAxO1xuICB9KTtcbiAgcmV0dXJuIHM7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIEdpdmVuIGEgcHJvcGVydHkgbmFtZSB0aGlzIG1ldGhvZCBpZGVudGlmaWVzIGlmIGl0J3MgYSB2YWxpZCBwcm9wZXJ0eSBmb3IgdGhlIHNha2VcbiAqIG9mIHRoZSBsaWJyYXJ5LCBhIHZhbGlkIHByb3BlcnR5IGlzIGEgcHJvcGVydHkgd2hpY2ggZG9lcyBub3QgcHJvdm9rZSBhbiBlcnJvclxuICogd2hlbiB0cnlpbmcgdG8gYWNjZXNzIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIGl0IGZyb20gYW55IG9iamVjdFxuICpcbiAqIEZvciBleGFtcGxlIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIGNvZGUgaW4gc3RyaWN0IG1vZGUgd2lsbCB5aWVsZCBhbiBlcnJvcjpcbiAqXG4gKiAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHt9O1xuICogICAgZm4uYXJndW1lbnRzXG4gKlxuICogU2luY2UgYXJndW1lbnRzIGlzIHByb2hpYml0ZWQgaW4gc3RyaWN0IG1vZGVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL1N0cmljdF9tb2RlXG4gKlxuICpcbiAqXG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAqL1xudXRpbHMub2JqZWN0UHJvcGVydHlJc0ZvcmJpZGRlbiA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gIHZhciBrZXk7XG4gIHZhciBydWxlcyA9IHV0aWxzLnByb3BlcnR5Rm9yYmlkZGVuUnVsZXM7XG4gIGZvciAoa2V5IGluIHJ1bGVzKSB7XG4gICAgaWYgKHJ1bGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGlmIChydWxlc1trZXldKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEB0ZW1wbGF0ZVxuICpcbiAqIE1vZGlmeSB0aGlzIG9iamVjdCB0byBhZGQvcmVtb3ZlIHJ1bGVzIHRoYXQgd2lsIGJlIHJ1biBieVxuICogI29iamVjdFByb3BlcnR5SXNGb3JiaWRkZW4sIHRvIGRldGVybWluZSBpZiBhIHByb3BlcnR5IGlzIGludmFsaWRcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG51dGlscy5wcm9wZXJ0eUZvcmJpZGRlblJ1bGVzID0ge1xuICAvKipcbiAgICogYGNhbGxlcmAgYW5kIGBhcmd1bWVudHNgIGFyZSBpbnZhbGlkIHByb3BlcnRpZXMgb2YgYSBmdW5jdGlvbiBpbiBzdHJpY3QgbW9kZVxuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBzdHJpY3RNb2RlOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmICh1dGlscy5pc0Z1bmN0aW9uKG9iamVjdCkpIHtcbiAgICAgIHJldHVybiBwcm9wZXJ0eSA9PT0gJ2NhbGxlcicgfHwgcHJvcGVydHkgPT09ICdhcmd1bWVudHMnO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgdGhhdCBzdGFydCBhbmQgZW5kIHdpdGggX18gYXJlIHNwZWNpYWwgcHJvcGVydGllcyxcbiAgICogaW4gc29tZSBjYXNlcyB0aGV5IGFyZSB2YWxpZCAobGlrZSBfX3Byb3RvX18pIG9yIGRlcHJlY2F0ZWRcbiAgICogbGlrZSBfX2RlZmluZUdldHRlcl9fXG4gICAqXG4gICAqIGUuZy5cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX3Byb3RvX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fXG4gICAqICAtIE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfX1xuICAgKiAgLSBPYmplY3QucHJvdG90eXBlLl9fbG9va3VwR2V0dGVyX19cbiAgICogIC0gT2JqZWN0LnByb3RvdHlwZS5fX2xvb2t1cFNldHRlcl9fXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGhpZGRlblByb3BlcnR5OiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eS5zZWFyY2goL15fXy4qP19fJC8pID4gLTE7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFuZ3VsYXIgaGlkZGVuIHByb3BlcnRpZXMgc3RhcnQgYW5kIGVuZCB3aXRoICQkLCBmb3IgdGhlIHNha2VcbiAgICogb2YgdGhlIGxpYnJhcnkgdGhlc2UgYXJlIGludmFsaWQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBhbmd1bGFySGlkZGVuUHJvcGVydHk6IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvXlxcJFxcJC4qP1xcJFxcJCQvKSA+IC0xO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUaGUgcHJvcGVydGllcyB0aGF0IGhhdmUgdGhlIGZvbGxvd2luZyBzeW1ib2xzIGFyZSBmb3JiaWRkZW46XG4gICAqIFs6K34hPjw9Ly9cXFtcXF1AXFwuIF1cbiAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgLy9zeW1ib2xzOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAvLyAgcmV0dXJuIHByb3BlcnR5LnNlYXJjaCgvWzorfiE+PD0vL1xcXUBcXC4gXS8pID4gLTE7XG4gIC8vfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbWF1cmljaW8gb24gMi8yMS8xNS5cbiAqL1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBoYXNoS2V5ID0gcmVxdWlyZSgnLi9oYXNoS2V5Jyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLycpO1xudmFyIG1lLCBsYWJlbGVyO1xudmFyIGRvSW5zZXJ0LCBkb0dldDtcblxuLy8gbGFiZWxzIHBlciBlYWNoIG9iamVjdCB3aWxsIGJlIHNhdmVkIGluc2lkZSB0aGlzIG9iamVjdFxudmFyIGxhYmVsQ2FjaGUgPSB7fTtcblxudmFyIHByb3RvID0ge1xuICBmaXJzdDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlc1swXTtcbiAgfSxcbiAgc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH0sXG4gIGdldFZhbHVlczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcztcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gZnJvbVxuICogQHBhcmFtIHtzdHJpbmd9IFtwcm9wZXJ0eV1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnXVxuICpcbiAqICAtIGNvbmZpZy5sYWJlbE92ZXJyaWRlIE92ZXJyaWRlcyB0aGUgcHJvcGVydHkgbGFiZWwgd2l0aCB0aGlzIHZhbHVlXG4gKiAgLSBjb25maWcuaGlnaFByaW9yaXR5IHtib29sZWFufSBpZiBzZXQgdG8gdHJ1ZSB0aGVuIHRoZSBsYWJlbCB3aWxsIGJlXG4gKiAgcHJlcGVuZGVkIGluc3RlYWQgb2YgYmVpbmcgYXBwZW5kXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG5tZSA9IGxhYmVsZXIgPSBmdW5jdGlvbiAoZnJvbSwgcHJvcGVydHksIGNvbmZpZykge1xuICBhc3NlcnQodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKGZyb20pLCAnZnJvbSBuZWVkcyB0byBiZSBhbiBvYmplY3Qgb3IgYSBmdW5jdGlvbicpO1xuICBjb25maWcgPSBjb25maWcgfHwge307XG4gIHZhciBvYmo7XG4gIHZhciBsYWJlbDtcblxuICBmdW5jdGlvbiBhdHRlbXBUb0luc2VydChvYmosIGZyb20sIGxhYmVsKSB7XG4gICAgaWYgKHV0aWxzLmlzT2JqZWN0T3JGdW5jdGlvbihvYmopKSB7XG4gICAgICB2YXIgb2JqSGFzaCA9IGhhc2hLZXkob2JqKTtcbiAgICAgIHZhciBmcm9tSGFzaCA9IGZyb20gPyBoYXNoS2V5KGZyb20pIDogbnVsbDtcbiAgICAgIHZhciBsYWJlbENmZyA9IHtcbiAgICAgICAgZnJvbTogZnJvbUhhc2gsXG4gICAgICAgIGxhYmVsOiBsYWJlbFxuICAgICAgfTtcbiAgICAgIGlmICghXy5maW5kKGxhYmVsQ2FjaGVbb2JqSGFzaF0gfHwgW10sIGxhYmVsQ2ZnKSkge1xuICAgICAgICBkb0luc2VydChvYmosIGxhYmVsQ2ZnLCBjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgaWYgKHByb3BlcnR5KSB7XG4gICAgb2JqID0gZnJvbVtwcm9wZXJ0eV07XG4gICAgbGFiZWwgPSBwcm9wZXJ0eTtcbiAgICAvLyBpZiB0aGUgcHJvcGVydHkgaXMgYHByb3RvdHlwZWAgYXBwZW5kIHRoZSBuYW1lIG9mIHRoZSBjb25zdHJ1Y3RvclxuICAgIC8vIHRoaXMgbWVhbnMgdGhhdCBpdCBoYXMgYSBoaWdoZXIgcHJpb3JpdHkgc28gdGhlIGl0ZW0gc2hvdWxkIGJlIHByZXBlbmRlZFxuICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3Byb3RvdHlwZScgJiYgdXRpbHMuaXNDb25zdHJ1Y3Rvcihmcm9tKSkge1xuICAgICAgY29uZmlnLmhpZ2hQcmlvcml0eSA9IHRydWU7XG4gICAgICBsYWJlbCA9IGZyb20ubmFtZSArICcuJyArIHByb3BlcnR5O1xuICAgIH1cbiAgICBhdHRlbXBUb0luc2VydChvYmosIGZyb20sIGxhYmVsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyB0aGUgZGVmYXVsdCBsYWJlbCBmb3IgYW4gaXRlcmFibGUgaXMgdGhlIGhhc2hrZXlcbiAgICBhdHRlbXBUb0luc2VydChmcm9tLCBudWxsLCBoYXNoS2V5KGZyb20pKTtcblxuICAgIC8vIGlmIGl0J3MgY2FsbGVkIHdpdGggdGhlIHNlY29uZCBhcmcgPT09IHVuZGVmaW5lZCB0aGVuIG9ubHlcbiAgICAvLyBzZXQgYSBsYWJlbCBpZiBpdCdzIGEgY29uc3RydWN0b3JcbiAgICBpZiAodXRpbHMuaXNDb25zdHJ1Y3Rvcihmcm9tKSkge1xuICAgICAgY29uZmlnLmhpZ2hQcmlvcml0eSA9IHRydWU7XG4gICAgICBhdHRlbXBUb0luc2VydChmcm9tLCBudWxsLCBmcm9tLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkb0dldChmcm9tLCBwcm9wZXJ0eSk7XG59O1xuXG5tZS5oaWRkZW5MYWJlbCA9ICdfX3Bvam92aXpMYWJlbF9fJztcblxuLyoqXG4gKiBUaGUgb2JqZWN0IGhhcyBhIGhpZGRlbiBrZXkgaWYgaXQgZXhpc3RzIGFuZCBpc1xuICogYW4gYXJyYXlcbiAqIEBwYXJhbSB2XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xubWUuaGFzID0gZnVuY3Rpb24gKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiBsYWJlbENhY2hlW2hhc2hLZXkodildICE9PSAndW5kZWZpbmVkJztcbn07XG5cbmRvR2V0ID0gZnVuY3Rpb24gKGZyb20sIHByb3BlcnR5KSB7XG4gIHZhciBvYmogPSBwcm9wZXJ0eSA/IGZyb21bcHJvcGVydHldIDogZnJvbTtcbiAgdmFyIHIgPSBPYmplY3QuY3JlYXRlKHByb3RvKTtcbiAgci52YWx1ZXMgPSAodXRpbHMuaXNPYmplY3RPckZ1bmN0aW9uKG9iaikgJiYgbGFiZWxDYWNoZVtoYXNoS2V5KG9iaildKSB8fCBbXTtcbiAgcmV0dXJuIHI7XG59O1xuJ2xlbmd0aCcsICduYW1lJywgJ3Byb3RvdHlwZScsXG5cbi8qKlxuICogQHByaXZhdGVcbiAqIFNldHMgYSBoaWRkZW4ga2V5IG9uIGFuIG9iamVjdCwgdGhlIGhpZGRlbiBrZXkgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0cyxcbiAqIGVhY2ggb2JqZWN0IGhhcyB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcbiAqXG4gKiAge1xuICogICAgZnJvbTogc3RyaW5nLFxuICogICAgbGFiZWw6IHN0cmluZ1xuICogIH1cbiAqXG4gKiBAcGFyYW0geyp9IG9iaiBUaGUgb2JqZWN0IHdob3NlIGxhYmVsIG5lZWQgdG8gYmUgc2F2ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIFRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBsYWJlbHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgYWRkaXRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAqL1xuZG9JbnNlcnQgPSBmdW5jdGlvbiAob2JqLCBwcm9wZXJ0aWVzLCBjb25maWcpIHtcbiAgdmFyIGhrT2JqID0gaGFzaEtleShvYmopO1xuICBsYWJlbENhY2hlW2hrT2JqXSA9IGxhYmVsQ2FjaGVbaGtPYmpdIHx8IFtdO1xuICB2YXIgYXJyID0gbGFiZWxDYWNoZVtoa09ial07XG4gIHZhciBpbmRleCA9IGNvbmZpZy5oaWdoUHJpb3JpdHkgPyAwIDogYXJyLmxlbmd0aDtcblxuICAvLyBsYWJlbCBvdmVycmlkZVxuICBpZiAoY29uZmlnLmxhYmVsT3ZlcnJpZGUpIHtcbiAgICBwcm9wZXJ0aWVzLmxhYmVsID0gY29uZmlnLmxhYmVsT3ZlcnJpZGU7XG4gIH1cblxuICAvLyBpbnNlcnRpb24gZWl0aGVyIGF0IHN0YXJ0IG9yIGVuZFxuICBhcnIuc3BsaWNlKGluZGV4LCAwLCBwcm9wZXJ0aWVzKTtcbn07XG5cbi8vbWUubGFiZWxDYWNoZSA9IGxhYmVsQ2FjaGU7XG5tb2R1bGUuZXhwb3J0cyA9IG1lOyJdfQ==
